export const RUNE_COLORS = {
  W: { name: 'White', hex: '#f0c040', symbol: 'W' },
  U: { name: 'Blue', hex: '#3b82f6', symbol: 'U' },
  B: { name: 'Black', hex: '#1a1a2e', symbol: 'B' },
  R: { name: 'Red', hex: '#ef4444', symbol: 'R' },
  G: { name: 'Green', hex: '#22c55e', symbol: 'G' },
  P: { name: 'Purple', hex: '#a855f7', symbol: 'P' },
  C: { name: 'Grey', hex: '#9ca3af', symbol: 'C' },
};

export const FACTIONS = {
  dark: {
    id: 'dark',
    name: 'Dark Faction',
    primaryColor: 'P',
    heroIds: ['zaccaria', 'sly', 'jack'],
  },
  bright: {
    id: 'bright',
    name: 'Bright Faction',
    primaryColor: 'G',
    heroIds: ['majani', 'moraga', 'doran'],
  },
};

export const HEROES = {
  zaccaria: {
    id: 'zaccaria',
    name: 'Zaccaria',
    faction: 'dark',
    color: 'P',
    magicPower: 1,
    attack: 1,
    defense: 2,
    health: 10,
    maxHealth: 10,
    special: { items: 1, enchants: 1 },
    runes: { P: 9, U: 5, W: 1 },
    passive: {
      name: 'First Strike',
      description: 'During the First Turn of the Game you Always go First',
    },
    active1: {
      name: 'Mind Shatter',
      cost: { U: 1, P: 2 },
      description: "Plus 1 Magical Power Until the end of Turn, Minus X Defense to Any Hero, X Equals Zaccaria's Magical Power",
    },
    active2: {
      name: 'Summon Crooks',
      cost: { W: 1, C: 1, P: 2 },
      description: 'Create a 1/1 Crook Token On your side of All Battlefields',
    },
  },

  sly: {
    id: 'sly',
    name: 'Sly',
    faction: 'dark',
    color: 'P',
    magicPower: 0,
    attack: 2,
    defense: 0,
    health: 11,
    maxHealth: 11,
    special: { items: 2, enchants: 0 },
    runes: { P: 6, B: 4, C: 3, G: 2 },
    passive: {
      name: 'Hidden Blade',
      description: 'At the Beginning of the Game Shuffle a Purple Knife Into your Draw Pile',
    },
    active1: {
      name: 'Craft Purple Knife',
      cost: { P: 4, C: 1 },
      description: 'Create a Purple Knife in your Hand',
    },
    active2: {
      name: 'Arsenal',
      cost: { P: 1, G: 1, B: 1 },
      description: "Sly Gains Attack equal to the Number of Items Your Heroes Have Equipped (Dead or Alive)",
    },
  },

  jack: {
    id: 'jack',
    name: 'Jack',
    faction: 'dark',
    color: 'C',
    magicPower: 0,
    attack: 3,
    defense: 0,
    health: 10,
    maxHealth: 10,
    special: { items: 2, enchants: 0 },
    runes: { C: 8, B: 4, P: 3 },
    passive: {
      name: 'Ambush',
      description: 'If you are going First, And Jack is your Active Hero, He Gains 2 Attack',
    },
    active1: {
      name: 'Quick Equip',
      cost: { C: 3, P: 1 },
      description: 'You can Play an Item with 2 or Less Runes Immediately When this Effect Resolves',
    },
    active2: {
      name: 'Crippling Strike',
      cost: { C: 2, B: 2 },
      description: "Minus X Attack to Any Hero, X Equals Jack's Attack Bonus",
    },
  },

  majani: {
    id: 'majani',
    name: 'Majani',
    faction: 'bright',
    color: 'G',
    magicPower: 2,
    attack: 0,
    defense: 2,
    health: 10,
    maxHealth: 10,
    special: { items: 0, enchants: 2 },
    runes: { G: 6, R: 5, U: 4 },
    passive: {
      name: 'Anti-Magic Aura',
      description: 'Enchanted Enemy Heroes Cannot Play More than 2 Cards in the Same Turn',
    },
    active1: {
      name: 'Nature Guard',
      cost: { G: 2, R: 1 },
      description: 'Majani Gains Defense equal to the number of Enchants You Own on the Field or Stack',
    },
    active2: {
      name: 'Enchanting Roots',
      cost: { G: 2, R: 1, U: 1 },
      description: 'One Card you Own in the Stack Becomes an Enchant if it has less or equal runes than your Green Runes',
    },
  },

  moraga: {
    id: 'moraga',
    name: 'Moraga',
    faction: 'bright',
    color: 'G',
    magicPower: 0,
    attack: 2,
    defense: 2,
    health: 10,
    maxHealth: 10,
    special: { items: 1, enchants: 0 },
    runes: { G: 8, W: 5, C: 2 },
    passive: {
      name: 'Life Bond',
      description: "At the End of Moraga's Turn Restore 1 Health to All of Your equipped Heroes",
    },
    active1: {
      name: 'Amber Forge',
      cost: { G: 4, C: 1 },
      description: 'Create an Amber Sword-Axe in your Hand',
    },
    active2: {
      name: 'Earthen Strike',
      cost: { W: 2, G: 2 },
      description: "Moraga Deals Magic Damage equal to his Defense to an Enemy Hero on a Different Battlefield",
    },
  },

  doran: {
    id: 'doran',
    name: 'Doran',
    faction: 'bright',
    color: 'G',
    magicPower: 0,
    attack: 1,
    defense: 2,
    health: 10,
    maxHealth: 10,
    special: { items: 4, enchants: 0 },
    runes: { G: 8, W: 4, C: 4 },
    passive: {
      name: 'Master Smith',
      description: 'When you play an Item, Gain Celerity. Doran can play Items of Any Color',
    },
    active1: {
      name: 'Quick Smith',
      cost: { C: 2, W: 1 },
      description: 'The Next Item you play This Turn Activates Immediately',
    },
    active2: {
      name: 'Second Wind',
      cost: { C: 1, G: 2 },
      description: 'If Doran is at Half Health or less, He Restores 2 Health to Himself',
    },
  },
};
