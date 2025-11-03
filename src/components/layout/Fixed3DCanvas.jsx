import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';

function forceHeights(gl) {
  const hCSS = getComputedStyle(document.documentElement).getPropertyValue('--app-height');
  const h = parseFloat(hCSS);
  const w = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;

  // R3F structure: <div class="r3fWrapper"> <canvas/> </div>
  const canvas = gl.domElement;
  const wrapper = canvas.parentElement;

  // Force wrapper to fill parent
  Object.assign(wrapper.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: `${h}px`,
    border: '4px solid red',          // wrapper border
    boxSizing: 'border-box',
  });

  // Force canvas attributes and CSS to match
  canvas.width  = Math.max(1, Math.floor(w * dpr));
  canvas.height = Math.max(1, Math.floor(h * dpr));
  Object.assign(canvas.style, {
    width: `${w}px`,
    height: `${h}px`,
    display: 'block',
    border: '4px solid orange',       // canvas border
    boxSizing: 'border-box',
  });

  // Also set renderer size explicitly
  gl.setPixelRatio(dpr);
  gl.setSize(w, h, false);
}

export default function Fixed3DCanvas() {
  // keep --app-height in sync with real innerHeight
  useEffect(() => {
    const updateHeight = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);
    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
    };
  }, []);

  // Outer container = full device viewport (proved earlier)
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: 'var(--app-height)',
        background: '#6a0dad',           // purple
        border: '4px solid white',       // OUTER container border
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Probe div: should match outer exactly */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: '4px solid cyan',      // PROBE border (should be full height)
          pointerEvents: 'none',
          boxSizing: 'border-box',
        }}
      />

      <Canvas
        id="r3f"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',                 // wrapper should inherit 100%
          border: '4px solid lime',       // Canvas *wrapper* border (R3F applies style to wrapper)
          boxSizing: 'border-box',
        }}
        onCreated={({ gl }) => {
          // Force heights immediately
          forceHeights(gl);

          // Re-force on resize/orientation as iOS animates toolbars
          const reforce = () => forceHeights(gl);
          window.addEventListener('resize', reforce);
          window.addEventListener('orientationchange', reforce);

          // Cleanup
          return () => {
            window.removeEventListener('resize', reforce);
            window.removeEventListener('orientationchange', reforce);
          };
        }}
      />
    </div>
  );
}
