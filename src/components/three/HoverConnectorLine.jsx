import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

const CURVE_SEGMENTS = 32;
const PARTICLE_COUNT = 26;
const STREAMER_COUNT = 8;

const tempVec2 = new THREE.Vector2();
const tempVec3 = new THREE.Vector3();
const tempVec3B = new THREE.Vector3();
const tempVec3C = new THREE.Vector3();
const tempRaycaster = new THREE.Raycaster();
const tempPlaneNormal = new THREE.Vector3();
const tempPlane = new THREE.Plane();

function resolveEndpoints({ enabled, hoveredFacetKey, domAnchorClient, overviewWorldAnchors, camera, size }) {
  if (!enabled || !hoveredFacetKey || !domAnchorClient || !overviewWorldAnchors) return null;

  const start = overviewWorldAnchors[hoveredFacetKey];
  if (!start) return null;

  const width = size.width || 1;
  const height = size.height || 1;

  tempVec2.set((domAnchorClient.x / width) * 2 - 1, -(domAnchorClient.y / height) * 2 + 1);
  tempRaycaster.setFromCamera(tempVec2, camera);

  camera.getWorldDirection(tempPlaneNormal);
  tempPlane.setFromNormalAndCoplanarPoint(tempPlaneNormal, start);

  const end = new THREE.Vector3();
  const intersected = tempRaycaster.ray.intersectPlane(tempPlane, end);
  if (!intersected) return null;

  return { start: start.clone(), end };
}

function buildCurve(start, end, camera) {
  const mid = tempVec3.copy(start).lerp(end, 0.5);
  const dir = tempVec3B.copy(end).sub(start);
  const distance = Math.max(dir.length(), 0.001);

  const arcLift = THREE.MathUtils.clamp(distance * 0.14, 0.12, 0.52);
  const cameraDir = tempVec3C.set(0, 0, -1);
  camera.getWorldDirection(cameraDir);

  const control1 = new THREE.Vector3().copy(start).lerp(mid, 0.42);
  control1.y += arcLift;
  control1.addScaledVector(cameraDir, -distance * 0.04);

  const control2 = new THREE.Vector3().copy(end).lerp(mid, 0.42);
  control2.y += arcLift * 0.84;
  control2.addScaledVector(cameraDir, -distance * 0.03);

  return new THREE.CubicBezierCurve3(start.clone(), control1, control2, end.clone());
}

const HoverConnectorLine = ({
  enabled,
  hoveredFacetKey,
  domAnchorClient,
  overviewWorldAnchors,
  hybridPrototypeEnabled = false,
  color = 'rgba(255,255,255,0.72)',
}) => {
  const { camera, size, clock } = useThree();

  const simplePoints = useMemo(() => {
    if (hybridPrototypeEnabled) return null;
    const points = resolveEndpoints({
      enabled,
      hoveredFacetKey,
      domAnchorClient,
      overviewWorldAnchors,
      camera,
      size,
    });
    return points ? [points.start, points.end] : null;
  }, [
    hybridPrototypeEnabled,
    enabled,
    hoveredFacetKey,
    domAnchorClient,
    overviewWorldAnchors,
    camera,
    size,
  ]);

  const lineGeometryRef = useRef(null);
  const lineMaterialRef = useRef(null);
  const lineHighlightGeometryRef = useRef(null);
  const lineHighlightMaterialRef = useRef(null);
  const particlesGeometryRef = useRef(null);
  const particlesMaterialRef = useRef(null);
  const curveRef = useRef(null);
  const curveSamplesRef = useRef(Array.from({ length: CURVE_SEGMENTS }, () => new THREE.Vector3()));
  const lineFadeRef = useRef(0);
  const gatherRef = useRef(0);
  const particleDataRef = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const theta = Math.random() * Math.PI * 2;
      const radius = 0.8 + Math.random() * 2.0;
      const height = (Math.random() - 0.5) * 1.8;

      return {
        offset: Math.random(),
        speed: 0.4 + Math.random() * 0.45,
        jitter: 0.015 + Math.random() * 0.03,
        seed: i + Math.random() * 100,
        basePosition: new THREE.Vector3(Math.cos(theta) * radius, height, Math.sin(theta) * radius),
      };
    }),
  );

  const particlePositions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);

  useFrame((_, delta) => {
    if (!hybridPrototypeEnabled) return;

    const hasHover = Boolean(enabled && hoveredFacetKey && domAnchorClient);
    const endpoints = hasHover
      ? resolveEndpoints({ enabled, hoveredFacetKey, domAnchorClient, overviewWorldAnchors, camera, size })
      : null;

    const targetFade = endpoints ? 1 : 0;
    lineFadeRef.current = THREE.MathUtils.damp(lineFadeRef.current, targetFade, 7.5, delta);
    gatherRef.current = THREE.MathUtils.damp(gatherRef.current, targetFade, 4.5, delta);

    if (lineMaterialRef.current) {
      lineMaterialRef.current.opacity = lineFadeRef.current * 0.85;
    }
    if (lineHighlightMaterialRef.current) {
      lineHighlightMaterialRef.current.opacity = lineFadeRef.current * 0.38;
    }
    if (particlesMaterialRef.current) {
      particlesMaterialRef.current.opacity = 0.2 + gatherRef.current * 0.45;
    }

    if (endpoints) {
      const curve = buildCurve(endpoints.start, endpoints.end, camera);
      curveRef.current = curve;

      const linePositions = lineGeometryRef.current?.attributes?.position?.array;
      const highlightPositions = lineHighlightGeometryRef.current?.attributes?.position?.array;
      if (linePositions && highlightPositions) {
        for (let i = 0; i < CURVE_SEGMENTS; i += 1) {
          const t = i / (CURVE_SEGMENTS - 1);
          const sample = curve.getPoint(t);
          curveSamplesRef.current[i].copy(sample);
          const idx = i * 3;
          linePositions[idx] = sample.x;
          linePositions[idx + 1] = sample.y;
          linePositions[idx + 2] = sample.z;
          highlightPositions[idx] = sample.x;
          highlightPositions[idx + 1] = sample.y;
          highlightPositions[idx + 2] = sample.z;
        }

        lineGeometryRef.current.attributes.position.needsUpdate = true;
        lineHighlightGeometryRef.current.attributes.position.needsUpdate = true;
        lineGeometryRef.current.computeBoundingSphere();
        lineHighlightGeometryRef.current.computeBoundingSphere();
      }
    }

    const time = clock.elapsedTime;
    for (let i = 0; i < PARTICLE_COUNT; i += 1) {
      const pdata = particleDataRef.current[i];
      const idx = i * 3;

      tempVec3.copy(pdata.basePosition);
      tempVec3.x += Math.sin(time * pdata.speed + pdata.seed) * 0.045;
      tempVec3.y += Math.cos(time * (pdata.speed * 0.72) + pdata.seed) * 0.04;
      tempVec3.z += Math.sin(time * (pdata.speed * 0.55) + pdata.seed) * 0.04;

      if (curveRef.current && gatherRef.current > 0.01) {
        const streaming = i < STREAMER_COUNT;

        if (streaming) {
          const progress = (time * (0.24 + i * 0.007) + pdata.offset * 2.0) % 1;
          const onCurve = curveRef.current.getPoint(progress);
          const pulse = 0.55 + Math.sin((time + pdata.seed) * 4.4) * 0.45;
          tempVec3.lerp(onCurve, gatherRef.current * (0.7 + pulse * 0.25));
        } else {
          const sampleIndex = Math.floor(((pdata.offset + time * 0.01) % 1) * (CURVE_SEGMENTS - 1));
          const nearest = curveSamplesRef.current[sampleIndex];
          tempVec3.lerp(nearest, gatherRef.current * 0.18);
        }
      }

      tempVec3.x += Math.sin(time * 1.2 + pdata.seed) * pdata.jitter;
      tempVec3.y += Math.cos(time * 1.1 + pdata.seed * 0.5) * pdata.jitter;

      particlePositions[idx] = tempVec3.x;
      particlePositions[idx + 1] = tempVec3.y;
      particlePositions[idx + 2] = tempVec3.z;
    }

    if (particlesGeometryRef.current?.attributes?.position) {
      particlesGeometryRef.current.attributes.position.needsUpdate = true;
      particlesGeometryRef.current.computeBoundingSphere();
    }
  });

  if (!hybridPrototypeEnabled) {
    if (!simplePoints) return null;

    return (
      <Line
        points={simplePoints}
        color={color}
        lineWidth={1}
        depthTest={false}
      />
    );
  }

  return (
    <group renderOrder={5000}>
      <line frustumCulled={false}>
        <bufferGeometry ref={lineGeometryRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(CURVE_SEGMENTS * 3), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          ref={lineMaterialRef}
          color="#f8fcff"
          transparent
          opacity={0}
          depthTest={false}
          depthWrite={false}
        />
      </line>

      <line frustumCulled={false}>
        <bufferGeometry ref={lineHighlightGeometryRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(CURVE_SEGMENTS * 3), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          ref={lineHighlightMaterialRef}
          color="#d8f0ff"
          transparent
          opacity={0}
          depthTest={false}
          depthWrite={false}
        />
      </line>

      <points frustumCulled={false} renderOrder={5001}>
        <bufferGeometry ref={particlesGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={particlesMaterialRef}
          color="#d9f7ff"
          size={0.035}
          sizeAttenuation
          transparent
          opacity={0.2}
          depthWrite={false}
          depthTest={false}
        />
      </points>
    </group>
  );
};

export default HoverConnectorLine;
