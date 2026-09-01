import React, { useState } from 'react';
import { FACTIONS, HEROES, RUNE_COLORS } from '../data/heroes.js';

/**
 * FactionSelect - faction selection screen for SETUP phase.
 *
 * Props:
 *   onComplete — callback({ faction1, faction2 }) when both players have chosen
 */
export default function FactionSelect({ onComplete }) {
  const [step, setStep] = useState(1); // 1 = player1 picks, 2 = player2 picks
  const [faction1, setFaction1] = useState(null);
  const [faction2, setFaction2] = useState(null);

  const handleSelect = (factionId) => {
    if (step === 1) {
      setFaction1(factionId);
      setStep(2);
    } else if (step === 2) {
      const f2 = factionId;
      setFaction2(f2);
      // Small delay for visual feedback, then complete
      setTimeout(() => {
        onComplete({ faction1, faction2: f2 });
      }, 300);
    }
  };

  const renderFactionCard = (factionId) => {
    const faction = FACTIONS[factionId];
    if (!faction) return null;

    const isSelected = (step === 2 && faction1 === factionId);
    const isDisabled = (step === 2 && faction1 === factionId);

    const heroes = faction.heroIds.map(hid => HEROES[hid]).filter(Boolean);
    const primaryColor = RUNE_COLORS[faction.primaryColor]?.hex || '#888';

    return (
      <div
        key={factionId}
        className={[
          'faction-card',
          `faction-card--${factionId}`,
          isSelected && 'faction-card--selected',
          isDisabled && 'faction-card--disabled',
        ].filter(Boolean).join(' ')}
        onClick={() => !isDisabled && handleSelect(factionId)}
      >
        <div className="faction-card__name">{faction.name}</div>

        <div className="faction-card__heroes">
          {heroes.map(hero => {
            const heroColor = RUNE_COLORS[hero.color]?.hex || '#888';
            return (
              <div key={hero.id} className="faction-hero-preview">
                <div
                  className={`faction-hero-preview__portrait portrait-bg-${hero.color}`}
                  style={{ borderColor: heroColor }}
                >
                  {hero.name[0]}
                </div>
                <div className="faction-hero-preview__name">{hero.name}</div>
                <div className="faction-hero-preview__stats">
                  ATK {hero.attack} | DEF {hero.defense} | HP {hero.health}
                </div>
                <div className="faction-hero-preview__stats" style={{ color: heroColor }}>
                  {hero.passive?.name || ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="faction-select">
      <div className="faction-select__title">Rune Wars</div>
      <div className="faction-select__subtitle">
        {step === 1
          ? 'Player 1 - Choose your faction'
          : 'Player 2 - Choose your faction'}
      </div>

      <div className="faction-select__cards">
        {renderFactionCard('dark')}
        {renderFactionCard('bright')}
      </div>
    </div>
  );
}
