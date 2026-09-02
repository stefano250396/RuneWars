/**
 * Main game reducer for the Rune Wars engine.
 *
 * Pure function: (state, action) => newState
 * All mutations are immutable (structuredClone + in-place mutation on the clone).
 * No React or UI imports.
 */

import { PHASES, createInitialState, createHeroInstance } from './gameState.js';
import { HEROES, FACTIONS } from '../data/heroes.js';
import { createBrightDeck, createDarkDeck, PURPLE_KNIFE } from '../data/cards.js';
import * as A from './actions.js';
import {
  getSelectionEffects,
  canPlayCard,
  checkAbilityCost,
} from './effects.js';
import { resolveCard } from './effectHandlers.js';

// ─── Fisher-Yates Shuffle ────────────────────────────────────────────────────

function shuffleDeck(deck) {
  const a = [...deck];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── ID generation for runtime-created cards ─────────────────────────────────

function generateCardId() {
  return 10000 + Math.floor(Math.random() * 90000);
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function findHeroInState(state, instanceId) {
  if (!instanceId) return null;
  for (const player of Object.values(state.players)) {
    const hero = player.heroes.find(h => h.instanceId === instanceId);
    if (hero) return hero;
  }
  return null;
}

function getActiveHeroForPlayer(state, playerId) {
  if (state.activeBattlefield == null) return null;
  const bf = state.battlefields[state.activeBattlefield];
  if (!bf) return null;
  const id = playerId === 'player1' ? bf.player1Hero : bf.player2Hero;
  return findHeroInState(state, id);
}

function opponentOf(playerId) {
  return playerId === 'player1' ? 'player2' : 'player1';
}

function addLog(state, ...messages) {
  state.combatLog = [...state.combatLog, ...messages];
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function gameReducer(state, action) {
  switch (action.type) {
    case A.SETUP_GAME:
      return handleSetupGame(state, action.payload);
    case A.DRAW_CARDS:
      return handleDrawCards(state);
    case A.PLACE_HERO:
      return handlePlaceHero(state, action.payload);
    case A.PLACE_OPPONENT_HERO:
      return handlePlaceOpponentHero(state, action.payload);
    case A.SELECT_CARDS:
      return handleSelectCards(state, action.payload);
    case A.RESOLVE_ABILITIES:
      return handleResolveAbilities(state, action.payload);
    case A.RESOLVE_NEXT_CARD:
      return handleResolveNextCard(state, action.payload);
    case A.EXECUTE_COMBAT:
      return handleExecuteCombat(state);
    case A.END_TURN:
      return handleEndTurn(state);
    case A.DISCARD_CARD:
      return handleDiscardCard(state, action.payload);
    case A.NEXT_TURN:
      return handleNextTurn(state);
    case A.CHOOSE_INITIATIVE:
      return handleChooseInitiative(state, action.payload);
    case 'ADVANCE_PHASE': {
      const order = [PHASES.SETUP, PHASES.DRAW, PHASES.PLACEMENT, PHASES.CARD_SELECT,
        PHASES.ABILITY_CHECK, PHASES.CARD_RESOLVE, PHASES.COMBAT, PHASES.END_TURN];
      const idx = order.indexOf(state.phase);
      const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : PHASES.DRAW;
      return { ...state, phase: next };
    }
    case 'FORCE_PHASE':
      return { ...state, phase: action.payload };
    default:
      return state;
  }
}

// ─── Phase Handlers ──────────────────────────────────────────────────────────

// ── SETUP_GAME ────────────────────────────────────────────────────────────────

function handleSetupGame(_state, { faction1, faction2 }) {
  const s = createInitialState();
  const f1 = FACTIONS[faction1];
  const f2 = FACTIONS[faction2];
  if (!f1 || !f2) return s; // invalid faction — return blank state

  // Assign factions
  s.players.player1.faction = faction1;
  s.players.player2.faction = faction2;

  // Create hero instances
  s.players.player1.heroes = f1.heroIds.map(id => createHeroInstance(HEROES[id]));
  s.players.player2.heroes = f2.heroIds.map(id => createHeroInstance(HEROES[id]));

  // Create decks
  const deck1 = faction1 === 'bright' ? createBrightDeck() : createDarkDeck();
  const deck2 = faction2 === 'bright' ? createBrightDeck() : createDarkDeck();

  // Sly's passive: shuffle a Purple Knife into deck
  const p1HasSly = s.players.player1.heroes.some(h => h.id === 'sly');
  const p2HasSly = s.players.player2.heroes.some(h => h.id === 'sly');

  if (p1HasSly) {
    deck1.push({ ...PURPLE_KNIFE, id: generateCardId() });
  }
  if (p2HasSly) {
    deck2.push({ ...PURPLE_KNIFE, id: generateCardId() });
  }

  s.players.player1.deck = shuffleDeck(deck1);
  s.players.player2.deck = shuffleDeck(deck2);

  // Determine first player: Zaccaria passive overrides coin flip
  const p1HasZac = s.players.player1.heroes.some(h => h.id === 'zaccaria');
  const p2HasZac = s.players.player2.heroes.some(h => h.id === 'zaccaria');

  if (p1HasZac && !p2HasZac) {
    s.firstPlayerId = 'player1';
  } else if (p2HasZac && !p1HasZac) {
    s.firstPlayerId = 'player2';
  } else {
    s.firstPlayerId = Math.random() < 0.5 ? 'player1' : 'player2';
  }

  s.activePlayerId = s.firstPlayerId;
  s.turnFirstPlayerId = s.firstPlayerId;
  s.turn = 1;
  s.phase = PHASES.DRAW;

  // Combat log
  const logs = [`Game started! ${s.players[s.firstPlayerId].name} goes first.`];
  if (p1HasSly) logs.push("Sly's Hidden Blade: Purple Knife shuffled into Player 1's deck.");
  if (p2HasSly) logs.push("Sly's Hidden Blade: Purple Knife shuffled into Player 2's deck.");
  if (p1HasZac) logs.push("Zaccaria's First Strike: Player 1 goes first on turn 1.");
  if (p2HasZac) logs.push("Zaccaria's First Strike: Player 2 goes first on turn 1.");
  s.combatLog = logs;

  return s;
}

// ── DRAW_CARDS ────────────────────────────────────────────────────────────────

function handleDrawCards(state) {
  if (state.phase !== PHASES.DRAW) return state;

  const s = structuredClone(state);
  const logs = [];

  // Check for deck-out loss: if deck is empty and hand is not full, player loses
  for (const pid of ['player1', 'player2']) {
    const p = s.players[pid];
    if (p.deck.length === 0 && p.hand.length < 4) {
      const winnerId = opponentOf(pid);
      s.phase = PHASES.GAME_OVER;
      s.winner = winnerId;
      logs.push(
        `${p.name}'s deck is empty and hand is not full! ${s.players[winnerId].name} wins!`,
      );
      addLog(s, ...logs);
      return s;
    }
  }

  // Draw cards for both players (up to hand size of 4)
  for (const pid of ['player1', 'player2']) {
    const p = s.players[pid];
    const toDraw = Math.min(4 - p.hand.length, p.deck.length);

    if (toDraw > 0) {
      const drawn = p.deck.splice(0, toDraw);
      p.hand.push(...drawn);
      logs.push(`${p.name} draws ${toDraw} card(s) → hand: [${p.hand.map(c => c.name).join(', ')}] (${p.deck.length} left in deck)`);
    } else {
      logs.push(`${p.name}'s hand is already full: [${p.hand.map(c => c.name).join(', ')}]`);
    }

    // Extra draw from previous-turn effects (capped so hand never exceeds 4)
    const extra = Math.min(p.extraDraw || 0, p.deck.length, Math.max(0, 4 - p.hand.length));
    if (extra > 0) {
      const drawn = p.deck.splice(0, extra);
      p.hand.push(...drawn);
      logs.push(`${p.name} draws ${extra} extra card(s).`);
    }
    p.extraDraw = 0;
  }

  s.phase = PHASES.PLACEMENT;
  addLog(s, ...logs);
  return s;
}

// ── PLACE_HERO ────────────────────────────────────────────────────────────────

function handlePlaceHero(state, { playerId, heroInstanceId, battlefieldId }) {
  if (state.phase !== PHASES.PLACEMENT) return state;
  if (playerId !== state.activePlayerId) return state;

  const s = structuredClone(state);
  const player = s.players[playerId];
  const hero = player.heroes.find(h => h.instanceId === heroInstanceId);

  // Validate: hero exists, is alive, and hasn't been used this round
  if (!hero || !hero.alive) return state;
  if (player.heroesUsedThisRound.includes(heroInstanceId)) return state;

  // Validate: battlefield slot is empty for this player
  const bf = s.battlefields[battlefieldId];
  if (!bf) return state;
  const slot = playerId === 'player1' ? 'player1Hero' : 'player2Hero';
  if (bf[slot] !== null) return state;

  // Place hero
  bf[slot] = heroInstanceId;
  hero.isActive = true;
  hero.battlefieldId = battlefieldId;
  s.activeBattlefield = battlefieldId;

  // Apply battlefield bonus (once per placement)
  const logs = [`${player.name} places ${hero.name} on battlefield ${battlefieldId + 1}.`];
  if (!hero.bfBonusApplied) {
    if (bf.atkBonus) { hero.currentAttack += bf.atkBonus; logs.push(`${hero.name} gains +${bf.atkBonus} ATK (battlefield bonus)`); }
    if (bf.magBonus) { hero.currentMagicPower += bf.magBonus; logs.push(`${hero.name} gains +${bf.magBonus} Magic Power (battlefield bonus)`); }
    hero.bfBonusApplied = !!(bf.atkBonus || bf.magBonus);
  }

  // Wait for opponent placement
  s.waitingForPlacement = opponentOf(playerId);

  addLog(s, ...logs);
  return s;
}

// ── PLACE_OPPONENT_HERO ───────────────────────────────────────────────────────

function handlePlaceOpponentHero(state, { playerId, heroInstanceId }) {
  if (state.phase !== PHASES.PLACEMENT) return state;
  if (playerId !== state.waitingForPlacement) return state;

  const s = structuredClone(state);
  const player = s.players[playerId];
  const hero = player.heroes.find(h => h.instanceId === heroInstanceId);

  if (!hero || !hero.alive) return state;
  if (player.heroesUsedThisRound.includes(heroInstanceId)) return state;

  // Place on the same battlefield the active player chose
  const bf = s.battlefields[s.activeBattlefield];
  const slot = playerId === 'player1' ? 'player1Hero' : 'player2Hero';
  if (bf[slot] !== null) return state;

  bf[slot] = heroInstanceId;
  hero.isActive = true;
  hero.battlefieldId = s.activeBattlefield;

  const logs = [
    `${player.name} places ${hero.name} against the opponent on battlefield ${s.activeBattlefield + 1}.`,
  ];

  // Apply battlefield bonus (once per placement)
  if (!hero.bfBonusApplied) {
    if (bf.atkBonus) { hero.currentAttack += bf.atkBonus; logs.push(`${hero.name} gains +${bf.atkBonus} ATK (battlefield bonus)`); }
    if (bf.magBonus) { hero.currentMagicPower += bf.magBonus; logs.push(`${hero.name} gains +${bf.magBonus} Magic Power (battlefield bonus)`); }
    hero.bfBonusApplied = !!(bf.atkBonus || bf.magBonus);
  }

  // Jack's Ambush passive: +2 Attack if going first and Jack is active hero
  for (const pid of ['player1', 'player2']) {
    const h = getActiveHeroForPlayer(s, pid);
    if (h && h.id === 'jack' && s.turnFirstPlayerId === pid) {
      h.tempAttack += 2;
      logs.push(`Jack's Ambush: going first, Jack gains +2 Attack!`);
    }
  }

  // Clean up placement tracking, advance to card selection
  delete s.waitingForPlacement;
  s.phase = PHASES.CARD_SELECT;
  s.cardSelections = { player1: null, player2: null };

  logs.push('Both players, select your cards!');
  addLog(s, ...logs);
  return s;
}

// ── SELECT_CARDS ──────────────────────────────────────────────────────────────

function handleSelectCards(state, { playerId, cardIds }) {
  if (state.phase !== PHASES.CARD_SELECT) return state;
  if (!state.cardSelections || state.cardSelections[playerId] !== null) return state;

  const s = structuredClone(state);
  const player = s.players[playerId];
  const hero = getActiveHeroForPlayer(s, playerId);
  if (!hero) return state;

  // Allow passing (empty selection) — player plays no cards this turn
  const ids = cardIds || [];

  // Resolve card objects from hand
  const selectedCards = ids
    .map(cid => player.hand.find(c => c.id === cid))
    .filter(Boolean);
  if (selectedCards.length !== ids.length) return state; // some card not in hand

  // Validate every card is playable by the active hero
  for (const card of selectedCards) {
    if (!canPlayCard(card, hero)) return state;
  }

  // Determine celerity: from selection-time card effects, or Doran's item passive
  let hasCelerity = player.hasCelerity;

  for (const card of selectedCards) {
    const selEffects = getSelectionEffects(card);
    for (const eff of selEffects) {
      if (eff.type !== 'celerity') continue;
      // Check condition (e.g. goingFirst)
      if (eff.condition === 'goingFirst' && s.turnFirstPlayerId !== playerId) continue;
      if (eff.condition === 'goingSecond' && s.turnFirstPlayerId === playerId) continue;
      hasCelerity = true;
    }
    // Doran passive: playing an item grants celerity
    if (hero.id === 'doran' && card.special === 'item') {
      hasCelerity = true;
    }
  }

  // Validate card count: 1 normally, 2 with celerity, max 3 absolute
  const maxCards = Math.min(hasCelerity ? 2 : 1, 3);
  if (selectedCards.length > maxCards) return state;

  // Accept selection
  s.cardSelections[playerId] = ids;
  player.hasCelerity = hasCelerity;
  player.playedCards = selectedCards;
  player.hand = player.hand.filter(c => !ids.includes(c.id));
  player.cardsPlayedThisTurn = selectedCards.length;

  const logs = [];
  if (selectedCards.length === 0) {
    logs.push(`${player.name} passes (no cards played). Hand: [${player.hand.map(c => c.name).join(', ') || 'empty'}]`);
  } else {
    logs.push(`${player.name} plays: ${selectedCards.map(c => `${c.name} (${c.runeStr || '?'})`).join(', ')}`);
    logs.push(`  → ${player.name} hand remaining: [${player.hand.map(c => c.name).join(', ') || 'empty'}]`);
    if (hasCelerity && !state.players[playerId].hasCelerity) {
      logs.push(`${player.name} gains Celerity!`);
    }
  }

  // Check if both players have selected
  if (s.cardSelections?.player1 !== null && s.cardSelections?.player2 !== null) {
    s.phase = PHASES.ABILITY_CHECK;
    const p1 = s.players.player1;
    const p2 = s.players.player2;
    const h1 = getActiveHeroForPlayer(s, 'player1');
    const h2 = getActiveHeroForPlayer(s, 'player2');
    logs.push('Both players have selected cards. Checking abilities...');
    logs.push(`  [State] Turn ${s.turn} | Round ${s.round} | First: ${s.players[s.turnFirstPlayerId].name}`);
    if (h1) logs.push(`  [${p1.name}] ${h1.name} HP:${h1.currentHealth}/${h1.maxHealth} ATK:${h1.attack + h1.tempAttack} DEF:${h1.defense + h1.tempDefense} | deck:${p1.deck.length} hand:${p1.hand.length}`);
    if (h2) logs.push(`  [${p2.name}] ${h2.name} HP:${h2.currentHealth}/${h2.maxHealth} ATK:${h2.attack + h2.tempAttack} DEF:${h2.defense + h2.tempDefense} | deck:${p2.deck.length} hand:${p2.hand.length}`);
  }

  addLog(s, ...logs);
  return s;
}

// ── RESOLVE_ABILITIES ─────────────────────────────────────────────────────────

function handleResolveAbilities(state, payload) {
  const { targets } = payload || {};
  if (state.phase !== PHASES.ABILITY_CHECK) return state;

  const s = structuredClone(state);
  const logs = [];
  const first = s.turnFirstPlayerId;
  const second = opponentOf(first);

  // Resolve abilities: first player first, then opponent
  for (const pid of [first, second]) {
    const player = s.players[pid];
    const hero = getActiveHeroForPlayer(s, pid);
    if (!hero) continue;

    const heroData = HEROES[hero.id];
    if (!heroData) continue;

    // Active 1
    if (heroData.active1 && checkAbilityCost(player.playedCards, heroData.active1.cost)) {
      logs.push(`${hero.name}'s ${heroData.active1.name} activates!`);
      const abilityTarget = targets?.[pid]?.active1 || null;
      logs.push(...resolveAbility(s, hero, heroData.active1, pid, abilityTarget));
    }

    // Active 2
    if (heroData.active2 && checkAbilityCost(player.playedCards, heroData.active2.cost)) {
      logs.push(`${hero.name}'s ${heroData.active2.name} activates!`);
      const abilityTarget = targets?.[pid]?.active2 || null;
      logs.push(...resolveAbility(s, hero, heroData.active2, pid, abilityTarget));
    }
  }

  // Build interleaved card-resolve queue: first player card 1, second player card 1, etc.
  const p1Cards = s.players[first].playedCards;
  const p2Cards = s.players[second].playedCards;
  const queue = [];
  const maxLen = Math.max(p1Cards.length, p2Cards.length);

  for (let i = 0; i < maxLen; i++) {
    if (i < p1Cards.length) queue.push({ playerId: first, card: p1Cards[i] });
    if (i < p2Cards.length) queue.push({ playerId: second, card: p2Cards[i] });
  }

  s.cardResolveQueue = queue;
  s.cardResolveIndex = 0;
  s.negateNext = null;

  s.phase = PHASES.CARD_RESOLVE;
  logs.push('Resolving cards...');
  addLog(s, ...logs);
  return s;
}

/**
 * Resolve a single hero ability (mutates state in place).
 * Returns an array of log strings.
 */
function resolveAbility(state, hero, ability, playerId, target) {
  const logs = [];
  const name = ability.name;

  // ── Zaccaria: Mind Shatter ──────────────────────────────────────────
  if (name === 'Mind Shatter') {
    hero.tempMagicPower += 1;
    logs.push(`${hero.name} gains +1 Magic Power`);
    const totalMP = hero.magicPower + hero.tempMagicPower;
    if (target) {
      const t = findHeroInState(state, target);
      if (t) {
        t.tempDefense -= totalMP;
        logs.push(`${t.name} gets -${totalMP} Defense (Mind Shatter)`);
      }
    }
  }

  // ── Zaccaria: Summon Crooks ─────────────────────────────────────────
  if (name === 'Summon Crooks') {
    for (const bf of state.battlefields) {
      bf.tokens.push({
        id: `token_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: 'Crook',
        attack: 1,
        defense: 1,
        owner: playerId,
      });
    }
    logs.push('Crook tokens (1/1) created on all battlefields!');
  }

  // ── Sly: Craft Purple Knife ─────────────────────────────────────────
  if (name === 'Craft Purple Knife') {
    const knife = { ...PURPLE_KNIFE, id: generateCardId() };
    state.players[playerId].hand.push(knife);
    logs.push('Purple Knife created in hand!');
  }

  // ── Sly: Arsenal ────────────────────────────────────────────────────
  if (name === 'Arsenal') {
    let itemCount = 0;
    for (const h of state.players[playerId].heroes) {
      itemCount += (h.items ? h.items.length : 0);
    }
    hero.tempAttack += itemCount;
    logs.push(`Sly gains +${itemCount} Attack from Arsenal (${itemCount} items equipped)`);
  }

  // ── Jack: Quick Equip ───────────────────────────────────────────────
  if (name === 'Quick Equip') {
    logs.push('Quick Equip: you may play an item with 2 or fewer runes immediately.');
    // Full sub-phase implementation deferred; logged for UI awareness.
  }

  // ── Jack: Crippling Strike ──────────────────────────────────────────
  if (name === 'Crippling Strike') {
    const bonus = hero.tempAttack;
    if (target && bonus > 0) {
      const t = findHeroInState(state, target);
      if (t) {
        t.tempAttack -= bonus;
        logs.push(`${t.name} gets -${bonus} Attack (Crippling Strike)`);
      }
    } else if (bonus <= 0) {
      logs.push('Crippling Strike: no Attack bonus to transfer.');
    }
  }

  // ── Majani: Nature Guard ────────────────────────────────────────────
  if (name === 'Nature Guard') {
    let enchantCount = 0;
    for (const h of state.players[playerId].heroes) {
      enchantCount += (h.enchantments ? h.enchantments.length : 0);
    }
    for (const card of state.players[playerId].playedCards) {
      if (card.special === 'enchant') enchantCount++;
    }
    hero.tempDefense += enchantCount;
    logs.push(`Majani gains +${enchantCount} Defense (Nature Guard)`);
  }

  // ── Majani: Enchanting Roots ────────────────────────────────────────
  if (name === 'Enchanting Roots') {
    logs.push('Enchanting Roots: a card in the stack may become an enchantment.');
  }

  // ── Moraga: Amber Forge ─────────────────────────────────────────────
  if (name === 'Amber Forge') {
    const amberSword = {
      id: generateCardId(),
      name: 'Amber Sword-Axe',
      text: '+2 Attack to the equipped hero. It uses Defense instead of Attack for combat damage.',
      effects: [
        { type: 'buff', stat: 'attack', amount: 2, duration: 'turn', target: 'ownActive' },
        { type: 'swapAttackDefense', target: 'ownActive' },
      ],
      runes: { G: 2, W: 2 },
      runeStr: 'GGWW',
      runeCount: 4,
      colors: ['G', 'W'],
      special: 'item',
    };
    state.players[playerId].hand.push(amberSword);
    logs.push('Amber Sword-Axe created in hand!');
  }

  // ── Moraga: Earthen Strike ──────────────────────────────────────────
  if (name === 'Earthen Strike') {
    const totalDef = hero.defense + hero.tempDefense;
    if (target) {
      const t = findHeroInState(state, target);
      if (t && t.battlefieldId !== hero.battlefieldId) {
        t.currentHealth -= totalDef;
        logs.push(`${t.name} takes ${totalDef} magic damage (Earthen Strike)`);
      } else if (t && t.battlefieldId === hero.battlefieldId) {
        logs.push('Earthen Strike: target must be on a different battlefield.');
      }
    }
  }

  // ── Doran: Quick Smith ──────────────────────────────────────────────
  if (name === 'Quick Smith') {
    logs.push('Quick Smith: next item played this turn activates immediately.');
  }

  // ── Doran: Second Wind ──────────────────────────────────────────────
  if (name === 'Second Wind') {
    if (hero.currentHealth <= hero.maxHealth / 2) {
      const room = hero.maxHealth - hero.currentHealth;
      const healed = Math.min(2, room);
      hero.currentHealth += healed;
      logs.push(`Doran restores ${healed} HP (Second Wind) -> ${hero.currentHealth}/${hero.maxHealth}`);
    } else {
      logs.push('Second Wind: Doran is above half health, no effect.');
    }
  }

  return logs;
}

// ── RESOLVE_NEXT_CARD ─────────────────────────────────────────────────────────

function handleResolveNextCard(state, payload) {
  const { targets } = payload || {};
  if (state.phase !== PHASES.CARD_RESOLVE) return state;

  const s = structuredClone(state);

  // If the queue is exhausted, advance to COMBAT
  if (!s.cardResolveQueue || s.cardResolveIndex >= s.cardResolveQueue.length) {
    s.phase = PHASES.COMBAT;
    s.combatRolls = {
      player1: Math.floor(Math.random() * 4) + 1,
      player2: Math.floor(Math.random() * 4) + 1,
    };
    addLog(s, 'All cards resolved. Entering combat!');
    return s;
  }

  const entry = s.cardResolveQueue[s.cardResolveIndex];
  const { playerId, card } = entry;
  const ownerName = s.players[playerId].name;
  const logs = [`Resolving ${card.name} (${ownerName})`];

  // ── Negate check ────────────────────────────────────────────────────
  if (s.negateNext && s.negateNext.active) {
    // Negate applies to the first opponent card after the one that set it
    if (s.negateNext.sourcePlayerId !== playerId) {
      if (card.runeCount < s.negateNext.sourceRuneCount) {
        logs.push(`${card.name} is NEGATED! (${card.runeCount} runes < ${s.negateNext.sourceRuneCount})`);
        s.negateNext = null;
        s.cardResolveIndex++;
        // If queue exhausted after skip, advance to combat
        if (s.cardResolveIndex >= s.cardResolveQueue.length) {
          s.phase = PHASES.COMBAT;
          logs.push('All cards resolved. Entering combat!');
        }
        addLog(s, ...logs);
        return s;
      }
      // Not fewer runes — negate fizzles
      logs.push(`${card.name} has ${card.runeCount} runes, negate fizzles.`);
      s.negateNext = null;
    }
  }

  // ── Resolve the card's effects (targeting/conditions/timing handled inside) ──
  logs.push(...resolveCard(s, entry, targets || {}));

  s.cardResolveIndex++;

  // Check if all cards are resolved
  if (s.cardResolveIndex >= s.cardResolveQueue.length) {
    s.phase = PHASES.COMBAT;
    s.combatRolls = {
      player1: Math.floor(Math.random() * 4) + 1,
      player2: Math.floor(Math.random() * 4) + 1,
    };
    logs.push('All cards resolved. Entering combat!');
  }

  addLog(s, ...logs);
  return s;
}

// ── EXECUTE_COMBAT ────────────────────────────────────────────────────────────

function handleExecuteCombat(state) {
  if (state.phase !== PHASES.COMBAT) return state;

  const s = structuredClone(state);
  const bf = s.battlefields[s.activeBattlefield];
  if (!bf) {
    s.phase = PHASES.END_TURN;
    return s;
  }

  const hero1 = findHeroInState(s, bf.player1Hero);
  const hero2 = findHeroInState(s, bf.player2Hero);

  if (!hero1 || !hero2) {
    s.phase = PHASES.END_TURN;
    addLog(s, 'Combat skipped (missing combatant).');
    return s;
  }

  const logs = ['--- COMBAT ---'];
  logs.push(`  [${hero1.name}] HP:${hero1.currentHealth}/${hero1.maxHealth} ATK:${hero1.attack + hero1.tempAttack} DEF:${hero1.defense + hero1.tempDefense}${hero1.useDefenseForAttack ? ' (uses DEF for dmg)' : ''}`);
  logs.push(`  [${hero2.name}] HP:${hero2.currentHealth}/${hero2.maxHealth} ATK:${hero2.attack + hero2.tempAttack} DEF:${hero2.defense + hero2.tempDefense}${hero2.useDefenseForAttack ? ' (uses DEF for dmg)' : ''}`);

  // ── Token combat (tokens attack alongside their owner's hero) ───────
  for (const token of bf.tokens) {
    const enemy = token.owner === 'player1' ? hero2 : hero1;
    enemy.currentHealth -= token.attack;
    logs.push(`${token.name} token (${token.owner}) deals ${token.attack} damage to ${enemy.name}`);
  }
  bf.tokens = []; // tokens die after dealing/taking damage

  // ── Use pre-generated rolls ─────────────────────────────────────────
  const roll1 = state.combatRolls?.player1 || (Math.floor(Math.random() * 4) + 1);
  const roll2 = state.combatRolls?.player2 || (Math.floor(Math.random() * 4) + 1);

  // ── Effective stats ─────────────────────────────────────────────────
  const atk1 = hero1.useDefenseForAttack
    ? hero1.defense + hero1.tempDefense
    : hero1.attack + hero1.tempAttack;
  const def1 = hero1.defense + hero1.tempDefense;
  const atk2 = hero2.useDefenseForAttack
    ? hero2.defense + hero2.tempDefense
    : hero2.attack + hero2.tempAttack;
  const def2 = hero2.defense + hero2.tempDefense;

  // ── Damage calculation: d4 + ATK - opponent DEF, min 0 ─────────────
  const dmg1to2 = Math.max(0, roll1 + atk1 - def2);
  const dmg2to1 = Math.max(0, roll2 + atk2 - def1);

  logs.push(
    `${hero1.name}: rolls ${roll1} + ${atk1} ATK - ${def2} DEF = ${dmg1to2} damage to ${hero2.name}`,
  );
  logs.push(
    `${hero2.name}: rolls ${roll2} + ${atk2} ATK - ${def1} DEF = ${dmg2to1} damage to ${hero1.name}`,
  );

  // ── Apply damage simultaneously ─────────────────────────────────────
  hero1.currentHealth -= dmg2to1;
  hero2.currentHealth -= dmg1to2;

  logs.push(`${hero1.name}: ${hero1.currentHealth}/${hero1.maxHealth} HP`);
  logs.push(`${hero2.name}: ${hero2.currentHealth}/${hero2.maxHealth} HP`);

  // ── Track overkill for tiebreaker ───────────────────────────────────
  if (hero2.currentHealth < 0) {
    s.overkillDamage.player1 += Math.abs(hero2.currentHealth);
  }
  if (hero1.currentHealth < 0) {
    s.overkillDamage.player2 += Math.abs(hero1.currentHealth);
  }

  s.phase = PHASES.END_TURN;
  addLog(s, ...logs);
  return s;
}

// ── END_TURN ──────────────────────────────────────────────────────────────────

function handleEndTurn(state) {
  if (state.phase !== PHASES.END_TURN) return state;

  const s = structuredClone(state);
  const logs = [];

  // ── Moraga's Life Bond passive: restore 1 HP to all allied active heroes ──
  for (const pid of ['player1', 'player2']) {
    const activeHero = getActiveHeroForPlayer(s, pid);
    if (activeHero && activeHero.id === 'moraga') {
      for (const h of s.players[pid].heroes) {
        if (h.alive && h.currentHealth < h.maxHealth) {
          const healed = Math.min(1, h.maxHealth - h.currentHealth);
          h.currentHealth += healed;
          logs.push(`Moraga's Life Bond: ${h.name} restores ${healed} HP`);
        }
      }
    }
  }

  // ── Check hero deaths (after end-of-turn effects) ───────────────────
  for (const pid of ['player1', 'player2']) {
    for (const h of s.players[pid].heroes) {
      if (h.currentHealth <= 0 && h.alive) {
        h.alive = false;
        h.currentHealth = 0;
        logs.push(`${h.name} has fallen!`);
      }
    }
  }

  // ── Win condition: all heroes of one player are dead ────────────────
  for (const pid of ['player1', 'player2']) {
    if (s.players[pid].heroes.every(h => !h.alive)) {
      const winnerId = opponentOf(pid);
      s.phase = PHASES.GAME_OVER;
      s.winner = winnerId;
      logs.push(`All of ${s.players[pid].name}'s heroes have fallen!`);
      logs.push(`${s.players[winnerId].name} wins the game!`);
      addLog(s, ...logs);
      return s;
    }
  }

  // ── Reset temporary buffs/debuffs ───────────────────────────────────
  for (const pid of ['player1', 'player2']) {
    for (const h of s.players[pid].heroes) {
      h.tempAttack = 0;
      h.tempDefense = 0;
      h.tempMagicPower = 0;
      h.useDefenseForAttack = false;
    }
  }

  // ── Move played cards to discard (skip items - they stay equipped) ────
  for (const pid of ['player1', 'player2']) {
    const p = s.players[pid];
    const nonItems = p.playedCards.filter(c => c.special !== 'item');
    p.discard.push(...nonItems);
    p.playedCards = [];
    p.hasCelerity = false;
    p.cardsPlayedThisTurn = 0;
  }

  // ── Mark heroes as used this round ──────────────────────────────────
  const bf = s.battlefields[s.activeBattlefield];
  if (bf) {
    for (const pid of ['player1', 'player2']) {
      const heroId = pid === 'player1' ? bf.player1Hero : bf.player2Hero;
      if (heroId) {
        s.players[pid].heroesUsedThisRound.push(heroId);
        const h = findHeroInState(s, heroId);
        if (h) h.isActive = false;
      }
    }
  }

  // ── Enable optional discard ─────────────────────────────────────────
  s.canDiscard = true;
  logs.push('Turn ended. You may discard a card, then advance to next turn.');
  addLog(s, ...logs);
  return s;
}

// ── DISCARD_CARD ──────────────────────────────────────────────────────────────

function handleDiscardCard(state, { playerId, cardId }) {
  if (state.phase !== PHASES.END_TURN) return state;
  if (!state.canDiscard) return state;

  const s = structuredClone(state);
  const player = s.players[playerId];
  const idx = player.hand.findIndex(c => c.id === cardId);
  if (idx === -1) return state;

  const [discarded] = player.hand.splice(idx, 1);
  player.discard.push(discarded);

  addLog(s, `${player.name} discards ${discarded.name}.`);
  return s;
}

// ── NEXT_TURN ─────────────────────────────────────────────────────────────────

function handleNextTurn(state) {
  if (state.phase !== PHASES.END_TURN) return state;

  const s = structuredClone(state);
  const logs = [];
  s.canDiscard = false;

  // ── Check if round should end ───────────────────────────────────────
  // Round ends when either player has no unused alive heroes left
  const available = (pid) =>
    s.players[pid].heroes.filter(
      h => h.alive && !s.players[pid].heroesUsedThisRound.includes(h.instanceId),
    );

  const p1Avail = available('player1');
  const p2Avail = available('player2');

  if (p1Avail.length === 0 || p2Avail.length === 0) {
    logs.push(`--- Round ${s.round} ends ---`);

    // Clear all battlefields
    for (const bf of s.battlefields) {
      bf.player1Hero = null;
      bf.player2Hero = null;
      bf.tokens = [];
    }

    // Reset hero round tracking and bf bonuses
    for (const pid of ['player1', 'player2']) {
      s.players[pid].heroesUsedThisRound = [];
      for (const h of s.players[pid].heroes) {
        h.isActive = false;
        h.battlefieldId = null;
        if (h.bfBonusApplied) {
          h.currentAttack = h.attack;
          h.currentMagicPower = h.magicPower;
          h.bfBonusApplied = false;
        }
      }
    }

    s.round++;
    s.activeBattlefield = null;
    logs.push(`--- Round ${s.round} begins ---`);
  }

  // ── Determine initiative for next turn ──────────────────────────────
  if (s.polarityHolder) {
    // Player with polarity chose initiative via CHOOSE_INITIATIVE
    if (s.initiativeChoice != null) {
      s.turnFirstPlayerId = s.initiativeChoice
        ? s.polarityHolder
        : opponentOf(s.polarityHolder);
    } else {
      // Default: polarity holder goes first
      s.turnFirstPlayerId = s.polarityHolder;
    }
    logs.push(
      `${s.players[s.turnFirstPlayerId].name} has initiative (polarity).`,
    );
    s.polarityHolder = null;
    s.initiativeChoice = null;
  } else {
    // Alternate initiative each turn
    s.turnFirstPlayerId =
      s.turnFirstPlayerId === 'player1' ? 'player2' : 'player1';
  }

  s.activePlayerId = s.turnFirstPlayerId;
  s.turn++;
  s.phase = PHASES.DRAW;

  // Log state summary before next turn begins
  for (const pid of ['player1', 'player2']) {
    const p = s.players[pid];
    logs.push(`  [${p.name}] hand:${p.hand.length} [${p.hand.map(c => c.name).join(', ') || 'empty'}] deck:${p.deck.length} discard:${p.discard.length}`);
  }
  logs.push(`  Next turn: Turn ${s.turn} | Round ${s.round} | First: ${s.players[s.turnFirstPlayerId].name}`);

  // Clean up transient state
  delete s.cardSelections;
  delete s.cardResolveQueue;
  delete s.cardResolveIndex;
  s.negateNext = null;

  logs.push(`Turn ${s.turn}: ${s.players[s.activePlayerId].name} is the active player.`);
  addLog(s, ...logs);
  return s;
}

// ── CHOOSE_INITIATIVE ─────────────────────────────────────────────────────────

function handleChooseInitiative(state, { playerId, wantsFirst }) {
  if (state.polarityHolder !== playerId) return state;

  const s = structuredClone(state);
  s.initiativeChoice = wantsFirst;

  addLog(
    s,
    `${s.players[playerId].name} chooses to go ${wantsFirst ? 'first' : 'second'} next turn.`,
  );
  return s;
}
