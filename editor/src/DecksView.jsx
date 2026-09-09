import React, { useState, useMemo } from 'react';
import DeckCreate from './DeckCreate.jsx';
import { SAMPLE_DECKS } from './sample-decks.js';
import { parseCsv } from './csv.js';
import { rowsToHeroes } from './heroes.js';
import { heroToCard } from './adapt.js';
import { slugId } from './vocab.js';
import { RUNE_LETTERS } from './runes.js';
import { useCsvSource } from './useCsvSource.js';
import sampleHeroesCsv from '../sample-heroes.csv?raw';

const DECKS_KEY = 'rw-editor-decks';

function loadDecks() {
  try {
    const s = localStorage.getItem(DECKS_KEY);
    if (s) return JSON.parse(s);
  } catch { /* ignore */ }
  return SAMPLE_DECKS;
}
function persistDecks(d) {
  try { localStorage.setItem(DECKS_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function DecksView({ onHome }) {
  const [decks, setDecks] = useState(loadDecks);
  const [mode, setMode] = useState('collection'); // 'collection' | 'create'
  const [selectedId, setSelectedId] = useState(null);

  // heroes come from the same source as the Database Eroi view
  const heroSrc = useCsvSource('rw-editor-heroes', sampleHeroesCsv, 'sample-heroes.csv');
  const heroes = useMemo(
    () => rowsToHeroes(parseCsv(heroSrc.csvText)).heroes.map(heroToCard),
    [heroSrc.csvText],
  );

  const selected = decks.find((d) => d.id === selectedId) || null;

  const deleteDeck = (id) => {
    const next = decks.filter((d) => d.id !== id);
    setDecks(next);
    persistDecks(next);
    setSelectedId(null);
  };

  const saveDeck = ({ name, color, heroes: heroList, totals, cards = [], issues = [] }) => {
    const deck = {
      id: `${slugId(name, 'mazzo')}-${Date.now().toString(36)}`,
      name,
      color,
      heroes: heroList.map((h) => ({ id: h.id, name: h.name, color: h.color })),
      cards,
      issues,
      runeTotals: totals.runes,
      items: totals.items,
      enchants: totals.enchants,
      colors: [color],
      cardCount: cards.length,
      note: '',
      updated: today(),
    };
    const next = [deck, ...decks];
    setDecks(next);
    persistDecks(next);
    setMode('collection');
    setSelectedId(deck.id);
  };

  if (mode === 'create') {
    return (
      <DeckCreate
        heroes={heroes}
        onCancel={() => setMode('collection')}
        onSave={saveDeck}
      />
    );
  }

  return (
    <>
      <header className="editor__header">
        <div className="editor__nav">
          <button type="button" className="crumb" onClick={onHome}>← Editor</button>
          <span className="editor__section">Gestore Mazzi</span>
          <button type="button" className="btn-primary" onClick={() => { setSelectedId(null); setMode('create'); }}>
            + Crea nuovo mazzo
          </button>
        </div>
      </header>

      <div className="editor__body">
        <div className="collection">
          <p className="collection__label">Collezione — {decks.length} mazzi</p>
          <div className="collection__grid">
            {decks.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`deck-card ${d.id === selectedId ? 'deck-card--on' : ''}`}
                onClick={() => setSelectedId(d.id === selectedId ? null : d.id)}
              >
                <span className="deck-card__name">{d.name}</span>
                <span className="deck-card__heroes">
                  {d.heroes.map((h) => (
                    <span key={h.id} className={`hero-chip portrait-bg-${h.color}`} title={h.name}>
                      {h.name[0]}
                    </span>
                  ))}
                </span>
                {d.issues && d.issues.length > 0 && (
                  <span className="deck-card__warn" title={d.issues.join('\n')}>
                    ⚠ {d.issues.length} problema/i
                  </span>
                )}
                <span className="deck-card__meta">{d.cardCount} carte · agg. {d.updated}</span>
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <DeckDetail
            deck={selected}
            onClose={() => setSelectedId(null)}
            onDelete={() => deleteDeck(selected.id)}
          />
        )}
      </div>
    </>
  );
}

function DeckDetail({ deck, onClose, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const totalRunes = deck.runeTotals && Object.keys(deck.runeTotals).length > 0;
  return (
    <aside className="detail">
      <button type="button" className="detail__close" onClick={onClose} aria-label="Chiudi">×</button>
      <h2>{deck.name}</h2>
      <div className="detail__meta">
        {deck.color ? <>colore {deck.color} · </> : null}
        {deck.cardCount} carte · aggiornato {deck.updated}
      </div>

      <h3>Eroi ({deck.heroes.length})</h3>
      <ul className="deck-heroes">
        {deck.heroes.map((h) => (
          <li key={h.id}>
            <span className={`hero-chip portrait-bg-${h.color}`}>{h.name[0]}</span>
            <span className="deck-heroes__name">{h.name}</span>
            <span className="deck-heroes__color">{h.color}</span>
          </li>
        ))}
      </ul>

      {totalRunes && (
        <>
          <h3>Rune totali eroi</h3>
          <div className="detail__pips">
            {RUNE_LETTERS.filter((l) => deck.runeTotals[l]).map((l) => (
              <span key={l} className="pool-chip">
                <span className={`rune-pip rune-pip--${l}`} title={l}>{l}</span>×{deck.runeTotals[l]}
              </span>
            ))}
          </div>
          <p className="deck-note">Oggetti {deck.items ?? 0} · Incantesimi {deck.enchants ?? 0}</p>
        </>
      )}

      {deck.colors && !totalRunes && (
        <>
          <h3>Colori</h3>
          <div className="detail__pips">
            {deck.colors.map((c) => (
              <span key={c} className={`rune-pip rune-pip--${c}`} title={c}>{c}</span>
            ))}
          </div>
        </>
      )}

      {deck.issues && deck.issues.length > 0 && (
        <>
          <h3>Problemi ({deck.issues.length})</h3>
          <ul className="deck-issues">
            {deck.issues.map((msg, i) => <li key={i}>{msg}</li>)}
          </ul>
        </>
      )}

      {deck.note && (
        <>
          <h3>Note</h3>
          <p className="deck-note">{deck.note}</p>
        </>
      )}

      <div className="detail__foot">
        <button type="button" className="btn-primary" disabled title="funzione in arrivo">
          Modifica mazzo <span className="soon-tag">in arrivo</span>
        </button>
        <button
          type="button"
          className="danger"
          onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          onBlur={() => setConfirmDelete(false)}
        >
          {confirmDelete ? 'Conferma eliminazione' : 'Elimina mazzo'}
        </button>
      </div>
    </aside>
  );
}
