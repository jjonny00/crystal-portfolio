import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';

function ForceFiberSync() {
  const { gl, camera, size, setSize } = useThree();

  useEffect(() => {
    const sync = () => {
      const h = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-height'));
      const w = window.innerWidth;
      gl.setSize(w, h, false);
      setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
    };
  }, [gl, camera, setSize, size]);

  return null;
}

export default function Fixed3DCanvas() {
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: 'var(--app-height)',
        background: '#9370DB',
        overflow: 'hidden',
      }}
    >
      <Canvas
        style={{
          position: 'absolute',
          inset: 0,
          width: '100vw',
          height: 'var(--app-height)',
          border: '4px solid red',
        }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <ForceFiberSync />
      </Canvas>
    </div>
  );
}
