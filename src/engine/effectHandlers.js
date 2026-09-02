/**
 * CARD EFFECT RESOLUTION ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure, no React. Mutates a state clone in place (the reducer owns the cloning).
 *
 *   resolveCard(state, { playerId, card }, uiTargets) -> string[]  (combat-log lines)
 *
 * Each card effect is dispatched to a handler in EFFECT_HANDLERS keyed by
 * `effect.type`. Targeting, conditions and timing are resolved here, once, for
 * every effect — see `src/engine/effectSchema.js` for the vocabulary.
 */

import { EFFECT_TYPES } from './effectSchema.js';

// ─── State helpers ───────────────────────────────────────────────────────────

function opponentOf(playerId) {
  return playerId === 'player1' ? 'player2' : 'player1';
}

function findHeroInstance(state, instanceId) {
  if (!instanceId) return null;
  for (const player of Object.values(state.players)) {
    const hero = player.heroes.find(h => h.instanceId === instanceId);
    if (hero) return hero;
  }
  return null;
}

/** The hero a player has in play on the currently active battlefield. */
function getActiveHero(state, playerId) {
  if (state.activeBattlefield == null) return null;
  const bf = state.battlefields[state.activeBattlefield];
  if (!bf) return null;
  const id = playerId === 'player1' ? bf.player1Hero : bf.player2Hero;
  return findHeroInstance(state, id);
}

function tempField(stat) {
  switch (stat) {
    case 'defense': return 'tempDefense';
    case 'magicPower': return 'tempMagicPower';
    case 'attack':
    default: return 'tempAttack';
  }
}

// ─── Conditions ──────────────────────────────────────────────────────────────

/** Whether an effect's `condition` gate passes. No condition -> always true. */
export function checkCondition(state, effect, sourcePlayerId) {
  switch (effect.condition) {
    case undefined:
    case null:
      return true;
    case 'goingFirst':
      return state.turnFirstPlayerId === sourcePlayerId;
    case 'goingSecond':
      return state.turnFirstPlayerId !== sourcePlayerId;
    case 'activeHeroHalfOrLess': {
      const h = getActiveHero(state, sourcePlayerId);
      return !!h && h.currentHealth <= h.maxHealth / 2;
    }
    case 'activeHeroAboveHalf': {
      const h = getActiveHero(state, sourcePlayerId);
      return !!h && h.currentHealth > h.maxHealth / 2;
    }
    default:
      return true;
  }
}

// ─── Targeting ───────────────────────────────────────────────────────────────

/** Buffs and heals default to your own hero; everything else to the enemy. */
function smartDefaultTargetId(state, effect, sourcePlayerId) {
  const helpful = effect.type === EFFECT_TYPES.BUFF || effect.type === EFFECT_TYPES.HEAL;
  const hero = getActiveHero(state, helpful ? sourcePlayerId : opponentOf(sourcePlayerId));
  return hero ? hero.instanceId : null;
}

/**
 * Resolve an effect's `target` to a hero instanceId (or null for
 * player-level / battlefield-level effects).
 */
export function resolveTarget(state, effect, sourcePlayerId, uiTarget) {
  switch (effect.target) {
    case 'ownActive': {
      const h = getActiveHero(state, sourcePlayerId);
      return h ? h.instanceId : null;
    }
    case 'enemyActive': {
      const h = getActiveHero(state, opponentOf(sourcePlayerId));
      return h ? h.instanceId : null;
    }
    case 'any':
      return uiTarget || smartDefaultTargetId(state, effect, sourcePlayerId);
    case 'none':
    case 'activeBattlefield':
      return null;
    default:
      // No target declared: helpful effects hit self, harmful ones hit the enemy.
      return smartDefaultTargetId(state, effect, sourcePlayerId);
  }
}

// ─── Handlers: (ctx, effect) => void, push log lines via ctx.log ──────────────

export const EFFECT_HANDLERS = {
  [EFFECT_TYPES.BUFF]({ state, targetHeroId, log }, effect) {
    const hero = findHeroInstance(state, targetHeroId);
    if (!hero) return;
    const field = tempField(effect.stat);
    hero[field] = (hero[field] || 0) + effect.amount;
    log(`${hero.name} gains +${effect.amount} ${effect.stat}`);
  },

  [EFFECT_TYPES.DEBUFF]({ state, targetHeroId, log }, effect) {
    const hero = findHeroInstance(state, targetHeroId);
    if (!hero) return;
    const field = tempField(effect.stat);
    hero[field] = (hero[field] || 0) - effect.amount;
    log(`${hero.name} gets -${effect.amount} ${effect.stat}`);
  },

  [EFFECT_TYPES.HEAL]({ state, targetHeroId, log }, effect) {
    const hero = findHeroInstance(state, targetHeroId);
    if (!hero) return;
    const room = hero.maxHealth - hero.currentHealth;
    const healed = Math.min(effect.amount, room);
    if (healed <= 0) return;
    hero.currentHealth += healed;
    log(`${hero.name} heals ${healed} HP (${hero.currentHealth}/${hero.maxHealth})`);
  },

  [EFFECT_TYPES.DAMAGE]({ state, targetHeroId, log }, effect) {
    const hero = findHeroInstance(state, targetHeroId);
    if (!hero) return;
    hero.currentHealth -= effect.amount;
    log(`${hero.name} takes ${effect.amount} damage (${hero.currentHealth}/${hero.maxHealth})`);
  },

  [EFFECT_TYPES.TOKEN]({ state, sourcePlayerId, log }, effect) {
    if (state.activeBattlefield == null) return;
    const bf = state.battlefields[state.activeBattlefield];
    if (!bf) return;
    bf.tokens.push({
      id: `token_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: effect.name || 'Token',
      attack: effect.attack,
      defense: effect.defense,
      owner: sourcePlayerId,
    });
    log(
      `${effect.name || 'Token'} (${effect.attack}/${effect.defense}) created on battlefield ${state.activeBattlefield + 1}`,
    );
  },

  [EFFECT_TYPES.CELERITY]({ state, sourcePlayerId, log }) {
    const player = state.players[sourcePlayerId];
    if (!player) return;
    player.hasCelerity = true;
    log(`${player.name} gains Celerity`);
  },

  [EFFECT_TYPES.NEGATE]({ state, sourcePlayerId, card, log }) {
    state.negateNext = {
      active: true,
      sourcePlayerId,
      sourceRuneCount: card ? card.runeCount : 0,
    };
    log('Next opponent card with fewer runes will be negated.');
  },

  [EFFECT_TYPES.NEGATE_STATS]({ state, sourcePlayerId, log }) {
    const enemyHero = getActiveHero(state, opponentOf(sourcePlayerId));
    if (!enemyHero) return;
    enemyHero.tempAttack = 0;
    enemyHero.tempDefense = 0;
    enemyHero.tempMagicPower = 0;
    log(`All stat changes on ${enemyHero.name} negated`);
  },

  [EFFECT_TYPES.POLARITY]({ state, sourcePlayerId, log }) {
    state.polarityHolder = sourcePlayerId;
    log(`${state.players[sourcePlayerId].name} can choose initiative next turn`);
  },

  [EFFECT_TYPES.DRAW]({ state, sourcePlayerId, log }, effect) {
    const player = state.players[sourcePlayerId];
    if (!player) return;
    player.extraDraw = (player.extraDraw || 0) + effect.amount;
    log(`${player.name} will draw ${effect.amount} extra card(s) next turn`);
  },

  [EFFECT_TYPES.SWAP_ATTACK_DEFENSE]({ state, targetHeroId, log }) {
    const hero = findHeroInstance(state, targetHeroId);
    if (!hero) return;
    hero.useDefenseForAttack = true;
    log(`${hero.name} uses Defense for combat damage`);
  },

  [EFFECT_TYPES.UNPLAYABLE]() {
    // Dead card — nothing happens.
  },
};

// ─── Public entry point ──────────────────────────────────────────────────────

/**
 * Apply every `timing: 'resolve'` effect of a card to the state (mutates).
 *
 * @param {object} state        Mutable state clone.
 * @param {{playerId: string, card: object}} entry  Queue entry being resolved.
 * @param {Object<number,string>} uiTargets  Optional per-effect-index hero targets.
 * @returns {string[]} combat-log lines
 */
export function resolveCard(state, { playerId, card }, uiTargets = {}) {
  const logs = [];
  const log = (msg) => logs.push(msg);
  const effects = card.effects || [];

  for (let i = 0; i < effects.length; i++) {
    const effect = effects[i];
    if ((effect.timing || 'resolve') !== 'resolve') continue;
    if (!checkCondition(state, effect, playerId)) continue;

    const targetHeroId = resolveTarget(state, effect, playerId, uiTargets[i]);
    const handler = EFFECT_HANDLERS[effect.type];
    if (handler) {
      handler({ state, sourcePlayerId: playerId, targetHeroId, card, log }, effect);
    }
  }

  return logs;
}
