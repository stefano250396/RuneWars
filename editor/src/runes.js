/**
 * Rune helpers — copied verbatim from src/data/cards.js of the game.
 * Kept as a local copy because the editor is a standalone app.
 */

export const RUNE_LETTERS = ['W', 'U', 'B', 'R', 'G', 'P', 'C'];

export const RUNE_NAMES = {
  W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green', P: 'Purple', C: 'Grey',
};

export function parseRunes(str) {
  const runes = {};
  for (const ch of String(str || '').toUpperCase()) {
    if ('WUBRGPC'.includes(ch)) runes[ch] = (runes[ch] || 0) + 1;
  }
  return runes;
}

export function runeCount(runes) {
  return Object.values(runes).reduce((a, b) => a + b, 0);
}

export function getCardColors(runes) {
  const max = Math.max(...Object.values(runes), 0);
  if (max === 0) return [];
  return Object.entries(runes).filter(([, v]) => v === max).map(([k]) => k);
}
