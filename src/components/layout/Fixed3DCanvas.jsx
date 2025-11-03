import { Canvas, useThree } from '@react-three/fiber';
import { useEffect } from 'react';

function SyncCanvasSize() {
  const { gl, camera, size } = useThree();

  useEffect(() => {
    const update = () => {
      const h = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-height'));
      const w = window.innerWidth;
      const canvas = gl.domElement;
      // Force HTML attributes to match the physical viewport height
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      gl.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [gl, camera, size]);

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
        background: '#663399',
        overflow: 'hidden',
      }}
    >
      <Canvas
        style={{
          position: 'absolute',
          inset: 0,
          width: '100vw',
          height: 'var(--app-height)',
          border: '4px solid orange',
        }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <SyncCanvasSize />
      </Canvas>
    </div>
  );
}
