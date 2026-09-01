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

function makeCard(name, effect, runeStr, special = null) {
  const runes = parseRunes(runeStr);
  return {
    id: id(),
    name,
    effect,
    runes,
    runeStr: runeStr.toUpperCase(),
    runeCount: runeCount(runes),
    colors: getCardColors(runes),
    special,
  };
}

export function createBrightDeck() {
  const cards = [];

  cards.push(makeCard('Haze', 'If you are going Second, Negate All Stat Changes Of the Enemy Hero', 'CU'));
  cards.push(makeCard('Mossy Salve', 'Restore 1 HP to Any Hero. If your Active Hero has 50% HP or less, Restore 2 HP instead', 'CG'));
  cards.push(makeCard('Shield Wall', 'Plus 1 Defense to Any Hero Until end of Turn. Create 1/1 White Legionnaire on this Battlefield', 'WG'));
  cards.push(makeCard('Pisello', 'This card cannot be played.', 'B', 'pisello'));

  for (let i = 0; i < 2; i++) cards.push(makeCard('Swift Guard', 'During Card Selection, if you select this Card, You gain Celerity for Grey Cards Only', 'CW'));
  for (let i = 0; i < 2; i++) cards.push(makeCard('Fortify', 'Plus 2 Defense to Any Hero Until end of Turn', 'CG'));
  for (let i = 0; i < 2; i++) cards.push(makeCard('Harden', 'Plus 2 Defense to Any Hero Until end of Turn', 'GG'));
  cards.push(makeCard('Heal', 'Restore 2 HP to Any Hero', 'GG'));
  for (let i = 0; i < 2; i++) cards.push(makeCard('Block', 'Plus 1 Defense to Any Hero Until end of Turn', 'G'));

  for (let i = 0; i < 2; i++) cards.push(makeCard('Shield Bash Blade', "Your Equipped Hero uses it's Defense instead of Attack to determine Damage", 'CWUG', 'item'));
  for (let i = 0; i < 2; i++) cards.push(makeCard('Arcane Shield', "Plus 1 Magic Power to Equipped Hero. Your Equipped Hero uses Defense instead of Attack to determine Damage", 'CWUG', 'item'));

  for (let i = 0; i < 2; i++) cards.push(makeCard('Living Armor', "At the Beginning of Enchanted Hero's Turn, Plus 1 Defense Until end of Turn. Uses Defense instead of Attack for Damage", 'WRRGG', 'enchant'));
  cards.push(makeCard('Green Lore', 'Plus 1 Defense to Any Hero Until end of Turn. A Player draws 1 additional Card next Draw Phase', 'RG'));

  return cards;
}

export function createDarkDeck() {
  const cards = [];

  for (let i = 0; i < 2; i++) cards.push(makeCard('Shadow Strike', 'If going First, Plus 3 Attack to Any Hero Until end of Turn. If next opponent card has fewer Runes, negate it', 'CBP'));
  for (let i = 0; i < 4; i++) cards.push(makeCard('Pisello', 'This card cannot be played.', 'R', 'pisello'));
  for (let i = 0; i < 2; i++) cards.push(makeCard('Shadow Pierce', 'If going First, Minus 3 Defense to Any Hero Until end of Turn. If next opponent card has fewer Runes, negate it', 'CBP'));
  for (let i = 0; i < 2; i++) cards.push(makeCard('Dark Charge', 'If going First, Plus 3 Attack to Any Hero', 'CP'));
  for (let i = 0; i < 2; i++) cards.push(makeCard('Cripple', 'Minus 1 Attack to Any Hero Until end of Turn. Minus 2 Defense to Any Hero Until end of Turn', 'BP'));
  for (let i = 0; i < 2; i++) cards.push(makeCard('Violet Gambit', 'During Card Selection if going First, You gain Celerity. Choose to go First or Second next Turn', 'UPP'));
  for (let i = 0; i < 2; i++) cards.push(makeCard('Dark Dominion', 'If going First, Plus 3 Attack to Any Hero. Choose to go First or Second next Turn', 'CUPP'));
  cards.push(makeCard('Shadow Rush', 'During Card Selection if going First, You gain Celerity. Minus 1 Atk and Minus 2 Def to Any Hero Until end of Turn', 'BPP'));
  cards.push(makeCard('Charge', 'Plus 2 Attack to Any Hero Until end of Turn', 'CW'));
  cards.push(makeCard('Dark Reprisal', 'If going First, Minus 3 Defense to Any Hero. Choose to go First or Second next Turn', 'CUPP'));
  cards.push(makeCard('Nick', 'If going First, Minus 3 Defense to Any Hero', 'CP'));

  return cards;
}

export const PURPLE_KNIFE = makeCard(
  'Purple Knife',
  'Plus 2 Attack to Equipped Hero. If going First, activates Immediately',
  'PP',
  'item'
);

export { parseRunes, runeCount, getCardColors };
