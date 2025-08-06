import { useState, useEffect, useRef } from 'react';
import './App.css';
import './styles/scroll-snap.css';

import LoadingScreen from './components/ui/LoadingScreen.jsx';
import AdaptivePerformanceApp from './performance/AdaptivePerformanceApp.js';
import MasterAnimationCoordinator from './components/three/MasterAnimationCoordinator.jsx';
import Fixed3DCanvas from './components/layout/Fixed3DCanvas.jsx';
import ScrollablePortfolio from './components/layout/ScrollablePortfolio.jsx';
import * as config from './crystalConfig.js';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({
    progress: 0,
    currentTask: 'Initializing...',
    isIndeterminate: true
  });
  const appRef = useRef();

  useEffect(() => {
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

  const handleRendererReady = async (gl) => {
    appRef.current.setRenderer(gl);
    await appRef.current.initialize();
    setIsLoading(false);
  };

  // Basic defaults for the 3D scene
  const performanceProfile = {
    simplifiedAnimations: false,
    reducedParticles: false,
    particleCount: 16,
    maxLights: 10
  };
  const effectsEnabled = {
    bloom: true,
    chromaticAberration: true,
    noise: true,
    vignette: true
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
      <MasterAnimationCoordinator config={config}>
        <Fixed3DCanvas
          onRendererReady={handleRendererReady}
          materialVariant="default"
          effectsEnabled={effectsEnabled}
          postProcessingConfig={config.postProcessing}
          performanceProfile={performanceProfile}
          config={config}
        />
        <ScrollablePortfolio />
      </MasterAnimationCoordinator>
    </>
  );
}

export default App;
