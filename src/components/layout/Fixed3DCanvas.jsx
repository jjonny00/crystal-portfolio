// src/components/layout/Fixed3DCanvas.jsx
// Fixed position 3D canvas that sits behind scrollable content

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// Import your existing 3D components
import EnhancedCrystalScene from '../three/EnhancedCrystalScene';
import { FPSCounter } from '../ui/FpsDisplay';

/**
 * Fixed3DCanvas - The 3D scene that remains fixed behind scrollable content
 * Fixed layering to ensure content appears above the canvas
 */
const Fixed3DCanvas = ({ 
  crystalState,
  selectedFacet,
  hoveredFacet,
  onFacetSelect,
  onFacetHover,
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
      zIndex: 1, // IMPORTANT: Behind scrollable content (which is z-index 10)
      pointerEvents: 'none', // IMPORTANT: Don't block scrolling
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
          // IMPORTANT: Allow pointer events only for 3D interactions
          pointerEvents: isMobile ? 'none' : 'auto',
        }}
      >
        
        <FPSCounter />
        
        <color attach="background" args={['#050505']} />
        
        {/* Lighting setup */}
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
        
        {/* Crystal scene */}
        <EnhancedCrystalScene 
          isExploded={crystalState === 'EXPLODED' || crystalState === 'EXPLODING' || crystalState === 'PROJECT_SELECTED'} 
          crystalState={crystalState}
          config={config} 
          materialVariant={materialVariant}
          blackOpalConfig={blackOpalConfig}
          iceOpalConfig={iceOpalConfig}
          selectedFacet={selectedFacet}
          hoveredFacet={hoveredFacet}
          onFacetSelect={isMobile ? null : onFacetSelect} // Disable on mobile
          onFacetHover={isMobile ? null : onFacetHover}   // Disable on mobile
          isTransitioning={false} // Will be managed by scroll observer
          performanceConfig={performanceConfig}
          isMobileDevice={isMobile}
        />
        
        {/* Environment */}
        <Environment 
          files={environmentProps.files || config?.environment?.hdri || "/assets/environment/prismatic09-low.hdr"} 
          background={config?.environment?.showBackground !== false} 
          rotation={config?.environment?.rotation || [0, Math.PI * 0.5, 0]}
        />
        
        {/* Post-processing effects */}
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
        
        {/* Orbit controls - disabled on mobile, scroll-aware on desktop */}
        {!isMobile && (
          <OrbitControls 
            makeDefault
            enabled={crystalState !== 'PROJECT_SELECTED'} // Disable when project selected
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