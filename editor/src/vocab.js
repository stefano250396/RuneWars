/**
 * Shared vocabulary for the CSV importers (modules + heroes).
 *
 * Effect `type` values, targets, conditions, timings, durations, scaler
 * sources. Heroes extend the module set — a module simply never uses the
 * hero-only values.
 */

// ─── Effect types ────────────────────────────────────────────────────────────

export const MODULE_EFFECT_TYPES = [
  'buff', 'debuff', 'heal', 'damage', 'healthLoss', 'token', 'celerity',
  'negate', 'negateStats', 'polarity', 'draw', 'swapAttackDefense',
  'damageReduction', 'stealStat', 'playExtraCard', 'extraAttack',
  'deckShuffle', 'mill', 'destroyPermanent', 'moveEnchantment', 'unplayable',
];

export const HERO_EFFECT_TYPES = [
  'initiative', 'createCard', 'grantColorFreedom', 'restrictCards',
  'transformStackCard', 'itemHaste',
];

export const EFFECT_TYPES = [...MODULE_EFFECT_TYPES, ...HERO_EFFECT_TYPES];

/** Effects that need `amount` or `scaler`. */
export const NUMERIC_TYPES = [
  'buff', 'debuff', 'heal', 'damage', 'healthLoss', 'draw', 'damageReduction',
];
/** Effects that need `stat`. */
export const STAT_TYPES = ['buff', 'debuff'];

// ─── Stats & scalers ─────────────────────────────────────────────────────────

export const STATS = ['attack', 'defense', 'magicPower'];

/** `scaler` column: space-separated list of these. */
export const SCALER_SOURCES = [
  'magicPower', 'ownDefense', 'ownAttackBonus', 'equippedItems', 'ownEnchants',
];

// ─── Targets ─────────────────────────────────────────────────────────────────

export const TARGETS = [
  // modules
  'any', 'anyOther', 'ownActive', 'enemyActive', 'allHeroes',
  'twoOwnHeroes', 'enemyInactive', 'activeBattlefield', 'none',
  // heroes
  'self', 'allOwnHeroes', 'allBattlefieldsOwnSide', 'enemyOnOtherBattlefield',
];

// ─── Conditions ──────────────────────────────────────────────────────────────

export const SIMPLE_CONDITIONS = [
  'goingFirst', 'goingSecond',
  'activeHeroHalfOrLess', 'activeHeroAboveHalf', 'enemyActiveHalfOrLess',
  'selfIsActive', 'targetEnchanted', 'selfHalfOrLess',
];
export const PARAM_CONDITION = /^(deckAtMost|deckAtLeast):\d+$/;

export function isValidCondition(c) {
  return SIMPLE_CONDITIONS.includes(c) || PARAM_CONDITION.test(c);
}

// ─── Timing ──────────────────────────────────────────────────────────────────

/** Canonical timings. `resolve`/`selection` are accepted aliases. */
export const TIMINGS = [
  'preGame', 'draw', 'placement', 'cardSelect', 'abilityCheck',
  'cardResolve', 'combat', 'endTurn', 'always', 'enchantUpkeep',
  'onPlayItem', 'onDamaged',
];
export const TIMING_ALIASES = { resolve: 'cardResolve', selection: 'cardSelect' };

export function canonicalTiming(t) {
  return TIMING_ALIASES[t] || t;
}

// ─── Duration ────────────────────────────────────────────────────────────────

export const DURATIONS = ['turn', 'permanent', 'always'];

// ─── Modifier ops (modules only) ─────────────────────────────────────────────

export const MOD_OPS = ['addFlat', 'addScaler', 'setValue', 'removeDuration', 'retype'];

// ─── Rune letters ────────────────────────────────────────────────────────────

export const RUNE_LETTERS = ['W', 'U', 'B', 'R', 'G', 'C', 'P'];

/** Emoji column header -> rune letter (for the hero rune-pool columns). */
export const RUNE_EMOJI = {
  '🟡': 'W', '🔵': 'U', '⚫': 'B', '🔴': 'R', '🟢': 'G', '⚪': 'C', '🟣': 'P',
};

// ─── id slug ─────────────────────────────────────────────────────────────────

export function slugId(name, fallback = 'x') {
  const parts = String(name).toLowerCase().match(/[a-z0-9]+/g) || [];
  if (parts.length === 0) return fallback;
  return parts[0] + parts.slice(1).map((p) => p[0].toUpperCase() + p.slice(1)).join('');
}
