/**
 * Action type constants and action creator functions for the Rune Wars game engine.
 * Used by the React UI via useReducer to drive game state transitions.
 */

// ─── Action Types ────────────────────────────────────────────────────────────

export const SETUP_GAME = 'SETUP_GAME';
export const DRAW_CARDS = 'DRAW_CARDS';
export const PLACE_HERO = 'PLACE_HERO';
export const PLACE_OPPONENT_HERO = 'PLACE_OPPONENT_HERO';
export const SELECT_CARDS = 'SELECT_CARDS';
export const RESOLVE_ABILITIES = 'RESOLVE_ABILITIES';
export const RESOLVE_NEXT_CARD = 'RESOLVE_NEXT_CARD';
export const EXECUTE_COMBAT = 'EXECUTE_COMBAT';
export const END_TURN = 'END_TURN';
export const DISCARD_CARD = 'DISCARD_CARD';
export const NEXT_TURN = 'NEXT_TURN';
export const CHOOSE_INITIATIVE = 'CHOOSE_INITIATIVE';

// ─── Action Creators ─────────────────────────────────────────────────────────

/** Start a new game with the given factions ('dark' | 'bright'). */
export const setupGame = (faction1, faction2) => ({
  type: SETUP_GAME,
  payload: { faction1, faction2 },
});

/** Both players draw cards up to hand size of 4. */
export const drawCards = () => ({
  type: DRAW_CARDS,
});

/** Active player places an unused hero on a battlefield. */
export const placeHero = (playerId, heroInstanceId, battlefieldId) => ({
  type: PLACE_HERO,
  payload: { playerId, heroInstanceId, battlefieldId },
});

/** Opponent places a hero against the active player's hero (same battlefield). */
export const placeOpponentHero = (playerId, heroInstanceId) => ({
  type: PLACE_OPPONENT_HERO,
  payload: { playerId, heroInstanceId },
});

/**
 * A player selects cards to play this turn.
 * cardIds: array of card IDs from the player's hand.
 */
export const selectCards = (playerId, cardIds) => ({
  type: SELECT_CARDS,
  payload: { playerId, cardIds },
});

/**
 * Check and resolve hero abilities based on played card runes.
 * targets: optional { [playerId]: { active1: heroInstanceId, active2: heroInstanceId } }
 */
export const resolveAbilities = (targets = {}) => ({
  type: RESOLVE_ABILITIES,
  payload: { targets },
});

/**
 * Resolve the next card in the interleaved card resolution queue.
 * targets: optional { [effectIndex]: heroInstanceId } for effects that need a target.
 */
export const resolveNextCard = (targets = {}) => ({
  type: RESOLVE_NEXT_CARD,
  payload: { targets },
});

/** Execute combat: roll d4, calculate damage, apply simultaneously. */
export const executeCombat = () => ({
  type: EXECUTE_COMBAT,
});

/** Trigger end-of-turn effects, check deaths, reset temp stats. */
export const endTurn = () => ({
  type: END_TURN,
});

/** Optionally discard one card from hand during END_TURN phase. */
export const discardCard = (playerId, cardId) => ({
  type: DISCARD_CARD,
  payload: { playerId, cardId },
});

/** Advance to the next turn (handles round transitions). */
export const nextTurn = () => ({
  type: NEXT_TURN,
});

/** Choose initiative for next turn (from polarity card effects). */
export const chooseInitiative = (playerId, wantsFirst) => ({
  type: CHOOSE_INITIATIVE,
  payload: { playerId, wantsFirst },
});
