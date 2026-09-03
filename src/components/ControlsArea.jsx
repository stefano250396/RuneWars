import AbilityPanel from './AbilityPanel.jsx';
import Hand from './Hand.jsx';
import DiceRoll from './DiceRoll.jsx';
import ActionCard from './ActionCard.jsx';
import { getSelectionEffects } from '../engine/effects.js';

function PlacementHeroCard({ hero, selected, onClick }) {
  const hp = hero.currentHealth ?? hero.health ?? 0;
  const maxHp = hero.maxHealth ?? hero.health ?? 1;
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const hpColor = hpPercent > 60 ? 'var(--hp-high)' : hpPercent > 30 ? 'var(--hp-mid)' : 'var(--hp-low)';
  const initial = (hero.name || '?')[0].toUpperCase();

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        gap: 14,
        width: 400,
        background: 'var(--bg-card)',
        border: `2px solid ${selected ? 'var(--border-glow)' : `var(--rune-${hero.color || 'C'})`}`,
        borderRadius: 12,
        padding: '12px 14px',
        cursor: 'pointer',
        boxShadow: selected ? '0 0 16px rgba(240,192,64,0.4)' : 'none',
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}
    >
      {/* Portrait column */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 80 }}>
        <div
          className={`portrait-bg-${hero.color || 'C'}`}
          style={{ width: 70, height: 70, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: '#fff' }}
        >
          {initial}
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', textAlign: 'center' }}>{hero.name}</div>
        <div style={{ width: '100%', height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }}>
          <div style={{ height: '100%', width: `${hpPercent}%`, background: hpColor, borderRadius: 3 }} />
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{hp}/{maxHp} HP</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
          {[['⚔', hero.attack ?? 0, 'ATK'], ['🛡', hero.defense ?? 0, 'DEF'], ['✨', hero.magicPower ?? 0, 'MAG']].map(([icon, val, lbl]) => (
            <div key={lbl} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem' }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{val}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Abilities column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {hero.passive && (
          <div style={{ fontSize: '0.88rem', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 700, color: '#f0c040' }}>Passiva: {hero.passive.name} </span>
            <span style={{ color: 'var(--text-secondary)' }}>{hero.passive.description}</span>
          </div>
        )}
        {hero.active1 && (
          <div style={{ fontSize: '0.88rem', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 700, color: '#a878ff' }}>{hero.active1.name} </span>
            <span style={{ color: 'var(--text-secondary)' }}>{hero.active1.description}</span>
          </div>
        )}
        {hero.active2 && (
          <div style={{ fontSize: '0.88rem', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 700, color: '#a878ff' }}>{hero.active2.name} </span>
            <span style={{ color: 'var(--text-secondary)' }}>{hero.active2.description}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ControlsArea({
  phase,
  PHASES,
  // Placement
  isPlacing,
  placementStep,
  currentPlayer,
  availableHeroes,
  selectedHeroId,
  handleHeroSelect,
  handleFinishPlacement,
  // Card select
  isSelectingCards,
  selectedCardIds,
  selectedAbility,
  onAbilitySelect,
  handleCardClick,
  handleConfirmCards,
  handleSkipCards,
  // Combat
  diceState,
  combatCountdown,
  state,
  handleStopRolling,
  countdownTimerRef,
  safeDispatch,
  setCombatCountdown,
  // End turn
  isDiscarding,
  handleDiscardCard,
  handleNextTurn,
}) {
  const selectedCards = (currentPlayer?.hand || []).filter(c =>
    selectedCardIds.includes(c.id)
  );

  // Detect celerity dynamically from currently selected cards (allows selecting 2nd card live)
  // NOTE: ignore conditions here — cards CAN be selected even if their conditional effects don't trigger
  const hasCelerityFromCards = selectedCards.some(card => {
    const effects = getSelectionEffects(card);
    return effects.some(e => e.type === 'celerity');
  });
  const effectiveMaxSelections = (currentPlayer?.hasCelerity || hasCelerityFromCards) ? 2 : 1;

  // Only show the active battlefield hero's abilities
  const activeHero = state?.activeBattlefield != null
    ? (currentPlayer?.heroes || []).find(
        h => h.alive !== false && h.battlefieldId === state.activeBattlefield
      )
    : null;
  const heroesForAbility = activeHero
    ? [activeHero]
    : (currentPlayer?.heroes || []).filter(h => h.alive !== false);

  return (
    <>
      {/* PLACEMENT controls */}
      {isPlacing && (
        <div style={{ padding: '10px 20px' }}>
          <div style={{ color: '#fff', fontWeight: 700, marginBottom: 10, fontSize: '1rem', textAlign: 'center' }}>
            {placementStep.isOpponent
              ? `${currentPlayer?.name} — Scegli l'eroe avversario sul campo ${(state.activeBattlefield ?? 0) + 1}`
              : placementStep.waitingForSlot
                ? `Scegli un campo di battaglia per ${
                    currentPlayer?.heroes?.find(h => h.instanceId === selectedHeroId)?.name || 'il tuo eroe'
                  }`
                : `${currentPlayer?.name} — Seleziona un eroe da piazzare`}
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {availableHeroes.map(hero => (
              <PlacementHeroCard
                key={hero.instanceId}
                hero={hero}
                selected={hero.instanceId === selectedHeroId}
                onClick={() => handleHeroSelect(hero)}
              />
            ))}
            {availableHeroes.length === 0 && (
              <div style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9rem' }}>
                Nessun eroe disponibile
              </div>
            )}
          </div>
          {!placementStep.isOpponent && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button
                className="btn btn--secondary btn--small"
                onClick={handleFinishPlacement}
              >
                Salta Piazzamento
              </button>
            </div>
          )}
        </div>
      )}

      {/* CARD SELECT controls */}
      {isSelectingCards && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '6px 10px' }}>
          {/* Left: hand + confirm/skip */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
                {currentPlayer?.name} — Seleziona {effectiveMaxSelections > 1 ? '1-2' : '1'} carta{effectiveMaxSelections > 1 ? ' (Celerity!)' : ''}
                {selectedCardIds.length > 0 && ` (${selectedCardIds.length} selezionata)`}
              </span>
              <button
                className="btn btn--primary btn--small"
                onClick={handleConfirmCards}
                disabled={selectedCardIds.length === 0}
              >
                Conferma
              </button>
              <button className="btn btn--secondary btn--small" onClick={handleSkipCards}>
                Salta
              </button>
            </div>
            <Hand
              cards={currentPlayer?.hand || []}
              selectedIds={selectedCardIds}
              onCardClick={handleCardClick}
              maxSelections={effectiveMaxSelections}
              compact
            />
          </div>

          {/* Right: abilities — always rendered to prevent layout shift */}
          <div style={{ flexShrink: 0, width: 300, alignSelf: 'stretch' }}>
            <AbilityPanel
              heroes={heroesForAbility}
              selectedCards={selectedCards}
              selectedAbility={selectedAbility}
              onSelectAbility={onAbilitySelect}
            />
          </div>
        </div>
      )}

      {/* RESOLVING indicator */}
      {(phase === PHASES.ABILITY_CHECK || phase === PHASES.CARD_RESOLVE) && (
        <div style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ color: '#f0c040', fontWeight: 700, fontSize: '1rem' }}>
            {phase === PHASES.ABILITY_CHECK ? 'Verifica Abilità...' : 'Risoluzione Carte...'}
          </div>
        </div>
      )}

      {/* COMBAT dice */}
      {phase === PHASES.COMBAT && (
        <div style={{ padding: '8px', textAlign: 'center' }}>
          <div style={{ color: '#f0c040', fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
            {diceState.rolling ? 'LANCIO DADI...' : 'PRONTO A RISOLVERE'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
            <DiceRoll
              result={diceState.rolling ? null : state.combatRolls?.player1}
              rolling={diceState.rolling}
              label={state.players?.player1?.name}
            />
            <DiceRoll
              result={diceState.rolling ? null : state.combatRolls?.player2}
              rolling={diceState.rolling}
              label={state.players?.player2?.name}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 6 }}>
            {diceState.rolling && (
              <button className="btn btn--secondary btn--small" onClick={handleStopRolling}>
                Ferma Dadi
              </button>
            )}
            {!diceState.rolling && combatCountdown !== null && (
              <>
                <button
                  className="btn btn--primary btn--small"
                  onClick={() => {
                    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                    safeDispatch({ type: 'EXECUTE_COMBAT' });
                    setCombatCountdown(null);
                  }}
                >
                  Risolvi Ora
                </button>
                <div style={{ color: '#f0c040', fontWeight: 700, fontSize: '0.85rem', alignSelf: 'center' }}>
                  Auto-risoluzione in {combatCountdown}s
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* END TURN discard */}
      {isDiscarding && (
        <div style={{ textAlign: 'center', padding: '6px 8px' }}>
          <div style={{ color: '#fff', marginBottom: 4, fontSize: '0.9rem' }}>
            Fine Turno — Puoi scartare una carta (clicca), oppure procedi
          </div>
          <div className="hand hand--compact">
            {(currentPlayer?.hand || []).map(card => (
              <div key={card.id} className="hand__card-wrapper">
                <ActionCard card={card} onClick={handleDiscardCard} />
              </div>
            ))}
          </div>
          <button
            className="btn btn--primary btn--small"
            onClick={handleNextTurn}
            style={{ marginTop: 4 }}
          >
            Prossimo Turno
          </button>
        </div>
      )}
    </>
  );
}
