import React, { useState, useMemo } from 'react';
import HeroCard from './components/HeroCard.jsx';
import CsvLoaderBar from './components/CsvLoaderBar.jsx';
import ErrorBanner from './components/ErrorBanner.jsx';
import { useCsvSource } from './useCsvSource.js';
import { parseCsv } from './csv.js';
import { rowsToHeroes } from './heroes.js';
import { heroToCard } from './adapt.js';
import { describeEffect } from './describe.js';
import { RUNE_LETTERS, RUNE_NAMES } from './runes.js';
import sampleCsv from '../sample-heroes.csv?raw';

export default function HeroesView() {
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

function HeroDetail({ hero, onClose }) {
  const dump = {
    id: hero.id,
    name: hero.name,
    color: hero.color,
    magicPower: hero.magicPower,
    attack: hero.attack,
    defense: hero.defense,
    health: hero.health,
    maxHealth: hero.maxHealth,
    items: hero.items,
    enchants: hero.enchants,
    runePool: hero.runePool,
    abilities: hero.abilities.map((a) => ({ num: a.num, name: a.name, kind: a.kind, cost: a.cost, effects: a.effects })),
  };

  const rowCols = ['ability', 'ability name', 'ability cost', 'slot', 'effect', 'stat', 'amount', 'scaler', 'target', 'condition', 'timing', 'duration', 'token', 'extra'];

  return (
    <aside className="detail">
      <button type="button" className="detail__close" onClick={onClose} aria-label="Chiudi">×</button>
      <h2>{hero.name}</h2>
      <div className="detail__meta">
        <code>{hero.id}</code> · colore {hero.color} · {hero.magicPower}/{hero.attack}/{hero.defense} · {hero.health} HP · item {hero.items} · enchant {hero.enchants}
      </div>

      <div className="detail__pips">
        {Object.entries(hero.runePool).map(([k, n]) => (
          <span key={k} className="pool-chip">
            <span className={`rune-pip rune-pip--${k}`} title={k}>{k}</span>×{n}
          </span>
        ))}
      </div>

      <h3>Abilità ({hero.abilities.length})</h3>
      {hero.abilities.map((a) => (
        <div key={a.num} className="ability-block">
          <div className="ability-block__head">
            <span className="ability-block__num">{a.num}</span>
            <span className="ability-block__name">{a.name}</span>
            <span className={`ability-block__kind ability-block__kind--${a.kind}`}>{a.kind}</span>
            {a.cost.length > 0 && (
              <span className="ability-block__cost">
                {a.cost.map((k, i) => <span key={i} className={`rune-pip rune-pip--${k}`} title={k}>{k}</span>)}
              </span>
            )}
          </div>
          <ul className="detail__effects">
            {a.effects.map((eff, i) => (
              <li key={i}><span className="type">{eff.type}</span>{describeEffect(eff)}</li>
            ))}
          </ul>
        </div>
      ))}

      <h3>Struttura compilata</h3>
      <pre>{JSON.stringify(dump, null, 2)}</pre>

      <h3>Righe CSV di origine</h3>
      <div className="tablewrap-x">
        <table className="rows">
          <thead><tr><th>#</th>{rowCols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {hero._rows.map((r) => (
              <tr key={r._line}><td>{r._line}</td>{rowCols.map((c) => <td key={c}>{r[c] || ''}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </aside>
  );
}
