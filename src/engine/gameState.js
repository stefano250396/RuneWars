/**
 * GAME STATE SHAPE - used by both engine and UI
 *
 * Phases: SETUP -> DRAW -> PLACEMENT -> CARD_SELECT -> ABILITY_CHECK ->
 *         CARD_RESOLVE -> COMBAT -> END_TURN -> (back to DRAW or game over)
 */

export const PHASES = {
  SETUP: 'SETUP',
  DRAW: 'DRAW',
  PLACEMENT: 'PLACEMENT',
  CARD_SELECT: 'CARD_SELECT',
  ABILITY_CHECK: 'ABILITY_CHECK',
  CARD_RESOLVE: 'CARD_RESOLVE',
  COMBAT: 'COMBAT',
  END_TURN: 'END_TURN',
  GAME_OVER: 'GAME_OVER',
};

export function createInitialState() {
  return {
    phase: PHASES.SETUP,
    turn: 0,
    round: 1,
    firstPlayerId: null,
    activePlayerId: null,

    players: {
      player1: createPlayerState('player1', 'Player 1'),
      player2: createPlayerState('player2', 'Player 2'),
    },

    battlefields: [
      { id: 0, player1Hero: null, player2Hero: null, tokens: [], atkBonus: 1, magBonus: 0 },
      { id: 1, player1Hero: null, player2Hero: null, tokens: [], atkBonus: 0, magBonus: 0 },
      { id: 2, player1Hero: null, player2Hero: null, tokens: [], atkBonus: 0, magBonus: 1 },
    ],

    activeBattlefield: null,

    stack: [],

    combatLog: [],

    overkillDamage: { player1: 0, player2: 0 },

    combatRolls: { player1: null, player2: null },
  };
}

export function createPlayerState(id, name) {
  return {
    id,
    name,
    faction: null,
    heroes: [],
    deck: [],
    hand: [],
    discard: [],
    playedCards: [],
    hasCelerity: false,
    cardsPlayedThisTurn: 0,
    heroesUsedThisRound: [],
  };
}

export function createHeroInstance(heroData) {
  return {
    ...heroData,
    instanceId: `${heroData.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    currentHealth: heroData.health,
    currentAttack: heroData.attack,
    currentDefense: heroData.defense,
    currentMagicPower: heroData.magicPower,
    tempAttack: 0,
    tempDefense: 0,
    tempMagicPower: 0,
    alive: true,
    items: [],
    enchantments: [],
    isActive: false,
    battlefieldId: null,
    bfBonusApplied: false,
  };
}
