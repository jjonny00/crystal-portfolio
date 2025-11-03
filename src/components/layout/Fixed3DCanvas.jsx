import { useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

function ResizeHandler() {
  const { gl, camera } = useThree();
  useEffect(() => {
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      gl.setPixelRatio(window.devicePixelRatio || 1);
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

function ClearOnly() {
  useFrame(({ gl }) => {
    gl.setClearColor('#008B8B', 1); // teal
    gl.clear(true, true, true);
  });
  return null;
}

export default function Fixed3DCanvas() {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        background: '#000', overflow: 'hidden',
      }}
    >
      <Canvas
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => { gl.setClearColor('#008B8B', 1); }}
        frameloop="always"
      >
        <ResizeHandler />
        <ClearOnly />
      </Canvas>
    </div>
  );
}
