// FIXED: src/components/three/GradientBackground.jsx
// Large inverted sphere gradient background with smooth color transitions and better state management

import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = /* glsl */`
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = /* glsl */`
  uniform vec3 colorA;
  uniform vec3 colorB;
  varying vec3 vWorldPosition;
  
  // Cheap procedural noise using sin() products for mobile-friendly variation
  float cheapNoise(vec3 p) {
    return sin(p.x) * sin(p.y) * sin(p.z);
  }

  void main() {
    vec3 dir = normalize(vWorldPosition);
    float height = dir.y * 0.5 + 0.5;             // vertical gradient component
    float angle = (atan(dir.z, dir.x) / (2.0 * 3.1415926)) + 0.5; // around-sphere variation
    float noise = cheapNoise(vWorldPosition * 0.05) * 0.1;        // subtle randomized variation
    float t = clamp(height + angle * 0.1 + noise, 0.0, 1.0);
    vec3 color = mix(colorA, colorB, t);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const GradientBackground = forwardRef(({ backgrounds, initialKey = 'default', radius = 100 }, ref) => {
  const materialRef = useRef();
  const currentA = useRef(new THREE.Color(backgrounds[initialKey].colorA));
  const currentB = useRef(new THREE.Color(backgrounds[initialKey].colorB));
  const targetA = useRef(currentA.current.clone());
  const targetB = useRef(currentB.current.clone());
  
  // ADDED: Track current key to prevent redundant updates
  const currentKey = useRef(initialKey);

  useFrame(() => {
    if (!materialRef.current) return;
    currentA.current.lerp(targetA.current, 0.05);
    currentB.current.lerp(targetB.current, 0.05);
    materialRef.current.uniforms.colorA.value.copy(currentA.current);
    materialRef.current.uniforms.colorB.value.copy(currentB.current);
    materialRef.current.uniformsNeedUpdate = true;
    materialRef.current.needsUpdate = true;
  });

  useImperativeHandle(ref, () => ({
    updateBackground: (key) => {
      // FIXED: Always update if key is different, or if we don't have the key in backgrounds
      if (key !== currentKey.current || !backgrounds[key]) {
        const scheme = backgrounds[key] || backgrounds.default;
        
        if (import.meta.env.DEV) {
          console.log(`🎨 GradientBackground: Updating from "${currentKey.current}" to "${key}"`, {
            oldColors: {
              colorA: currentKey.current ? backgrounds[currentKey.current]?.colorA : 'unknown',
              colorB: currentKey.current ? backgrounds[currentKey.current]?.colorB : 'unknown'
            },
            newColors: {
              colorA: scheme.colorA,
              colorB: scheme.colorB
            }
          });
        }
        
        targetA.current = new THREE.Color(scheme.colorA);
        targetB.current = new THREE.Color(scheme.colorB);
        currentKey.current = key;
      } else if (import.meta.env.DEV) {
        console.log(`🎨 GradientBackground: Skipping update, already on "${key}"`);
      }
    },
    
    // ADDED: Getter to check current state
    getCurrentKey: () => currentKey.current,
    
    // ADDED: Force update method for debugging
    forceUpdate: (key) => {
      const scheme = backgrounds[key] || backgrounds.default;
      targetA.current = new THREE.Color(scheme.colorA);
      targetB.current = new THREE.Color(scheme.colorB);
      currentKey.current = key;
      
      if (import.meta.env.DEV) {
        console.log(`🎨 GradientBackground: Force updated to "${key}"`);
      }
    }
  }));

  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          colorA: { value: currentA.current.clone() },
          colorB: { value: currentB.current.clone() }
        }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </mesh>
  );
});

GradientBackground.displayName = 'GradientBackground';

export default GradientBackground;