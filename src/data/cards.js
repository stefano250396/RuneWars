/**
 * Card catalogue for the two faction decks.
 *
 * Each card declares its behaviour as a structured `effects` array (schema in
 * `src/engine/effectSchema.js`); `text` is the hand-written display string.
 */

let _nextId = 1;
function id() { return _nextId++; }

function parseRunes(str) {
  const runes = {};
  for (const ch of str.toUpperCase()) {
    if ('WUBRGPC'.includes(ch)) runes[ch] = (runes[ch] || 0) + 1;
  }
  return runes;
}

function runeCount(runes) {
  return Object.values(runes).reduce((a, b) => a + b, 0);
}

function getCardColors(runes) {
  const max = Math.max(...Object.values(runes), 0);
  if (max === 0) return [];
  return Object.entries(runes).filter(([, v]) => v === max).map(([k]) => k);
}

/**
 * @param {string} name
 * @param {string} text     human-readable description (UI only)
 * @param {string} runeStr  e.g. "CWUG"
 * @param {Array}  effects   structured effect objects
 * @param {string|null} special  'item' | 'enchant' | 'pisello' | null
 */
function makeCard(name, text, runeStr, effects = [], special = null) {
  const runes = parseRunes(runeStr);
  return {
    id: id(),
    name,
    text,
    effects,
    runes,
    runeStr: runeStr.toUpperCase(),
    runeCount: runeCount(runes),
    colors: getCardColors(runes),
    special,
  };
}

// ─── Effect shorthands ───────────────────────────────────────────────────────

const buff = (stat, amount, opts = {}) =>
  ({ type: 'buff', stat, amount, duration: 'turn', target: 'any', ...opts });
const debuff = (stat, amount, opts = {}) =>
  ({ type: 'debuff', stat, amount, duration: 'turn', target: 'any', ...opts });
const heal = (amount, opts = {}) =>
  ({ type: 'heal', amount, target: 'any', ...opts });
const UNPLAYABLE = [{ type: 'unplayable' }];

// ─── Bright deck ─────────────────────────────────────────────────────────────

export function createBrightDeck() {
  const cards = [];

  cards.push(makeCard(
    'Haze',
    'If you go second, wipe all temporary stat changes from the enemy hero.',
    'CU',
    [{ type: 'negateStats', condition: 'goingSecond', target: 'enemyActive' }],
  ));

  cards.push(makeCard(
    'Mossy Salve',
    'Restore 1 HP to any hero — 2 HP instead if your active hero is at half health or less.',
    'CG',
    [
      heal(1, { condition: 'activeHeroAboveHalf' }),
      heal(2, { condition: 'activeHeroHalfOrLess' }),
    ],
  ));

  cards.push(makeCard(
    'Shield Wall',
    '+1 Defense to any hero until end of turn. Create a 1/1 White Legionnaire on this battlefield.',
    'WG',
    [
      buff('defense', 1),
      { type: 'token', name: 'White Legionnaire', attack: 1, defense: 1, target: 'activeBattlefield' },
    ],
  ));

  cards.push(makeCard('Pisello', 'This card cannot be played.', 'B', UNPLAYABLE, 'pisello'));

  for (let i = 0; i < 2; i++) cards.push(makeCard(
    'Swift Guard',
    'During card selection: selecting this card grants Celerity for Grey cards only.',
    'CW',
    [{ type: 'celerity', timing: 'selection', restriction: 'grey' }],
  ));

  for (let i = 0; i < 2; i++) cards.push(makeCard(
    'Fortify', '+2 Defense to any hero until end of turn.', 'CG', [buff('defense', 2)],
  ));

  for (let i = 0; i < 2; i++) cards.push(makeCard(
    'Harden', '+2 Defense to any hero until end of turn.', 'GG', [buff('defense', 2)],
  ));

  cards.push(makeCard('Heal', 'Restore 2 HP to any hero.', 'GG', [heal(2)]));

  for (let i = 0; i < 2; i++) cards.push(makeCard(
    'Block', '+1 Defense to any hero until end of turn.', 'G', [buff('defense', 1)],
  ));

  for (let i = 0; i < 2; i++) cards.push(makeCard(
    'Shield Bash Blade',
    'Equipped hero uses its Defense instead of Attack for combat damage.',
    'CWUG',
    [{ type: 'swapAttackDefense', target: 'ownActive' }],
    'item',
  ));

  for (let i = 0; i < 2; i++) cards.push(makeCard(
    'Arcane Shield',
    '+1 Magic Power to the equipped hero. It uses Defense instead of Attack for combat damage.',
    'CWUG',
    [
      buff('magicPower', 1, { target: 'ownActive' }),
      { type: 'swapAttackDefense', target: 'ownActive' },
    ],
    'item',
  ));

  for (let i = 0; i < 2; i++) cards.push(makeCard(
    'Living Armor',
    "Enchant. At the start of the enchanted hero's turn: +1 Defense until end of turn, and it uses Defense instead of Attack for combat damage.",
    'WRRGG',
    [
      buff('defense', 1, { target: 'ownActive', timing: 'enchantUpkeep' }),
      { type: 'swapAttackDefense', target: 'ownActive', timing: 'enchantUpkeep' },
    ],
    'enchant',
  ));

  cards.push(makeCard(
    'Green Lore',
    '+1 Defense to any hero until end of turn. You draw 1 extra card next draw phase.',
    'RG',
    [buff('defense', 1), { type: 'draw', amount: 1, target: 'none' }],
  ));

  return cards;
}

// ─── Dark deck ───────────────────────────────────────────────────────────────

export function createDarkDeck() {
  const cards = [];

  for (let i = 0; i < 2; i++) cards.push(makeCard(
    'Shadow Strike',
    'If you go first: +3 Attack to any hero until end of turn. If the next opponent card has fewer runes, negate it.',
    'CBP',
    [buff('attack', 3, { condition: 'goingFirst' }), { type: 'negate', mode: 'fewerRunes' }],
  ));

  for (let i = 0; i < 4; i++) cards.push(
    makeCard('Pisello', 'This card cannot be played.', 'R', UNPLAYABLE, 'pisello'),
  );

  for (let i = 0; i < 2; i++) cards.push(makeCard(
    'Shadow Pierce',
    'If you go first: -3 Defense to any hero until end of turn. If the next opponent card has fewer runes, negate it.',
    'CBP',
    [debuff('defense', 3, { condition: 'goingFirst' }), { type: 'negate', mode: 'fewerRunes' }],
  ));

  for (let i = 0; i < 2; i++) cards.push(makeCard(
    'Dark Charge',
    'If you go first: +3 Attack to any hero.',
    'CP',
    [buff('attack', 3, { condition: 'goingFirst' })],
  ));

  for (let i = 0; i < 2; i++) cards.push(makeCard(
    'Cripple',
    '-1 Attack and -2 Defense to any hero until end of turn.',
    'BP',
    [debuff('attack', 1), debuff('defense', 2)],
  ));

  for (let i = 0; i < 2; i++) cards.push(makeCard(
    'Violet Gambit',
    'During card selection, if you go first: gain Celerity. Choose to go first or second next turn.',
    'UPP',
    [
      { type: 'celerity', timing: 'selection', condition: 'goingFirst' },
      { type: 'polarity', target: 'none' },
    ],
  ));

  for (let i = 0; i < 2; i++) cards.push(makeCard(
    'Dark Dominion',
    'If you go first: +3 Attack to any hero. Choose to go first or second next turn.',
    'CUPP',
    [
      buff('attack', 3, { condition: 'goingFirst' }),
      { type: 'polarity', target: 'none' },
    ],
  ));

  cards.push(makeCard(
    'Shadow Rush',
    'During card selection, if you go first: gain Celerity. -1 Attack and -2 Defense to any hero until end of turn.',
    'BPP',
    [
      { type: 'celerity', timing: 'selection', condition: 'goingFirst' },
      debuff('attack', 1),
      debuff('defense', 2),
    ],
  ));

  cards.push(makeCard(
    'Charge', '+2 Attack to any hero until end of turn.', 'CW', [buff('attack', 2)],
  ));

  cards.push(makeCard(
    'Dark Reprisal',
    'If you go first: -3 Defense to any hero. Choose to go first or second next turn.',
    'CUPP',
    [
      debuff('defense', 3, { condition: 'goingFirst' }),
      { type: 'polarity', target: 'none' },
    ],
  ));

  cards.push(makeCard(
    'Nick',
    'If you go first: -3 Defense to any hero.',
    'CP',
    [debuff('defense', 3, { condition: 'goingFirst' })],
  ));

  return cards;
}

export const PURPLE_KNIFE = makeCard(
  'Purple Knife',
  '+2 Attack to the equipped hero.',
  'PP',
  [buff('attack', 2, { target: 'ownActive' })],
  'item',
);

export { parseRunes, runeCount, getCardColors };
