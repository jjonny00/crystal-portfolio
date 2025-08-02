import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

import UnifiedCrystalScene from '../components/three/UnifiedCrystalScene';
import * as defaultConfig from '../crystalConfig';
import { getHDRIPath, getCanvasDPR } from '../utils/renderUtils';
import { preloadAssets } from '../utils/preloadAssets';

const PerformanceTestScene = forwardRef(({
  config = defaultConfig,
  renderScale = 1,
  useNormalMaps = true,
  pbrQuality = 'high',
  usePBR = true,
  textureQuality = 'high',
  postProcessing = { bloom: true, chromaticAberration: true, noise: true, vignette: true },
  hdriQuality,
  maxLights = 5,
  antialiasing = true,
  anisotropicFiltering = 4,
  simplifiedAnimations = false,
  reducedParticles = false,
  particleCount = 16
}, ref) => {
  const [active, setActive] = useState(false);
  const fpsSamples = useRef([]);
  const startRef = useRef(0);
  const lastRef = useRef(0);
  const nextSampleRef = useRef(0);
  const rafRef = useRef(null);
  const durationRef = useRef(0);
  const resolveRef = useRef(null);
  const assetPromiseRef = useRef(Promise.resolve());

  useEffect(() => {
    assetPromiseRef.current = preloadAssets(hdriQuality);
  }, [hdriQuality]);

  const animationData = {
    state: 'hero',
    crystalForm: 'whole',
    cameraState: 'hero',
    crystalConfig: { shouldRotate: true, rotationSpeed: 0.0003 }
  };

  const loop = (time) => {
    if (!startRef.current) {
      startRef.current = time;
      lastRef.current = time;
      nextSampleRef.current = time + 100;
    }

    const delta = time - lastRef.current;
    lastRef.current = time;

    if (time >= nextSampleRef.current) {
      fpsSamples.current.push(1000 / delta);
      nextSampleRef.current += 100;
    }

    if (time - startRef.current >= durationRef.current) {
      cancelAnimationFrame(rafRef.current);
      setActive(false);
      const samples = fpsSamples.current;
      const avg = samples.reduce((a, b) => a + b, 0) / (samples.length || 1);
      const min = samples.length ? Math.min(...samples) : 0;
      const max = samples.length ? Math.max(...samples) : 0;
      startRef.current = 0;
      if (resolveRef.current) {
        resolveRef.current({ samples, avg, min, max });
      }
      return;
    }

    rafRef.current = requestAnimationFrame(loop);
  };

  useImperativeHandle(ref, () => ({
    runTest: (durationMs = 4000) => {
      fpsSamples.current = [];
      durationRef.current = durationMs;
      startRef.current = 0;
      setActive(true);
      return new Promise((resolve) => {
        resolveRef.current = (result) => {
          assetPromiseRef.current.then(() => resolve(result));
        };
        rafRef.current = requestAnimationFrame(loop);
      });
    }
  }), []);

  const perfCfg = {
    renderScale,
    useNormalMaps,
    pbrQuality,
    usePBR,
    textureQuality,
    postProcessing,
    hdriQuality,
    maxLights,
    antialiasing,
    anisotropicFiltering,
    simplifiedAnimations,
    reducedParticles,
    particleCount
  };

  const [minDpr, maxDpr] = getCanvasDPR({ renderScale, pbrQuality });

  return active ? (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
      <Canvas
        dpr={[minDpr * renderScale, maxDpr * renderScale]}
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.2,
          outputColorSpace: THREE.SRGBColorSpace,
          antialias: antialiasing
        }}
        camera={{ position: config.camera?.startingPosition || [0, 0, 4.5], fov: config.camera?.fov || 45 }}
      >
        <color attach="background" args={[ '#050505' ]} />
        <ambientLight intensity={config.lighting?.ambient?.intensity || 0.4} />
        <directionalLight
          position={config.lighting?.directional?.position || [10, 8, 5]}
          intensity={config.lighting?.directional?.intensity || 1.8}
          color={config.lighting?.directional?.color || '#FFFFFF'}
          castShadow={false}
        />
        {config.lighting?.directionalBottom && (
          <directionalLight
            position={config.lighting.directionalBottom.position || [0, -5, 0]}
            intensity={config.lighting.directionalBottom.intensity || 0.2}
            color={config.lighting.directionalBottom.color || '#e75c25ff'}
            castShadow={false}
          />
        )}
        {config.lighting?.pointLights
          ?.slice(0, maxLights)
          .map((light, i) => (
            <pointLight key={i} position={light.position} intensity={light.intensity} color={light.color} castShadow={false} />
          ))}
        <spotLight
          position={config.lighting?.spotLight?.position || [0, 0, 10]}
          intensity={config.lighting?.spotLight?.intensity || 1000.2}
          angle={config.lighting?.spotLight?.angle || Math.PI / 4}
          penumbra={config.lighting?.spotLight?.penumbra || 0.2}
          color={config.lighting?.spotLight?.color || '#ffffffff'}
          castShadow={false}
        />

        <UnifiedCrystalScene
          animationData={animationData}
          config={config}
          materialVariant="default"
          performanceConfig={perfCfg}
          isMobile={false}
          simplifiedAnimations={simplifiedAnimations}
        />

        <Environment
          files={getHDRIPath(hdriQuality)}
          background={false}
          rotation={config.environment?.rotation || [0, Math.PI * 0.5, 0]}
        />

        <EffectComposer>
          <Bloom
            enabled={postProcessing?.bloom}
            luminanceThreshold={0.05}
            luminanceSmoothing={0.9}
            intensity={1.0}
            radius={1.9}
          />
          <ChromaticAberration
            enabled={postProcessing?.chromaticAberration}
            offset={[0.003, 0.003]}
            radialModulation
            modulationOffset={0.5}
          />
          <Noise enabled={postProcessing?.noise} opacity={0.1} blendFunction={BlendFunction.OVERLAY} />
          <Vignette enabled={postProcessing?.vignette} eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  ) : null;
});

export default PerformanceTestScene;
