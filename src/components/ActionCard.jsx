import React from 'react';

/**
 * ActionCard - displays an action card in the player's hand.
 *
 * Props:
 *   card      — card object {id, name, effect, runes, runeStr, runeCount, colors, special}
 *   onClick   — click handler
 *   selected  — boolean, golden glow
 *   disabled  — boolean, greyed out
 *   played    — boolean, faded out
 */
export default function ActionCard({
  card,
  onClick,
  selected = false,
  disabled = false,
  played = false,
}) {
  if (!card) return null;

  const primaryColor = card.colors?.[0] || 'C';
  const colorClass = `action-card--color-${primaryColor}`;

  const classNames = [
    'action-card',
    colorClass,
    selected && 'action-card--selected',
    disabled && 'action-card--disabled',
    played && 'action-card--played',
  ].filter(Boolean).join(' ');

  // Build rune pips from runeStr
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

  const handleClick = () => {
    if (!disabled && !played && onClick) {
      onClick(card);
    }
  };

  return (
    <div className={classNames} onClick={handleClick}>
      <div className="action-card__header">
        <div className="action-card__name">{card.name}</div>
        <div className="action-card__runes">{runePips}</div>
      </div>

      <div className="action-card__effect">
        {card.effect}
      </div>

      {card.special && card.special !== 'pisello' && (
        <div className={`action-card__special action-card__special--${card.special}`}>
          {card.special}
        </div>
      )}

      {card.special === 'pisello' && (
        <div className="action-card__special action-card__special--pisello">
          unplayable
        </div>
      )}
    </div>
  );
}
