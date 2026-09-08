# Rune Wars — Editor

Tool standalone: importa da CSV il **database dei moduli** e le **schede eroe** e li
sfoglia in stile gioco, con ricerca e filtri. Due viste, switch "Moduli" / "Eroi" in cima.

Non è collegato al gioco: è un'app Vite + React separata, con il proprio
`package.json`. La parte visiva (`ActionCard`, `HeroCard`, i CSS relativi) è una
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

## CSV eroi (`sample-heroes.csv`)

Un file, righe raggruppate per `name`. Statistiche + le 7 colonne rune-pool
(🟡=W 🔵=U ⚫=B 🔴=R 🟢=G ⚪=C 🟣=P) solo sulla **prima riga** dell'eroe; le righe
successive hanno `name` vuoto. `ability` = `1`/`2`/`3`… ripetuta su ogni riga della
sua abilità; `ability name`/`ability cost` solo sulla prima riga del gruppo.
**Con `ability cost` → attiva, senza → passiva.** `scaler` e `condition` accettano
più valori separati da spazio. Colonne effetto identiche a quelle dei moduli, più
`duration` (`turn`/`permanent`/`always`) e un `timing` esteso alle fasi
(`preGame`, `placement`, `endTurn`, `always`, …).

## Struttura

```
src/
  App.jsx          shell + switch Moduli / Eroi
  ModulesView.jsx  vista moduli (toolbar, griglia, dettaglio)
  HeroesView.jsx   vista eroi
  csv.js           parser CSV
  vocab.js         vocabolario degli enum (condiviso)
  effect.js        una riga CSV → un oggetto effetto (condiviso)
  modules.js       CSV → moduli + validazione
  heroes.js        CSV → eroi + validazione
  describe.js      testo italiano degli effetti
  adapt.js         modulo/eroe → shape per <ActionCard> / <HeroCard>
  runes.js         helper rune (copia da src/data/cards.js del gioco)
  useCsvSource.js  hook: stato CSV + localStorage + carica/svuota/annulla
  components/       ActionCard, HeroCard (copie dal gioco), CsvLoaderBar, ErrorBanner
  styles/          card.css, hero-card.css (copie dal gioco), editor.css
```
