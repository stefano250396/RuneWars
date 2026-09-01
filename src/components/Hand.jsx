import ActionCard from './ActionCard.jsx';

export default function Hand({
  cards = [],
  selectedIds = [],
  onCardClick,
  maxSelections = 1,
  disabled = false,
  compact = false,
}) {
  const selectedSet = new Set(
    Array.isArray(selectedIds) ? selectedIds : [...selectedIds]
  );

  const className = compact ? 'hand hand--compact' : 'hand';

  if (cards.length === 0) {
    return (
      <div className={className}>
        <div className="hand__empty">No cards in hand</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {cards.map((card) => {
        const isSelected = selectedSet.has(card.id);
        const isPisello = card.special === 'pisello';
        const atMax = selectedSet.size >= maxSelections && !isSelected;

        return (
          <div key={card.id} className="hand__card-wrapper">
            <ActionCard
              card={card}
              selected={isSelected}
              disabled={disabled || isPisello || atMax}
              onClick={onCardClick}
            />
          </div>
        );
      })}
    </div>
  );
}
