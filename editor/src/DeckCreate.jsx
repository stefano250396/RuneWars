import React, { useState, useMemo } from 'react';
import HeroCard from './components/HeroCard.jsx';
import HeroDetail from './components/HeroDetail.jsx';
import DeckBuild from './DeckBuild.jsx';
import { slotForSave } from './slotCard.js';
import { RUNE_LETTERS, RUNE_NAMES } from './runes.js';

const MAX_HEROES = 3;
const SLOT_COUNT = 20;

function computeTotals(heroes) {
  const runes = {};
  let items = 0;
  let enchants = 0;
  for (const h of heroes) {
    for (const [k, n] of Object.entries(h.runePool || {})) runes[k] = (runes[k] || 0) + n;
    items += h.items || 0;
    enchants += h.enchants || 0;
  }
  return { runes, items, enchants };
}

/**
 * Deck creation flow.
 *  1. pick a colour
 *  2. pick 3 heroes (of that colour or grey), with a live rune/item/enchant total
 * `onSave({ name, color, heroes, totals })` adds a deck to the collection.
 * "Scegli questi eroi" is intentionally not wired yet.
 */
export default function DeckCreate({ heroes, onCancel, onSave }) {
  const [color, setColor] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const [naming, setNaming] = useState(false);
  const [deckName, setDeckName] = useState('');
  const [stage, setStage] = useState('heroes'); // 'heroes' | 'cards'
  const [slots, setSlots] = useState(() => Array.from({ length: SLOT_COUNT }, () => ({ modules: [] })));

  const pool = useMemo(
    () => (color ? heroes.filter((c) => c._hero.color === color || c._hero.color === 'C') : []),
    [heroes, color],
  );

  const selectedHeroes = useMemo(
    () => selectedIds.map((id) => heroes.find((c) => c.id === id)?._hero).filter(Boolean),
    [selectedIds, heroes],
  );
  const totals = useMemo(() => computeTotals(selectedHeroes), [selectedHeroes]);
  const hovered = heroes.find((c) => c.id === hoveredId)?._hero || null;
  const full = selectedIds.length >= MAX_HEROES;

  const toggle = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_HEROES) return prev;
      return [...prev, id];
    });
  };

  const confirmSave = () => {
    const name = deckName.trim() || 'Mazzo senza nome';
    const cards = slots.filter((s) => s.modules.length > 0).map((s) => slotForSave(s.modules));
    onSave({ name, color, heroes: selectedHeroes, totals, cards });
  };

  // ── Phase 1: colour ──
  if (!color) {
    return (
      <>
        <header className="editor__header">
          <div className="editor__nav">
            <button type="button" className="crumb" onClick={onCancel}>← Collezione</button>
            <span className="editor__section">Nuovo mazzo · scegli un colore</span>
          </div>
        </header>
        <div className="editor__body">
          <div className="colorpick">
            {RUNE_LETTERS.map((l) => (
              <button
                key={l}
                type="button"
                className={`colorpick__btn colorpick__btn--${l}`}
                onClick={() => setColor(l)}
              >
                <span className={`rune-pip rune-pip--${l}`}>{l}</span>
                <span>{RUNE_NAMES[l]}</span>
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  const namingModal = naming && (
    <div className="modal" onClick={() => setNaming(false)}>
      <div className="modal__box" onClick={(e) => e.stopPropagation()}>
        <h3>Salva mazzo</h3>
        <p className="modal__hint">
          {selectedIds.length} eroi · {slots.filter((s) => s.modules.length > 0).length} carte
        </p>
        <input
          type="text"
          autoFocus
          placeholder="Nome del mazzo"
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && confirmSave()}
        />
        <div className="modal__actions">
          <button type="button" onClick={() => setNaming(false)}>Annulla</button>
          <button type="button" className="btn-primary" onClick={confirmSave}>Aggiungi alla collezione</button>
        </div>
      </div>
    </div>
  );

  // ── Phase 3: cards ──
  if (stage === 'cards') {
    return (
      <>
        <DeckBuild
          color={color}
          slots={slots}
          setSlots={setSlots}
          onBack={() => setStage('heroes')}
          onSaveRequest={() => { setDeckName(''); setNaming(true); }}
        />
        {namingModal}
      </>
    );
  }

  // ── Phase 2: heroes ──
  return (
    <>
      <header className="editor__header">
        <div className="editor__nav">
          <button type="button" className="crumb" onClick={() => { setColor(null); setSelectedIds([]); }}>← Colore</button>
          <span className="editor__section">
            Nuovo mazzo · colore {color} <span className="editor__section-sub">({RUNE_NAMES[color]} + grigio)</span>
          </span>
          <span className="deck-create__count">{selectedIds.length} / {MAX_HEROES} eroi</span>
          <button
            type="button"
            className="btn-primary"
            disabled={!full}
            title={full ? 'passa alle carte' : 'seleziona 3 eroi'}
            onClick={() => full && setStage('cards')}
          >
            Scegli questi eroi
          </button>
          <button type="button" onClick={() => { setDeckName(''); setNaming(true); }}>
            Salva mazzo
          </button>
        </div>

        <div className="totals">
          <span className="totals__label">Totali eroi selezionati</span>
          <span className="totals__runes">
            {RUNE_LETTERS.filter((l) => totals.runes[l]).map((l) => (
              <span key={l} className="pool-chip">
                <span className={`rune-pip rune-pip--${l}`}>{l}</span>×{totals.runes[l]}
              </span>
            ))}
            {Object.keys(totals.runes).length === 0 && <span className="totals__empty">—</span>}
          </span>
          <span className="totals__sep" />
          <span className="totals__slot">Oggetti <b>{totals.items}</b></span>
          <span className="totals__slot">Incantesimi <b>{totals.enchants}</b></span>
        </div>
      </header>

      <div className="editor__body">
        <div className="grid grid--heroes">
          {pool.length === 0 && (
            <div className="grid__empty">Nessun eroe di colore {color} o grigio nel database.</div>
          )}
          {pool.map((card) => {
            const isSel = selectedIds.includes(card.id);
            const locked = full && !isSel;
            return (
              <div
                key={card.id}
                className={`hero-pick ${locked ? 'hero-pick--locked' : ''}`}
                onMouseEnter={() => setHoveredId(card.id)}
              >
                <HeroCard
                  hero={card}
                  selected={isSel}
                  onClick={() => !locked && toggle(card.id)}
                />
              </div>
            );
          })}
        </div>

        {hovered && <HeroDetail hero={hovered} />}
      </div>

      {namingModal}
    </>
  );
}
