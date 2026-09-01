import RunePip from './RunePip.jsx';

function coversAbilityCost(selectedCards, cost) {
  if (!cost || selectedCards.length === 0) return false;
  const pool = {};
  for (const card of selectedCards) {
    for (const [r, n] of Object.entries(card.runes || {})) {
      pool[r] = (pool[r] || 0) + n;
    }
  }
  return Object.entries(cost).every(([r, n]) => (pool[r] || 0) >= n);
}

function AbilityBox({ ability, abilityNum, heroId, selectedCards, selectedAbility, onSelectAbility, extraStyle }) {
  const covered = coversAbilityCost(selectedCards, ability.cost);
  const isSelected =
    selectedAbility?.heroId === heroId && selectedAbility?.abilityNum === abilityNum;

  const className = [
    'ability-box',
    !covered && 'ability-box--disabled',
    isSelected && 'ability-box--selected',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      data-tooltip={ability.description}
      onClick={() => {
        if (!covered) return;
        onSelectAbility(
          isSelected ? null : { heroId, abilityNum, cost: ability.cost }
        );
      }}
      style={{
        display: 'block',
        padding: '8px 12px',
        cursor: covered ? 'pointer' : 'not-allowed',
        ...extraStyle,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 5 }}>{ability.name}</div>
      <div style={{ fontSize: '0.82rem', color: 'rgba(200,200,220,0.75)', marginBottom: 5, lineHeight: 1.4 }}>
        {ability.description}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
        {Object.entries(ability.cost).map(([rune, count]) =>
          Array.from({ length: count }).map((_, i) => (
            <RunePip key={`${rune}-${i}`} rune={rune} size={20} />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * AbilityPanel
 *
 * Props:
 *   heroes         — hero instances already filtered to alive
 *   selectedCards  — array of currently selected card objects
 *   selectedAbility — { heroId, abilityNum } | null
 *   onSelectAbility — callback({ heroId, abilityNum, cost } | null)
 */
export default function AbilityPanel({ heroes, selectedCards, selectedAbility, onSelectAbility }) {
  const heroesWithAbilities = (heroes || []).filter(h => h.active1 || h.active2);
  if (heroesWithAbilities.length === 0) return null;

  return (
    <div style={{ padding: '8px 12px 10px', borderLeft: '2px solid rgba(255,255,255,0.1)', height: '100%' }}>
      <div style={{ color: '#f0c040', fontWeight: 700, fontSize: '1rem', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>
        Abilità Attivabili
      </div>
      {selectedCards.length === 0 && (
        <div style={{ color: '#555', fontSize: '0.85rem', fontStyle: 'italic', padding: '6px 0' }}>
          Seleziona una carta per attivare abilità
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {selectedCards.length > 0 && heroesWithAbilities.map(hero => (
          <div key={hero.instanceId}>
            <div style={{ color: '#a878ff', fontWeight: 700, marginBottom: 6, fontSize: '1rem' }}>{hero.name}</div>
            {hero.active1 && (
              <AbilityBox
                ability={hero.active1}
                abilityNum={1}
                heroId={hero.instanceId}
                selectedCards={selectedCards}
                selectedAbility={selectedAbility}
                onSelectAbility={onSelectAbility}
                extraStyle={{ marginBottom: 3 }}
              />
            )}
            {hero.active2 && (
              <AbilityBox
                ability={hero.active2}
                abilityNum={2}
                heroId={hero.instanceId}
                selectedCards={selectedCards}
                selectedAbility={selectedAbility}
                onSelectAbility={onSelectAbility}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
