import React from 'react';

/**
 * ActionCard — copied from the game (src/components/ActionCard.jsx) so the
 * editor renders modules with exactly the game's card visuals.
 * Keep in sync manually if the game's card markup changes.
 *
 * Props:
 *   card      — { name, text, runeStr, colors, special }
 *   onClick   — click handler (receives the card)
 *   selected  — boolean, golden glow
 */
export default function ActionCard({ card, onClick, selected = false }) {
  if (!card) return null;

  const primaryColor = card.colors?.[0] || 'C';
  const colorClass = `action-card--color-${primaryColor}`;

  const classNames = [
    'action-card',
    colorClass,
    selected && 'action-card--selected',
  ].filter(Boolean).join(' ');

  const runePips = [];
  if (card.runeStr) {
    for (let i = 0; i < card.runeStr.length; i++) {
      const ch = card.runeStr[i];
      runePips.push(
        <span key={i} className={`rune-pip rune-pip--${ch}`} title={ch}>
          {ch}
        </span>
      );
    }
  }

  return (
    <div className={classNames} onClick={() => onClick && onClick(card)}>
      <div className="action-card__header">
        <div className="action-card__name">{card.name}</div>
        <div className="action-card__runes">{runePips}</div>
      </div>

      <div className="action-card__effect">
        {card.text}
      </div>

      {card.special && (
        <div className={`action-card__special action-card__special--${card.special}`}>
          {card.special}
        </div>
      )}
    </div>
  );
}
