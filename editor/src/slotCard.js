/**
 * A deck card is a list of modules. Its cost is the sum of the module costs,
 * its effects are the module effects one after another.
 */
import { describeModule } from './describe.js';

export function compileSlot(modules) {
  const costLetters = modules.flatMap((m) => m.cost || []);
  const runes = {};
  for (const l of costLetters) runes[l] = (runes[l] || 0) + 1;

  return {
    modules,
    costLetters,
    runes,
    runeStr: costLetters.join(''),
    runeCount: costLetters.length,
    text: modules.map((m) => describeModule(m)).filter(Boolean).join(' '),
    effects: modules.flatMap((m) => m.produces || []),
    name: modules.map((m) => m.name).join(' + '),
  };
}

/** Lighter shape for storing a card inside a saved deck. */
export function slotForSave(modules) {
  const c = compileSlot(modules);
  return {
    modules: modules.map((m) => ({ id: m.id, name: m.name, cost: m.cost })),
    runeStr: c.runeStr,
    effects: c.effects,
  };
}
