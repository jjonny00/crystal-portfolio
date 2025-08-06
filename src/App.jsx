import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import LoadingScreen from './components/ui/LoadingScreen.jsx';
import AdaptivePerformanceApp from './performance/AdaptivePerformanceApp.js';
import './App.css';

function RotatingCube() {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({
    progress: 0,
    currentTask: 'Initializing...',
    isIndeterminate: true
  });
  const appRef = useRef();

  useEffect(() => {
    // Hide the immediate loader defined in index.html once React mounts
    if (typeof window !== 'undefined' && typeof window.showReactApp === 'function') {
      window.showReactApp();
    }

    appRef.current = new AdaptivePerformanceApp({
      onProgressUpdate: (update) => {
        setLoadingProgress({
          progress: update.progress,
          currentTask: update.currentTask,
          isIndeterminate: update.isIndeterminate
        });
      }
    });
  }, []);

  const handleCreated = async ({ gl }) => {
    appRef.current.setRenderer(gl);
    await appRef.current.initialize();
    setIsLoading(false);
  };

  return (
    <>
      {isLoading && (
        <LoadingScreen
          progress={loadingProgress.progress}
          task={loadingProgress.currentTask}
          isIndeterminate={loadingProgress.isIndeterminate}
        />
      )}
      <Canvas
        onCreated={handleCreated}
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.5s ease'
        }}
      >
        <ambientLight />
        <RotatingCube />
      </Canvas>
    </>
  );
}

export default App;
