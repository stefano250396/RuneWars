import React, { useState, useMemo } from 'react';
import ActionCard from './components/ActionCard.jsx';
import CsvLoaderBar from './components/CsvLoaderBar.jsx';
import ErrorBanner from './components/ErrorBanner.jsx';
import { useCsvSource } from './useCsvSource.js';
import { parseCsv } from './csv.js';
import { rowsToModules } from './modules.js';
import { moduleToCard } from './adapt.js';
import { describeEffect } from './describe.js';
import { RUNE_LETTERS, RUNE_NAMES, parseRunes } from './runes.js';
import sampleCsv from '../sample-modules.csv?raw';

function letterCounts(str) {
  const c = {};
  for (const ch of String(str).toUpperCase()) if ('WUBRGPC'.includes(ch)) c[ch] = (c[ch] || 0) + 1;
  return c;
}

export default function ModulesView() {
  const src = useCsvSource('rw-editor-modules', sampleCsv, 'sample-modules.csv');
  const [pasteOpen, setPasteOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [cost, setCost] = useState('');
  const [costExact, setCostExact] = useState(false);
  const [effectFilter, setEffectFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const { modules, errors, cards } = useMemo(() => {
    const parsed = parseCsv(src.csvText);
    const { modules, errors } = rowsToModules(parsed);
    return { modules, errors, cards: modules.map(moduleToCard) };
  }, [src.csvText]);

  const effectOptions = useMemo(() => {
    const set = new Set();
    for (const m of modules) for (const e of m.produces || []) set.add(e.type);
    return [...set].sort();
  }, [modules]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const wantCost = letterCounts(cost);
    const wantCostStr = Object.entries(wantCost).flatMap(([k, n]) => Array(n).fill(k)).sort().join('');

    return cards.filter((card) => {
      const m = card._module;
      if (q && !card.name.toLowerCase().includes(q)) return false;
      if (cost.trim()) {
        const have = letterCounts(card.runeStr);
        if (costExact) {
          const haveStr = Object.entries(have).flatMap(([k, n]) => Array(n).fill(k)).sort().join('');
          if (haveStr !== wantCostStr) return false;
        } else {
          for (const [k, n] of Object.entries(wantCost)) if ((have[k] || 0) < n) return false;
        }
      }
      if (kindFilter && m.kind !== kindFilter) return false;
      if (colorFilter && !card.colors.includes(colorFilter)) return false;
      if (effectFilter) {
        if (m.kind === 'modifier') return false;
        if (!(m.produces || []).some((e) => e.type === effectFilter)) return false;
      }
      return true;
    });
  }, [cards, search, cost, costExact, kindFilter, colorFilter, effectFilter]);

  const selected = useMemo(() => cards.find((c) => c.id === selectedId) || null, [cards, selectedId]);

  return (
    <>
      <header className="editor__header">
        <div className="toolbar">
          <label className="grow">
            Cerca nome
            <input type="search" placeholder="es. harden" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <label>
            Costo (rune)
            <span className="cost-field">
              <input type="text" placeholder="GG" value={cost} onChange={(e) => setCost(e.target.value)} />
              <span className="chk">
                <input type="checkbox" checked={costExact} onChange={(e) => setCostExact(e.target.checked)} />
                esatto
              </span>
            </span>
          </label>
          <label>
            Effetto
            <select value={effectFilter} onChange={(e) => setEffectFilter(e.target.value)}>
              <option value="">tutti</option>
              {effectOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>
            Tipo
            <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
              <option value="">tutti</option>
              <option value="spell">spell</option>
              <option value="modifier">modifier</option>
            </select>
          </label>
          <label>
            Colore
            <select value={colorFilter} onChange={(e) => setColorFilter(e.target.value)}>
              <option value="">tutti</option>
              {RUNE_LETTERS.map((l) => <option key={l} value={l}>{l} — {RUNE_NAMES[l]}</option>)}
            </select>
          </label>
          <span className="toolbar__count">{filtered.length} / {modules.length} moduli</span>
        </div>

        <CsvLoaderBar
          source={src.source}
          csvText={src.csvText}
          onFile={(f) => { src.loadFile(f); setSelectedId(null); }}
          onPaste={src.setPasted}
          pasteOpen={pasteOpen}
          onTogglePaste={() => setPasteOpen((v) => !v)}
          onRestore={() => { src.restoreSample(); setSelectedId(null); }}
          onClear={() => { src.clear(); setSelectedId(null); }}
          onUndo={src.undoClear}
          canClear={src.canClear}
          canUndo={src.canUndo}
        />
      </header>

      <ErrorBanner errors={errors} />

      <div className="editor__body">
        <div className="grid">
          {filtered.length === 0 && (
            <div className="grid__empty">
              {modules.length === 0
                ? 'Nessun modulo caricato. Usa "Carica CSV…", "Incolla CSV" o "Ripristina esempio".'
                : 'Nessun modulo corrisponde ai filtri.'}
            </div>
          )}
          {filtered.map((card) => (
            <ActionCard
              key={card.id}
              card={card}
              selected={card.id === selectedId}
              onClick={() => setSelectedId(card.id === selectedId ? null : card.id)}
            />
          ))}
        </div>

        {selected && <ModuleDetail card={selected} onClose={() => setSelectedId(null)} />}
      </div>
    </>
  );
}

function ModuleDetail({ card, onClose }) {
  const m = card._module;
  const pipList = Object.entries(parseRunes(card.runeStr)).flatMap(([k, n]) => Array(n).fill(k));

  const dump = m.kind === 'modifier'
    ? { id: m.id, name: m.name, cost: m.cost, kind: m.kind, needsTarget: m.needsTarget, transform: m.transform }
    : { id: m.id, name: m.name, cost: m.cost, kind: m.kind, produces: m.produces };

  const rowCols = ['slot', 'cost', 'kind', 'effect', 'stat', 'amount', 'scaler', 'target', 'condition', 'timing', 'token', 'mod_op', 'extra'];

  return (
    <aside className="detail">
      <button type="button" className="detail__close" onClick={onClose} aria-label="Chiudi">×</button>
      <h2>{card.name}</h2>
      <div className="detail__meta"><code>{m.id}</code> · {m.kind} · costo {card.runeStr || '—'} ({card.runeCount})</div>
      <div className="detail__pips">
        {pipList.map((k, i) => <span key={i} className={`rune-pip rune-pip--${k}`} title={k}>{k}</span>)}
      </div>

      <h3>{m.kind === 'modifier' ? 'Trasformazione' : `Effetti (${m.produces.length})`}</h3>
      {m.kind === 'modifier' ? (
        <p style={{ fontSize: '0.86rem', margin: 0 }}>{card.text}</p>
      ) : (
        <ul className="detail__effects">
          {m.produces.map((eff, i) => (
            <li key={i}><span className="type">{eff.type}</span>{describeEffect(eff)}</li>
          ))}
        </ul>
      )}

      <h3>Struttura compilata</h3>
      <pre>{JSON.stringify(dump, null, 2)}</pre>

      <h3>Righe CSV di origine</h3>
      <div className="tablewrap-x">
        <table className="rows">
          <thead><tr><th>#</th>{rowCols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {m._rows.map((r) => (
              <tr key={r._line}><td>{r._line}</td>{rowCols.map((c) => <td key={c}>{r[c] || ''}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </aside>
  );
}
