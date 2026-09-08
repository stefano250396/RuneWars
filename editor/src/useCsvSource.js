import { useState, useMemo, useEffect } from 'react';

/**
 * CSV text state for one importer view: localStorage persistence, file load,
 * paste, restore-sample, clear + one-step undo.
 *
 *   null in localStorage -> load the bundled sample
 *   ""   in localStorage -> the user cleared on purpose, stay empty
 */
export function useCsvSource(storageKey, sample, sampleName) {
  const kCsv = `${storageKey}:csv`;
  const kSrc = `${storageKey}:src`;

  const init = useMemo(() => {
    try {
      const saved = localStorage.getItem(kCsv);
      if (saved !== null) {
        return { text: saved, src: localStorage.getItem(kSrc) || (saved ? 'CSV salvato' : 'vuoto') };
      }
    } catch { /* ignore */ }
    return { text: sample, src: sampleName };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [csvText, setCsvText] = useState(init.text);
  const [source, setSource] = useState(init.src);
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(kCsv, csvText);
      localStorage.setItem(kSrc, source);
    } catch { /* ignore */ }
  }, [csvText, source, kCsv, kSrc]);

  return {
    csvText,
    source,
    setPasted: (t) => { setCsvText(t); setSource('incollato'); },
    loadFile: (file) => {
      const r = new FileReader();
      r.onload = () => { setCsvText(String(r.result)); setSource(file.name); };
      r.readAsText(file);
    },
    restoreSample: () => { setCsvText(sample); setSource(sampleName); },
    clear: () => { setSnapshot(csvText); setCsvText(''); setSource('vuoto'); },
    undoClear: () => { setCsvText(snapshot ?? ''); setSource('ripristinato'); setSnapshot(null); },
    canClear: csvText.trim() !== '',
    canUndo: snapshot !== null && csvText.trim() === '',
  };
}
