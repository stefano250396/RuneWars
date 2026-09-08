import React from 'react';
import { describeEffect } from '../describe.js';

const ROW_COLS = ['ability', 'ability name', 'ability cost', 'slot', 'effect', 'stat', 'amount', 'scaler', 'target', 'condition', 'timing', 'duration', 'token', 'extra'];

/** Side panel with a hero's stats, rune pool, abilities and source CSV rows. */
export default function HeroDetail({ hero, onClose }) {
  if (!hero) return null;

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

  return (
    <aside className="detail">
      {onClose && (
        <button type="button" className="detail__close" onClick={onClose} aria-label="Chiudi">×</button>
      )}
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

      {hero._rows && (
        <>
          <h3>Righe CSV di origine</h3>
          <div className="tablewrap-x">
            <table className="rows">
              <thead><tr><th>#</th>{ROW_COLS.map((c) => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>
                {hero._rows.map((r) => (
                  <tr key={r._line}><td>{r._line}</td>{ROW_COLS.map((c) => <td key={c}>{r[c] || ''}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </aside>
  );
}
