import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useState } from 'react';

function ForceResize() {
  const { gl, camera } = useThree();

  useEffect(() => {
    const resize = () => {
      const h = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-height'));
      const w = window.innerWidth;
      gl.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
    };
  }, [gl, camera]);

  return null;
}

export default function Fixed3DCanvas() {
  const [vh, setVh] = useState(window.innerHeight);

  useEffect(() => {
    const updateHeight = () => {
      setVh(window.innerHeight);
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: 'var(--app-height)',
        background: '#4B0082',
        overflow: 'hidden',
      }}
    >
      <Canvas
        style={{
          position: 'absolute',
          inset: 0,
          width: '100vw',
          height: 'var(--app-height)',
          border: '4px solid cyan',
        }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <ForceResize />
      </Canvas>
    </div>
  );
}
