/**
 * Human-readable Italian descriptions for structured effects.
 * describeModule(module) -> string used as the card body (`card.text`).
 * describeAbility(ability) / describeEffect(effect) for the hero view.
 */

const STAT_LABEL = { attack: 'Attacco', defense: 'Difesa', magicPower: 'Potere Magico' };

const SCALER_LABEL = {
  magicPower: 'Potere Magico',
  ownDefense: 'la Difesa',
  ownAttackBonus: 'il bonus Attacco',
  equippedItems: 'gli oggetti equipaggiati',
  ownEnchants: 'gli incantesimi che possiedi',
};

const TARGET_LABEL = {
  any: 'un eroe',
  anyOther: 'un altro eroe',
  ownActive: 'il tuo eroe attivo',
  enemyActive: "l'eroe avversario",
  allHeroes: 'tutti gli eroi',
  twoOwnHeroes: 'due tuoi eroi',
  enemyInactive: 'un eroe avversario inattivo',
  activeBattlefield: 'questo campo',
  none: '',
  self: 'sé stesso',
  allOwnHeroes: 'tutti i tuoi eroi',
  allBattlefieldsOwnSide: 'tutti i campi (tuo lato)',
  enemyOnOtherBattlefield: 'un eroe nemico su un altro campo',
};

const CONDITION_LABEL = {
  goingFirst: 'vai primo',
  goingSecond: 'vai secondo',
  activeHeroHalfOrLess: 'il tuo eroe attivo è a ≤ 50% HP',
  activeHeroAboveHalf: 'il tuo eroe attivo è sopra il 50% HP',
  enemyActiveHalfOrLess: "l'eroe avversario è a ≤ 50% HP",
  selfIsActive: 'è il tuo eroe attivo',
  selfHalfOrLess: 'è a ≤ 50% HP',
  targetEnchanted: 'il bersaglio è incantato',
};

const TIMING_LABEL = {
  preGame: 'pre-partita',
  draw: 'in pesca',
  placement: 'in piazzamento',
  cardSelect: 'in selezione carte',
  abilityCheck: 'al check abilità',
  combat: 'in combattimento',
  endTurn: 'a fine turno',
  always: 'sempre',
  onPlayItem: 'quando giochi un oggetto',
  onDamaged: 'quando subisce danno',
  enchantUpkeep: "all'upkeep dell'incantesimo",
};

function conditionLabel(c) {
  if (Array.isArray(c)) return c.map(conditionLabel).join(' e ');
  if (!c) return '';
  if (CONDITION_LABEL[c]) return CONDITION_LABEL[c];
  const m = c.match(/^(deckAtMost|deckAtLeast):(\d+)$/);
  if (m) return m[1] === 'deckAtMost' ? `hai ≤ ${m[2]} carte nel mazzo` : `hai ≥ ${m[2]} carte nel mazzo`;
  return c;
}

function scalerSuffix(effect) {
  if (!effect.scalers || effect.scalers.length === 0) return '';
  const parts = effect.scalers.map((s) => SCALER_LABEL[s.source] || s.source);
  return ` + ${parts.join(' + ')}`;
}

function hasFlatAmount(effect) {
  return typeof effect.amount === 'number' && effect.amount !== 0;
}
function isScalerOnly(effect) {
  return !hasFlatAmount(effect) && effect.scalers && effect.scalers.length > 0;
}
function scalerText(effect) {
  return scalerSuffix(effect).replace(/^ \+ /, '');
}

/** "3", "1 + Potere Magico", "0". Prefer `describeWithAmount` for prose. */
function amountExpr(effect) {
  const scaler = scalerSuffix(effect);
  if (hasFlatAmount(effect) && scaler) return `${effect.amount}${scaler}`;
  if (hasFlatAmount(effect)) return `${effect.amount}`;
  if (scaler) return scalerText(effect);
  if (typeof effect.amount === 'number') return `${effect.amount}`;
  return '';
}

/** Render "N <noun>" or "<noun> pari a <scaler>". */
function withAmount(effect, noun, nounPlural) {
  if (isScalerOnly(effect)) return `${nounPlural} pari a ${scalerText(effect)}`;
  const a = amountExpr(effect);
  return `${a} ${a === '1' ? noun : nounPlural}`;
}

export function describeEffect(effect) {
  const t = effect.type;
  const tgt = TARGET_LABEL[effect.target] ?? (effect.target || 'un eroe');
  let s;

  switch (t) {
    case 'buff': {
      const stat = STAT_LABEL[effect.stat] || effect.stat;
      s = isScalerOnly(effect)
        ? `+${stat} pari a ${scalerText(effect)} a ${tgt}`
        : `+${amountExpr(effect)} ${stat} a ${tgt}`;
      break;
    }
    case 'debuff': {
      const stat = STAT_LABEL[effect.stat] || effect.stat;
      s = isScalerOnly(effect)
        ? `−${stat} pari a ${scalerText(effect)} a ${tgt}`
        : `−${amountExpr(effect)} ${stat} a ${tgt}`;
      break;
    }
    case 'heal':
      s = isScalerOnly(effect)
        ? `Cura HP pari a ${scalerText(effect)} a ${tgt}`
        : `Cura ${amountExpr(effect)} HP a ${tgt}`;
      break;
    case 'damage':
      s = `${withAmount(effect, 'danno', 'danni')} a ${tgt}`;
      break;
    case 'healthLoss':
      s = `${tgt} perde ${isScalerOnly(effect) ? `HP pari a ${scalerText(effect)}` : `${amountExpr(effect)} HP`}`;
      break;
    case 'token':
      s = `Crea ${effect.name || 'un token'} ${effect.attack ?? '?'}/${effect.defense ?? '?'} su ${TARGET_LABEL[effect.target] || 'questo campo'}`;
      break;
    case 'celerity':
      s = 'Guadagni Celerità';
      break;
    case 'negate':
      s = 'Annulla la prossima carta avversaria con meno rune';
      break;
    case 'negateStats':
      s = `Azzera le modifiche di statistica di ${tgt || "l'eroe avversario"}`;
      break;
    case 'polarity':
      s = "Scegli l'iniziativa del prossimo turno";
      break;
    case 'draw': {
      const extra = effect.sign === 'minus' ? 'pesca 1 carta in meno' : `pesca ${amountExpr(effect)} carta/e in più`;
      s = `Un giocatore ${extra} alla prossima pesca`;
      break;
    }
    case 'swapAttackDefense':
      s = `${tgt || 'Il tuo eroe'} usa la Difesa al posto dell'Attacco in combattimento`;
      break;
    case 'damageReduction':
      s = `Riduci di ${amountExpr(effect)} il danno${effect.scope === 'nonCombat' ? ' non-combattimento' : ''} subìto da ${tgt}`;
      break;
    case 'stealStat':
      s = `Ruba ${amountExpr(effect) || 1} punto da ${tgt}`;
      break;
    case 'playExtraCard':
      s = `Gioca un'altra carta${effect.source ? ' da ' + effect.source : ''}`;
      break;
    case 'extraAttack':
      s = `Attacco fisico aggiuntivo contro ${tgt}`;
      break;
    case 'deckShuffle':
      s = `Rimescola ${amountExpr(effect) || ''} carta/e dal cimitero nel mazzo`.replace('  ', ' ');
      break;
    case 'mill':
      s = `Scarta ${amountExpr(effect) || 1} carta/e dalla cima del mazzo`;
      break;
    case 'destroyPermanent':
      s = `Distruggi un ${effect.permanent === 'enchant' ? 'incantamento' : 'oggetto'}`;
      break;
    case 'moveEnchantment':
      s = 'Sposta un incantamento da un eroe a un altro';
      break;
    case 'unplayable':
      s = 'Non può essere giocata';
      break;

    // ── hero-only ──
    case 'initiative':
      s = `Vai ${effect.which === 'second' ? 'secondo' : 'primo'}${effect.turn ? ` al turno ${effect.turn}` : ''}`;
      break;
    case 'createCard':
      s = `Crea ${effect.card || 'una carta'} ${effect.into === 'deck' ? 'nel mazzo' : 'in mano'}`;
      break;
    case 'grantColorFreedom':
      s = `Puoi giocare ${effect.scope === 'item' ? 'oggetti' : 'carte'} di qualsiasi colore`;
      break;
    case 'restrictCards':
      s = `${tgt || "L'avversario"} non può giocare più di ${effect.amount ?? '?'} carte nel turno`;
      break;
    case 'transformStackCard':
      s = 'Una carta nello stack diventa un incantamento';
      break;
    case 'itemHaste':
      s = `Il prossimo oggetto${effect.maxRunes ? ` (≤ ${effect.maxRunes} rune)` : ''} si attiva subito`;
      break;

    default:
      s = t;
  }

  if (effect.condition) s += ` (se ${conditionLabel(effect.condition)})`;
  const tl = effect.timing && TIMING_LABEL[effect.timing];
  if (tl && effect.timing !== 'cardResolve') s += ` [${tl}]`;
  if (effect.duration === 'always' && effect.timing !== 'always') s += ' [ricorrente]';
  return s;
}

export function describeModule(module) {
  if (module.kind === 'modifier') return describeTransform(module.transform);
  const parts = (module.produces || []).map(describeEffect);
  return parts.join('. ') + (parts.length ? '.' : '');
}

/** Short summary line for a hero card body: ability names. */
export function describeHero(hero) {
  return (hero.abilities || [])
    .map((a) => `${a.kind === 'passive' ? '◆' : '●'} ${a.name}`)
    .join('  ');
}

function describeTransform(tr) {
  if (!tr) return 'Modificatore (non valido)';
  switch (tr.op) {
    case 'addFlat':
      return `Aggiunge +${tr.value} al campo "${tr.field}" di un modulo di questa carta`;
    case 'addScaler':
      return `Aggiunge "+ ${SCALER_LABEL[tr.scaler?.source] || tr.scaler?.source}" al campo "${tr.field}" di un modulo`;
    case 'setValue':
      return `Forza il campo "${tr.field}" di un modulo al valore ${tr.value}`;
    case 'removeDuration':
      return 'Rimuove "fino a fine turno" da un modulo (lo rende permanente)';
    case 'retype':
      return `Trasforma la carta in ${tr.to === 'item' ? 'un oggetto' : 'un incantamento'}`;
    default:
      return `Modificatore: ${tr.op}`;
  }
}
