// src/components/three/VolumetricOmniLight.jsx
// True volumetric omni light using custom shaders for realistic light scattering

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Volumetric Light Shader
 * Creates a realistic volumetric light effect using distance-based falloff
 */
const VolumetricLightShader = {
  vertexShader: `
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vNormal = normalize(normalMatrix * normal);
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  
  fragmentShader: `
    uniform vec3 lightColor;
    uniform float intensity;
    uniform float radius;
    uniform float falloff;
    uniform float time;
    uniform bool enablePulse;
    uniform float pulseSpeed;
    uniform float pulseAmount;
    uniform vec3 lightPosition;
    
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    // Noise function for subtle variation
    float noise(vec3 p) {
      return fract(sin(dot(p, vec3(12.9898, 78.233, 54.53))) * 43758.5453);
    }
    
    void main() {
      // Distance from light center
      float dist = distance(vWorldPosition, lightPosition);
      
      // Volumetric falloff - realistic inverse square with artistic control
      float attenuation = 1.0 / (1.0 + dist * dist * falloff);
      
      // Smooth falloff at edges
      float edgeFade = 1.0 - smoothstep(radius * 0.7, radius, dist);
      
      // Fresnel effect for volume density
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = 1.0 - abs(dot(vNormal, viewDir));
      fresnel = pow(fresnel, 2.0);
      
      // Pulse effect
      float pulse = 1.0;
      if (enablePulse) {
        pulse = 1.0 + sin(time * pulseSpeed) * pulseAmount;
      }
      
      // Subtle noise for organic feeling
      vec3 noisePos = vWorldPosition * 8.0 + time * 0.5;
      float noiseValue = noise(noisePos) * 0.1 + 0.9;
      
      // Combine all effects
      float finalIntensity = intensity * attenuation * edgeFade * fresnel * pulse * noiseValue;
      
      // Volume density based on distance and viewing angle
      float density = finalIntensity * (1.0 - dist / radius);
      density = clamp(density, 0.0, 1.0);
      
      // Color with volumetric scattering
      vec3 finalColor = lightColor * density;
      
      // Additive blending alpha
      float alpha = density * 0.8;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

/**
 * VolumetricOmniLight Component
 * Creates a true volumetric omni-directional light with realistic scattering
 */
const VolumetricOmniLight = ({
  // Light properties
  intensity = 200.0,
  color = '#64ffda',
  radius = 1.5,
  falloff = 0.5,
  
  // Animation properties
  pulseEnabled = true,
  pulseSpeed = 1.2,
  pulseAmount = 0.2,
  
  // Volumetric properties
  volumeRadius = 100.8,
  volumeSegments = 32,
  volumeRings = 16,
  
  // Performance/visibility
  visible = true,
  animationData = null,
  
  // Position
  position = [0, 0, 0]
}) => {
  const materialRef = useRef();
  const lightRef = useRef();
  const timeRef = useRef(0);
  
  // Create volumetric material
  const volumetricMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        lightColor: { value: new THREE.Color(color) },
        intensity: { value: intensity },
        radius: { value: radius },
        falloff: { value: falloff },
        time: { value: 0 },
        enablePulse: { value: pulseEnabled },
        pulseSpeed: { value: pulseSpeed },
        pulseAmount: { value: pulseAmount },
        lightPosition: { value: new THREE.Vector3(...position) }
      },
      vertexShader: VolumetricLightShader.vertexShader,
      fragmentShader: VolumetricLightShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide, // Render from inside
      depthWrite: false,
      depthTest: true
    });
  }, [color, intensity, radius, falloff, pulseEnabled, pulseSpeed, pulseAmount, position]);
  
  // Create volume geometry
  const volumeGeometry = useMemo(() => {
    return new THREE.SphereGeometry(volumeRadius, volumeSegments, volumeRings);
  }, [volumeRadius, volumeSegments, volumeRings]);
  
  // Animation loop
  useFrame((state, delta) => {
    if (!visible || !materialRef.current) return;
    
    timeRef.current += delta;
    
    // Update shader uniforms
    materialRef.current.uniforms.time.value = timeRef.current;
    
    // Sync with crystal state if animation data is provided
    if (animationData) {
      let stateIntensityMultiplier = 1.0;
      let stateColorShift = new THREE.Color(color);
      
      switch (animationData.state) {
        case 'hero':
          stateIntensityMultiplier = 1.3;
          break;
        case 'overview':
          stateIntensityMultiplier = 0.7;
          stateColorShift.set('#bb86fc'); // Purple for exploded state
          break;
        case 'project_focused':
          stateIntensityMultiplier = 0.5;
          stateColorShift.set('#03dac6'); // Teal for focused
          break;
        case 'about':
          stateIntensityMultiplier = 1.1;
          stateColorShift.set('#ffd600'); // Gold for about
          break;
      }
      
      // Smooth transitions
      const currentIntensity = materialRef.current.uniforms.intensity.value;
      const targetIntensity = intensity * stateIntensityMultiplier;
      materialRef.current.uniforms.intensity.value = THREE.MathUtils.lerp(
        currentIntensity, 
        targetIntensity, 
        0.02
      );
      
      // Smooth color transitions
      materialRef.current.uniforms.lightColor.value.lerp(stateColorShift, 0.01);
    }
    
    // Update point light to match volumetric intensity
    if (lightRef.current && materialRef.current) {
      lightRef.current.intensity = materialRef.current.uniforms.intensity.value * 0.5;
      lightRef.current.color.copy(materialRef.current.uniforms.lightColor.value);
    }
  });
  
  // Update material uniforms when props change
  React.useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.lightColor.value.set(color);
      materialRef.current.uniforms.intensity.value = intensity;
      materialRef.current.uniforms.radius.value = radius;
      materialRef.current.uniforms.falloff.value = falloff;
      materialRef.current.uniforms.enablePulse.value = pulseEnabled;
      materialRef.current.uniforms.pulseSpeed.value = pulseSpeed;
      materialRef.current.uniforms.pulseAmount.value = pulseAmount;
      materialRef.current.uniforms.lightPosition.value.set(...position);
    }
  }, [color, intensity, radius, falloff, pulseEnabled, pulseSpeed, pulseAmount, position]);
  
  if (!visible) return null;
  
  return (
    <group position={position}>
      {/* Actual point light for scene illumination */}
      <pointLight
        ref={lightRef}
        color={color}
        intensity={intensity * 0.5}
        distance={radius * 2}
        decay={2}
        castShadow={false}
      />
      
      {/* Volumetric light volume */}
      <mesh geometry={volumeGeometry} material={volumetricMaterial}>
        <shaderMaterial
          ref={materialRef}
          attach="material"
          {...volumetricMaterial}
        />
      </mesh>
    </group>
  );
};

/**
 * Preset configurations for different states
 */
export const VolumetricLightPresets = {
  ambient: {
    intensity: 1.5,
    color: '#64ffda',
    radius: 1.2,
    falloff: 0.3,
    pulseEnabled: true,
    pulseSpeed: 0.8,
    pulseAmount: 0.15,
    volumeRadius: 0.6
  },
  
  hero: {
    intensity: 2.8,
    color: '#64ffda',
    radius: 1.8,
    falloff: 0.2,
    pulseEnabled: true,
    pulseSpeed: 1.2,
    pulseAmount: 0.25,
    volumeRadius: 0.9
  },
  
  exploded: {
    intensity: 1.0,
    color: '#bb86fc',
    radius: 1.0,
    falloff: 0.4,
    pulseEnabled: true,
    pulseSpeed: 2.0,
    pulseAmount: 0.3,
    volumeRadius: 0.5
  },
  
  focused: {
    intensity: 1.8,
    color: '#03dac6',
    radius: 1.3,
    falloff: 0.25,
    pulseEnabled: false,
    volumeRadius: 0.7
  },
  
  about: {
    intensity: 2.2,
    color: '#ffd600',
    radius: 1.5,
    falloff: 0.3,
    pulseEnabled: true,
    pulseSpeed: 0.6,
    pulseAmount: 0.2,
    volumeRadius: 0.75
  }
};

/**
 * Smart preset selector
 */
export const SmartVolumetricOmniLight = ({ animationData, ...props }) => {
  let preset = VolumetricLightPresets.ambient;
  
  if (animationData) {
    switch (animationData.state) {
      case 'hero':
        preset = VolumetricLightPresets.hero;
        break;
      case 'overview':
        preset = VolumetricLightPresets.exploded;
        break;
      case 'project_focused':
        preset = VolumetricLightPresets.focused;
        break;
      case 'about':
        preset = VolumetricLightPresets.about;
        break;
      default:
        preset = VolumetricLightPresets.ambient;
    }
  }
  
  const finalProps = { ...preset, ...props, animationData };
  return <VolumetricOmniLight {...finalProps} />;
};

export default VolumetricOmniLight;

/**
 * USAGE INSTRUCTIONS:
 * 
 * Replace your CrystalCoreLight with this VolumetricOmniLight:
 * 
 * import VolumetricOmniLight, { SmartVolumetricOmniLight } from './VolumetricOmniLight';
 * 
 * // In your UnifiedCrystalScene.jsx:
 * <SmartVolumetricOmniLight 
 *   animationData={animationData}
 *   visible={true}
 * />
 * 
 * This creates true volumetric lighting with:
 * - Realistic light scattering and falloff
 * - Proper fresnel effects for volume density
 * - Subtle noise for organic light variation
 * - No visible geometry, just pure light volume
 * - Performance-optimized custom shaders
 */