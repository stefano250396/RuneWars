import React from 'react';

/**
 * HeroCard - displays a hero in the battlefield or selection view.
 *
 * Props:
 *   hero        — hero instance object
 *   onClick     — optional click handler
 *   selected    — boolean, golden glow border
 *   large       — boolean, bigger size
 *   showAbilities — boolean, show passive/active text
 *   compact     — boolean, minimal stat display (opponent bar)
 */
export default function HeroCard({
  hero,
  onClick,
  selected = false,
  large = false,
  showAbilities = false,
  compact = false,
  style,
}) {
  if (!hero) return null;

  const hp = hero.currentHealth ?? hero.health ?? 0;
  const maxHp = hero.maxHealth ?? hero.health ?? 1;
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  const atk = hero.useDefenseForAttack
    ? (hero.currentDefense ?? hero.defense ?? 0) + (hero.tempDefense ?? 0)
    : (hero.currentAttack ?? hero.attack ?? 0) + (hero.tempAttack ?? 0);
  const def = (hero.currentDefense ?? hero.defense ?? 0) + (hero.tempDefense ?? 0);
  const mag = (hero.currentMagicPower ?? hero.magicPower ?? 0) + (hero.tempMagicPower ?? 0);

  const baseAtk = hero.useDefenseForAttack ? (hero.defense ?? 0) : (hero.attack ?? 0);
  const baseDef = hero.defense ?? 0;
  const baseMag = hero.magicPower ?? 0;

  const hpColor = hpPercent > 60 ? 'var(--hp-high)' : hpPercent > 30 ? 'var(--hp-mid)' : 'var(--hp-low)';
  const colorClass = hero.color ? `hero-card--color-${hero.color}` : '';

  const classNames = [
    'hero-card',
    compact && 'hero-card--compact',
    large && 'hero-card--large',
    onClick && 'hero-card--clickable',
    selected && 'hero-card--selected',
    hero.alive === false && 'hero-card--dead',
    hero.isActive && 'hero-card--active',
    colorClass,
  ].filter(Boolean).join(' ');

  const initial = (hero.name || '?')[0].toUpperCase();

  return (
    <div className={classNames} onClick={onClick} title={hero.name} style={style}>
      {/* Portrait */}
      <div className={`hero-card__portrait portrait-bg-${hero.color || 'C'}`}>
        {initial}
      </div>

      {/* Name */}
      <div className="hero-card__name">{hero.name}</div>

      {/* HP bar */}
      <div className="hero-card__hp-bar">
        <div
          className="hero-card__hp-fill"
          style={{ width: `${hpPercent}%`, background: hpColor }}
        />
      </div>
      <div className="hero-card__hp-text">
        {hp} / {maxHp} HP
      </div>

      {/* Stats */}
      {!compact && (
        <div className="hero-card__stats">
          <div className="hero-stat">
            <span className="hero-stat__icon">&#x2694;</span>
            <span className={`hero-stat__value ${atk > baseAtk ? 'hero-stat__value--buffed' : ''}`}>
              {atk}
            </span>
            <span className="hero-stat__label">{hero.useDefenseForAttack ? 'DEF→ATK' : 'ATK'}</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat__icon">&#x1F6E1;</span>
            <span className={`hero-stat__value ${def > baseDef ? 'hero-stat__value--buffed' : ''}`}>
              {def}
            </span>
            <span className="hero-stat__label">DEF</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat__icon">&#x2728;</span>
            <span className={`hero-stat__value ${mag > baseMag ? 'hero-stat__value--buffed' : ''}`}>
              {mag}
            </span>
            <span className="hero-stat__label">MAG</span>
          </div>
        </div>
      )}

      {/* Abilities (shown on hover/expand or in detail view) */}
      {showAbilities && (
        <div className="hero-card__abilities">
          {hero.passive && (
            <div className="hero-ability">
              <span className="hero-ability__name">Passive: {hero.passive.name}</span>
              {' '}{hero.passive.description}
            </div>
          )}
          {hero.active1 && (
            <div className="hero-ability">
              <span className="hero-ability__name">{hero.active1.name}</span>
              {' '}{hero.active1.description}
            </div>
          )}
        </div>
      )}

      {/* Items & Enchantments */}
      {(hero.items?.length > 0 || hero.enchantments?.length > 0) && (
        <div className="hero-card__items">
          {hero.items?.map((item, i) => {
            const itemTitle = typeof item === 'string'
              ? item
              : `${item.name}\n\nRunes: ${item.runeStr || '?'}\n${item.description || ''}`;
            return (
              <span
                key={`item-${i}`}
                className="hero-item-badge"
                title={itemTitle}
              >
                ⚔️ {typeof item === 'string' ? item : item.name || 'Item'}
              </span>
            );
          })}
          {hero.enchantments?.map((enc, i) => (
            <span key={`enc-${i}`} className="hero-enchant-badge" title={enc.name || enc}>
              {typeof enc === 'string' ? enc : enc.name || 'Enchant'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
