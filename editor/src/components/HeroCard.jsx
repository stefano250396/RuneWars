import React from 'react';

/**
 * HeroCard — trimmed copy of the game's src/components/HeroCard.jsx so the
 * editor renders heroes with the game's hero-card visuals.
 * Keep in sync manually if the game's markup changes.
 *
 * Props: hero { name, color, health, maxHealth, attack, defense, magicPower,
 *               abilitySummary? }, onClick, selected
 */
export default function HeroCard({ hero, onClick, selected = false }) {
  if (!hero) return null;

  const hp = hero.health ?? 0;
  const maxHp = hero.maxHealth ?? hero.health ?? 1;
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const hpColor = hpPercent > 60 ? 'var(--hp-high)' : hpPercent > 30 ? 'var(--hp-mid)' : 'var(--hp-low)';

  const classNames = [
    'hero-card',
    'hero-card--clickable',
    selected && 'hero-card--selected',
    hero.color ? `hero-card--color-${hero.color}` : '',
  ].filter(Boolean).join(' ');

  const initial = (hero.name || '?')[0].toUpperCase();

  return (
    <div className={classNames} onClick={() => onClick && onClick(hero)} title={hero.name}>
      <div className={`hero-card__portrait portrait-bg-${hero.color || 'C'}`}>{initial}</div>

      <div className="hero-card__name">{hero.name}</div>

      <div className="hero-card__hp-bar">
        <div className="hero-card__hp-fill" style={{ width: `${hpPercent}%`, background: hpColor }} />
      </div>
      <div className="hero-card__hp-text">{hp} / {maxHp} HP</div>

      <div className="hero-card__stats">
        <div className="hero-stat">
          <span className="hero-stat__icon">&#x2694;</span>
          <span className="hero-stat__value">{hero.attack ?? 0}</span>
          <span className="hero-stat__label">ATK</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat__icon">&#x1F6E1;</span>
          <span className="hero-stat__value">{hero.defense ?? 0}</span>
          <span className="hero-stat__label">DEF</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat__icon">&#x2728;</span>
          <span className="hero-stat__value">{hero.magicPower ?? 0}</span>
          <span className="hero-stat__label">MAG</span>
        </div>
      </div>

      {hero.abilitySummary && (
        <div className="hero-card__abilities">
          <div className="hero-ability">{hero.abilitySummary}</div>
        </div>
      )}
    </div>
  );
}
