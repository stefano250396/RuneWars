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
 */

// ─── Vocabulary ──────────────────────────────────────────────────────────────

export const EFFECT_TYPES = [
  'buff', 'debuff', 'heal', 'damage', 'healthLoss', 'token', 'celerity',
  'negate', 'negateStats', 'polarity', 'draw', 'swapAttackDefense',
  'damageReduction', 'stealStat', 'playExtraCard', 'extraAttack',
  'deckShuffle', 'mill', 'destroyPermanent', 'moveEnchantment', 'unplayable',
];

export const STATS = ['attack', 'defense', 'magicPower'];
export const SCALER_STATS = ['attack', 'defense', 'magicPower'];

export const TARGETS = [
  'any', 'anyOther', 'ownActive', 'enemyActive', 'allHeroes',
  'twoOwnHeroes', 'enemyInactive', 'activeBattlefield', 'none',
];

export const TIMINGS = ['resolve', 'selection', 'enchantUpkeep'];

const SIMPLE_CONDITIONS = [
  'goingFirst', 'goingSecond', 'activeHeroHalfOrLess',
  'activeHeroAboveHalf', 'enemyActiveHalfOrLess',
];
const PARAM_CONDITION = /^(deckAtMost|deckAtLeast):\d+$/;

const NUMERIC_TYPES = ['buff', 'debuff', 'heal', 'damage', 'healthLoss', 'draw', 'damageReduction'];
const STAT_TYPES = ['buff', 'debuff'];

const MOD_OPS = ['addFlat', 'addScaler', 'setValue', 'removeDuration', 'retype'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function slugId(name) {
  const parts = String(name).toLowerCase().match(/[a-z0-9]+/g) || [];
  if (parts.length === 0) return 'module';
  return parts[0] + parts.slice(1).map((p) => p[0].toUpperCase() + p.slice(1)).join('');
}

function parseToken(str) {
  const m = String(str || '').trim().match(/^(.+?)\s+(\d+)\s*\/\s*(\d+)$/);
  if (!m) return null;
  return { name: m[1].trim(), attack: Number(m[2]), defense: Number(m[3]) };
}

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
    if (!args[0] || !SCALER_STATS.includes(args[1])) {
      errors.push({ ...ctx, message: 'atteso addScaler:campo:stat (stat = attack|defense|magicPower)' });
      return null;
    }
    return { op, field: args[0], scaler: { stat: args[1], of: 'caster' } };
  }
  // addFlat / setValue
  const n = Number(args[1]);
  if (!args[0] || !Number.isFinite(n)) {
    errors.push({ ...ctx, message: `atteso ${op}:campo:numero` });
    return null;
  }
  return { op, field: args[0], value: n };
}

function buildEffect(row, name, errors) {
  const ctx = { line: row._line, name };
  const type = (row.effect || '').trim();

  if (!type) { errors.push({ ...ctx, message: 'colonna "effect" vuota' }); return null; }
  if (!EFFECT_TYPES.includes(type)) {
    errors.push({ ...ctx, message: `effect sconosciuto: "${type}"` });
    return null;
  }

  const eff = { type };

  // stat
  if (row.stat) {
    if (!STATS.includes(row.stat)) errors.push({ ...ctx, message: `stat sconosciuta: "${row.stat}"` });
    else eff.stat = row.stat;
  }
  if (STAT_TYPES.includes(type) && !row.stat) {
    errors.push({ ...ctx, message: `stat obbligatoria per effect "${type}"` });
  }

  // amount
  const hasAmount = row.amount !== '' && row.amount != null;
  if (hasAmount) {
    const n = Number(row.amount);
    if (!Number.isFinite(n)) errors.push({ ...ctx, message: `amount non numerico: "${row.amount}"` });
    else eff.amount = n;
  }

  // scaler
  if (row.scaler) {
    if (!SCALER_STATS.includes(row.scaler)) {
      errors.push({ ...ctx, message: `scaler sconosciuto: "${row.scaler}"` });
    } else {
      eff.scalers = [{ stat: row.scaler, of: 'caster' }];
    }
  }

  if (NUMERIC_TYPES.includes(type) && !hasAmount && !row.scaler) {
    errors.push({ ...ctx, message: `effect "${type}" richiede "amount" oppure "scaler"` });
  }

  // target
  if (row.target) {
    if (!TARGETS.includes(row.target)) errors.push({ ...ctx, message: `target sconosciuto: "${row.target}"` });
    else eff.target = row.target;
  }

  // condition
  if (row.condition) {
    if (SIMPLE_CONDITIONS.includes(row.condition) || PARAM_CONDITION.test(row.condition)) {
      eff.condition = row.condition;
    } else {
      errors.push({ ...ctx, message: `condition sconosciuta: "${row.condition}"` });
    }
  }

  // timing
  let timing = (row.timing || '').trim();
  if (type === 'celerity' && !timing) timing = 'selection'; // celerity is always selection-timed
  if (timing && timing !== 'resolve') {
    if (!TIMINGS.includes(timing)) errors.push({ ...ctx, message: `timing sconosciuto: "${timing}"` });
    else eff.timing = timing;
  }

  // token
  if (type === 'token') {
    const tok = parseToken(row.token);
    if (!tok) errors.push({ ...ctx, message: 'token malformato — atteso "Nome A/D", es. "White Legionnaire 1/1"' });
    else Object.assign(eff, tok);
  }

  // extra (JSON escape hatch)
  if (row.extra) {
    try {
      const obj = JSON.parse(row.extra);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) Object.assign(eff, obj);
      else errors.push({ ...ctx, message: 'colonna "extra" deve essere un oggetto JSON' });
    } catch {
      errors.push({ ...ctx, message: `colonna "extra": JSON non valido — ${row.extra}` });
    }
  }

  // default duration for stat effects
  if (STAT_TYPES.includes(type) && !eff.duration) eff.duration = 'turn';

  return eff;
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

    // id + collision check
    const id = slugId(name);
    if (seenIds.has(id) && seenIds.get(id) !== name) {
      errors.push({ ...ctx, message: `id "${id}" già usato da "${seenIds.get(id)}" — rinomina uno dei due` });
    }
    seenIds.set(id, name);

    // kind
    const kind = (head.kind || 'spell').trim() || 'spell';
    if (!['spell', 'modifier'].includes(kind)) {
      errors.push({ ...ctx, message: `kind sconosciuto: "${kind}" (atteso spell | modifier)` });
    }

    // cost
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

    // spell
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
