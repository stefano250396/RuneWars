import React, { useState } from 'react';
import ModulePicker from './ModulePicker.jsx';
import { compileSlot } from './slotCard.js';
import { describeModule } from './describe.js';

const SLOT_COUNT = 20;

/**
 * Deck cards phase. 20 slots; each is a card composed of modules.
 * `slots` / `setSlots` are owned by the parent so a save can read them.
 */
export default function DeckBuild({ color, slots, setSlots, onBack, onSaveRequest }) {
  const [activeSlot, setActiveSlot] = useState(null);
  const [picking, setPicking] = useState(false);

  const setSlot = (idx, modules) =>
    setSlots((prev) => prev.map((s, i) => (i === idx ? { modules } : s)));

  const addModule = (mod) => {
    setSlot(activeSlot, [...slots[activeSlot].modules, mod]);
    setPicking(false);
  };
  const removeModule = (slotIdx, modIdx) =>
    setSlot(slotIdx, slots[slotIdx].modules.filter((_, mi) => mi !== modIdx));

  // ── Module picker ──
  if (picking && activeSlot != null) {
    return (
      <ModulePicker
        title={`Carta ${activeSlot + 1} · scegli un modulo`}
        onConfirm={addModule}
        onCancel={() => setPicking(false)}
      />
    );
  }

  // ── Single card editor ──
  if (activeSlot != null) {
    const mods = slots[activeSlot].modules;
    const compiled = compileSlot(mods);
    return (
      <>
        <header className="editor__header">
          <div className="editor__nav">
            <button type="button" className="crumb" onClick={() => setActiveSlot(null)}>← Carte</button>
            <span className="editor__section">Carta {activeSlot + 1}</span>
          </div>
        </header>

        <div className="editor__body">
          <div className="card-edit">
            <h3>Costo</h3>
            <div className="detail__pips">
              {compiled.costLetters.length === 0
                ? <span className="totals__empty">—</span>
                : compiled.costLetters.map((l, i) => (
                    <span key={i} className={`rune-pip rune-pip--${l}`} title={l}>{l}</span>
                  ))}
            </div>

            <h3>Moduli ({mods.length})</h3>
            {mods.length === 0 && (
              <p className="deck-note">Nessun modulo. Premi «Aggiungi modulo».</p>
            )}
            <ul className="card-edit__mods">
              {mods.map((m, mi) => (
                <li key={mi}>
                  <div className="card-edit__mod-head">
                    <span className="card-edit__mod-name">{m.name}</span>
                    <span className="card-edit__mod-cost">
                      {(m.cost || []).map((l, i) => (
                        <span key={i} className={`rune-pip rune-pip--${l}`} title={l}>{l}</span>
                      ))}
                    </span>
                    <button
                      type="button"
                      className="mod-chip__x"
                      onClick={() => removeModule(activeSlot, mi)}
                      aria-label="Rimuovi modulo"
                    >×</button>
                  </div>
                  <p className="card-edit__mod-text">{describeModule(m)}</p>
                </li>
              ))}
            </ul>

            <button type="button" className="btn-primary" onClick={() => setPicking(true)}>
              + Aggiungi modulo
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Grid of 20 slots ──
  const filled = slots.filter((s) => s.modules.length > 0).length;
  return (
    <>
      <header className="editor__header">
        <div className="editor__nav">
          <button type="button" className="crumb" onClick={onBack}>← Eroi</button>
          <span className="editor__section">
            Carte del mazzo <span className="editor__section-sub">colore {color}</span>
          </span>
          <span className="deck-create__count">{filled} / {SLOT_COUNT} carte</span>
          <button type="button" onClick={onSaveRequest}>Salva mazzo</button>
        </div>
      </header>

      <div className="editor__body">
        <div className="slot-grid">
          {slots.map((s, i) => {
            if (s.modules.length === 0) {
              return (
                <button
                  key={i}
                  type="button"
                  className="card-slot card-slot--empty"
                  onClick={() => setActiveSlot(i)}
                >
                  <span className="card-slot__idx">{i + 1}</span>
                </button>
              );
            }
            const c = compileSlot(s.modules);
            return (
              <div
                key={i}
                className="card-slot card-slot--filled"
                onClick={() => setActiveSlot(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveSlot(i)}
              >
                <div className="card-slot__runes">
                  {c.costLetters.map((l, li) => (
                    <span key={li} className={`rune-pip rune-pip--${l}`} title={l}>{l}</span>
                  ))}
                </div>
                <div className="card-slot__text">{c.text}</div>
                <div className="card-slot__mods">
                  {s.modules.map((m, mi) => (
                    <span key={mi} className="mod-chip">
                      {m.name}
                      <button
                        type="button"
                        className="mod-chip__x"
                        onClick={(e) => { e.stopPropagation(); removeModule(i, mi); }}
                        aria-label="Rimuovi modulo"
                      >×</button>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
