/**
 * Adapt structured objects into the shapes the game's components expect.
 * <ActionCard> reads: name, runeStr, colors, text, special.
 * <HeroCard>   reads: name, color, health/maxHealth, attack, defense, magicPower.
 */
import { parseRunes, runeCount, getCardColors } from './runes.js';
import { describeModule, describeHero } from './describe.js';

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

export function heroToCard(hero) {
  return {
    id: hero.id,
    name: hero.name,
    color: hero.color,
    health: hero.health,
    maxHealth: hero.maxHealth,
    attack: hero.attack,
    defense: hero.defense,
    magicPower: hero.magicPower,
    abilitySummary: describeHero(hero),
    _hero: hero,
  };
}
