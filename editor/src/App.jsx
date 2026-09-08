import React, { useState } from 'react';
import Home from './Home.jsx';
import ModulesView from './ModulesView.jsx';
import HeroesView from './HeroesView.jsx';
import DecksView from './DecksView.jsx';

export default function App() {
  const [view, setView] = useState('home');
  const goHome = () => setView('home');

  return (
    <div className="editor">
      {view === 'home' && <Home onPick={setView} />}
      {view === 'modules' && <ModulesView onHome={goHome} />}
      {view === 'heroes' && <HeroesView onHome={goHome} />}
      {view === 'decks' && <DecksView onHome={goHome} />}
    </div>
  );
}
