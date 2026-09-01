import HeroCard from './HeroCard.jsx';

const BF_CONFIG = {
  0: { bonusClass: 'battlefield--atk-bonus', bonusLabel: '⚔ +1 ATK', bonusColor: '#ef4444' },
  1: { bonusClass: '', bonusLabel: null, bonusColor: null },
  2: { bonusClass: 'battlefield--mag-bonus', bonusLabel: '✨ +1 MAG', bonusColor: '#a855f7' },
};

export default function Battlefield({
  battlefield,
  isActive = false,
  currentPlayerId = 'player1',
  onSlotClick,
  placementMode = false,
}) {
  if (!battlefield) return null;

  const { id: bfId, player1Hero, player2Hero, tokens = [] } = battlefield;
  const cfg = BF_CONFIG[bfId] || BF_CONFIG[1];

  const topHero = currentPlayerId === 'player1' ? player2Hero : player1Hero;
  const bottomHero = currentPlayerId === 'player1' ? player1Hero : player2Hero;
  const topSlot = currentPlayerId === 'player1' ? 'player2' : 'player1';
  const bottomSlot = currentPlayerId === 'player1' ? 'player1' : 'player2';

  const handleBattlefieldClick = () => {
    if (placementMode && onSlotClick) onSlotClick(bfId, bottomSlot);
  };

  const renderHero = (hero) => {
    if (!hero) return null;
    return (
      <div className="battlefield__slot">
        <HeroCard hero={hero} />
      </div>
    );
  };

  const topTokens = tokens.filter(t => t.owner === topSlot);
  const bottomTokens = tokens.filter(t => t.owner === bottomSlot);

  const classes = [
    'battlefield',
    isActive && 'battlefield--active',
    placementMode && 'battlefield--placement',
    cfg.bonusClass,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={handleBattlefieldClick}>
      <div className="battlefield__label">Campo {bfId + 1}</div>

      {cfg.bonusLabel && (
        <div className="battlefield__bonus-badge" style={{ color: cfg.bonusColor }}>
          {cfg.bonusLabel}
        </div>
      )}

      {renderHero(topHero)}

      {topTokens.length > 0 && (
        <div className="battlefield__tokens">
          {topTokens.map((token, i) => (
            <span key={i} className="token-badge">
              {token.name || 'Token'} {token.attack}/{token.defense ?? token.health ?? '?'}
            </span>
          ))}
        </div>
      )}

      <div className="battlefield__vs">
        <span className="battlefield__vs-text">VS</span>
      </div>

      {bottomTokens.length > 0 && (
        <div className="battlefield__tokens">
          {bottomTokens.map((token, i) => (
            <span key={i} className="token-badge">
              {token.name || 'Token'} {token.attack}/{token.defense ?? token.health ?? '?'}
            </span>
          ))}
        </div>
      )}

      {renderHero(bottomHero)}
    </div>
  );
}
