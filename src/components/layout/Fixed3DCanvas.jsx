import { Canvas } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';

function useAppHeightVar() {
  const [appH, setAppH] = useState(window.innerHeight);
  useEffect(() => {
    const update = () => {
      const h = window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${h}px`);
      setAppH(h);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return appH;
}

export default function Fixed3DCanvas() {
  const appH = useAppHeightVar();
  const containerRef = useRef(null);
  const probeRef = useRef(null);
  const canvasRef = useRef(null);       // will be set in onCreated
  const wrapperRef = useRef(null);      // r3f wrapper = canvas.parentElement
  const [stats, setStats] = useState({});

  // measure and (re)apply sizes
  const measure = () => {
    const container = containerRef.current;
    const probe = probeRef.current;
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    const dpr = window.devicePixelRatio || 1;

    const cs = (el) => (el ? el.getBoundingClientRect() : { width: 0, height: 0 });

    setStats({
      winW: window.innerWidth,
      winH: window.innerHeight,
      appH,
      containerH: cs(container).height,
      probeH: cs(probe).height,
      wrapperH: cs(wrapper).height,
      canvasCSSH: cs(canvas).height,
      canvasAttrW: canvas?.width ?? 0,
      canvasAttrH: canvas?.height ?? 0,
      dpr,
    });
  };

  // keep forcing wrapper/canvas CSS heights to appH
  const forceCSSHeights = () => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!container || !canvas || !wrapper) return;

    Object.assign(wrapper.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: `${appH}px`,
      boxSizing: 'border-box',
      border: '4px solid #ff0000', // RED (R3F WRAPPER)
    });

    Object.assign(canvas.style, {
      width: '100vw',
      height: `${appH}px`,
      display: 'block',
      boxSizing: 'border-box',
      border: '4px solid #ffa500', // ORANGE (CANVAS)
    });
  };

  useEffect(() => {
    forceCSSHeights();
    measure();
  }, [appH]);

  useEffect(() => {
    const onR = () => { forceCSSHeights(); measure(); };
    window.addEventListener('resize', onR);
    window.addEventListener('orientationchange', onR);
    return () => {
      window.removeEventListener('resize', onR);
      window.removeEventListener('orientationchange', onR);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: 'var(--app-height)',
        background: '#592D8D',
        border: '4px solid #ffffff', // WHITE (OUTER CONTAINER)
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        ref={probeRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: '4px solid #00ffff', // CYAN (PROBE SIBLING)
          pointerEvents: 'none',
          boxSizing: 'border-box',
        }}
      />
      <Canvas
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',              // initial; we force more in onCreated
          border: '4px solid #32cd32', // LIME (Canvas STYLE applied to wrapper by R3F)
          boxSizing: 'border-box',
        }}
        onCreated={({ gl, size, camera }) => {
          // save refs to wrapper/canvas
          const canvas = gl.domElement;
          canvasRef.current = canvas;
          wrapperRef.current = canvas.parentElement;

          // force CSS heights
          forceCSSHeights();

          // force internal buffer size to appH
          const setInternal = () => {
            const w = window.innerWidth;
            const h = appH;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.max(1, Math.floor(w * dpr));
            canvas.height = Math.max(1, Math.floor(h * dpr));
            gl.setPixelRatio(dpr);
            gl.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            measure();
          };
          setInternal();

          // update again after a tick to beat toolbar animations
          requestAnimationFrame(setInternal);

          // hook resize
          const onR = () => { forceCSSHeights(); setInternal(); };
          window.addEventListener('resize', onR);
          window.addEventListener('orientationchange', onR);
          return () => {
            window.removeEventListener('resize', onR);
            window.removeEventListener('orientationchange', onR);
          };
        }}
      />

      {/* HUD */}
      <div
        style={{
          position: 'fixed',
          left: 8,
          top: 8,
          zIndex: 99999,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 12,
          lineHeight: 1.35,
          color: '#fff',
          background: 'rgba(0,0,0,0.6)',
          padding: '8px 10px',
          borderRadius: 6,
          pointerEvents: 'none',
          whiteSpace: 'pre',
        }}
      >
        {`win:  ${stats.winW} x ${stats.winH}
appH: ${stats.appH}
containerH: ${stats.containerH}
probeH:     ${stats.probeH}
wrapperH:   ${stats.wrapperH}
canvasCSSH: ${stats.canvasCSSH}
canvasAttr: ${stats.canvasAttrW} x ${stats.canvasAttrH}
dpr: ${stats.dpr}`}
      </div>
    </div>
  );
}
