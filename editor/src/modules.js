/**
 * Turn parsed CSV rows into structured module objects, with validation.
 *
 *   rowsToModules({ rows }) -> { modules, errors }
 *
 * CSV shape (one row per effect, rows grouped by `name`):
 *   name, slot, cost, kind, effect, stat, amount, scaler, target,
 *   condition, timing, token, mod_target, mod_op, extra, notes
 *
 * A module:
 *   { id, name, cost:['G','G'], kind:'spell', produces:[Effect,…], _rows:[…] }
 *   { id, name, cost, kind:'modifier', needsTarget:'spell', transform:{…}, _rows:[…] }
 *
 * The effect vocabulary and per-row effect builder are shared with the hero
 * importer (see vocab.js / effect.js).
 */
import { MOD_OPS, SCALER_SOURCES, slugId } from './vocab.js';
import { buildEffect } from './effect.js';

// Re-export what the UI imports from here.
export { EFFECT_TYPES } from './vocab.js';

// ─── Modifier ops ────────────────────────────────────────────────────────────

function parseModOp(str, ctx, errors) {
  const raw = String(str || '').trim();
  if (!raw) {
    errors.push({ ...ctx, message: 'riga modifier senza mod_op' });
    return null;
  }
  const [op, ...args] = raw.split(':');
  if (!MOD_OPS.includes(op)) {
    errors.push({ ...ctx, message: `mod_op sconosciuto: "${op}"` });
    return null;
  }
  if (op === 'removeDuration') return { op };
  if (op === 'retype') {
    if (!['item', 'enchant'].includes(args[0])) {
      errors.push({ ...ctx, message: `retype atteso item|enchant, trovato "${args[0] || ''}"` });
      return null;
    }
    return { op, to: args[0] };
  }
  if (op === 'addScaler') {
    if (!args[0] || !SCALER_SOURCES.includes(args[1])) {
      errors.push({ ...ctx, message: 'atteso addScaler:campo:sorgente' });
      return null;
    }
    return { op, field: args[0], scaler: { source: args[1] } };
  }
  // addFlat / setValue
  const n = Number(args[1]);
  if (!args[0] || !Number.isFinite(n)) {
    errors.push({ ...ctx, message: `atteso ${op}:campo:numero` });
    return null;
  }
  return { op, field: args[0], value: n };
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function rowsToModules({ rows }) {
  const errors = [];
  const groups = new Map();

  rows.forEach((row, index) => {
    const name = (row.name || '').trim();
    if (!name) {
      errors.push({ line: row._line, name: '', message: 'riga senza "name"' });
      return;
    }
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push({ ...row, _index: index });
  });

  const modules = [];
  const seenIds = new Map();

  for (const [name, grp] of groups) {
    grp.sort((a, b) => {
      const sa = a.slot ? Number(a.slot) : Infinity;
      const sb = b.slot ? Number(b.slot) : Infinity;
      if (sa !== sb) return sa - sb;
      return a._index - b._index;
    });

    const head = grp[0];
    const ctx = { line: head._line, name };

    const id = slugId(name, 'module');
    if (seenIds.has(id) && seenIds.get(id) !== name) {
      errors.push({ ...ctx, message: `id "${id}" già usato da "${seenIds.get(id)}" — rinomina uno dei due` });
    }
    seenIds.set(id, name);

    const kind = (head.kind || 'spell').trim() || 'spell';
    if (!['spell', 'modifier'].includes(kind)) {
      errors.push({ ...ctx, message: `kind sconosciuto: "${kind}" (atteso spell | modifier)` });
    }

    const costLetters = String(head.cost || '').toUpperCase().replace(/[^WUBRGPC]/g, '');
    const cost = costLetters.split('');
    const isUnplayable = kind === 'spell' && grp.length === 1 && grp[0].effect === 'unplayable';
    if (cost.length === 0 && !isUnplayable) {
      errors.push({ ...ctx, message: 'colonna "cost" mancante o senza rune valide (WUBRGPC)' });
    }
    if (head.cost && costLetters.length !== String(head.cost).replace(/\s/g, '').length) {
      errors.push({ ...ctx, message: `cost contiene caratteri non-runa: "${head.cost}"` });
    }

    if (kind === 'modifier') {
      if (grp.length > 1) {
        errors.push({ ...ctx, message: 'un modulo modifier deve avere una sola riga' });
      }
      const transform = parseModOp(head.mod_op, ctx, errors);
      modules.push({
        id, name, cost, kind: 'modifier',
        needsTarget: (head.mod_target || 'spell').trim() || 'spell',
        transform,
        _rows: grp,
      });
      continue;
    }

    const produces = [];
    for (const r of grp) {
      const eff = buildEffect(r, name, errors);
      if (eff) produces.push(eff);
    }
    modules.push({ id, name, cost, kind: 'spell', produces, _rows: grp });
  }

  modules.sort((a, b) => a.name.localeCompare(b.name));
  return { modules, errors };
}
