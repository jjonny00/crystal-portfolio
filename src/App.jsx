import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import LoadingScreen from './components/ui/LoadingScreen.jsx';
import AdaptivePerformanceApp from './performance/AdaptivePerformanceApp.js';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({
    progress: 0,
    currentTask: 'Initializing...',
    isIndeterminate: true
  });

  useEffect(() => {
    const app = new AdaptivePerformanceApp({
      onProgressUpdate: (update) => {
        setLoadingProgress({
          progress: update.progress,
          currentTask: update.currentTask,
          isIndeterminate: update.isIndeterminate
        });
      }
    });

    app.initialize().then(() => setIsLoading(false));
  }, []);

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
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.5s ease'
        }}
      >
        {/* Your Three.js scene */}
      </Canvas>
    </>
  );
}

export default App;
