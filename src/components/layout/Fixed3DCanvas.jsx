// FIXED: src/components/layout/Fixed3DCanvas.jsx
// UPDATED: Fixed background color updates for project sections

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// FIXED: Import enhanced camera controller from correct path
import UnifiedCameraController from '../three/UnifiedCameraController';
import UnifiedCrystalScene from '../three/UnifiedCrystalScene';
import PersistentDustSystem from '../three/PersistentDustSystem';
import { FPSCounter } from '../ui/FpsDisplay';

// ADDED: Import the debug panels component
import CrystalDebugPanels from '../ui/CrystalDebugPanels';
import GradientBackground from '../three/GradientBackground';
import { projectBackgrounds } from '../../data/projectBackgrounds';

const PulsingOmniLight = ({ simplified = false }) => {
  const lightRef = useRef();

  useFrame((state) => {
    if (lightRef.current) {
      if (simplified) {
        lightRef.current.intensity = 100.5;
        return;
      }
      const time = state.clock.elapsedTime;
      const pulse = Math.sin(time * 2 + Math.sin(time * 0.7) * 0.5) * 0.3 + 1;
      lightRef.current.intensity = 100.5 * pulse;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 0, 0]}
      intensity={5.5}
      color="#00ba7f"
      distance={100}
      decay={1}
      castShadow={false}
    />
  );
};

/**
 * UPDATED: Fixed3DCanvas with corrected background color logic
 */
const Fixed3DCanvas = forwardRef(({
  // Animation data from MasterAnimationCoordinator
  animationData,
  
  // Material and effects (unchanged)
  materialVariant = 'default',
  effectsEnabled,
  postProcessingConfig,
  performanceProfile,
  config,
  canvasProps = {},
  environmentProps = {},
  isMobile = false,
  scrollToProgress
}, ref) => {
  // NEW: Ref to access crystal scene for debug panels
  const crystalSceneRef = useRef();
  const backgroundRef = useRef();

  // Expose internal state to parent components
  useImperativeHandle(ref, () => ({
    modelsLoaded: crystalSceneRef.current?.modelsLoaded || false,
    updateBackground: (key) => backgroundRef.current?.updateBackground(key)
  }), [crystalSceneRef.current?.modelsLoaded]);
  
  // NEW: State for debug data
  const [debugData, setDebugData] = useState({
    facetKeys: ['empathy', 'narrative', 'craft', 'system', 'leadership', 'exploration'],
    facetModels: [],
    facetRefs: { current: [] },
    showWholeCrystal: true,
    showFacets: false,
    sphereVisible: false,
    showCrystalDebug: false,
    lastCrystalForm: 'whole'
  });

  const simplifiedAnimations = performanceProfile?.simplifiedAnimations;
  const dustEnabled = !performanceProfile?.reducedParticles;
  const particleCount = performanceProfile?.particleCount;

  // NEW: Update debug data when crystal scene changes
  useEffect(() => {
    if (crystalSceneRef.current) {
      const sceneDebugState = crystalSceneRef.current.debugState;
      const debugMethods = crystalSceneRef.current.debugMethods;
      
      if (sceneDebugState) {
        setDebugData(prev => ({
          ...prev,
          ...sceneDebugState,
          debugMethods
        }));
      }
    }
  }, [crystalSceneRef]);

  // FIXED: Update gradient background based on scroll zone or project focus
  const bg = backgroundRef.current;
  useEffect(() => {
    if (!bg || !animationData) return;
    
    let key = 'default';
    
    // Debug logging to see what's happening
    if (import.meta.env.DEV) {
      console.log('🎨 Background update check:', {
        currentZone: animationData?.currentZone,
        zoneInfo: animationData?.zoneInfo,
        state: animationData?.state,
        focusedProject: animationData?.focusedProject,
        focusedFacet: animationData?.focusedFacet,
        projectInfo: animationData?.projectInfo
      });
    }

    // FIXED: Check for focused project first (more specific)
    if (animationData.focusedProject || animationData.focusedFacet) {
      const projectKey = animationData.focusedProject || animationData.focusedFacet;
      key = projectKey;
      if (import.meta.env.DEV) {
        console.log(`🎨 Setting background to project: ${projectKey}`);
      }
    }
    // FIXED: Then check zones - be more specific about projects zone
    else if (animationData.currentZone === 'projects' || animationData.state === 'project_focused') {
      // In projects zone but no specific project focused - use overview
      key = 'overview';
      if (import.meta.env.DEV) {
        console.log('🎨 Setting background to projects overview');
      }
    }
    else if (animationData.currentZone === 'overview') {
      key = 'overview';
      if (import.meta.env.DEV) {
        console.log('🎨 Setting background to overview');
      }
    }
    else {
      // Default for hero, about, or any other zone
      key = 'default';
      if (import.meta.env.DEV) {
        console.log('🎨 Setting background to default');
      }
    }

    // FIXED: Always call updateBackground, even if key is the same
    // The component should handle duplicate calls internally
    bg.updateBackground(key);
    
    if (import.meta.env.DEV) {
      console.log(`🎨 Background key set to: ${key}`);
    }
    
  }, [
    animationData?.focusedProject, 
    animationData?.focusedFacet,
    animationData?.currentZone, 
    animationData?.state,
    animationData?.projectInfo,
    bg
  ]);

  // FIXED: Function to get facet refs from crystal scene with proper access
  const getFacetRefs = () => {
    if (crystalSceneRef.current && crystalSceneRef.current.facetRefs) {
      if (import.meta.env.DEV) {
        console.log('📍 Fixed3DCanvas: Retrieved facet refs from crystal scene');
      }
      return crystalSceneRef.current.facetRefs; // Access the exposed refs directly
    }
    if (import.meta.env.DEV) {
      console.warn('📍 Fixed3DCanvas: No facet refs available from crystal scene');
    }
    return null;
  };

  return (
    <>
      {/* Main 3D Canvas */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1, // Behind scrollable content (which is z-index 10)
        pointerEvents: 'none', // Don't block scrolling
      }}>
        <Canvas
          key={Array.isArray(canvasProps.dpr) ? canvasProps.dpr.join('-') : canvasProps.dpr}
          camera={{
            position: config?.camera?.startingPosition || [0, 0, 4.5],
            fov: config?.camera?.fov || 45
          }}
          {...canvasProps}
          gl={{
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.2,
            outputColorSpace: THREE.SRGBColorSpace,
            ...canvasProps.gl
          }}
          style={{ 
            width: '100%', 
            height: '100%',
            // Allow pointer events only for 3D interactions (disabled on mobile)
            pointerEvents: isMobile ? 'none' : 'auto',
          }}
        >
          
          <FPSCounter />

          {/* FIXED: Pass backgrounds to GradientBackground and use 'default' as initial */}
          <GradientBackground 
            ref={backgroundRef} 
            backgrounds={projectBackgrounds} 
            initialKey="default"
          />

          {/* Persistent Dust System */}
          {dustEnabled && (
            <PersistentDustSystem count={particleCount} enabled={dustEnabled} />
          )}
          
          {/* UPDATED: Enhanced lighting setup with bottom directional light */}
          <ambientLight intensity={config?.lighting?.ambient?.intensity || 0.4} />
          
          {/* Main directional light (from above/side) */}
          <directionalLight
            position={config?.lighting?.directional?.position || [10, 8, 5]}
            intensity={config?.lighting?.directional?.intensity || 1.8}
            color={config?.lighting?.directional?.color || "#FFFFFF"}
            castShadow={false}
          />
          
          {/* ADDED: Bottom directional light pointing upward */}
          {config?.lighting?.directionalBottom && (
            <directionalLight
              position={config.lighting.directionalBottom.position || [0, -5, 0]}
              target-position={config.lighting.directionalBottom.target || [0, 0, 0]}
              intensity={config.lighting.directionalBottom.intensity || 0.2}
              color={config.lighting.directionalBottom.color || "#e75c25ff"}
              castShadow={false}
            />
          )}
          
          {/* Point lights */}
          {config?.lighting?.pointLights
            ?.slice(0, performanceProfile?.maxLights || config?.lighting?.pointLights.length)
            .map((light, index) => (
              <pointLight
                key={index}
                position={light.position}
                intensity={light.intensity}
                color={light.color}
                castShadow={false}
              />
            ))}

          <PulsingOmniLight simplified={simplifiedAnimations} />
          
          {/* Spot light */}
          <spotLight
            position={config?.lighting?.spotLight?.position || [0, 0, 10]}
            intensity={config?.lighting?.spotLight?.intensity || 1000.2}
            angle={config?.lighting?.spotLight?.angle || Math.PI / 4}
            penumbra={config?.lighting?.spotLight?.penumbra || 0.2}
            color={config?.lighting?.spotLight?.color || "#ffffffff"}
            castShadow={false}
          />
          
          {/* UPDATED: Enhanced Camera Controller with facet refs */}
          <UnifiedCameraController
            animationData={animationData}
            config={config}
            isMobile={isMobile}
            simplifiedAnimations={simplifiedAnimations}
            facetRefs={getFacetRefs()} // FIXED: Pass exposed facet refs for anchor targeting
          />
          
          {/* UPDATED: Crystal Scene with ref for accessing debug state */}
          <UnifiedCrystalScene
            ref={crystalSceneRef} // NEW: Ref to access debug state and methods
            animationData={animationData}
            config={config}
            materialVariant={materialVariant}
            performanceProfile={performanceProfile}
            isMobile={isMobile}
            simplifiedAnimations={simplifiedAnimations}
            scrollToProgress={scrollToProgress}
          />
          
          {/* Environment used for reflections only */}
          <Environment
            files={environmentProps.files || config?.environment?.hdri || "/assets/environment/prismatic09-low.hdr"}
            background={false}
            rotation={config?.environment?.rotation || [0, Math.PI * 0.5, 0]}
          />
          
          {/* Post-processing effects (unchanged) */}
          <EffectComposer enabled={true}>
            {/* Default minimal bloom when no effects are enabled */}
            <Bloom 
              intensity={Object.values(effectsEnabled || {}).some(Boolean) ? 0 : 0.0001}
              luminanceThreshold={1.0}
              luminanceSmoothing={0.9}
              radius={0.5}
              enabled={!Object.values(effectsEnabled || {}).some(Boolean)}
            />
            
            {effectsEnabled?.bloom && (
              <Bloom 
                luminanceThreshold={postProcessingConfig?.bloom?.luminanceThreshold || 0.05} 
                luminanceSmoothing={postProcessingConfig?.bloom?.luminanceSmoothing || 0.9} 
                intensity={postProcessingConfig?.bloom?.intensity || 1.0} 
                radius={postProcessingConfig?.bloom?.radius || 1.9} 
              />
            )}
            {effectsEnabled?.chromaticAberration && (
              <ChromaticAberration 
                offset={postProcessingConfig?.chromaticAberration?.offset || [0.003, 0.003]} 
                radialModulation={postProcessingConfig?.chromaticAberration?.radialModulation !== false} 
                modulationOffset={postProcessingConfig?.chromaticAberration?.modulationOffset || 0.5} 
              />
            )}
            {effectsEnabled?.noise && (
              <Noise 
                opacity={postProcessingConfig?.noise?.opacity || 0.1} 
                blendFunction={BlendFunction.OVERLAY} 
              />
            )}
            {effectsEnabled?.vignette && (
              <Vignette 
                eskil={postProcessingConfig?.vignette?.eskil || false} 
                offset={postProcessingConfig?.vignette?.offset || 0.1} 
                darkness={postProcessingConfig?.vignette?.darkness || 1.1} 
              />
            )}
          </EffectComposer>
          
          {/* Orbit controls - explicitly disabled to prevent camera conflicts */}
          {false && !isMobile && (
            <OrbitControls
              makeDefault
              enabled={false}
              enableZoom={false}
              enablePan={false}
              enableRotate={false}
            />
          )}
        </Canvas>
      </div>

      {/* ADDED: External Debug Panels - Rendered outside Canvas */}
      {crystalSceneRef.current?.debugState && (
        <CrystalDebugPanels
          showCrystalDebug={debugData.showCrystalDebug}
          animationData={animationData}
          facetKeys={debugData.facetKeys}
          facetModels={[]} // Will be populated by the crystal scene
          facetRefs={{ current: crystalSceneRef.current.facetRefs || [] }}
          showWholeCrystal={debugData.showWholeCrystal}
          showFacets={debugData.showFacets}
          sphereVisible={debugData.sphereVisible}
          onForceShowFacets={debugData.debugMethods?.forceShowFacets}
          onForceShowWhole={debugData.debugMethods?.forceShowWhole}
          onInspectModels={debugData.debugMethods?.inspectModels}
          lastCrystalForm={debugData.lastCrystalForm}
        />
      )}
    </>
  );
});

export default Fixed3DCanvas;