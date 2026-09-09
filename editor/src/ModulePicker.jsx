import React, { useState, useMemo } from 'react';
import ActionCard from './components/ActionCard.jsx';
import DeckTotals from './components/DeckTotals.jsx';
import { useCsvSource } from './useCsvSource.js';
import { parseCsv } from './csv.js';
import { rowsToModules } from './modules.js';
import { moduleToCard } from './adapt.js';
import { RUNE_LETTERS, RUNE_NAMES } from './runes.js';
import sampleModulesCsv from '../sample-modules.csv?raw';

function letterCounts(str) {
  const c = {};
  for (const ch of String(str).toUpperCase()) if ('WUBRGPC'.includes(ch)) c[ch] = (c[ch] || 0) + 1;
  return c;
}

/**
 * The Database Carte grid without the import hub. Single-select + Conferma.
 * `onConfirm(module)` returns the raw module object; `onCancel()` backs out.
 */
export default function ModulePicker({
  onConfirm, onCancel, title = 'Scegli un modulo',
  pool, used, items = 0, enchants = 0, bonus,
}) {
  const src = useCsvSource('rw-editor-modules', sampleModulesCsv, 'sample-modules.csv');
  const [search, setSearch] = useState('');
  const [cost, setCost] = useState('');
  const [effectFilter, setEffectFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [chosenId, setChosenId] = useState(null);

  const modules = useMemo(
    () => rowsToModules(parseCsv(src.csvText)).modules,
    [src.csvText],
  );
  const cards = useMemo(() => modules.map(moduleToCard), [modules]);

  const effectOptions = useMemo(() => {
    const set = new Set();
    for (const m of modules) for (const e of m.produces || []) set.add(e.type);
    return [...set].sort();
  }, [modules]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const want = letterCounts(cost);
    return cards.filter((card) => {
      const m = card._module;
      if (q && !card.name.toLowerCase().includes(q)) return false;
      if (cost.trim()) {
        const have = letterCounts(card.runeStr);
        for (const [k, n] of Object.entries(want)) if ((have[k] || 0) < n) return false;
      }
      if (colorFilter && !card.colors.includes(colorFilter)) return false;
      if (effectFilter) {
        if (m.kind === 'modifier') return false;
        if (!(m.produces || []).some((e) => e.type === effectFilter)) return false;
      }
      return true;
    });
  }, [cards, search, cost, colorFilter, effectFilter]);

  const chosen = modules.find((m) => m.id === chosenId) || null;

  // preview: subtract the tentatively-chosen module's cost too
  const previewUsed = useMemo(() => {
    if (!used) return used;
    const u = { ...used };
    for (const l of chosen?.cost || []) u[l] = (u[l] || 0) + 1;
    return u;
  }, [used, chosen]);

  return (
    <>
      <header className="editor__header">
        <div className="editor__nav">
          <button type="button" className="crumb" onClick={onCancel}>← Indietro</button>
          <span className="editor__section">{title}</span>
          <button
            type="button"
            className="btn-primary"
            disabled={!chosen}
            onClick={() => chosen && onConfirm(chosen)}
          >
            Conferma{chosen ? ` — ${chosen.name}` : ''}
          </button>
        </div>

        {pool && (
          <DeckTotals label="Rune rimanenti" pool={pool} used={previewUsed} items={items} enchants={enchants} bonus={bonus} />
        )}
        <div className="toolbar">
          <label className="grow">
            Cerca nome
            <input type="search" placeholder="es. harden" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <label>
            Costo (rune)
            <input type="text" placeholder="GG" value={cost} onChange={(e) => setCost(e.target.value)} />
          </label>
          <label>
            Effetto
            <select value={effectFilter} onChange={(e) => setEffectFilter(e.target.value)}>
              <option value="">tutti</option>
              {effectOptions.map((t) => <option key={t} value={t}>{t}</option>)}
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
      </header>

      <div className="editor__body">
        <div className="grid">
          {filtered.length === 0 && <div className="grid__empty">Nessun modulo corrisponde ai filtri.</div>}
          {filtered.map((card) => (
            <ActionCard
              key={card.id}
              card={card}
              selected={card.id === chosenId}
              onClick={() => setChosenId(card.id === chosenId ? null : card.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
