# Rune Wars — Card Editor

Tool standalone: importa il **database dei moduli** da un CSV e lo sfoglia come carte
in stile gioco, con ricerca e filtri.

Non è collegato al gioco: è un'app Vite + React separata, con il proprio
`package.json`. La parte visiva della carta (`ActionCard`, `card.css`) è una
**copia** di quella del gioco — se cambia lì, va riallineata qui a mano.

## Avvio

```bash
cd editor
npm install
npm run dev
```

Si apre su `http://localhost:3100`. Il tool parte già pieno con
`sample-modules.csv`. Usa **Carica CSV…** per aprire il tuo file, o **Incolla CSV**
per incollarlo. L'ultimo CSV caricato resta salvato nel browser tra i reload.

## Formato del CSV

Una riga per **effetto**; le righe con lo stesso `name` formano un modulo.

| colonna | note |
|---|---|
| `name` | nome del modulo, ripetuto su ogni riga del modulo |
| `slot` | ordine dell'effetto nel modulo (vuoto = ordine di file) |
| `cost` | stringa di rune `GG`, `CBP` — solo sulla prima riga |
| `kind` | `spell` (default) \| `modifier` — solo sulla prima riga |
| `effect` | tipo di effetto (`buff`, `damage`, `heal`, `token`, `celerity`, …) |
| `stat` | `attack` \| `defense` \| `magicPower` |
| `amount` | intero |
| `scaler` | `attack` \| `defense` \| `magicPower` — somma la stat del lanciatore ad `amount` |
| `target` | `any` \| `anyOther` \| `ownActive` \| `enemyActive` \| `allHeroes` \| `twoOwnHeroes` \| `enemyInactive` \| `activeBattlefield` \| `none` |
| `condition` | `goingFirst` \| `goingSecond` \| `activeHeroHalfOrLess` \| `activeHeroAboveHalf` \| `enemyActiveHalfOrLess` \| `deckAtMost:N` \| `deckAtLeast:N` |
| `timing` | vuoto/`resolve` \| `selection` \| `enchantUpkeep` (celerity → `selection` in automatico) |
| `token` | `"Nome A/D"`, es. `White Legionnaire 1/1` — solo per `effect=token` |
| `mod_target` | riga `modifier`: cosa può puntare (`spell`) |
| `mod_op` | riga `modifier`: `addFlat:campo:n` \| `addScaler:campo:stat` \| `setValue:campo:n` \| `removeDuration` \| `retype:item` \| `retype:enchant` |
| `extra` | oggetto JSON fuso nell'effetto, es. `{"kind":"magic"}` |
| `notes` | ignorata dall'importer |

Esempio — *2 danni a un eroe, 1 a un altro, Celerità se l'avversario è a metà vita*:

```csv
name,slot,cost,kind,effect,stat,amount,scaler,target,condition,timing,token,mod_target,mod_op,extra,notes
Ray of Judgement,1,BRP,spell,damage,,2,,any,,,,,,"{""kind"":""magic""}",
Ray of Judgement,2,,,damage,,1,,anyOther,,,,,,"{""kind"":""magic""}",
Ray of Judgement,3,,,celerity,,,,none,enemyActiveHalfOrLess,selection,,,,,
```

I problemi nel CSV (tipo effetto sconosciuto, campo obbligatorio mancante, ecc.)
compaiono in un banner in cima, con il numero di riga.

## Struttura

```
src/
  App.jsx          UI (toolbar, griglia, pannello dettaglio)
  csv.js           parser CSV
  modules.js       CSV → moduli + validazione (vocabolario degli enum qui)
  describe.js      testo italiano degli effetti
  adapt.js         modulo → shape per <ActionCard>
  runes.js         helper rune (copia da src/data/cards.js del gioco)
  components/ActionCard.jsx   copia da src/components/ del gioco
  styles/card.css  copia degli stili .action-card / .rune-pip del gioco
  styles/editor.css  layout del tool
```
