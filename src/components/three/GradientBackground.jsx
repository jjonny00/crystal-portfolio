import React, { useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
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

// Hash function for scattered randomness
float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

// Generates scattered soft bursts
float burstField(vec3 p) {
  vec3 cell = floor(p);
  float burst = 0.0;

  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      for (int z = -1; z <= 1; z++) {
        vec3 offset = vec3(float(x), float(y), float(z));
        vec3 pos = cell + offset;

        // Random offset inside the cell
        vec3 randOffset = fract(sin(pos * 17.0) * 43758.5453);
        vec3 feature = pos + randOffset;

        // Soft contribution using smooth inverse falloff
        float dist = length(p - feature);
        float strength = smoothstep(1.0, 0.0, dist);  // Soft fade-in
        burst += strength;
      }
    }
  }

  return burst;
}

void main() {
  vec3 dir = normalize(vWorldPosition);

  float height = dir.y * 0.5 + 0.5;
  float angle = (atan(dir.z, dir.x) / (2.0 * 3.1415926)) + 0.5;

  // Subtle directional gradient
  float baseT = clamp(height + angle * 0.1, 0.0, 1.0);

  // Bursts of randomness (scale position to control density)
  float bursts = burstField(vWorldPosition * 0.03) * 0.01;

  float t = clamp(baseT + bursts, 0.0, 1.0);

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

  const currentKey = useRef(initialKey);

  const uniforms = useMemo(() => ({
    colorA: { value: currentA.current.clone() },
    colorB: { value: currentB.current.clone() }
  }), []);

  useFrame(() => {
    if (!materialRef.current) return;

    currentA.current.lerp(targetA.current, 0.05);
    currentB.current.lerp(targetB.current, 0.05);

    uniforms.colorA.value.copy(currentA.current);
    uniforms.colorB.value.copy(currentB.current);
    materialRef.current.needsUpdate = true;
  });

  useImperativeHandle(ref, () => ({
    updateBackground: (key) => {
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

    getCurrentKey: () => currentKey.current,

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
        uniforms={uniforms}
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
