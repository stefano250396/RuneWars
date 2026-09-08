import React from 'react';

/** The "Carica CSV / Incolla / Ripristina / Svuota" row + paste textarea. */
export default function CsvLoaderBar({
  source, csvText,
  onFile, onPaste,
  pasteOpen, onTogglePaste,
  onRestore, onClear, onUndo,
  canClear, canUndo,
}) {
  return (
    <>
      <div className="loader">
        <label className="filelabel">
          Carica CSV…
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
          />
        </label>
        <button type="button" onClick={onTogglePaste}>
          {pasteOpen ? 'Nascondi incolla' : 'Incolla CSV'}
        </button>
        <button type="button" onClick={onRestore}>Ripristina esempio</button>
        <button type="button" className="danger" disabled={!canClear} onClick={onClear}>Svuota</button>
        {canUndo && <button type="button" onClick={onUndo}>Annulla svuota</button>}
        <span className="src">sorgente: {source}</span>
      </div>

      {pasteOpen && (
        <div className="paste-area">
          <textarea
            value={csvText}
            spellCheck={false}
            onChange={(e) => onPaste(e.target.value)}
          />
        </div>
      )}
    </>
  );
}
