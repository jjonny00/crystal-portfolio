import { useEffect, useMemo, useRef } from 'react';

export const SAFARI_LAYOUT_MODES = [
  { id: 'full', label: 'Full CSS' },
  { id: 'canvas-only', label: 'Canvas only' },
  { id: 'position-fixed', label: 'Position fixed' },
  { id: 'overflow', label: 'Overflow' },
  { id: 'scroll-snap', label: 'Scroll snap' },
  { id: 'viewport-units', label: 'Viewport units' }
];

const EXPERIMENT_STYLE_ID = 'safari-layout-experiment-style';
const TARGET_STYLE_HINTS = [
  'src/index.css',
  'src/styles/scroll-snap.css',
  'src/styles/glow-70s.css'
];

const STYLE_SELECTOR = 'style[data-vite-dev-id], link[rel="stylesheet"]';

const buildExperimentCss = (mode, { disableContainerSnap }) => {
  if (!mode || mode === 'full') return '';

  const lines = [
    ':root { color-scheme: dark; }',
    'html, body { margin: 0; padding: 0; background: #050505; color: #e0e0e0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; min-height: 100%; }',
    '#root { min-height: 100vh; }',
    'canvas { width: 100vw; height: 100vh; display: block; }',
    '.scroll-container { background: transparent; pointer-events: none; margin: 0 auto; max-width: 100vw; }',
    '.scroll-section { padding: 24px; margin: 0 auto; width: min(1200px, 100%); border-bottom: 1px dashed rgba(255,255,255,0.08); }',
    '.scroll-section:last-of-type { border-bottom: none; }'
  ];

  if (mode === 'canvas-only') {
    lines.push('.scroll-container { position: static; }');
    lines.push('.scroll-section { min-height: auto; }');
    lines.push('.scroll-section { scroll-snap-align: none !important; scroll-snap-stop: normal !important; }');
    lines.push('html, body { overflow: auto; }');
    return lines.join('\n');
  }

  const appliesPosition = ['position-fixed', 'overflow', 'scroll-snap', 'viewport-units'].includes(mode);
  const appliesOverflow = ['overflow', 'scroll-snap', 'viewport-units'].includes(mode);
  const appliesSnap = ['scroll-snap', 'viewport-units'].includes(mode);
  const appliesViewport = mode === 'viewport-units';

  if (appliesPosition) {
    lines.push('.scroll-container { position: absolute; top: 0; left: 0; right: 0; }');
  }

  if (appliesOverflow) {
    lines.push('.scroll-container { height: 100vh; min-height: 100vh; overflow-y: auto; overflow-x: hidden; }');
    lines.push('html, body { overflow: hidden; }');
  } else {
    lines.push('.scroll-container { overflow: visible; }');
    lines.push('html, body { overflow: auto; }');
  }

  if (appliesSnap) {
    if (disableContainerSnap) {
      lines.push('.scroll-container { scroll-snap-type: none !important; scroll-behavior: auto !important; }');
      lines.push('.scroll-section { scroll-snap-align: none !important; scroll-snap-stop: normal !important; }');
    } else {
      lines.push('.scroll-container { scroll-snap-type: y mandatory; scroll-behavior: smooth; }');
      lines.push('.scroll-section { scroll-snap-align: start; scroll-snap-stop: always; }');
    }
  } else {
    lines.push('.scroll-section { scroll-snap-align: none !important; scroll-snap-stop: normal !important; }');
  }

  if (appliesViewport) {
    lines.push('.scroll-section { min-height: 100vh; display: flex; align-items: center; justify-content: center; }');
  } else {
    lines.push('.scroll-section { min-height: auto; }');
  }

  return lines.join('\n');
};

const captureRelevantStyles = () => {
  const nodes = Array.from(document.querySelectorAll(STYLE_SELECTOR));
  if (!nodes.length) return [];

  return nodes
    .filter((node) => {
      if (node.dataset?.safariExperiment === 'ignore') return false;
      const hint = node.dataset?.viteDevId || node.getAttribute?.('href') || '';
      return TARGET_STYLE_HINTS.some((target) => hint.includes(target));
    })
    .map((node) => ({ node, originalDisabled: !!node.disabled }));
};

export const useSafariLayoutExperiment = ({
  mode = 'full',
  disableAncestorSnap = false,
  disableContainerSnap = false
}) => {
  const capturedRef = useRef(null);
  const lastModeRef = useRef('full');

  const ensureCaptured = useMemo(() => {
    if (typeof window === 'undefined') return () => [];
    return () => {
      if (!capturedRef.current || capturedRef.current.length === 0) {
        capturedRef.current = captureRelevantStyles();
      }
      return capturedRef.current || [];
    };
  }, []);

  useEffect(() => {
    const captured = ensureCaptured();
    if (!captured.length) return;

    if (mode === 'full') {
      captured.forEach(({ node, originalDisabled }) => {
        node.disabled = originalDisabled;
      });
    } else {
      captured.forEach(({ node }) => {
        node.disabled = true;
      });
    }
  }, [ensureCaptured, mode]);

  useEffect(() => {
    const styleId = EXPERIMENT_STYLE_ID;
    const css = buildExperimentCss(mode, { disableContainerSnap });

    let styleEl = document.getElementById(styleId);

    if (!css) {
      if (styleEl) {
        styleEl.remove();
      }
      return;
    }

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = css;

    return () => {
      if (mode === 'full') {
        const cleanupEl = document.getElementById(styleId);
        if (cleanupEl) cleanupEl.remove();
      }
    };
  }, [mode, disableContainerSnap]);

  useEffect(() => {
    document.documentElement.dataset.safariLayoutMode = mode;
    lastModeRef.current = mode;
    return () => {
      if (lastModeRef.current === mode && mode !== 'full') {
        delete document.documentElement.dataset.safariLayoutMode;
      }
    };
  }, [mode]);

  useEffect(() => {
    const targets = [document.documentElement, document.body, document.getElementById('root')];

    targets.forEach((el) => {
      if (!el) return;
      if (disableAncestorSnap) {
        el.style.setProperty('scroll-snap-type', 'none', 'important');
      } else {
        el.style.removeProperty('scroll-snap-type');
      }
    });

    return () => {
      targets.forEach((el) => {
        if (!el) return;
        el.style.removeProperty('scroll-snap-type');
      });
    };
  }, [disableAncestorSnap]);

  useEffect(() => () => {
    const captured = capturedRef.current;
    if (captured && captured.length) {
      captured.forEach(({ node, originalDisabled }) => {
        node.disabled = originalDisabled;
      });
    }
    const styleEl = document.getElementById(EXPERIMENT_STYLE_ID);
    if (styleEl) styleEl.remove();
    delete document.documentElement.dataset.safariLayoutMode;
    [document.documentElement, document.body, document.getElementById('root')]
      .forEach((el) => el?.style.removeProperty('scroll-snap-type'));
  }, []);
};

export default useSafariLayoutExperiment;
