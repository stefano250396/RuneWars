import React, { useState } from 'react';
import ModulesView from './ModulesView.jsx';
import HeroesView from './HeroesView.jsx';

function readMode() {
  try { return localStorage.getItem('rw-editor-mode') || 'modules'; } catch { return 'modules'; }
}

export default function App() {
  const [mode, setMode] = useState(readMode);

  const pick = (m) => {
    setMode(m);
    try { localStorage.setItem('rw-editor-mode', m); } catch { /* ignore */ }
  };

  return (
    <div className="editor">
      <div className="editor__topbar">
        <h1 className="editor__title">
          Rune Wars — Editor
          <span>importa da CSV, sfoglia come nel gioco</span>
        </h1>
        <div className="tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'modules'}
            className={`tab ${mode === 'modules' ? 'tab--on' : ''}`}
            onClick={() => pick('modules')}
          >
            Moduli
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'heroes'}
            className={`tab ${mode === 'heroes' ? 'tab--on' : ''}`}
            onClick={() => pick('heroes')}
          >
            Eroi
          </button>
        </div>
      </div>

      {mode === 'modules' ? <ModulesView /> : <HeroesView />}
    </div>
  );
}
