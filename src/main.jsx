// src/main.jsx - FIXED: Remove static loading element that was causing the initial "Loading..."

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

const rootEl = document.getElementById('root');

// REMOVED: Static loading element removal - let React handle all loading states
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);