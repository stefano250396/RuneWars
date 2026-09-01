/**
 * Card effect parser and resolver for the Rune Wars game engine.
 *
 * Parses card effect text into structured effect objects and provides
 * functions to apply those effects to the game state.
 */

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Parse a card's effect text into an array of structured effect objects.
 * Each effect has at minimum a `type` field plus type-specific data.
 *
 * @param {Object} card - A card object from the deck.
 * @returns {Array} Array of effect objects.
 */
export function parseEffects(card) {
  if (!card || !card.effect) return [];
  if (card.special === 'pisello') return [{ type: 'unplayable' }];

  const effects = [];
  const sentences = card.effect.split(/\.\s*/).filter(s => s.trim().length > 0);

  for (const sentence of sentences) {
    const parsed = parseSentence(sentence.trim(), card);
    if (parsed) {
      if (Array.isArray(parsed)) {
        effects.push(...parsed);
      } else {
        effects.push(parsed);
      }
    }
  }

  return effects;
}

/**
 * Return only the effects that fire during CARD_SELECT phase (e.g. celerity).
 */
export function getSelectionEffects(card) {
  return parseEffects(card).filter(e => e.timing === 'selection');
}

/**
 * Check whether a hero is allowed to play a specific card.
 *
 * Rules:
 *  1. Pisello cards cannot be played by anyone.
 *  2. Doran can play Items of any color (passive override).
 *  3. Otherwise: hero's color must appear in card's colors, OR 'C' (Grey) must
 *     appear in card's colors.
 */
export function canPlayCard(card, hero) {
  if (card.special === 'pisello') return false;
  if (hero.id === 'doran' && card.special === 'item') return true;

  const cardColors = card.colors || [];
  return cardColors.includes(hero.color) || cardColors.includes('C');
}

/**
 * Check if the runes from played cards cover an ability's rune cost.
 *
 * @param {Array} playedCards - Array of card objects played this turn.
 * @param {Object} abilityCost - e.g. { P: 2, U: 1 }
 * @returns {boolean}
 */
export function checkAbilityCost(playedCards, abilityCost) {
  if (!abilityCost) return false;

  const totalRunes = {};
  for (const card of playedCards) {
    if (!card.runes) continue;
    for (const [rune, count] of Object.entries(card.runes)) {
      totalRunes[rune] = (totalRunes[rune] || 0) + count;
    }
  }

  for (const [rune, required] of Object.entries(abilityCost)) {
    if ((totalRunes[rune] || 0) < required) return false;
  }

  return true;
}

/**
 * Apply a single effect to the game state **in place** (mutates).
 * The caller is responsible for cloning state first.
 *
 * @param {Object} state - Mutable game state.
 * @param {Object} effect - Parsed effect object.
 * @param {string|null} targetHeroInstanceId - Target hero, if applicable.
 * @param {string} sourcePlayerId - 'player1' | 'player2'
 * @returns {string[]} Array of combat-log messages.
 */
export function applyEffectMut(state, effect, targetHeroInstanceId, sourcePlayerId) {
  const logs = [];
  if (!effect) return logs;

  // ── Condition gate ──────────────────────────────────────────────────────
  if (effect.condition) {
    if (effect.condition === 'goingFirst' && state.turnFirstPlayerId !== sourcePlayerId) {
      return logs; // condition not met — silent skip
    }
    if (effect.condition === 'goingSecond' && state.turnFirstPlayerId === sourcePlayerId) {
      return logs;
    }
  }

  switch (effect.type) {
    // ── Stat buff ─────────────────────────────────────────────────────────
    case 'buff': {
      const hero = findHeroInstance(state, targetHeroInstanceId);
      if (hero) {
        const field = tempField(effect.stat);
        hero[field] = (hero[field] || 0) + effect.value;
        logs.push(`${hero.name} gains +${effect.value} ${effect.stat}`);
      }
      break;
    }

    // ── Stat debuff ───────────────────────────────────────────────────────
    case 'debuff': {
      const hero = findHeroInstance(state, targetHeroInstanceId);
      if (hero) {
        const field = tempField(effect.stat);
        hero[field] = (hero[field] || 0) - effect.value;
        logs.push(`${hero.name} gets -${effect.value} ${effect.stat}`);
      }
      break;
    }

    // ── Healing ───────────────────────────────────────────────────────────
    case 'heal': {
      const hero = findHeroInstance(state, targetHeroInstanceId);
      if (hero) {
        const room = hero.maxHealth - hero.currentHealth;
        const healed = Math.min(effect.value, room);
        hero.currentHealth += healed;
        logs.push(`${hero.name} heals ${healed} HP (${hero.currentHealth}/${hero.maxHealth})`);
      }
      break;
    }

    // ── Direct damage ─────────────────────────────────────────────────────
    case 'damage': {
      const hero = findHeroInstance(state, targetHeroInstanceId);
      if (hero) {
        hero.currentHealth -= effect.value;
        logs.push(`${hero.name} takes ${effect.value} damage (${hero.currentHealth}/${hero.maxHealth})`);
      }
      break;
    }

    // ── Celerity ──────────────────────────────────────────────────────────
    case 'celerity': {
      const player = state.players[sourcePlayerId];
      if (player) {
        player.hasCelerity = true;
        logs.push(`${player.name} gains Celerity`);
      }
      break;
    }

    // ── Token creation ────────────────────────────────────────────────────
    case 'token': {
      if (state.activeBattlefield != null) {
        const bf = state.battlefields[state.activeBattlefield];
        if (bf) {
          bf.tokens.push({
            id: `token_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: effect.name || 'Token',
            attack: effect.attack,
            defense: effect.defense,
            owner: sourcePlayerId,
          });
          logs.push(
            `${effect.name || 'Token'} (${effect.attack}/${effect.defense}) created on battlefield ${state.activeBattlefield + 1}`,
          );
        }
      }
      break;
    }

    // ── Negate next opponent card ─────────────────────────────────────────
    case 'negate': {
      // The actual negateNext data (with sourceRuneCount) is set in the reducer
      // because it needs the source card's rune count which isn't in the effect.
      // This branch is a fallback if called generically.
      state.negateNext = {
        active: true,
        sourcePlayerId,
        sourceRuneCount: effect.sourceRuneCount || 0,
      };
      logs.push('Next opponent card with fewer runes will be negated');
      break;
    }

    // ── Negate all stat changes on enemy hero ─────────────────────────────
    case 'negateStats': {
      const opponentId = getOpponentId(sourcePlayerId);
      const opponentHero = getActiveHero(state, opponentId);
      if (opponentHero) {
        opponentHero.tempAttack = 0;
        opponentHero.tempDefense = 0;
        opponentHero.tempMagicPower = 0;
        logs.push(`All stat changes on ${opponentHero.name} negated`);
      }
      break;
    }

    // ── Polarity (choose initiative next turn) ────────────────────────────
    case 'polarity': {
      state.polarityHolder = sourcePlayerId;
      logs.push(`${state.players[sourcePlayerId].name} can choose initiative next turn`);
      break;
    }

    // ── Extra draw next turn ──────────────────────────────────────────────
    case 'draw': {
      const player = state.players[sourcePlayerId];
      if (player) {
        player.extraDraw = (player.extraDraw || 0) + effect.value;
        logs.push(`${player.name} will draw ${effect.value} extra card(s) next turn`);
      }
      break;
    }

    // ── Swap attack/defense for combat ────────────────────────────────────
    case 'swapAttackDefense': {
      const hero = findHeroInstance(state, targetHeroInstanceId);
      if (hero) {
        hero.useDefenseForAttack = true;
        logs.push(`${hero.name} uses Defense for combat damage`);
      }
      break;
    }

    // ── Unplayable / unknown ──────────────────────────────────────────────
    case 'unplayable':
    default:
      break;
  }

  return logs;
}

/**
 * Immutable wrapper: deep-clones state, applies effect, returns { state, logs }.
 * Useful for external consumers that aren't already working on a mutable clone.
 */
export function applyEffect(state, effect, targetHeroInstanceId, sourcePlayerId) {
  const newState = structuredClone(state);
  const logs = applyEffectMut(newState, effect, targetHeroInstanceId, sourcePlayerId);
  return { state: newState, logs };
}

// ─── Sentence Parsing ────────────────────────────────────────────────────────

function parseSentence(text, card) {
  let condition = null;
  let effectText = text;
  let timing = 'resolve';

  // "During Card Selection" → timing marker
  if (/during card selection/i.test(effectText)) {
    timing = 'selection';
    effectText = effectText.replace(/during card selection,?\s*/i, '');
  }

  // "If [you are] going First, ..."
  const firstMatch = effectText.match(/if (?:you are )?going first,?\s*/i);
  if (firstMatch) {
    condition = 'goingFirst';
    effectText = effectText.replace(firstMatch[0], '');
  }

  // "If [you are] going Second, ..."
  const secondMatch = effectText.match(/if (?:you are )?going second,?\s*/i);
  if (secondMatch) {
    condition = 'goingSecond';
    effectText = effectText.replace(secondMatch[0], '');
  }

  const effect = parseEffectText(effectText.trim(), card);

  if (effect) {
    const stamp = (e) => {
      if (condition) e.condition = condition;
      if (timing !== 'resolve') e.timing = timing;
      return e;
    };

    if (Array.isArray(effect)) {
      return effect.map(stamp);
    }
    return stamp(effect);
  }

  return null;
}

// ─── Effect Text Parsing ─────────────────────────────────────────────────────

function parseEffectText(text, _card) {
  const t = text.trim();
  if (!t) return null;

  // ── Compound debuff: "Minus X Atk and Minus Y Def to Any Hero" ──────
  {
    const m = t.match(
      /minus (\d+) (atk|attack)\s+(?:and\s+)?minus (\d+) (def|defense) to (any|equipped) hero(?: until end of turn)?/i,
    );
    if (m) {
      const target = normalizeTarget(m[5]);
      return [
        { type: 'debuff', stat: 'attack', value: parseInt(m[1]), target, duration: 'turn' },
        { type: 'debuff', stat: 'defense', value: parseInt(m[3]), target, duration: 'turn' },
      ];
    }
  }

  // ── Buff: "Plus X Stat to Target Hero [Until end of Turn]" ──────────
  {
    const m = t.match(
      /plus (\d+) (attack|defense|magic(?:al)? power|atk|def) to (any|equipped|self) hero(?: until end of turn)?/i,
    );
    if (m) {
      return {
        type: 'buff',
        stat: normalizeStat(m[2]),
        value: parseInt(m[1]),
        target: normalizeTarget(m[3]),
        duration: 'turn',
      };
    }
  }

  // ── Debuff: "Minus X Stat to Target Hero [Until end of Turn]" ───────
  {
    const m = t.match(
      /minus (\d+) (attack|defense|magic(?:al)? power|atk|def) to (any|equipped|self) hero(?: until end of turn)?/i,
    );
    if (m) {
      return {
        type: 'debuff',
        stat: normalizeStat(m[2]),
        value: parseInt(m[1]),
        target: normalizeTarget(m[3]),
        duration: 'turn',
      };
    }
  }

  // ── Heal: "Restore X HP to Any/Self Hero" ───────────────────────────
  {
    const m = t.match(/restore (\d+) (?:hp|health) to (any|self|your active) hero/i);
    if (m) {
      return {
        type: 'heal',
        value: parseInt(m[1]),
        target: normalizeTarget(m[2]),
      };
    }
  }

  // ── Damage: "Deal(s) X Damage to Any/Enemy Hero" ───────────────────
  {
    const m = t.match(/deals? (\d+) (?:magic )?damage to (any|an? enemy|enemy) hero/i);
    if (m) {
      return {
        type: 'damage',
        value: parseInt(m[1]),
        target: normalizeTarget(m[2]),
      };
    }
  }

  // ── Celerity ────────────────────────────────────────────────────────
  if (/you gain celerity/i.test(t)) {
    let restriction = null;
    if (/grey cards only/i.test(t)) restriction = 'grey';
    return { type: 'celerity', restriction };
  }

  // ── Token: "Create [a] X/Y Name ... on Battlefield" ────────────────
  {
    const m = t.match(/create (?:a )?(\d+)\/(\d+) (.+)/i);
    if (m) {
      let name = m[3].trim();
      // Strip trailing context ("on this Battlefield", "Token On ...", etc.)
      name = name.replace(/\s+(?:on |token\b).*/i, '').trim();
      return {
        type: 'token',
        attack: parseInt(m[1]),
        defense: parseInt(m[2]),
        name,
      };
    }
  }

  // ── Negate next opponent card (fewer-runes condition) ───────────────
  if (/if next opponent card has fewer runes,?\s*negate it/i.test(t)) {
    return { type: 'negate', negate: 'fewerRunes' };
  }

  // ── Negate all stat changes ─────────────────────────────────────────
  if (/negate all stat changes/i.test(t)) {
    return { type: 'negateStats' };
  }

  // ── Polarity: "Choose First or Second [next Turn]" ─────────────────
  if (/choose (?:to go )?first or second/i.test(t)) {
    return { type: 'polarity' };
  }

  // ── Draw: "draws X additional Card" ─────────────────────────────────
  {
    const m = t.match(/(?:a player )?draws? (\d+) additional card/i);
    if (m) {
      return { type: 'draw', value: parseInt(m[1]) };
    }
  }

  // ── Swap attack/defense for damage ──────────────────────────────────
  if (/uses? (?:it'?s? )?defense instead of attack/i.test(t)) {
    return { type: 'swapAttackDefense', target: 'self' };
  }

  // ── Unplayable ──────────────────────────────────────────────────────
  if (/cannot be played/i.test(t)) {
    return { type: 'unplayable' };
  }

  // Unrecognised sentence — silently ignored.
  return null;
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

function normalizeStat(str) {
  const s = str.toLowerCase();
  if (s === 'atk' || s === 'attack') return 'attack';
  if (s === 'def' || s === 'defense') return 'defense';
  if (s.includes('magic')) return 'magicPower';
  return s;
}

function normalizeTarget(str) {
  const s = str.toLowerCase();
  if (s === 'equipped' || s === 'self' || s === 'your active') return 'self';
  if (s === 'enemy' || s === 'an enemy') return 'enemy';
  return 'any';
}

function tempField(stat) {
  switch (stat) {
    case 'attack':
      return 'tempAttack';
    case 'defense':
      return 'tempDefense';
    case 'magicPower':
      return 'tempMagicPower';
    default:
      return 'tempAttack';
  }
}

/** Find a hero instance by instanceId across both players. */
function findHeroInstance(state, instanceId) {
  if (!instanceId) return null;
  for (const player of Object.values(state.players)) {
    const hero = player.heroes.find(h => h.instanceId === instanceId);
    if (hero) return hero;
  }
  return null;
}

/** Get the active hero on the current battlefield for a given player. */
function getActiveHero(state, playerId) {
  if (state.activeBattlefield == null) return null;
  const bf = state.battlefields[state.activeBattlefield];
  if (!bf) return null;
  const instanceId = playerId === 'player1' ? bf.player1Hero : bf.player2Hero;
  return findHeroInstance(state, instanceId);
}

function getOpponentId(playerId) {
  return playerId === 'player1' ? 'player2' : 'player1';
}
