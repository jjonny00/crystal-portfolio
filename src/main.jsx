import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

const rootEl = document.getElementById('root');
const initialLoader = document.getElementById('initial-loading');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Remove the static loading element once React has mounted
if (initialLoader) {
  initialLoader.remove();
}
