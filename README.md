# RuneWars

Gioco da tavolo digitale RuneWars — prototipo interattivo in React.

---

## Requisiti prima di iniziare

Questi sono i programmi che devi installare sul tuo PC. Segui gli step nell'ordine indicato.

---

## Passo 1 — Installa Visual Studio Code

VS Code è l'editor di testo dove puoi leggere e modificare il codice.

1. Vai su [https://code.visualstudio.com](https://code.visualstudio.com)
2. Clicca **Download for Windows**
3. Apri il file scaricato (es. `VSCodeSetup-x64-x.x.x.exe`) e segui l'installazione
   - Durante l'installazione, spunta **"Add to PATH"** se ti viene chiesto
4. Al termine, apri VS Code dal menu Start

---

## Passo 2 — Installa Git

Git è lo strumento che permette di scaricare e aggiornare il codice dalla repository.

1. Vai su [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Scarica la versione **64-bit** e avvia l'installazione
3. Lascia tutte le opzioni di default e clicca **Next** fino alla fine
4. Per verificare che l'installazione sia andata a buon fine:
   - Premi `Win + R`, digita `cmd`, premi Invio
   - Nel terminale che si apre, digita:
     ```
     git --version
     ```
   - Dovresti vedere qualcosa come `git version 2.x.x`

---

## Passo 3 — Installa Node.js

Node.js è l'ambiente che permette di eseguire il progetto in locale.

1. Vai su [https://nodejs.org](https://nodejs.org)
2. Scarica la versione **LTS** (quella consigliata, a sinistra)
3. Avvia il file scaricato e segui l'installazione con le opzioni di default
4. Per verificare:
   - Apri un nuovo terminale (`Win + R` → `cmd`)
   - Digita:
     ```
     node --version
     ```
   - Dovresti vedere qualcosa come `v20.x.x`
   - Digita anche:
     ```
     npm --version
     ```
   - Dovresti vedere qualcosa come `10.x.x`

---

## Passo 4 — Scarica il progetto (clona la repository)

1. Scegli una cartella sul tuo PC dove vuoi salvare il progetto (es. `Documenti`)
2. Apri il terminale in quella cartella:
   - Naviga nella cartella con Esplora File
   - Clicca sulla barra dell'indirizzo in alto, digita `cmd` e premi Invio
3. Nel terminale, digita il seguente comando (sostituisci l'URL con quello reale della repo):
   ```
   git clone https://github.com/TUO-UTENTE/rune-wars.git
   ```
4. Entra nella cartella appena creata:
   ```
   cd rune-wars
   ```

> **Nota:** se non sai l'URL della repository, chiedilo a chi ti ha invitato al progetto.

---

## Passo 5 — Apri il progetto in VS Code

1. Apri VS Code
2. Dal menu in alto, clicca **File → Open Folder...**
3. Seleziona la cartella `rune-wars` che hai appena clonato
4. Clicca **Seleziona cartella**

Ora puoi vedere tutti i file del progetto nel pannello a sinistra.

---

## Passo 6 — Installa le dipendenze del progetto

Le dipendenze sono le librerie esterne di cui il progetto ha bisogno per funzionare.

1. In VS Code, apri il terminale integrato: **Terminale → Nuovo terminale** (oppure `Ctrl + ò`)
2. Digita il comando:
   ```
   npm install
   ```
3. Aspetta che finisca (può volerci qualche minuto la prima volta)

---

## Passo 7 — Avvia il gioco

1. Sempre nel terminale integrato di VS Code, digita:
   ```
   npm run dev
   ```
2. Aspetta qualche secondo. Dovresti vedere un output simile a:
   ```
   VITE ready in xxx ms
   ➜  Local:   http://localhost:3000/
   ```
3. Il browser si aprirà automaticamente su `http://localhost:3000`
4. Il gioco è in esecuzione!

Per fermarlo, torna nel terminale e premi `Ctrl + C`.

---

## Aggiornare il codice (pull)

Quando qualcuno del team ha fatto modifiche e vuoi scaricarle:

1. Apri il terminale in VS Code
2. Digita:
   ```
   git pull
   ```
3. Se sono state aggiunte nuove dipendenze, esegui di nuovo:
   ```
   npm install
   ```
4. Avvia di nuovo il gioco con `npm run dev`

---

## Problemi comuni

| Problema | Soluzione |
|---|---|
| `'git' non è riconosciuto come comando` | Riavvia il PC dopo aver installato Git |
| `'node' non è riconosciuto come comando` | Riavvia il PC dopo aver installato Node.js |
| `npm install` fallisce | Assicurati di essere dentro la cartella del progetto |
| La porta 3000 è già in uso | Chiudi altri programmi o browser che usano quella porta |
| Il browser non si apre automaticamente | Apri manualmente `http://localhost:3000` nel browser |
