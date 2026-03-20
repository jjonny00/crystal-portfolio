// FIXED: src/components/layout/Fixed3DCanvas.jsx
// UPDATED: Enhanced MistyLayerStack positioning and render order

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { ShaderPass } from 'postprocessing';
import * as THREE from 'three';
import { HalfFloatType, UnsignedByteType, ShaderMaterial } from 'three';

// FIXED: Import enhanced camera controller from correct path
import UnifiedCameraController from '../three/UnifiedCameraController';
import UnifiedCrystalScene from '../three/UnifiedCrystalScene';
import PersistentDustSystem from '../three/PersistentDustSystem';
import { FPSCounter } from '../ui/FpsDisplay';

// ADDED: Import the debug panels component
import CrystalDebugPanels from '../ui/CrystalDebugPanels';
import GradientBackground from '../three/GradientBackground';
import { projectBackgrounds } from '../../data/projectBackgrounds';
import MistyLayerStack from '../MistyLayerStack';
import { isIOS26 } from '../../utils/isIOS26';
import { facetKeys as canonicalFacetKeys, getProjectIdBySceneFacetKey } from '../../data/projects';
import { useLayoutConfig } from '../../hooks/useLayoutConfig';

function createSanitizePass() {
  const material = new ShaderMaterial({
    uniforms: { inputBuffer: { value: null } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D inputBuffer;
      varying vec2 vUv;

      bool isInvalidValue(float v) {
        return (v != v) || abs(v) > 100000.0;
      }

      bool isInvalidColor(vec3 c) {
        return isInvalidValue(c.r) || isInvalidValue(c.g) || isInvalidValue(c.b);
      }

      void main() {
        vec4 texel = texture2D(inputBuffer, vUv);
        vec3 c = texel.rgb;
        if (isInvalidColor(c)) {
          c = vec3(1.0);
        }
        c = clamp(c, 0.0, 4.0);
        gl_FragColor = vec4(c, texel.a);
      }
    `
  });

  material.toneMapped = false;
  material.depthTest = false;
  material.depthWrite = false;

  const pass = new ShaderPass(material);
  pass.enabled = true;
  return pass;
}

const PulsingOmniLight = ({ simplified = false }) => {
  const lightRef = useRef();

  useFrame((state) => {
    if (lightRef.current) {
      if (simplified) {
        lightRef.current.intensity = 1.0;
        return;
      }
      const time = state.clock.elapsedTime;
      const pulse = Math.sin(time * 2 + Math.sin(time * 0.7) * 0.5) * 0.3 + 1;
      lightRef.current.intensity = 1.0 * pulse;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 0, 0]}
      intensity={1.0}
      color="#00ba7f"
      distance={100}
      decay={1}
      castShadow={false}
    />
  );
};

/**
 * UPDATED: Fixed3DCanvas with enhanced MistyLayerStack render order
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
  scrollToProgress,
  scrollToProject,
  onDirectProjectSelect,
  onDirectZoneSelect,
  cameraRuntimeOverrides = null,
  projectRuntimeOverrides = null
}, ref) => {
  // NEW: Ref to access crystal scene for debug panels
  const crystalSceneRef = useRef();
  const backgroundRef = useRef();
  const lastZoneRef = useRef(null);

  const handleFractureStart = useCallback(() => {
    backgroundRef.current?.flash(1, 0.5);
  }, []);

  // Expose internal state to parent components
  useImperativeHandle(ref, () => ({
    modelsLoaded: crystalSceneRef.current?.modelsLoaded || false,
    updateBackground: (key) => backgroundRef.current?.updateBackground(key),
    directSelectZone: (zoneKey) => onDirectZoneSelect?.(zoneKey)
  }), [onDirectZoneSelect, crystalSceneRef.current?.modelsLoaded]);
  
  // NEW: State for debug data
  const [debugData, setDebugData] = useState({
    facetKeys: [...canonicalFacetKeys],
    facetModels: [],
    facetRefs: { current: [] },
    showWholeCrystal: true,
    showFacets: false,
    sphereVisible: false,
    showCrystalDebug: false,
    lastCrystalForm: 'whole'
  });
  const lastDebugSignatureRef = useRef('');

  const simplifiedAnimations = performanceProfile?.simplifiedAnimations;
  const dustEnabled = !performanceProfile?.reducedParticles;
  const particleCount = performanceProfile?.particleCount;
  const [ios26, setIos26] = useState(() => {
    if (typeof navigator === 'undefined') {
      return false;
    }
    return isIOS26();
  });

  const sanitizePass = useMemo(() => createSanitizePass(), []);
  const { layout } = useLayoutConfig();

  const cameraMergedConfig = useMemo(() => {
    const nextConfig = { ...config };

    const mergeCameraLayer = (cameraLayer) => {
      if (!cameraLayer) return;

      if (cameraLayer.positions) {
        nextConfig.cameraPositions = {
          ...(nextConfig.cameraPositions || {}),
          ...cameraLayer.positions,
          projects: {
            ...(nextConfig.cameraPositions?.projects || {}),
            ...(cameraLayer.positions.projects || {}),
          },
        };
      }

      if (cameraLayer.targets) {
        nextConfig.cameraTargets = {
          ...(nextConfig.cameraTargets || {}),
          ...cameraLayer.targets,
          projects: {
            ...(nextConfig.cameraTargets?.projects || {}),
            ...(cameraLayer.targets.projects || {}),
          },
        };
      }

      if (cameraLayer.offsets) {
        nextConfig.cameraOffsets = {
          ...(nextConfig.cameraOffsets || {}),
          ...cameraLayer.offsets,
          global: {
            ...(nextConfig.cameraOffsets?.global || {}),
            ...(cameraLayer.offsets.global || {}),
          },
          zones: {
            ...(nextConfig.cameraOffsets?.zones || {}),
            ...(cameraLayer.offsets.zones || {}),
          },
          projects: {
            ...(nextConfig.cameraOffsets?.projects || {}),
            ...(cameraLayer.offsets.projects || {}),
          },
        };
      }
    };

    mergeCameraLayer(layout?.camera);
    mergeCameraLayer(cameraRuntimeOverrides);

    return nextConfig;
  }, [cameraRuntimeOverrides, config, layout?.camera]);

  const runtimeOverrideLogShownRef = useRef(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const hasRuntimeOverrides = Boolean(
      cameraRuntimeOverrides?.positions ||
      cameraRuntimeOverrides?.targets ||
      cameraRuntimeOverrides?.offsets
    );

    if (hasRuntimeOverrides && !runtimeOverrideLogShownRef.current) {
      runtimeOverrideLogShownRef.current = true;
      console.log('[camera] runtime overrides active');
    }

    if (!hasRuntimeOverrides) {
      runtimeOverrideLogShownRef.current = false;
    }
  }, [cameraRuntimeOverrides]);

  useEffect(() => () => {
    sanitizePass?.dispose?.();
    sanitizePass?.material?.dispose?.();
  }, [sanitizePass]);

  useEffect(() => {
    let isMounted = true;

    async function refineIOSDetection() {
      if (typeof navigator === 'undefined') {
        return;
      }

      const uaData = navigator.userAgentData;

      if (!uaData || typeof uaData.getHighEntropyValues !== 'function') {
        return;
      }

      try {
        const entropy = await uaData.getHighEntropyValues(['platformVersion', 'architecture', 'model']);
        if (!isMounted) return;

        if (isIOS26(entropy)) {
          setIos26(true);
        }
      } catch (error) {
        console.debug('[Fixed3DCanvas] Failed to refine iOS 26 detection', error);
      }
    }

    if (!ios26) {
      refineIOSDetection();
    }

    return () => {
      isMounted = false;
    };
  }, [ios26]);

  useEffect(() => {
    console[ios26 ? 'warn' : 'log'](
      ios26
        ? '⚠️  iOS 26 / A18 detected — disabling MSAA in composer to prevent Safari 26 artifact.'
        : '✅  Full 8× MSAA composer enabled.'
    );
  }, [ios26]);

  // Keep debug data in sync with scene state (including keyboard toggles inside the scene)
  useEffect(() => {
    const syncDebugData = () => {
      if (!crystalSceneRef.current) return;

      const sceneDebugState = crystalSceneRef.current.getDebugSnapshot?.()
        || crystalSceneRef.current.debugState;
      const debugMethods = crystalSceneRef.current.debugMethods;

      if (!sceneDebugState) return;

      const signature = JSON.stringify({
        showWholeCrystal: sceneDebugState.showWholeCrystal,
        showFacets: sceneDebugState.showFacets,
        sphereVisible: sceneDebugState.sphereVisible,
        showCrystalDebug: sceneDebugState.showCrystalDebug,
        lastCrystalForm: sceneDebugState.lastCrystalForm,
        focusedSceneFacetKey: sceneDebugState.focusedSceneFacetKey,
        focusedProjectKey: sceneDebugState.focusedProjectKey,
      });

      if (signature === lastDebugSignatureRef.current) return;
      lastDebugSignatureRef.current = signature;

      setDebugData((prev) => ({
        ...prev,
        ...sceneDebugState,
        debugMethods,
      }));
    };

    syncDebugData();
    const intervalId = window.setInterval(syncDebugData, 120);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  // Update gradient background based on project focus or zone changes
  const bg = backgroundRef.current;
  useEffect(() => {
    if (!bg || !animationData) return;

    const zone = animationData.currentZone;

    // Overview zone always uses its own gradient
    if (zone === 'overview') {
      if (lastZoneRef.current !== zone) {
        lastZoneRef.current = zone;
        bg.updateBackground('overview');
      }
      return;
    }

    // Project-specific backgrounds only apply inside the projects zone
    if (zone === 'projects' && (animationData.focusedProject || animationData.focusedFacet)) {
      const projectKey = animationData.focusedProject
        || getProjectIdBySceneFacetKey(animationData.focusedFacet)
        || animationData.focusedFacet;
      bg.updateBackground(projectKey);
      lastZoneRef.current = zone;
      return;
    }

    // General projects area uses overview background
    if (zone === 'projects') {
      if (lastZoneRef.current !== zone) {
        lastZoneRef.current = zone;
        bg.updateBackground('overview');
      }
      return;
    }

    // All other zones fall back to default
    if (lastZoneRef.current !== zone) {
      lastZoneRef.current = zone;
      bg.updateBackground('default');
    }
  }, [
    animationData?.focusedProject,
    animationData?.focusedFacet,
    animationData?.currentZone,
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
            // UPDATED: Ensure depth sorting is enabled for proper render order
            sortObjects: true,
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
            intensity={config?.lighting?.directional?.intensity || 1.0}
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
            intensity={config?.lighting?.spotLight?.intensity || 1.0}
            angle={config?.lighting?.spotLight?.angle || Math.PI / 4}
            penumbra={config?.lighting?.spotLight?.penumbra || 0.2}
            color={config?.lighting?.spotLight?.color || "#ffffffff"}
            castShadow={false}
          />
          
          {/* UPDATED: Enhanced Camera Controller with facet refs */}
          <UnifiedCameraController
            animationData={animationData}
            config={cameraMergedConfig}
            isMobile={isMobile}
            simplifiedAnimations={simplifiedAnimations}
            facetRefs={getFacetRefs()} // FIXED: Pass exposed facet refs for anchor targeting
          />
          
          {/* UPDATED: Crystal Scene with ref for accessing debug state */}
          <UnifiedCrystalScene
            projectRuntimeOverrides={projectRuntimeOverrides}
            ref={crystalSceneRef} // NEW: Ref to access debug state and methods
            animationData={animationData}
            config={config}
            materialVariant={materialVariant}
            performanceProfile={performanceProfile}
            isMobile={isMobile}
            simplifiedAnimations={simplifiedAnimations}
            scrollToProgress={scrollToProgress}
            scrollToProject={scrollToProject}
            onDirectProjectSelect={onDirectProjectSelect}
            onFractureStart={handleFractureStart}
          />

          {/* UPDATED: Enhanced MistyLayerStack with highest render order */}
          <MistyLayerStack
            y={0.4}              // Position above crystal
            width={18}         // Wide coverage
            height={9}      // 2:1 aspect ratio with new texture
            layers={3}         // Multiple layers for depth
            opacity={0.4}      // Semi-transparent
            drift={{ x: 0.002, y: 0.0 }}  // Gentle drift
            pulseAmp={0.007}   // Subtle pulsing
            pulseFreq={0.1}    // Slow pulse frequency
            renderOrder={3000} // UPDATED: Highest render order to be on top
          />

          {/* Environment used for reflections only */}
          <Environment
            files={environmentProps.files || config?.environment?.hdri || "/assets/environment/prismatic10-low.hdr"}
            background={false}
            rotation={config?.environment?.rotation || [0, Math.PI * 0.5, 0]}
          />
          
          {/* Post-processing effects (unchanged) */}
          <EffectComposer
            key={ios26 ? 'ios26-no-msaa' : 'default-msaa'}
            enabled={true}
            multisampling={ios26 ? 0 : 8}
            frameBufferType={ios26 ? UnsignedByteType : HalfFloatType}
          >
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

            {/* Sanitize HDR data before any full-screen overlays */}
            <primitive object={sanitizePass} />

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
          {/* eslint-disable-next-line no-constant-binary-expression */}
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
          focusedSceneFacetKey={debugData.focusedSceneFacetKey}
          focusedProjectKey={debugData.focusedProjectKey}
          focusedFacetSlot={debugData.focusedFacetSlot}
        />
      )}
    </>
  );
});

export default Fixed3DCanvas;
