/**
 * Build one structured effect object from a CSV row (shared by the module and
 * hero importers). Pushes `{ line, name, message }` onto `errors` for problems.
 *
 * Reads: effect, stat, amount, scaler, target, condition, timing, duration,
 *        token, extra
 */
import {
  EFFECT_TYPES, STATS, SCALER_SOURCES, TARGETS, NUMERIC_TYPES, STAT_TYPES,
  isValidCondition, TIMINGS, canonicalTiming, DURATIONS,
} from './vocab.js';

function parseToken(str) {
  const m = String(str || '').trim().match(/^(.+?)\s+(\d+)\s*\/\s*(\d+)$/);
  if (!m) return null;
  return { name: m[1].trim(), attack: Number(m[2]), defense: Number(m[3]) };
}

function splitList(str) {
  return String(str || '').split(/\s+/).map((s) => s.trim()).filter(Boolean);
}

export function buildEffect(row, name, errors) {
  const ctx = { line: row._line, name };
  const type = (row.effect || '').trim();

  if (!type) { errors.push({ ...ctx, message: 'colonna "effect" vuota' }); return null; }
  if (!EFFECT_TYPES.includes(type)) {
    errors.push({ ...ctx, message: `effect sconosciuto: "${type}"` });
    return null;
  }

  const eff = { type };

  // ── stat ──
  if (row.stat) {
    if (!STATS.includes(row.stat)) errors.push({ ...ctx, message: `stat sconosciuta: "${row.stat}"` });
    else eff.stat = row.stat;
  }
  if (STAT_TYPES.includes(type) && !row.stat) {
    errors.push({ ...ctx, message: `stat obbligatoria per effect "${type}"` });
  }

  // ── amount ──
  const hasAmount = row.amount !== '' && row.amount != null;
  if (hasAmount) {
    const n = Number(row.amount);
    if (!Number.isFinite(n)) errors.push({ ...ctx, message: `amount non numerico: "${row.amount}"` });
    else eff.amount = n;
  }

  // ── scaler (space-separated sources) ──
  if (row.scaler) {
    const sources = splitList(row.scaler);
    const bad = sources.filter((s) => !SCALER_SOURCES.includes(s));
    if (bad.length) errors.push({ ...ctx, message: `scaler sconosciuto: "${bad.join(', ')}"` });
    const ok = sources.filter((s) => SCALER_SOURCES.includes(s));
    if (ok.length) eff.scalers = ok.map((s) => ({ source: s }));
  }

  if (NUMERIC_TYPES.includes(type) && !hasAmount && !row.scaler) {
    errors.push({ ...ctx, message: `effect "${type}" richiede "amount" oppure "scaler"` });
  }

  // ── target ──
  if (row.target) {
    if (!TARGETS.includes(row.target)) errors.push({ ...ctx, message: `target sconosciuto: "${row.target}"` });
    else eff.target = row.target;
  }

  // ── condition (space-separated, AND) ──
  if (row.condition) {
    const conds = splitList(row.condition);
    const bad = conds.filter((c) => !isValidCondition(c));
    if (bad.length) errors.push({ ...ctx, message: `condition sconosciuta: "${bad.join(', ')}"` });
    const ok = conds.filter(isValidCondition);
    if (ok.length) eff.condition = ok.length === 1 ? ok[0] : ok;
  }

  // ── timing ──
  let timing = canonicalTiming((row.timing || '').trim());
  if (type === 'celerity' && !timing) timing = 'cardSelect'; // celerity is selection-timed
  if (timing && timing !== 'cardResolve') {
    if (!TIMINGS.includes(timing)) errors.push({ ...ctx, message: `timing sconosciuto: "${row.timing}"` });
    else eff.timing = timing;
  }

  // ── duration ──
  if (row.duration) {
    if (!DURATIONS.includes(row.duration)) errors.push({ ...ctx, message: `duration sconosciuta: "${row.duration}"` });
    else eff.duration = row.duration;
  }
  if (STAT_TYPES.includes(type) && !eff.duration) eff.duration = 'turn';

  // ── token ──
  if (type === 'token') {
    const tok = parseToken(row.token);
    if (!tok) errors.push({ ...ctx, message: 'token malformato — atteso "Nome A/D", es. "White Legionnaire 1/1"' });
    else Object.assign(eff, tok);
  }

  // ── extra (JSON escape hatch) ──
  if (row.extra) {
    try {
      const obj = JSON.parse(row.extra);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) Object.assign(eff, obj);
      else errors.push({ ...ctx, message: 'colonna "extra" deve essere un oggetto JSON' });
    } catch {
      errors.push({ ...ctx, message: `colonna "extra": JSON non valido — ${row.extra}` });
    }
  }

  return eff;
}
