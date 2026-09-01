import { useEffect, useRef } from 'react';

function detectType(entry) {
  if (typeof entry === 'object' && entry.type) return entry.type;
  const msg = typeof entry === 'string' ? entry : entry?.message || '';
  if (msg.includes('damage') || msg.includes('fallen') || msg.includes('defeated') || msg.includes('Loses')) return 'damage';
  if (msg.includes('estore') || msg.includes('heal') || msg.includes('Life Bond')) return 'heal';
  if (msg.includes('gains') || msg.includes('Plus') || msg.includes('Celerity') || msg.includes('activates')) return 'buff';
  if (msg.includes('---') || msg.includes('Round') || msg.includes('Phase') || msg.includes('combat') || msg.includes('begun') || msg.includes('Entering')) return 'phase';
  return 'system';
}

export default function CombatLog({ entries = [], isVisible = true, onToggle }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isVisible) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length, isVisible]);

  return (
    <div className={`combat-log${isVisible ? '' : ' combat-log--hidden'}`}>
      <div className="combat-log__header" onClick={onToggle}>
        {isVisible && <span className="combat-log__header-label">Combat Log</span>}
        <button className="combat-log__toggle-btn" title={isVisible ? 'Nascondi log' : 'Mostra log'}>
          {isVisible ? '◀' : '▶'}
        </button>
      </div>
      {isVisible && (
        <div className="combat-log__entries">
          {entries.length === 0 && (
            <div className="combat-log__empty">No events yet...</div>
          )}
          {entries.map((entry, i) => {
            const type = detectType(entry);
            const msg = typeof entry === 'string' ? entry : entry?.message || String(entry);
            return (
              <div key={i} className={`combat-log__entry combat-log__entry--${type}`}>
                {msg}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
