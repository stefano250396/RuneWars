import React, { useState } from 'react';
import { SAMPLE_DECKS } from './sample-decks.js';

export default function DecksView({ onHome }) {
  const decks = SAMPLE_DECKS;
  const [selectedId, setSelectedId] = useState(null);
  const selected = decks.find((d) => d.id === selectedId) || null;

  return (
    <>
      <header className="editor__header">
        <div className="editor__nav">
          <button type="button" className="crumb" onClick={onHome}>← Editor</button>
          <span className="editor__section">Gestore Mazzi</span>
          <button type="button" className="btn-primary" disabled title="funzione in arrivo">
            + Crea nuovo mazzo <span className="soon-tag">in arrivo</span>
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
                <span className="deck-card__meta">{d.cardCount} carte · agg. {d.updated}</span>
              </button>
            ))}
          </div>
        </div>

        {selected && <DeckDetail deck={selected} onClose={() => setSelectedId(null)} />}
      </div>
    </>
  );
}

function DeckDetail({ deck, onClose }) {
  return (
    <aside className="detail">
      <button type="button" className="detail__close" onClick={onClose} aria-label="Chiudi">×</button>
      <h2>{deck.name}</h2>
      <div className="detail__meta">{deck.cardCount} carte · aggiornato {deck.updated}</div>

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

      <h3>Colori</h3>
      <div className="detail__pips">
        {deck.colors.map((c) => (
          <span key={c} className={`rune-pip rune-pip--${c}`} title={c}>{c}</span>
        ))}
      </div>

      <h3>Note</h3>
      <p className="deck-note">{deck.note}</p>

      <button type="button" className="btn-primary" disabled title="funzione in arrivo" style={{ marginTop: 18 }}>
        Modifica mazzo <span className="soon-tag">in arrivo</span>
      </button>
    </aside>
  );
}
