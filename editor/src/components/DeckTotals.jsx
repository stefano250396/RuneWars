import React from 'react';
import { RUNE_LETTERS } from '../runes.js';

/**
 * The rune / item / enchant bar.
 *  - phase 2 (heroes): pass `pool` only -> shows the hero totals (×N).
 *  - phase 3 (cards):  pass `used` too   -> shows what's LEFT (pool − used),
 *    red where it goes negative.
 */
export default function DeckTotals({ label, pool = {}, items = 0, enchants = 0, used, bonus }) {
  const remaining = !!used;
  const present = RUNE_LETTERS.filter((c) => (pool[c] || 0) > 0 || (used && (used[c] || 0) > 0));

  return (
    <div className="totals">
      <span className="totals__label">{label}</span>
      <span className="totals__runes">
        {present.length === 0 && <span className="totals__empty">—</span>}
        {present.map((c) => {
          const p = pool[c] || 0;
          const u = (used || {})[c] || 0;
          const v = remaining ? p - u : p;
          return (
            <span key={c} className={`pool-chip ${v < 0 ? 'pool-chip--over' : ''}`}>
              <span className={`rune-pip rune-pip--${c}`} title={c}>{c}</span>
              {remaining ? v : `×${v}`}
            </span>
          );
        })}
      </span>
      {bonus && (
        <span className="totals__bonus" title="3 rune bonus (già incluse nei totali)">
          bonus +3 <span className={`rune-pip rune-pip--${bonus}`} title={bonus}>{bonus}</span>
        </span>
      )}
      <span className="totals__sep" />
      <span className="totals__slot">Oggetti <b>{items}</b></span>
      <span className="totals__slot">Incantesimi <b>{enchants}</b></span>
    </div>
  );
}
