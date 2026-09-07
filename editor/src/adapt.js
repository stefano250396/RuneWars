/**
 * Adapt a structured module into the shape the game's <ActionCard> expects.
 * The game card reads: name, runeStr, colors, text, special.
 */
import { parseRunes, runeCount, getCardColors } from './runes.js';
import { describeModule } from './describe.js';

export function moduleToCard(module) {
  const runeStr = module.cost.join('');
  const runes = parseRunes(runeStr);

  return {
    id: module.id,
    name: module.name,
    runeStr,
    runes,
    runeCount: runeCount(runes),
    colors: getCardColors(runes),
    special: module.kind === 'modifier' ? 'modifier' : null,
    text: describeModule(module),
    _module: module,
  };
}
