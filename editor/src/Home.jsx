import React from 'react';

const CHOICES = [
  {
    id: 'modules',
    title: 'Database Carte',
    desc: 'Importa e sfoglia i moduli delle carte da CSV.',
  },
  {
    id: 'heroes',
    title: 'Database Eroi',
    desc: 'Importa e sfoglia le schede eroe da CSV.',
  },
  {
    id: 'decks',
    title: 'Gestore Mazzi',
    desc: 'Naviga la collezione dei mazzi e le loro informazioni.',
  },
];

export default function Home({ onPick }) {
  return (
    <div className="home">
      <header className="home__head">
        <h1>Rune Wars — Editor</h1>
        <p>Database e composizione per carte, eroi e mazzi.</p>
      </header>

      <div className="home__choices">
        {CHOICES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`home-card ${c.soon ? 'home-card--soon' : ''}`}
            disabled={c.soon}
            onClick={() => !c.soon && onPick(c.id)}
          >
            <span className="home-card__title">{c.title}</span>
            <span className="home-card__desc">{c.desc}</span>
            {c.soon && <span className="home-card__badge">in arrivo</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
