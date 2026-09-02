/**
 * Card inspection helpers for the Rune Wars engine.
 *
 * Cards carry their behaviour as a structured `effects` array (see
 * `src/engine/effectSchema.js`); the resolution engine lives in
 * `src/engine/effectHandlers.js`. This module only *reads* cards.
 */

/**
 * The structured effects of a card. Pisello ("dead") cards resolve to a single
 * unplayable effect regardless of what's on their `effects` field.
 *
 * @param {Object} card
 * @returns {Array} effect objects
 */
export function getCardEffects(card) {
  if (!card) return [];
  if (card.special === 'pisello') return [{ type: 'unplayable' }];
  return card.effects || [];
}

/**
 * Effects that fire during CARD_SELECT (currently: celerity pre-checks).
 */
export function getSelectionEffects(card) {
  return getCardEffects(card).filter(e => e.timing === 'selection');
}

/**
 * Whether a hero is allowed to play a specific card.
 *
 * Rules:
 *  1. Pisello cards cannot be played by anyone.
 *  2. Doran can play Items of any color (passive override).
 *  3. Otherwise the hero's color must appear in the card's colors, or the card
 *     must contain a 'C' (Grey) rune.
 */
export function canPlayCard(card, hero) {
  if (card.special === 'pisello') return false;
  if (hero.id === 'doran' && card.special === 'item') return true;

  const cardColors = card.colors || [];
  return cardColors.includes(hero.color) || cardColors.includes('C');
}

/**
 * Whether the runes from played cards cover an ability's rune cost.
 *
 * @param {Array} playedCards - card objects played this turn
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
