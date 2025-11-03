import { Canvas } from '@react-three/fiber';
import { useEffect, useState } from 'react';

console.log('[Fixed3DCanvas] module loaded');

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

  console.log('[Fixed3DCanvas] render called');
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#8A2BE2', // purple for visibility
        height: 'var(--app-height)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '2rem',
      }}
    >
      <p>Canvas test</p>
      <Canvas
        style={{
          position: 'absolute',
          inset: 0,
          border: '4px solid yellow',
        }}
        onCreated={() => console.log('[Fixed3DCanvas] Canvas mounted')}
      />
    </div>
  );
}
