/**
 * CARD EFFECT SCHEMA
 * ─────────────────────────────────────────────────────────────────────────────
 * Cards declare their behaviour as a list of structured `Effect` objects on the
 * `effects` field (see `src/data/cards.js`). There is no text parsing — the
 * `text` field on a card is purely for display.
 *
 * An Effect looks like:
 *
 *   {
 *     type:      one of EFFECT_TYPES              (required)
 *     timing:    one of TIMINGS                   (default: 'resolve')
 *     condition: one of CONDITIONS | null | undefined
 *     target:    one of TARGETS                   (default depends on type)
 *
 *     // type-specific payload:
 *     stat:      'attack' | 'defense' | 'magicPower'   (buff / debuff)
 *     amount:    number                                (buff / debuff / heal / damage / draw)
 *     duration:  'turn'                                (buff / debuff — informational, temp stats
 *                                                       always reset at end of turn today)
 *     name, attack, defense:  token stats             (token)
 *     mode:      'fewerRunes'                          (negate)
 *     restriction: 'grey'                              (celerity — declared, not yet enforced)
 *   }
 *
 * The resolution engine lives in `src/engine/effectHandlers.js`.
 */

/** What an effect does. Each maps to a handler in EFFECT_HANDLERS. */
export const EFFECT_TYPES = {
  BUFF: 'buff',                       // + stat to a hero
  DEBUFF: 'debuff',                   // - stat to a hero
  HEAL: 'heal',                       // restore HP
  DAMAGE: 'damage',                   // direct HP loss
  TOKEN: 'token',                     // spawn a token on a battlefield
  CELERITY: 'celerity',              // grant the player a 2nd card this turn
  NEGATE: 'negate',                  // cancel the next weaker opponent card
  NEGATE_STATS: 'negateStats',      // wipe temp stat changes on the enemy hero
  POLARITY: 'polarity',             // let the player choose initiative next turn
  DRAW: 'draw',                      // extra card(s) next draw phase
  SWAP_ATTACK_DEFENSE: 'swapAttackDefense', // use DEF instead of ATK for combat damage
  UNPLAYABLE: 'unplayable',          // dead card (Pisello)
};

/** When an effect fires. */
export const TIMINGS = {
  SELECTION: 'selection',       // during CARD_SELECT (celerity pre-check)
  RESOLVE: 'resolve',           // during CARD_RESOLVE (the default)
  ENCHANT_UPKEEP: 'enchantUpkeep', // start of enchanted hero's turn — declared, not yet executed
};

/** Who / what an effect points at. */
export const TARGETS = {
  OWN_ACTIVE: 'ownActive',           // caster's active hero on the active battlefield
  ENEMY_ACTIVE: 'enemyActive',       // opponent's active hero
  ANY: 'any',                        // UI-supplied target, else a smart default
  NONE: 'none',                      // player-level effect, no hero target
  ACTIVE_BATTLEFIELD: 'activeBattlefield', // the battlefield currently in play (tokens)
};

/** Gate that must pass for the effect to apply. */
export const CONDITIONS = {
  GOING_FIRST: 'goingFirst',
  GOING_SECOND: 'goingSecond',
  ACTIVE_HERO_HALF_OR_LESS: 'activeHeroHalfOrLess',
  ACTIVE_HERO_ABOVE_HALF: 'activeHeroAboveHalf',
};
