/**
 * Human-readable Italian descriptions for structured effects.
 * describeModule(module) -> string used as the card body (`card.text`).
 * describeEffect(effect) -> one sentence for a single effect.
 */

const STAT_LABEL = { attack: 'Attacco', defense: 'Difesa', magicPower: 'Potere Magico' };

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
};

const CONDITION_LABEL = {
  goingFirst: 'vai primo',
  goingSecond: 'vai secondo',
  activeHeroHalfOrLess: 'il tuo eroe attivo è a ≤ 50% HP',
  activeHeroAboveHalf: 'il tuo eroe attivo è sopra il 50% HP',
  enemyActiveHalfOrLess: "l'eroe avversario è a ≤ 50% HP",
};

function conditionLabel(c) {
  if (!c) return '';
  if (CONDITION_LABEL[c]) return CONDITION_LABEL[c];
  const m = c.match(/^(deckAtMost|deckAtLeast):(\d+)$/);
  if (m) return m[1] === 'deckAtMost' ? `hai ≤ ${m[2]} carte nel mazzo` : `hai ≥ ${m[2]} carte nel mazzo`;
  return c;
}

function scalerSuffix(effect) {
  if (!effect.scalers || effect.scalers.length === 0) return '';
  const parts = effect.scalers.map((s) => STAT_LABEL[s.stat] || s.stat);
  return ` + ${parts.join(' + ')}`;
}

function amountExpr(effect) {
  const scaler = scalerSuffix(effect);          // e.g. " + Potere Magico"
  const hasFlat = typeof effect.amount === 'number' && effect.amount !== 0;
  if (hasFlat && scaler) return `${effect.amount}${scaler}`;
  if (hasFlat) return `${effect.amount}`;
  if (scaler) return scaler.replace(/^ \+ /, '');
  if (typeof effect.amount === 'number') return `${effect.amount}`;  // literal 0, no scaler
  return '';
}

function damageNoun(expr) {
  return expr === '1' ? 'danno' : 'danni';
}

export function describeEffect(effect) {
  const t = effect.type;
  const tgt = TARGET_LABEL[effect.target] ?? (effect.target || 'un eroe');
  let s;

  switch (t) {
    case 'buff':
      s = `+${amountExpr(effect)} ${STAT_LABEL[effect.stat] || effect.stat} a ${tgt}`;
      break;
    case 'debuff':
      s = `−${amountExpr(effect)} ${STAT_LABEL[effect.stat] || effect.stat} a ${tgt}`;
      break;
    case 'heal':
      s = `Cura ${amountExpr(effect)} HP a ${tgt}`;
      break;
    case 'damage': {
      const a = amountExpr(effect);
      s = `${a} ${damageNoun(a)} a ${tgt}`;
      break;
    }
    case 'healthLoss':
      s = `${tgt} perde ${amountExpr(effect)} HP`;
      break;
    case 'token':
      s = `Crea ${effect.name || 'un token'} ${effect.attack ?? '?'}/${effect.defense ?? '?'} su questo campo`;
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
      s = `Ruba ${amountExpr(effect) || 1} punto${effect.stat && effect.stat !== 'random' ? ' di ' + (STAT_LABEL[effect.stat] || effect.stat) : ''} da ${tgt}`;
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
    default:
      s = t;
  }

  if (effect.condition) s += ` (se ${conditionLabel(effect.condition)})`;
  if (effect.timing === 'selection') s += ' [in selezione]';
  return s;
}

export function describeModule(module) {
  if (module.kind === 'modifier') {
    return describeTransform(module.transform);
  }
  const parts = (module.produces || []).map(describeEffect);
  return parts.join('. ') + (parts.length ? '.' : '');
}

function describeTransform(tr) {
  if (!tr) return 'Modificatore (non valido)';
  switch (tr.op) {
    case 'addFlat':
      return `Aggiunge +${tr.value} al campo "${tr.field}" di un modulo di questa carta`;
    case 'addScaler':
      return `Aggiunge "+ ${STAT_LABEL[tr.scaler?.stat] || tr.scaler?.stat}" al campo "${tr.field}" di un modulo`;
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
