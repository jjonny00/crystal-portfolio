import { Canvas } from '@react-three/fiber';
import { useEffect, useState, useRef } from 'react';

console.log('[Fixed3DCanvas] module loaded');

export default function Fixed3DCanvas() {
  const [vh, setVh] = useState(window.innerHeight);
  const containerRef = useRef();

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
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        height: 'var(--app-height)',
        width: '100vw',
        background: '#8A2BE2',
        overflow: 'hidden',
      }}
    >
      <Canvas
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: 'var(--app-height)',
          border: '4px solid lime',
        }}
        gl={{ preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.setClearColor('#8A2BE2');
        }}
      />
    </div>
  );
}
