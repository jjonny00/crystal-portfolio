// src/components/three/GradientBackground.jsx
// Large inverted sphere gradient background with smooth color transitions

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
  void main() {
    vec3 dir = normalize(vWorldPosition);
    float height = dir.y * 0.5 + 0.5;
    float angle = (atan(dir.z, dir.x) / (2.0 * 3.1415926)) + 0.5;
    float noise = sin(vWorldPosition.x * 0.02) * sin(vWorldPosition.y * 0.02) * sin(vWorldPosition.z * 0.02);
    float t = clamp(height + angle * 0.1 + noise * 0.1, 0.0, 1.0);
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

  useFrame(() => {
    if (!materialRef.current) return;
    currentA.current.lerp(targetA.current, 0.05);
    currentB.current.lerp(targetB.current, 0.05);
    materialRef.current.uniforms.colorA.value.copy(currentA.current);
    materialRef.current.uniforms.colorB.value.copy(currentB.current);
  });

  useImperativeHandle(ref, () => ({
    updateBackground: (key) => {
      const scheme = backgrounds[key] || backgrounds.default;
      targetA.current = new THREE.Color(scheme.colorA);
      targetB.current = new THREE.Color(scheme.colorB);
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
      />
    </mesh>
  );
});

GradientBackground.displayName = 'GradientBackground';

export default GradientBackground;
