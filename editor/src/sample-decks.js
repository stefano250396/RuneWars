/**
 * Placeholder decks so the Gestore Mazzi view has something to show.
 * Deck creation / editing is not wired yet.
 */
export const SAMPLE_DECKS = [
  {
    id: 'ombre-viola',
    name: 'Ombre Viola',
    heroes: [
      { id: 'zaccaria', name: 'Zaccaria', color: 'P' },
      { id: 'sly', name: 'Sly', color: 'P' },
      { id: 'jack', name: 'Jack', color: 'C' },
    ],
    color: 'P',
    cardCount: 30,
    colors: ['P', 'B', 'C'],
    updated: '2026-09-05',
    note: 'Controllo e furto di statistiche. Molte rune viola, pochi grigi di supporto.',
  },
  {
    id: 'custodi-foresta',
    name: 'Custodi della Foresta',
    heroes: [
      { id: 'majani', name: 'Majani', color: 'G' },
      { id: 'moraga', name: 'Moraga', color: 'G' },
      { id: 'doran', name: 'Doran', color: 'G' },
    ],
    color: 'G',
    cardCount: 30,
    colors: ['G', 'W', 'R'],
    updated: '2026-09-06',
    note: 'Difesa, cura e oggetti. Gioca sul lungo e chiude con Doran.',
  },
  {
    id: 'sperimentale-3',
    name: 'Sperimentale #3',
    heroes: [
      { id: 'zaccaria', name: 'Zaccaria', color: 'P' },
      { id: 'moraga', name: 'Moraga', color: 'G' },
      { id: 'jack', name: 'Jack', color: 'C' },
    ],
    color: 'P',
    cardCount: 28,
    colors: ['P', 'G', 'C'],
    updated: '2026-09-07',
    note: 'Mix aggressivo tra le due fazioni, ancora da bilanciare.',
  },
];
