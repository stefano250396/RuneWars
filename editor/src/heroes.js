/**
 * Turn parsed CSV rows into structured hero objects, with validation.
 *
 *   rowsToHeroes({ rows }) -> { heroes, errors }
 *
 * CSV shape (one row per ability-effect, rows grouped by `name`):
 *   name, color, magicPower, attack, defense, health, items, enchants,
 *   🟡, 🔵, ⚫, 🔴, 🟢, ⚪, 🟣,
 *   ability, ability name, ability cost,
 *   slot, effect, stat, amount, scaler, target, condition, timing, duration,
 *   token, mod_target, mod_op, extra, notes
 *
 * Hero stats + the 7 rune-pool columns are read from the hero's FIRST row.
 * Abilities are grouped by `ability` (1/2/3…), effects ordered by `slot`.
 * `ability cost` present -> active; absent -> passive.
 */
import { RUNE_EMOJI, RUNE_LETTERS, slugId } from './vocab.js';
import { buildEffect } from './effect.js';

export function rowsToHeroes({ rows }) {
  const errors = [];
  const byHero = new Map();

  // A row with an empty `name` is a continuation of the previous hero
  // (hero stats live only on the hero's first row).
  let currentName = null;
  rows.forEach((row, index) => {
    const name = (row.name || '').trim();
    if (name) currentName = name;
    const target = name || currentName;
    if (!target) {
      errors.push({ line: row._line, name: '', message: 'riga senza "name" e nessun eroe precedente' });
      return;
    }
    if (!byHero.has(target)) byHero.set(target, []);
    byHero.get(target).push({ ...row, _index: index });
  });

  const heroes = [];
  const seenIds = new Map();

  for (const [name, grp] of byHero) {
    grp.sort((a, b) => a._index - b._index);
    const head = grp[0];
    const ctx = { line: head._line, name };

    const id = slugId(name, 'hero');
    if (seenIds.has(id) && seenIds.get(id) !== name) {
      errors.push({ ...ctx, message: `id "${id}" già usato da "${seenIds.get(id)}" — rinomina uno dei due` });
    }
    seenIds.set(id, name);

    const num = (v, field, def = 0) => {
      if (v === '' || v == null) return def;
      const n = Number(v);
      if (!Number.isFinite(n)) { errors.push({ ...ctx, message: `${field} non numerico: "${v}"` }); return def; }
      return n;
    };

    // colour
    let color = (head.color || '').trim().toUpperCase();
    if (!color) errors.push({ ...ctx, message: 'colonna "color" mancante' });
    else if (!RUNE_LETTERS.includes(color)) {
      errors.push({ ...ctx, message: `color sconosciuto: "${color}" (atteso W U B R G C P)` });
      color = 'C';
    }

    // rune pool from the emoji columns (letters accepted too)
    const runePool = {};
    for (const [emoji, letter] of Object.entries(RUNE_EMOJI)) {
      const raw = head[emoji] ?? head[letter] ?? '';
      const n = num(raw, `pool ${letter}`, 0);
      if (n > 0) runePool[letter] = n;
    }

    const hero = {
      id,
      name,
      color: color || 'C',
      magicPower: num(head.magicPower, 'magicPower'),
      attack: num(head.attack, 'attack'),
      defense: num(head.defense, 'defense'),
      health: num(head.health, 'health', 1),
      items: num(head.items, 'items'),
      enchants: num(head.enchants, 'enchants'),
      runePool,
      abilities: [],
      _rows: grp,
    };
    hero.maxHealth = hero.health;

    // group rows by ability
    const abilityGroups = new Map();
    for (const r of grp) {
      const a = (r.ability || '').trim();
      if (!a) continue; // stat-only row
      if (!abilityGroups.has(a)) abilityGroups.set(a, []);
      abilityGroups.get(a).push(r);
    }

    for (const [abilNum, arows] of abilityGroups) {
      arows.sort((a, b) => {
        const sa = a.slot ? Number(a.slot) : Infinity;
        const sb = b.slot ? Number(b.slot) : Infinity;
        if (sa !== sb) return sa - sb;
        return a._index - b._index;
      });
      const ahead = arows[0];
      const aname = (ahead['ability name'] || '').trim();
      const actx = { line: ahead._line, name: `${name} · abilità ${abilNum}` };
      if (!aname) errors.push({ ...actx, message: 'abilità senza "ability name"' });

      const rawCost = String(ahead['ability cost'] || '');
      const costLetters = rawCost.toUpperCase().replace(/[^WUBRGPC]/g, '');
      const cost = costLetters.split('');
      if (rawCost && costLetters.length !== rawCost.replace(/\s/g, '').length) {
        errors.push({ ...actx, message: `ability cost con caratteri non-runa: "${rawCost}"` });
      }

      const effects = [];
      for (const r of arows) {
        if (!(r.effect || '').trim()) continue;
        const eff = buildEffect(r, actx.name, errors);
        if (eff) effects.push(eff);
      }

      if (effects.length === 0) {
        errors.push({ ...actx, message: 'abilità senza effetti' });
      }

      hero.abilities.push({
        num: abilNum,
        name: aname || `Abilità ${abilNum}`,
        kind: cost.length > 0 ? 'active' : 'passive',
        cost,
        effects,
        _rows: arows,
      });
    }

    hero.abilities.sort((a, b) => (Number(a.num) || 99) - (Number(b.num) || 99));
    heroes.push(hero);
  }

  heroes.sort((a, b) => a.name.localeCompare(b.name));
  return { heroes, errors };
}
