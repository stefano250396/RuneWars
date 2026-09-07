import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ActionCard from './components/ActionCard.jsx';
import { parseCsv } from './csv.js';
import { rowsToModules } from './modules.js';
import { moduleToCard } from './adapt.js';
import { describeEffect } from './describe.js';
import { RUNE_LETTERS, RUNE_NAMES, parseRunes } from './runes.js';
import sampleCsv from '../sample-modules.csv?raw';

const LS_KEY = 'rw-editor-csv';
const LS_SRC = 'rw-editor-src';

function loadInitial() {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return { text: saved, src: localStorage.getItem(LS_SRC) || 'CSV salvato' };
  } catch { /* ignore */ }
  return { text: sampleCsv, src: 'sample-modules.csv' };
}

function letterCounts(str) {
  const c = {};
  for (const ch of String(str).toUpperCase()) if ('WUBRGPC'.includes(ch)) c[ch] = (c[ch] || 0) + 1;
  return c;
}

export default function App() {
  const init = useMemo(loadInitial, []);
  const [csvText, setCsvText] = useState(init.text);
  const [source, setSource] = useState(init.src);
  const [pasteOpen, setPasteOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [cost, setCost] = useState('');
  const [costExact, setCostExact] = useState(false);
  const [effectFilter, setEffectFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, csvText);
      localStorage.setItem(LS_SRC, source);
    } catch { /* ignore */ }
  }, [csvText, source]);

  const { modules, errors, cards } = useMemo(() => {
    const parsed = parseCsv(csvText);
    const { modules, errors } = rowsToModules(parsed);
    return { modules, errors, cards: modules.map(moduleToCard) };
  }, [csvText]);

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

  const selected = useMemo(
    () => cards.find((c) => c.id === selectedId) || null,
    [cards, selectedId],
  );

  const onFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result));
      setSource(file.name);
      setSelectedId(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  return (
    <div className="editor">
      <header className="editor__header">
        <h1 className="editor__title">
          Rune Wars — Card Editor
          <span>importa i moduli da CSV e sfogliali come carte</span>
        </h1>

        <div className="toolbar">
          <label className="grow">
            Cerca nome
            <input
              type="search"
              placeholder="es. harden"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <label>
            Costo (rune)
            <span className="cost-field">
              <input
                type="text"
                placeholder="GG"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
              <span className="chk">
                <input
                  type="checkbox"
                  checked={costExact}
                  onChange={(e) => setCostExact(e.target.checked)}
                />
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

          <span className="toolbar__count">
            {filtered.length} / {modules.length} moduli
          </span>
        </div>

        <div className="loader">
          <label className="filelabel">
            Carica CSV…
            <input type="file" accept=".csv,text/csv" onChange={onFile} />
          </label>
          <button type="button" onClick={() => setPasteOpen((v) => !v)}>
            {pasteOpen ? 'Nascondi incolla' : 'Incolla CSV'}
          </button>
          <button
            type="button"
            onClick={() => { setCsvText(sampleCsv); setSource('sample-modules.csv'); setSelectedId(null); }}
          >
            Ripristina esempio
          </button>
          <button
            type="button"
            className="danger"
            disabled={modules.length === 0}
            onClick={() => {
              if (modules.length === 0) return;
              if (!confirmClear) { setConfirmClear(true); return; }
              setCsvText('');
              setSource('vuoto');
              setSelectedId(null);
              setConfirmClear(false);
            }}
            onBlur={() => setConfirmClear(false)}
          >
            {confirmClear ? `Conferma — cancella ${modules.length} carte` : 'Svuota'}
          </button>
          <span className="src">sorgente: {source}</span>
        </div>

        {pasteOpen && (
          <div className="paste-area">
            <textarea
              value={csvText}
              spellCheck={false}
              onChange={(e) => { setCsvText(e.target.value); setSource('incollato'); }}
            />
          </div>
        )}
      </header>

      {errors.length > 0 && (
        <details className="errors" open>
          <summary>{errors.length} problema/i nel CSV</summary>
          <ul>
            {errors.map((err, i) => (
              <li key={i}>
                riga <b>{err.line}</b>
                {err.name ? <> — <b>{err.name}</b></> : null}
                {' — '}{err.message}
              </li>
            ))}
          </ul>
        </details>
      )}

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

        {selected && <DetailPanel card={selected} onClose={() => setSelectedId(null)} />}
      </div>
    </div>
  );
}

function DetailPanel({ card, onClose }) {
  const m = card._module;
  const pips = parseRunes(card.runeStr);
  const pipList = Object.entries(pips).flatMap(([k, n]) => Array(n).fill(k));

  const dump = m.kind === 'modifier'
    ? { id: m.id, name: m.name, cost: m.cost, kind: m.kind, needsTarget: m.needsTarget, transform: m.transform }
    : { id: m.id, name: m.name, cost: m.cost, kind: m.kind, produces: m.produces };

  const rowCols = ['slot', 'cost', 'kind', 'effect', 'stat', 'amount', 'scaler', 'target', 'condition', 'timing', 'token', 'mod_op', 'extra'];

  return (
    <aside className="detail">
      <button type="button" className="detail__close" onClick={onClose} aria-label="Chiudi">×</button>
      <h2>{card.name}</h2>
      <div className="detail__meta">
        <code>{m.id}</code> · {m.kind} · costo {card.runeStr || '—'} ({card.runeCount})
      </div>

      <div className="detail__pips">
        {pipList.map((k, i) => (
          <span key={i} className={`rune-pip rune-pip--${k}`} title={k}>{k}</span>
        ))}
      </div>

      <h3>{m.kind === 'modifier' ? 'Trasformazione' : `Effetti (${m.produces.length})`}</h3>
      {m.kind === 'modifier' ? (
        <p style={{ fontSize: '0.86rem', margin: 0 }}>{card.text}</p>
      ) : (
        <ul className="detail__effects">
          {m.produces.map((eff, i) => (
            <li key={i}>
              <span className="type">{eff.type}</span>
              {describeEffect(eff)}
            </li>
          ))}
        </ul>
      )}

      <h3>Struttura compilata</h3>
      <pre>{JSON.stringify(dump, null, 2)}</pre>

      <h3>Righe CSV di origine</h3>
      <table className="rows">
        <thead>
          <tr><th>#</th>{rowCols.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {m._rows.map((r) => (
            <tr key={r._line}>
              <td>{r._line}</td>
              {rowCols.map((c) => <td key={c}>{r[c] || ''}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  );
}
