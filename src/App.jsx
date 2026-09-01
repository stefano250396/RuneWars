import { useReducer, useState, useEffect, useCallback, useRef } from 'react';
import './styles/game.css';

import { createInitialState, PHASES } from './engine/gameState.js';
import { gameReducer } from './engine/reducer.js';

import FactionSelect from './components/FactionSelect.jsx';
import GameBoard from './components/GameBoard.jsx';
import PhaseOverlay from './components/PhaseOverlay.jsx';
import ControlsArea from './components/ControlsArea.jsx';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);
  const phase = state.phase;

  const [viewingPlayer, setViewingPlayer] = useState('player1');
  const [overlay, setOverlay] = useState(null);
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [selectedHeroId, setSelectedHeroId] = useState(null);
  const [placementStep, setPlacementStep] = useState(null);
  const [cardSelectStep, setCardSelectStep] = useState(null);
  const [bothSelected, setBothSelected] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState(null);
  const [discardStep, setDiscardStep] = useState(null);
  const [combatAnimating, setCombatAnimating] = useState(false);
  const [diceState, setDiceState] = useState({ rolling: false, result: null });
  const [combatCountdown, setCombatCountdown] = useState(null);
  const resolveTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  const safeDispatch = useCallback((action) => {
    try { dispatch(action); }
    catch (err) { console.error('Dispatch error:', err, action); }
  }, []);

  // ── Helper: resolve hero instanceId → hero object ──
  function resolveHero(instanceId) {
    if (!instanceId) return null;
    if (typeof instanceId === 'object') return instanceId;
    for (const p of Object.values(state.players)) {
      const h = p.heroes.find(h => h.instanceId === instanceId);
      if (h) return h;
    }
    return null;
  }

  function isHeroOnBattlefield(heroInstanceId) {
    return state.battlefields.some(bf => {
      const p1 = bf.player1Hero;
      const p2 = bf.player2Hero;
      const id = heroInstanceId;
      return (typeof p1 === 'string' ? p1 === id : p1?.instanceId === id) ||
             (typeof p2 === 'string' ? p2 === id : p2?.instanceId === id);
    });
  }

  // ── DRAW phase: auto-dispatch ──
  useEffect(() => {
    if (phase === PHASES.DRAW) {
      setOverlay({ type: 'drawing', data: { count: state.turn === 1 ? 4 : 'up to 4' } });
      const timer = setTimeout(() => {
        safeDispatch({ type: 'DRAW_CARDS' });
        setOverlay(null);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [phase, state.turn, safeDispatch]);

  // ── PLACEMENT phase: set up flow ──
  useEffect(() => {
    if (phase === PHASES.PLACEMENT) {
      const activePlayer = state.activePlayerId || 'player1';
      setViewingPlayer(activePlayer);
      setPlacementStep({ playerId: activePlayer, isOpponent: false, waitingForSlot: false });
      setSelectedHeroId(null);
    }
  }, [phase, state.activePlayerId]);

  // ── CARD_SELECT phase: set up flow ──
  useEffect(() => {
    if (phase === PHASES.CARD_SELECT) {
      const activePlayer = state.activePlayerId || 'player1';
      setViewingPlayer(activePlayer);
      setCardSelectStep({ playerId: activePlayer, phase: 'selecting' });
      setSelectedCardIds([]);
      setBothSelected(false);
      setSelectedAbility(null);
    }
  }, [phase, state.activePlayerId]);

  // ── ABILITY_CHECK → auto-advance ──
  useEffect(() => {
    if (phase === PHASES.ABILITY_CHECK) {
      const timer = setTimeout(() => {
        safeDispatch({ type: 'RESOLVE_ABILITIES', payload: { targets: {} } });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [phase, safeDispatch]);

  // ── CARD_RESOLVE: step through stack ──
  useEffect(() => {
    if (phase === PHASES.CARD_RESOLVE) {
      if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = setTimeout(() => {
        safeDispatch({ type: 'RESOLVE_NEXT_CARD', payload: { targets: {} } });
      }, 1000);
      return () => { if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current); };
    }
  }, [phase, state.cardResolveIndex, safeDispatch]);

  // ── COMBAT: auto-execute with 5s countdown ──
  useEffect(() => {
    if (phase === PHASES.COMBAT && !combatAnimating) {
      setCombatAnimating(true);
      setDiceState({ rolling: true, result: null });
      setCombatCountdown(5);

      // Roll for 1.2 seconds
      const rollTimer = setTimeout(() => {
        setDiceState({ rolling: false, result: null });

        // Start 5-second countdown
        let remaining = 5;
        countdownTimerRef.current = setInterval(() => {
          remaining--;
          setCombatCountdown(remaining);

          if (remaining <= 0) {
            clearInterval(countdownTimerRef.current);
            safeDispatch({ type: 'EXECUTE_COMBAT' });
            setCombatCountdown(null);
          }
        }, 1000);
      }, 1200);

      return () => {
        clearTimeout(rollTimer);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      };
    }
  }, [phase, combatAnimating, safeDispatch]);

  useEffect(() => {
    if (phase !== PHASES.COMBAT) {
      setCombatAnimating(false);
      setCombatCountdown(null);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }
  }, [phase]);

  // ── END_TURN: auto-dispatch or set up discard flow ──
  useEffect(() => {
    if (phase === PHASES.END_TURN && !state.canDiscard) {
      const timer = setTimeout(() => {
        safeDispatch({ type: 'END_TURN' });
      }, 500);
      return () => clearTimeout(timer);
    }
    if (phase === PHASES.END_TURN && state.canDiscard && discardStep === null) {
      setDiscardStep({ playerId: viewingPlayer, step: 1 });
    }
    if (phase !== PHASES.END_TURN && discardStep !== null) {
      setDiscardStep(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, state.canDiscard, safeDispatch]);

  // ── Keyboard ──
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') { setSelectedCardIds([]); setSelectedHeroId(null); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // ── Faction select ──
  const handleFactionComplete = useCallback(({ faction1, faction2 }) => {
    safeDispatch({ type: 'SETUP_GAME', payload: { faction1, faction2 } });
  }, [safeDispatch]);

  // ── Hero select for placement ──
  const handleHeroSelect = useCallback((hero) => {
    if (!placementStep) return;

    if (placementStep.isOpponent) {
      safeDispatch({
        type: 'PLACE_OPPONENT_HERO',
        payload: { playerId: placementStep.playerId, heroInstanceId: hero.instanceId },
      });
      setPlacementStep(null);
      setSelectedHeroId(null);
    } else {
      setSelectedHeroId(hero.instanceId);
      setPlacementStep(prev => ({ ...prev, waitingForSlot: true }));
    }
  }, [placementStep, safeDispatch]);

  // ── Slot click (active player only) ──
  const handleSlotClick = useCallback((battlefieldId, slot) => {
    if (!placementStep || placementStep.isOpponent || !placementStep.waitingForSlot || !selectedHeroId) return;

    const currentPid = placementStep.playerId;
    if (slot !== currentPid) return;

    safeDispatch({
      type: 'PLACE_HERO',
      payload: { playerId: currentPid, heroInstanceId: selectedHeroId, battlefieldId },
    });

    const opponentId = currentPid === 'player1' ? 'player2' : 'player1';
    const opponentName = state.players?.[opponentId]?.name || 'Player 2';

    setSelectedHeroId(null);
    setOverlay({
      type: 'pass-device',
      data: { playerName: opponentName },
      onDismiss: () => {
        setOverlay(null);
        setViewingPlayer(opponentId);
        setPlacementStep({ playerId: opponentId, isOpponent: true, waitingForSlot: false });
      },
    });
  }, [placementStep, selectedHeroId, safeDispatch, state.players]);

  // ── Card selection ──
  const handleCardClick = useCallback((card) => {
    if (!cardSelectStep || cardSelectStep.phase !== 'selecting') return;
    setSelectedCardIds(prev => {
      if (prev.includes(card.id)) return prev.filter(id => id !== card.id);
      const player = state.players?.[cardSelectStep.playerId];
      const maxCards = player?.hasCelerity ? 2 : 1;
      if (prev.length >= maxCards) return [...prev.slice(0, maxCards - 1), card.id];
      return [...prev, card.id];
    });
  }, [cardSelectStep, state.players]);

  const handleConfirmCards = useCallback(() => {
    if (!cardSelectStep) return;
    const currentPid = cardSelectStep.playerId;
    safeDispatch({ type: 'SELECT_CARDS', payload: { playerId: currentPid, cardIds: selectedCardIds, selectedAbility } });

    const opponentId = currentPid === 'player1' ? 'player2' : 'player1';

    if (!bothSelected) {
      setSelectedCardIds([]);
      const opponentName = state.players?.[opponentId]?.name || 'Player 2';
      setOverlay({
        type: 'pass-device',
        data: { playerName: opponentName },
        onDismiss: () => {
          setOverlay(null);
          setViewingPlayer(opponentId);
          setCardSelectStep({ playerId: opponentId, phase: 'selecting' });
          setBothSelected(true);
        },
      });
    } else {
      setCardSelectStep(null);
      setSelectedCardIds([]);
    }
  }, [cardSelectStep, selectedCardIds, bothSelected, safeDispatch, state.players]);

  const handleSkipCards = useCallback(() => {
    if (!cardSelectStep) return;
    const currentPid = cardSelectStep.playerId;
    safeDispatch({ type: 'SELECT_CARDS', payload: { playerId: currentPid, cardIds: [] } });

    setSelectedCardIds([]);
    const opponentId = currentPid === 'player1' ? 'player2' : 'player1';

    if (!bothSelected) {
      const opponentName = state.players?.[opponentId]?.name || 'Player 2';
      setOverlay({
        type: 'pass-device',
        data: { playerName: opponentName },
        onDismiss: () => {
          setOverlay(null);
          setViewingPlayer(opponentId);
          setCardSelectStep({ playerId: opponentId, phase: 'selecting' });
          setBothSelected(true);
        },
      });
    } else {
      setCardSelectStep(null);
    }
  }, [cardSelectStep, bothSelected, safeDispatch, state.players]);

  const handleDiscardCard = useCallback((card) => {
    if (!discardStep) return;
    safeDispatch({ type: 'DISCARD_CARD', payload: { playerId: discardStep.playerId, cardId: card.id } });
  }, [safeDispatch, discardStep]);

  const handleNextTurn = useCallback(() => {
    if (!discardStep) return;
    if (discardStep.step === 1) {
      const opponentId = discardStep.playerId === 'player1' ? 'player2' : 'player1';
      const opponentName = state.players?.[opponentId]?.name || 'Player 2';
      setOverlay({
        type: 'pass-device',
        data: { playerName: opponentName },
        onDismiss: () => {
          setOverlay(null);
          setViewingPlayer(opponentId);
          setDiscardStep({ playerId: opponentId, step: 2 });
        },
      });
    } else {
      setDiscardStep(null);
      safeDispatch({ type: 'NEXT_TURN' });
    }
  }, [discardStep, safeDispatch, state.players]);

  const handleFinishPlacement = useCallback(() => {
    setPlacementStep(null);
    setSelectedHeroId(null);
  }, []);

  const handlePlayAgain = useCallback(() => { window.location.reload(); }, []);

  const handleStopRolling = useCallback(() => {
    setDiceState({ rolling: false, result: null });
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setCombatCountdown(5);

    // Start 5-second countdown
    let remaining = 5;
    countdownTimerRef.current = setInterval(() => {
      remaining--;
      setCombatCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(countdownTimerRef.current);
        safeDispatch({ type: 'EXECUTE_COMBAT' });
        setCombatCountdown(null);
      }
    }, 1000);
  }, [safeDispatch]);

  // ── Render overlay ──
  const renderOverlay = () => {
    if (!overlay) return null;
    return (
      <PhaseOverlay
        type={overlay.type}
        data={overlay.data}
        onDismiss={overlay.onDismiss || (() => setOverlay(null))}
        autoClose={overlay.autoClose || 0}
      />
    );
  };

  // ── SETUP ──
  if (phase === PHASES.SETUP) {
    return (
      <div className="app-container">
        <FactionSelect onComplete={handleFactionComplete} />
      </div>
    );
  }

  // ── GAME OVER ──
  if (phase === PHASES.GAME_OVER) {
    const winnerPid = state.winner;
    const winner = winnerPid ? state.players[winnerPid] : null;

    return (
      <div className="app-container">
        <div className="game-over">
          <div className="game-over__crown">&#x1F451;</div>
          <div className="game-over__title">{winner ? 'Victory!' : 'Draw!'}</div>
          <div className="game-over__winner">
            {winner ? `${winner.name} wins the battle!` : 'The battle ends in a stalemate.'}
          </div>
          <div className="game-over__stats">
            <div className="game-over__stat">
              <div className="game-over__stat-value">{state.round}</div>
              <div className="game-over__stat-label">Rounds</div>
            </div>
            <div className="game-over__stat">
              <div className="game-over__stat-value">{state.turn}</div>
              <div className="game-over__stat-label">Turns</div>
            </div>
          </div>
          <button className="btn btn--primary btn--large" onClick={handlePlayAgain}>Play Again</button>
        </div>
        {renderOverlay()}
      </div>
    );
  }

  // ── Main game board ──
  const currentPlayer = state.players?.[viewingPlayer];
  const isPlacing = phase === PHASES.PLACEMENT && placementStep != null;
  const isSelectingCards = phase === PHASES.CARD_SELECT && cardSelectStep?.phase === 'selecting';

  const availableHeroes = isPlacing
    ? (currentPlayer?.heroes || []).filter(h => {
        if (!h.alive) return false;
        const usedIds = currentPlayer?.heroesUsedThisRound || [];
        if (usedIds.includes(h.instanceId)) return false;
        return !isHeroOnBattlefield(h.instanceId);
      })
    : [];

  // Resolve battlefields: convert hero IDs to full objects for display
  const resolvedBattlefields = (state.battlefields || []).map(bf => ({
    ...bf,
    player1Hero: resolveHero(bf.player1Hero),
    player2Hero: resolveHero(bf.player2Hero),
  }));

  return (
    <div className="app-container">
      <GameBoard
        state={{ ...state, battlefields: resolvedBattlefields }}
        currentPlayerId={viewingPlayer}
        phase={phase}
        selectedCardIds={selectedCardIds}
        onCardClick={handleCardClick}
        selectedHeroId={selectedHeroId}
        onHeroClick={handleHeroSelect}
        onSlotClick={handleSlotClick}
        placementMode={isPlacing && !placementStep?.isOpponent && placementStep?.waitingForSlot}
      >
        <ControlsArea
          phase={phase}
          PHASES={PHASES}
          isPlacing={isPlacing}
          placementStep={placementStep}
          currentPlayer={currentPlayer}
          availableHeroes={availableHeroes}
          selectedHeroId={selectedHeroId}
          handleHeroSelect={handleHeroSelect}
          handleFinishPlacement={handleFinishPlacement}
          isSelectingCards={isSelectingCards}
          selectedCardIds={selectedCardIds}
          selectedAbility={selectedAbility}
          onAbilitySelect={setSelectedAbility}
          handleCardClick={handleCardClick}
          handleConfirmCards={handleConfirmCards}
          handleSkipCards={handleSkipCards}
          diceState={diceState}
          combatCountdown={combatCountdown}
          state={state}
          handleStopRolling={handleStopRolling}
          countdownTimerRef={countdownTimerRef}
          safeDispatch={safeDispatch}
          setCombatCountdown={setCombatCountdown}
          isDiscarding={phase === PHASES.END_TURN && state.canDiscard && discardStep !== null}
          handleDiscardCard={handleDiscardCard}
          handleNextTurn={handleNextTurn}
        />
      </GameBoard>

      {renderOverlay()}
    </div>
  );
}
