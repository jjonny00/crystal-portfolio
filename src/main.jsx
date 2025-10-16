import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '../diagnostics/phase1-tests.js';
import App from './App.jsx';
import { preloadFractureAssets } from './loader/preloadFractureAssets';

async function boot() {
  try {
    await preloadFractureAssets();
  } catch (e) {
    console.warn('Fracture assets preload failed:', e);
  }

  const rootEl = document.getElementById('root');
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

boot();
