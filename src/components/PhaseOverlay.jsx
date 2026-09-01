import React from 'react';
import DiceRoll from './DiceRoll.jsx';

/**
 * PhaseOverlay - modal overlay for phase transitions, pass-device screens, etc.
 *
 * Props:
 *   type — 'pass-device' | 'round' | 'combat' | 'drawing' | 'resolving' |
 *          'winner' | 'placement' | 'custom'
 *   data — context object depending on type:
 *     pass-device: { playerName }
 *     round: { round }
 *     combat: { diceResult, diceRolling }
 *     drawing: { count }
 *     resolving: { cardName }
 *     winner: { playerName, rounds }
 *     placement: { playerName }
 *     custom: { title, subtitle, icon }
 *   onDismiss — callback to close overlay
 *   autoClose — ms to auto-close (0 = manual only)
 */
export default function PhaseOverlay({ type, data = {}, onDismiss, autoClose = 0 }) {
  React.useEffect(() => {
    if (autoClose > 0 && onDismiss) {
      const timer = setTimeout(onDismiss, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onDismiss]);

  // Handle keyboard
  React.useEffect(() => {
    const handleKey = (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && onDismiss) {
        e.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onDismiss]);

  const renderContent = () => {
    switch (type) {
      case 'pass-device':
        return (
          <>
            <div className="phase-overlay__icon">&#x1F50F;</div>
            <div className="phase-overlay__title phase-overlay__title--gold">
              Pass to {data.playerName || 'Next Player'}
            </div>
            <div className="phase-overlay__subtitle">
              Hand the device to {data.playerName}.<br />
              Press the button when ready.
            </div>
            <button className="btn btn--primary btn--large" onClick={onDismiss}>
              I am {data.playerName} - Ready!
            </button>
          </>
        );

      case 'round':
        return (
          <>
            <div className="phase-overlay__icon">&#x2694;</div>
            <div className="phase-overlay__title phase-overlay__title--gold">
              Round {data.round || 1}
            </div>
            <div className="phase-overlay__subtitle">
              A new round begins!
            </div>
          </>
        );

      case 'combat':
        return (
          <>
            <div className="phase-overlay__title phase-overlay__title--red">
              Combat!
            </div>
            {data.diceResult != null && (
              <DiceRoll
                result={data.diceResult}
                rolling={data.diceRolling}
                label="d4 Roll"
              />
            )}
            {data.message && (
              <div className="phase-overlay__subtitle">{data.message}</div>
            )}
            {data.showContinue && (
              <button className="btn btn--primary" onClick={onDismiss}>
                Continue
              </button>
            )}
          </>
        );

      case 'drawing':
        return (
          <>
            <div className="phase-overlay__icon">&#x1F0CF;</div>
            <div className="phase-overlay__title phase-overlay__title--gold">
              Drawing Cards
            </div>
            <div className="phase-overlay__subtitle">
              {data.count != null
                ? `Each player draws ${data.count} card${data.count !== 1 ? 's' : ''}`
                : 'Drawing cards...'}
            </div>
          </>
        );

      case 'resolving':
        return (
          <>
            <div className="phase-overlay__icon">&#x2728;</div>
            <div className="phase-overlay__title phase-overlay__title--gold">
              Resolving
            </div>
            <div className="phase-overlay__subtitle">
              {data.cardName
                ? `Playing: ${data.cardName}`
                : 'Resolving effects...'}
            </div>
          </>
        );

      case 'winner':
        return null; // Winner screen is handled separately in GameOver

      case 'placement':
        return (
          <>
            <div className="phase-overlay__icon">&#x1F3AF;</div>
            <div className="phase-overlay__title phase-overlay__title--gold">
              Hero Placement
            </div>
            <div className="phase-overlay__subtitle">
              {data.playerName}, choose a hero and place them on a battlefield.
            </div>
            {onDismiss && (
              <button className="btn btn--primary" onClick={onDismiss}>
                Ready
              </button>
            )}
          </>
        );

      case 'custom':
        return (
          <>
            {data.icon && <div className="phase-overlay__icon">{data.icon}</div>}
            {data.title && (
              <div className="phase-overlay__title phase-overlay__title--gold">
                {data.title}
              </div>
            )}
            {data.subtitle && (
              <div className="phase-overlay__subtitle">{data.subtitle}</div>
            )}
            {onDismiss && data.buttonText && (
              <button className="btn btn--primary" onClick={onDismiss}>
                {data.buttonText}
              </button>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="phase-overlay">
      <div className="phase-overlay__content">
        {renderContent()}
      </div>
    </div>
  );
}
