import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/global.css';
import App from './App.jsx';
import { installLegacyVhPolyfill } from './utils/viewportHeight.js';

const needsLegacyVh = installLegacyVhPolyfill();
if (needsLegacyVh) {
  document.documentElement.classList.add('legacy-vh');
}

const rootEl = document.getElementById('root');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);