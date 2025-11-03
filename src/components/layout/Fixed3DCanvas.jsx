import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

function ResizeHandler() {
  const { gl, camera } = useThree();
  useEffect(() => {
    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
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

function TestCube() {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.x += dt * 0.6;
      ref.current.rotation.y += dt * 0.8;
    }
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  );
}

export default function Fixed3DCanvas() {
  return (
    <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}>
      <Canvas
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        gl={{ antialias: true }}
        camera={{ fov: 60, position: [0, 0, 3] }}
        onCreated={({ gl }) => gl.setClearColor('#000000', 1)}
      >
        <ResizeHandler />
        <TestCube />
      </Canvas>
    </div>
  );
}
