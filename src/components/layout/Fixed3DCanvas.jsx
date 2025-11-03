import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';

export default function Fixed3DCanvas({ children }) {
  return (
    <div
      id="canvas-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        height: '-webkit-fill-available',
        backgroundColor: '#000',
        overflow: 'hidden',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      <Canvas
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
        }}
        gl={{ antialias: true }}
      >
        <ResizeHandler />
        {children}
      </Canvas>
    </div>
  );
}

function ResizeHandler() {
  const { gl, camera } = useThree();

  useEffect(() => {
    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      gl.setPixelRatio(window.devicePixelRatio);
      gl.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
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
