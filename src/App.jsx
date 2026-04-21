import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Builder } from './pages/Builder';
import { PreviewPage } from './pages/PreviewPage';
import { LivePage } from './pages/LivePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Builder />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/:slug" element={<LivePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
