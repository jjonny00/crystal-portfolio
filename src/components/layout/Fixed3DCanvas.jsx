// src/components/layout/Fixed3DCanvas.jsx
// UPDATED: Added PersistentDustSystem to isolate from UnifiedCrystalScene re-renders

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// NEW: Unified 3D components
import UnifiedCameraController from '../three/UnifiedCameraController';
import UnifiedCrystalScene from '../three/UnifiedCrystalScene';
import PersistentDustSystem from '../three/PersistentDustSystem';
import { FPSCounter } from '../ui/FpsDisplay';


// Animation Debug
// import AnimationDebugDisplay from './AnimationDebugDisplay';

/**
 * Fixed3DCanvas - SIMPLIFIED
 * Now receives single animationData prop instead of many complex props
 * All animation logic moved to unified system
 * UPDATED: Added PersistentDustSystem isolated from crystal animations
 */
const Fixed3DCanvas = ({ 
  // Animation data from MasterAnimationCoordinator
  animationData,
  
  // Material and effects (unchanged)
  materialVariant = 'default',
  blackOpalConfig,
  iceOpalConfig,
  effectsEnabled,
  postProcessingConfig,
  performanceConfig,
  config,
  canvasProps = {},
  environmentProps = {},
  isMobile = false
}) => {
  return (
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
        shadows 
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
        
        <color attach="background" args={['#050505']} />
        
        {/* MOVED: PersistentDustSystem here - isolated from crystal animations */}
        <PersistentDustSystem
          colorPalette={[
            '#ffffff',
            '#bb86fc',
            '#64ffda',
            '#00fff6'
          ]}
        />
        
        {/*Animation Debug*/}
        {/* <AnimationDebugDisplay animationData={animationData} /> */}
        
        {/* Lighting setup (unchanged) */}
        <ambientLight intensity={config?.lighting?.ambient?.intensity || 0.2} />
        <directionalLight 
          position={config?.lighting?.directional?.position || [10, 8, 5]} 
          intensity={config?.lighting?.directional?.intensity || 1.8} 
          color={config?.lighting?.directional?.color || "#FFFFFF"} 
          castShadow={config?.lighting?.directional?.castShadow !== false} 
        />
        
        {config?.lighting?.pointLights?.map((light, index) => (
          <pointLight 
            key={index}
            position={light.position} 
            intensity={light.intensity} 
            color={light.color} 
          />
        ))}
        
        <spotLight 
          position={config?.lighting?.spotLight?.position || [0, 0, 10]} 
          intensity={config?.lighting?.spotLight?.intensity || 1.0} 
          angle={config?.lighting?.spotLight?.angle || Math.PI / 4} 
          penumbra={config?.lighting?.spotLight?.penumbra || 0.2} 
          color={config?.lighting?.spotLight?.color || "#FFFFFF"} 
        />
        
        {/* Unified Camera Controller */}
        <UnifiedCameraController 
          animationData={animationData}
          config={config}
          isMobile={isMobile}
        />
        
        {/* Unified Crystal Scene */}
        <UnifiedCrystalScene 
          animationData={animationData}
          config={config}
          materialVariant={materialVariant}
          blackOpalConfig={blackOpalConfig}
          iceOpalConfig={iceOpalConfig}
          performanceConfig={performanceConfig}
          isMobile={isMobile}
        />
        
        {/* Environment (unchanged) */}
        <Environment 
          files={environmentProps.files || config?.environment?.hdri || "/assets/environment/prismatic09-low.hdr"} 
          background={config?.environment?.showBackground !== false} 
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
        
        {/* Orbit controls - disabled on mobile, animation-aware on desktop */}
        {!isMobile && (
          <OrbitControls 
            makeDefault
            // SIMPLIFIED: Enable/disable based on animation state instead of complex crystal state
            enabled={!animationData?.isTransitioning && animationData?.currentZone !== 'projects'} 
            enableZoom={config?.camera?.orbitControls?.enableZoom !== false}
            enablePan={config?.camera?.orbitControls?.enablePan !== false}
            rotateSpeed={config?.camera?.orbitControls?.rotateSpeed || 0.5}
            minPolarAngle={config?.camera?.orbitControls?.minPolarAngle || Math.PI / 3}
            maxPolarAngle={config?.camera?.orbitControls?.maxPolarAngle || Math.PI / 1.5}
          />
        )}
      </Canvas>
    </div>
  );
};

export default Fixed3DCanvas;