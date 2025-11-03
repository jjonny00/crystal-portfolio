import { useEffect, useRef } from 'react';
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

function TestCube() {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.x += dt * 0.8;
      ref.current.rotation.y += dt * 1.0;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#FF66CC" />
    </mesh>
  );
}

export default function Fixed3DCanvas() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        background: '#4B0082', // deep purple
        overflow: 'hidden',
      }}
    >
      <Canvas
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        gl={{ antialias: true }}
        camera={{ fov: 60, position: [0, 0, 3] }}
        onCreated={({ gl }) => gl.setClearColor('#4B0082', 1)}
      >
        <ResizeHandler />
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 3, 4]} intensity={1.0} />
        <TestCube />
      </Canvas>
    </div>
  );
}
