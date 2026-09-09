/**
 * A deck card is a list of modules. Its cost is the sum of the module costs,
 * its effects are the module effects one after another.
 */
import { describeModule } from './describe.js';
import { getCardColors } from './runes.js';

/**
 * Border colour of a composed card.
 *  - single dominant rune  -> that colour
 *  - tie: at least grey     -> grey
 *  - tie: at least the deck's colour -> the deck's colour
 *  - tie otherwise          -> colors[0]
 */
export function slotColor(runes, deckColor) {
  const colors = getCardColors(runes);
  if (colors.length === 0) return null;
  if (colors.length === 1) return colors[0];
  if (colors.includes('C')) return 'C';
  if (deckColor && colors.includes(deckColor)) return deckColor;
  return colors[0];
}

export function compileSlot(modules, deckColor) {
  const costLetters = modules.flatMap((m) => m.cost || []);
  const runes = {};
  for (const l of costLetters) runes[l] = (runes[l] || 0) + 1;

  return {
    modules,
    costLetters,
    runes,
    runeStr: costLetters.join(''),
    runeCount: costLetters.length,
    color: slotColor(runes, deckColor),
    text: modules.map((m) => describeModule(m)).filter(Boolean).join(' '),
    effects: modules.flatMap((m) => m.produces || []),
    name: modules.map((m) => m.name).join(' + '),
  };
}

/** Total runes consumed by every module in every slot. */
export function usedRunes(slots) {
  const r = {};
  for (const s of slots) {
    for (const m of s.modules) {
      for (const l of m.cost || []) r[l] = (r[l] || 0) + 1;
    }
  }
  return r;
}

/**
 * Deck-build problems. The deck is still saved; these become a warning
 * message in the collection.
 *   pool  — total hero rune pool { G: 6, ... }
 *   slots — the 20 card slots
 */
export function deckIssues(pool, slots) {
  const issues = [];
  const empty = slots.filter((s) => s.modules.length === 0).length;
  if (empty > 0) issues.push(`${empty} carta/e senza moduli`);

  const used = usedRunes(slots);
  const colors = new Set([...Object.keys(pool || {}), ...Object.keys(used)]);
  for (const c of [...colors].sort()) {
    const p = (pool || {})[c] || 0;
    const u = used[c] || 0;
    if (u > p) issues.push(`rune ${c}: usate ${u}, disponibili ${p} — ${u - p} in eccesso`);
    else if (u < p) issues.push(`rune ${c}: ${p - u} non usate (${u}/${p})`);
  }
  return issues;
}

/**
 * Shape stored for a card inside a saved deck. Keeps enough of each module
 * (kind / produces / transform) to re-open the card for editing without
 * depending on the module CSV being unchanged.
 */
export function slotForSave(modules) {
  const c = compileSlot(modules);
  return {
    modules: modules.map((m) => ({
      id: m.id,
      name: m.name,
      cost: m.cost,
      kind: m.kind,
      produces: m.produces,
      transform: m.transform,
      needsTarget: m.needsTarget,
    })),
    runeStr: c.runeStr,
    effects: c.effects,
  };
}
