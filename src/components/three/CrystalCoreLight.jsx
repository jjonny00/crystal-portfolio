// src/components/three/CrystalCoreLight.jsx
// Glowing light at the center of the crystal with pulsing animation

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * CrystalCoreLight Component
 * Creates a glowing light at the center of the crystal with configurable properties
 */
const CrystalCoreLight = ({
  // Light properties
  intensity = 2.0,
  color = '#64ffda', // Default crystal cyan color
  distance = 10,
  decay = 2,
  
  // Animation properties
  pulseEnabled = true,
  pulseSpeed = 1.2,
  pulseIntensityRange = [0.8, 1.5], // Min/max multiplier for intensity
  
  // Volumetric glow properties
  showVolumetricGlow = true,
  glowLayers = 3, // Multiple layers for soft falloff
  glowSizes = [0.05, 0.12, 0.25], // Different sizes for layered effect
  glowOpacities = [0.8, 0.3, 0.1], // Decreasing opacity for outer layers
  
  // Performance/visibility
  visible = true,
  animationData = null,
  
  // Position override (defaults to center)
  position = [0, 0, 0]
}) => {
  const pointLightRef = useRef();
  const glowSphereRef = useRef();
  const glowLayersRef = useRef([]);
  const timeRef = useRef(0);
  
  // Create volumetric glow materials and geometries
  const volumetricGlowData = useMemo(() => {
    if (!showVolumetricGlow) return null;
    
    const layers = [];
    
    for (let i = 0; i < glowLayers; i++) {
      const size = glowSizes[i] || glowSizes[glowSizes.length - 1];
      const opacity = glowOpacities[i] || glowOpacities[glowOpacities.length - 1];
      
      const geometry = new THREE.SphereGeometry(size, 16, 12);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: opacity,
        emissive: new THREE.Color(color),
        emissiveIntensity: 1.0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false, // Render on top for glow effect
        fog: false // Don't let fog affect the glow
      });
      
      layers.push({ geometry, material, baseOpacity: opacity });
    }
    
    return layers;
  }, [color, showVolumetricGlow, glowLayers, glowSizes, glowOpacities]);
  
  // Legacy single sphere material (keeping for backward compatibility)
  const glowMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.6,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }, [color]);
  
  // Legacy geometry
  const glowGeometry = useMemo(() => {
    return new THREE.SphereGeometry(0.15, 16, 12);
  }, []);
  
  // Animation loop
  useFrame((state, delta) => {
    if (!visible) return;
    
    timeRef.current += delta;
    
    // Pulse animation
    if (pulseEnabled && pointLightRef.current) {
      const pulsePhase = Math.sin(timeRef.current * pulseSpeed);
      const pulseMultiplier = THREE.MathUtils.lerp(
        pulseIntensityRange[0], 
        pulseIntensityRange[1], 
        (pulsePhase + 1) * 0.5 // Normalize -1,1 to 0,1
      );
      
      pointLightRef.current.intensity = intensity * pulseMultiplier;
      
      // Sync volumetric glow layers with light intensity
      if (glowLayersRef.current && showVolumetricGlow && volumetricGlowData) {
        glowLayersRef.current.forEach((layerMesh, index) => {
          if (layerMesh) {
            const baseOpacity = volumetricGlowData[index].baseOpacity;
            const glowPulse = pulseMultiplier * 0.2; // Subtle pulse for glow
            
            // Update opacity
            layerMesh.material.opacity = baseOpacity * (0.8 + glowPulse);
            
            // Update emissive intensity
            layerMesh.material.emissiveIntensity = 0.8 + glowPulse * 0.5;
            
            // Subtle scale animation - smaller for inner layers, larger for outer
            const scaleBase = 1 + (index * 0.1); // Outer layers scale more
            const scaleMultiplier = scaleBase + (pulseMultiplier - 1) * 0.05;
            layerMesh.scale.setScalar(scaleMultiplier);
          }
        });
      }
      
      // Legacy single sphere sync
      if (glowSphereRef.current && !showVolumetricGlow) {
        const glowPulse = pulseMultiplier * 0.3; // Less dramatic for the sphere
        glowSphereRef.current.material.emissiveIntensity = 0.5 + glowPulse;
        
        // Subtle scale animation
        const scaleMultiplier = 1 + (pulseMultiplier - 1) * 0.1;
        glowSphereRef.current.scale.setScalar(scaleMultiplier);
      }
    } else if (pointLightRef.current) {
      // Static intensity when pulse is disabled
      pointLightRef.current.intensity = intensity;
    }
    
    // Sync with crystal state if animation data is provided
    if (animationData) {
      // Adjust intensity based on crystal state
      let stateIntensityMultiplier = 1;
      
      switch (animationData.state) {
        case 'hero':
          stateIntensityMultiplier = 1.2; // Brighter in hero view
          break;
        case 'overview':
          stateIntensityMultiplier = 0.8; // Dimmer when exploded
          break;
        case 'project_focused':
          stateIntensityMultiplier = 0.6; // Even dimmer when focused on project
          break;
        case 'about':
          stateIntensityMultiplier = 1.0; // Normal in about
          break;
        default:
          stateIntensityMultiplier = 1.0;
      }
      
      if (pointLightRef.current) {
        const currentIntensity = pointLightRef.current.intensity;
        const targetIntensity = intensity * stateIntensityMultiplier * 
          (pulseEnabled ? (intensity * ((Math.sin(timeRef.current * pulseSpeed) + 1) * 0.5 * 
          (pulseIntensityRange[1] - pulseIntensityRange[0]) + pulseIntensityRange[0])) / intensity : 1);
        
        // Smooth transition to target intensity
        pointLightRef.current.intensity = THREE.MathUtils.lerp(currentIntensity, targetIntensity, 0.05);
      }
    }
  });
  
  // Don't render if not visible
  if (!visible) return null;
  
  return (
    <group position={position}>
      {/* Point Light */}
      <pointLight
        ref={pointLightRef}
        color={color}
        intensity={intensity}
        distance={distance}
        decay={decay}
        castShadow={false} // Disable shadows for performance
      />
      
      {/* Volumetric Glow Layers */}
      {showVolumetricGlow && volumetricGlowData && volumetricGlowData.map((layerData, index) => (
        <mesh
          key={index}
          ref={(el) => {
            if (!glowLayersRef.current) glowLayersRef.current = [];
            glowLayersRef.current[index] = el;
          }}
          geometry={layerData.geometry}
          material={layerData.material}
          renderOrder={1000 + index} // Render after other objects
        />
      ))}
      
      {/* Legacy Single Glow Sphere (fallback) */}
      {!showVolumetricGlow && (
        <mesh
          ref={glowSphereRef}
          geometry={glowGeometry}
          material={glowMaterial}
        />
      )}
    </group>
  );
};

/**
 * Preset configurations for different crystal states
 */
export const CrystalCoreLightPresets = {
  // Soft volumetric glow
  ambient: {
    intensity: 1.0,
    color: '#64ffda',
    pulseEnabled: true,
    pulseSpeed: 0.8,
    pulseIntensityRange: [0.9, 1.1],
    showVolumetricGlow: true,
    glowLayers: 3,
    glowSizes: [0.03, 0.08, 0.15],
    glowOpacities: [0.9, 0.4, 0.15]
  },
  
  // Dramatic hero lighting with bright core
  hero: {
    intensity: 2.5,
    color: '#64ffda',
    pulseEnabled: true,
    pulseSpeed: 1.2,
    pulseIntensityRange: [0.7, 1.3],
    showVolumetricGlow: true,
    glowLayers: 4,
    glowSizes: [0.02, 0.06, 0.12, 0.22],
    glowOpacities: [1.0, 0.6, 0.3, 0.1]
  },
  
  // Subtle background glow for exploded state
  exploded: {
    intensity: 0.8,
    color: '#bb86fc',
    pulseEnabled: true,
    pulseSpeed: 2.0,
    pulseIntensityRange: [0.8, 1.2],
    showVolumetricGlow: true,
    glowLayers: 2,
    glowSizes: [0.025, 0.07],
    glowOpacities: [0.7, 0.2]
  },
  
  // Focused project lighting with steady glow
  focused: {
    intensity: 1.5,
    color: '#03dac6',
    pulseEnabled: false,
    showVolumetricGlow: true,
    glowLayers: 3,
    glowSizes: [0.02, 0.05, 0.1],
    glowOpacities: [0.8, 0.4, 0.15]
  },
  
  // Warm about section glow
  about: {
    intensity: 1.8,
    color: '#ffd600',
    pulseEnabled: true,
    pulseSpeed: 0.6,
    pulseIntensityRange: [0.9, 1.1],
    showVolumetricGlow: true,
    glowLayers: 3,
    glowSizes: [0.025, 0.07, 0.14],
    glowOpacities: [0.9, 0.45, 0.18]
  }
};

/**
 * Smart preset selector based on animation data
 */
export const SmartCrystalCoreLight = ({ animationData, ...props }) => {
  // Select preset based on current state
  let preset = CrystalCoreLightPresets.ambient;
  
  if (animationData) {
    switch (animationData.state) {
      case 'hero':
        preset = CrystalCoreLightPresets.hero;
        break;
      case 'overview':
        preset = CrystalCoreLightPresets.exploded;
        break;
      case 'project_focused':
        preset = CrystalCoreLightPresets.focused;
        break;
      case 'about':
        preset = CrystalCoreLightPresets.about;
        break;
      default:
        preset = CrystalCoreLightPresets.ambient;
    }
  }
  
  // Merge preset with any custom props
  const finalProps = { ...preset, ...props, animationData };
  
  return <CrystalCoreLight {...finalProps} />;
};

export default CrystalCoreLight;
