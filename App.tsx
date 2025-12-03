import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Config from './pages/Config';
import PunchPage from './pages/Punch';
import NotesPage from './pages/Notes';
import Reports from './pages/Reports';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/config" element={<Config />} />
        <Route path="/punch/:type" element={<PunchPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
