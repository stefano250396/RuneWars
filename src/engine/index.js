/**
 * Rune Wars Game Engine — public API
 *
 * Re-exports everything the React UI needs from the engine modules.
 * Import from 'engine/' rather than individual files.
 */

// State shape, phases, factory helpers
export { PHASES, createInitialState, createPlayerState, createHeroInstance } from './gameState.js';

// Action types and creators
export {
  SETUP_GAME,
  DRAW_CARDS,
  PLACE_HERO,
  PLACE_OPPONENT_HERO,
  SELECT_CARDS,
  RESOLVE_ABILITIES,
  RESOLVE_NEXT_CARD,
  EXECUTE_COMBAT,
  END_TURN,
  DISCARD_CARD,
  NEXT_TURN,
  CHOOSE_INITIATIVE,
  setupGame,
  drawCards,
  placeHero,
  placeOpponentHero,
  selectCards,
  resolveAbilities,
  resolveNextCard,
  executeCombat,
  endTurn,
  discardCard,
  nextTurn,
  chooseInitiative,
} from './actions.js';

// Reducer
export { gameReducer } from './reducer.js';

// Card inspection helpers (for UI components that need to read cards)
export {
  getCardEffects,
  getSelectionEffects,
  canPlayCard,
  checkAbilityCost,
} from './effects.js';

// Effect resolution engine + schema
export { resolveCard, EFFECT_HANDLERS, resolveTarget, checkCondition } from './effectHandlers.js';
export { EFFECT_TYPES, TIMINGS, TARGETS, CONDITIONS } from './effectSchema.js';
