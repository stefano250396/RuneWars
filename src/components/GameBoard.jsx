import React, { useState } from 'react';
import Battlefield from './Battlefield.jsx';
import HeroCard from './HeroCard.jsx';
import Hand from './Hand.jsx';
import CombatLog from './CombatLog.jsx';
import { FACTIONS } from '../data/heroes.js';

/**
 * GameBoard - main game layout during active play phases.
 *
 * Props:
 *   state            — full game state
 *   currentPlayerId  — 'player1' or 'player2' (the one viewing the screen)
 *   phase            — current phase string
 *   selectedCardIds  — array of selected card IDs (for CARD_SELECT)
 *   onCardClick      — callback(card) for card selection
 *   selectedHeroId   — instanceId of selected hero (for PLACEMENT)
 *   onHeroClick      — callback(hero) for hero selection
 *   onSlotClick      — callback(battlefieldId, slot) for placement
 *   placementMode    — boolean, enable battlefield slot clicking
 *   children         — extra content rendered below the battlefields (controls)
 */
export default function GameBoard({
  state,
  currentPlayerId = 'player1',
  phase,
  selectedCardIds = [],
  onCardClick,
  selectedHeroId,
  onHeroClick,
  onSlotClick,
  placementMode = false,
  children,
}) {
  const [isLogVisible, setIsLogVisible] = useState(true);

  if (!state) return null;

  const opponentId = currentPlayerId === 'player1' ? 'player2' : 'player1';
  const currentPlayer = state.players?.[currentPlayerId];
  const opponentPlayer = state.players?.[opponentId];

  if (!currentPlayer || !opponentPlayer) return null;

  const currentFaction = FACTIONS[currentPlayer.faction];
  const opponentFaction = FACTIONS[opponentPlayer.faction];

  // Opponent heroes summary (alive ones)
  const opponentHeroes = (opponentPlayer.heroes || []).filter(h => h.alive !== false);
  const currentHeroes = (currentPlayer.heroes || []).filter(h => h.alive !== false);

  return (
    <div className={`game-board${isLogVisible ? '' : ' game-board--log-hidden'}`}>
      {/* ---- Opponent bar (top) ---- */}
      <div className="player-bar player-bar--opponent">
        <div className="player-bar__info">
          <div className="player-bar__name">{opponentPlayer.name}</div>
          <div className="player-bar__faction">
            {opponentFaction?.name || opponentPlayer.faction || ''}
          </div>
        </div>

        <div className="player-bar__stats">
          {opponentHeroes.map(h => (
            <div key={h.instanceId || h.id} className="player-bar__stat" title={h.name}>
              <span className="player-bar__stat-icon">
                {h.alive === false ? '☠' : '⚔'}
              </span>
              <span>{h.name}</span>
              <span style={{ color: h.currentHealth > h.maxHealth * 0.5 ? 'var(--hp-high)' : 'var(--hp-low)' }}>
                {h.currentHealth ?? h.health}/{h.maxHealth ?? h.health}
              </span>
            </div>
          ))}

          <div className="player-bar__stat">
            <span className="player-bar__stat-icon">{'ἌF'}</span>
            <span>Deck: {opponentPlayer.deck?.length ?? '?'}</span>
          </div>

          <div className="player-bar__stat">
            <span className="player-bar__stat-icon">{'✋'}</span>
            <span>Hand: {opponentPlayer.hand?.length ?? '?'}</span>
          </div>
        </div>
      </div>

      {/* ---- Battlefields (center) ---- */}
      <div className="battlefields-area">
        {(state.battlefields || []).map((bf, idx) => (
          <Battlefield
            key={idx}
            battlefield={bf}
            isActive={state.activeBattlefield === idx}
            currentPlayerId={currentPlayerId}
            onSlotClick={onSlotClick}
            placementMode={placementMode}
          />
        ))}
      </div>

      {/* ---- Combat Log (right) ---- */}
      <CombatLog
        entries={state.combatLog || []}
        isVisible={isLogVisible}
        onToggle={() => setIsLogVisible(v => !v)}
      />

      {/* ---- Current Player bar (bottom) ---- */}
      <div className="player-bar player-bar--current">
        <div className="player-bar__info">
          <div className="player-bar__name">{currentPlayer.name}</div>
          <div className="player-bar__faction">
            {currentFaction?.name || currentPlayer.faction || ''}
          </div>
        </div>

        <div className="player-bar__stats">
          <div className="phase-badge">{phase || state.phase}</div>
          <div className="turn-badge">Turn {state.turn} | Round {state.round}</div>

          {currentHeroes.map(h => (
            <div key={h.instanceId || h.id} className="player-bar__stat" title={h.name}>
              <span className="player-bar__stat-icon">
                {h.alive === false ? '☠' : '⚔'}
              </span>
              <span>{h.name}</span>
              <span style={{ color: h.currentHealth > (h.maxHealth ?? h.health) * 0.5 ? 'var(--hp-high)' : 'var(--hp-low)' }}>
                {h.currentHealth ?? h.health}/{h.maxHealth ?? h.health}
              </span>
            </div>
          ))}

          <div className="player-bar__stat">
            <span className="player-bar__stat-icon">{'ἌF'}</span>
            <span>Deck: {currentPlayer.deck?.length ?? '?'}</span>
          </div>
        </div>
      </div>

      {/* ---- Controls area (hand, placement, etc.) ---- */}
      {children && <div className="controls-area">{children}</div>}
    </div>
  );
}
