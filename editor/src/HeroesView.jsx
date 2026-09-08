import React, { useState, useMemo } from 'react';
import HeroCard from './components/HeroCard.jsx';
import HeroDetail from './components/HeroDetail.jsx';
import CsvLoaderBar from './components/CsvLoaderBar.jsx';
import ErrorBanner from './components/ErrorBanner.jsx';
import { useCsvSource } from './useCsvSource.js';
import { parseCsv } from './csv.js';
import { rowsToHeroes } from './heroes.js';
import { heroToCard } from './adapt.js';
import { RUNE_LETTERS, RUNE_NAMES } from './runes.js';
import sampleCsv from '../sample-heroes.csv?raw';

export default function HeroesView({ onHome }) {
  const src = useCsvSource('rw-editor-heroes', sampleCsv, 'sample-heroes.csv');
  const [pasteOpen, setPasteOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [effectFilter, setEffectFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const { heroes, errors, cards } = useMemo(() => {
    const parsed = parseCsv(src.csvText);
    const { heroes, errors } = rowsToHeroes(parsed);
    return { heroes, errors, cards: heroes.map(heroToCard) };
  }, [src.csvText]);

  const effectOptions = useMemo(() => {
    const set = new Set();
    for (const h of heroes) for (const a of h.abilities) for (const e of a.effects) set.add(e.type);
    return [...set].sort();
  }, [heroes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((card) => {
      const h = card._hero;
      if (q && !card.name.toLowerCase().includes(q)) return false;
      if (colorFilter && h.color !== colorFilter) return false;
      if (kindFilter && !h.abilities.some((a) => a.kind === kindFilter)) return false;
      if (effectFilter && !h.abilities.some((a) => a.effects.some((e) => e.type === effectFilter))) return false;
      return true;
    });
  }, [cards, search, colorFilter, kindFilter, effectFilter]);

  const selected = useMemo(() => cards.find((c) => c.id === selectedId) || null, [cards, selectedId]);

  return (
    <>
      <header className="editor__header">
        <div className="editor__nav">
          <button type="button" className="crumb" onClick={onHome}>← Editor</button>
          <span className="editor__section">Database Eroi</span>
        </div>
        <div className="toolbar">
          <label className="grow">
            Cerca nome
            <input type="search" placeholder="es. zaccaria" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <label>
            Colore
            <select value={colorFilter} onChange={(e) => setColorFilter(e.target.value)}>
              <option value="">tutti</option>
              {RUNE_LETTERS.map((l) => <option key={l} value={l}>{l} — {RUNE_NAMES[l]}</option>)}
            </select>
          </label>
          <label>
            Abilità
            <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
              <option value="">tutte</option>
              <option value="passive">ha una passiva</option>
              <option value="active">ha un'attiva</option>
            </select>
          </label>
          <label>
            Effetto
            <select value={effectFilter} onChange={(e) => setEffectFilter(e.target.value)}>
              <option value="">tutti</option>
              {effectOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <span className="toolbar__count">{filtered.length} / {heroes.length} eroi</span>
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
        <div className="grid grid--heroes">
          {filtered.length === 0 && (
            <div className="grid__empty">
              {heroes.length === 0
                ? 'Nessun eroe caricato. Usa "Carica CSV…", "Incolla CSV" o "Ripristina esempio".'
                : 'Nessun eroe corrisponde ai filtri.'}
            </div>
          )}
          {filtered.map((card) => (
            <HeroCard
              key={card.id}
              hero={card}
              selected={card.id === selectedId}
              onClick={() => setSelectedId(card.id === selectedId ? null : card.id)}
            />
          ))}
        </div>

        {selected && <HeroDetail hero={selected._hero} onClose={() => setSelectedId(null)} />}
      </div>
    </>
  );
}
