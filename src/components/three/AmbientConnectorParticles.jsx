import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

const PARTICLE_COUNT = 84;
const AMBIENT_RADIUS = 1.4;

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const AmbientConnectorParticles = ({
  enabled,
  hoveredFacetKey,
  domAnchorClient,
  overviewWorldAnchors,
  showGuideLine = true,
}) => {
  const { camera, size } = useThree();
  const pointsRef = useRef();
  const targetMixRef = useRef(0);
  const mixRef = useRef(0);
  const animationClock = useRef(0);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const planeNormal = useMemo(() => new THREE.Vector3(), []);
  const hoverStart = useMemo(() => new THREE.Vector3(), []);
  const hoverEnd = useMemo(() => new THREE.Vector3(), []);
  const pathVector = useMemo(() => new THREE.Vector3(), []);
  const samplePoint = useMemo(() => new THREE.Vector3(), []);
  const ambientCenter = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  const baseOffsets = useMemo(() => {
    const offsets = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = AMBIENT_RADIUS * (0.25 + Math.random() * 0.75);
      offsets[i3] = Math.sin(phi) * Math.cos(theta) * radius;
      offsets[i3 + 1] = Math.sin(phi) * Math.sin(theta) * radius;
      offsets[i3 + 2] = Math.cos(phi) * radius;
    }
    return offsets;
  }, []);

  const profileData = useMemo(() => {
    const data = new Float32Array(PARTICLE_COUNT * 4);
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const i4 = i * 4;
      data[i4] = Math.random(); // pathT
      data[i4 + 1] = 0.05 + Math.random() * 0.35; // pull affinity
      data[i4 + 2] = Math.random() * Math.PI * 2; // phase
      data[i4 + 3] = 0.6 + Math.random() * 0.7; // drift speed
    }
    return data;
  }, []);

  const positions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);

  const connectorPoints = useMemo(() => {
    if (!enabled || !hoveredFacetKey || !domAnchorClient || !overviewWorldAnchors) {
      targetMixRef.current = 0;
      return null;
    }

    const start = overviewWorldAnchors[hoveredFacetKey];
    if (!start) {
      targetMixRef.current = 0;
      return null;
    }

    const width = size.width || 1;
    const height = size.height || 1;
    const ndc = new THREE.Vector2(
      (domAnchorClient.x / width) * 2 - 1,
      -(domAnchorClient.y / height) * 2 + 1,
    );

    raycaster.setFromCamera(ndc, camera);
    camera.getWorldDirection(planeNormal);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, start);

    const intersected = raycaster.ray.intersectPlane(plane, hoverEnd);
    if (!intersected) {
      targetMixRef.current = 0;
      return null;
    }

    hoverStart.copy(start);
    targetMixRef.current = 1;
    return [hoverStart.clone(), hoverEnd.clone()];
  }, [enabled, hoveredFacetKey, domAnchorClient, overviewWorldAnchors, size.width, size.height, raycaster, camera, planeNormal, hoverEnd, hoverStart]);

  useEffect(() => {
    const center = overviewWorldAnchors?.[hoveredFacetKey] || ambientCenter;
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const i3 = i * 3;
      positions[i3] = center.x + baseOffsets[i3];
      positions[i3 + 1] = center.y + baseOffsets[i3 + 1];
      positions[i3 + 2] = center.z + baseOffsets[i3 + 2];
    }
    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  }, [baseOffsets, overviewWorldAnchors, hoveredFacetKey, positions, ambientCenter]);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points) return;

    const dt = Math.min(delta, 0.033);
    animationClock.current += dt;
    const clock = animationClock.current;

    mixRef.current += (targetMixRef.current - mixRef.current) * Math.min(1, dt * 6);
    const hoverMix = clamp01(mixRef.current);

    if (connectorPoints) {
      pathVector.subVectors(hoverEnd, hoverStart);
    }

    const center = connectorPoints ? hoverStart : ambientCenter;

    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const i3 = i * 3;
      const i4 = i * 4;

      const phase = profileData[i4 + 2];
      const speed = profileData[i4 + 3];
      const wobble = Math.sin(clock * speed + phase);
      const wobbleSecondary = Math.cos(clock * speed * 0.7 + phase * 0.6);

      const ambientX = center.x + baseOffsets[i3] + wobble * 0.025;
      const ambientY = center.y + baseOffsets[i3 + 1] + wobbleSecondary * 0.018;
      const ambientZ = center.z + baseOffsets[i3 + 2] + wobble * 0.02;

      let targetX = ambientX;
      let targetY = ambientY;
      let targetZ = ambientZ;

      if (connectorPoints) {
        const t = profileData[i4];
        samplePoint.copy(pathVector).multiplyScalar(t).add(hoverStart);

        const affinity = profileData[i4 + 1];
        const corridorWeight = clamp01((hoverMix - affinity) / (1 - affinity));
        const ripple = Math.sin(clock * 2.3 + phase * 2.0) * 0.014;

        targetX = samplePoint.x + ripple;
        targetY = samplePoint.y + Math.cos(clock * 1.8 + phase) * 0.008;
        targetZ = samplePoint.z;

        const blend = corridorWeight * hoverMix;
        positions[i3] += (THREE.MathUtils.lerp(ambientX, targetX, blend) - positions[i3]) * 0.14;
        positions[i3 + 1] += (THREE.MathUtils.lerp(ambientY, targetY, blend) - positions[i3 + 1]) * 0.14;
        positions[i3 + 2] += (THREE.MathUtils.lerp(ambientZ, targetZ, blend) - positions[i3 + 2]) * 0.14;
      } else {
        positions[i3] += (ambientX - positions[i3]) * 0.08;
        positions[i3 + 1] += (ambientY - positions[i3 + 1]) * 0.08;
        positions[i3 + 2] += (ambientZ - positions[i3 + 2]) * 0.08;
      }
    }

    points.geometry.attributes.position.needsUpdate = true;
  });

  if (!enabled) return null;

  return (
    <group>
      {showGuideLine && connectorPoints && (
        <Line
          points={connectorPoints}
          color="rgba(255,255,255,0.42)"
          lineWidth={1}
          depthTest={false}
        />
      )}
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={PARTICLE_COUNT}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#d9dde6"
          size={0.028}
          sizeAttenuation
          transparent
          opacity={0.42}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  );
};

export default AmbientConnectorParticles;
