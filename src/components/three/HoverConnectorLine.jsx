import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

const WORKING_COLOR = new THREE.Color('#9be7ff');
const START_WORLD = new THREE.Vector3();
const END_WORLD = new THREE.Vector3();
const CAMERA_DIRECTION = new THREE.Vector3();
const CAMERA_RIGHT = new THREE.Vector3();
const CAMERA_UP = new THREE.Vector3();
const TEMP_VEC = new THREE.Vector3();
const NDC = new THREE.Vector2();
const RAYCASTER = new THREE.Raycaster();
const PLANE = new THREE.Plane();

const HoverConnectorLine = ({
  enabled,
  hoveredFacetKey,
  domAnchorClient,
  overviewWorldAnchors,
  prototypeEnabled = true,
}) => {
  const { camera, size } = useThree();
  const groupRef = useRef();
  const coreLineRef = useRef();
  const glowLineRef = useRef();
  const pulseRef = useRef();
  const fadeRef = useRef(0);
  const pulseTravelRef = useRef(0);

  const curve = useMemo(() => {
    if (!prototypeEnabled || !enabled || !hoveredFacetKey || !domAnchorClient || !overviewWorldAnchors) return null;

    const start = overviewWorldAnchors[hoveredFacetKey];
    if (!start) return null;

    const width = size.width || 1;
    const height = size.height || 1;
    NDC.set((domAnchorClient.x / width) * 2 - 1, -(domAnchorClient.y / height) * 2 + 1);

    RAYCASTER.setFromCamera(NDC, camera);

    camera.getWorldDirection(CAMERA_DIRECTION);
    PLANE.setFromNormalAndCoplanarPoint(CAMERA_DIRECTION, start);

    const intersected = RAYCASTER.ray.intersectPlane(PLANE, END_WORLD);
    if (!intersected) return null;

    START_WORLD.copy(start);

    camera.getWorldDirection(CAMERA_DIRECTION);
    CAMERA_RIGHT.crossVectors(CAMERA_DIRECTION, camera.up).normalize();
    CAMERA_UP.copy(camera.up).normalize();

    const distance = START_WORLD.distanceTo(END_WORLD);
    const arcAmount = THREE.MathUtils.clamp(distance * 0.2, 0.09, 0.42);

    const controlA = START_WORLD
      .clone()
      .lerp(END_WORLD, 0.35)
      .add(CAMERA_UP.clone().multiplyScalar(arcAmount * 0.55))
      .add(CAMERA_RIGHT.clone().multiplyScalar(-arcAmount * 0.35));

    const controlB = START_WORLD
      .clone()
      .lerp(END_WORLD, 0.7)
      .add(CAMERA_UP.clone().multiplyScalar(arcAmount * 0.2))
      .add(CAMERA_RIGHT.clone().multiplyScalar(arcAmount * 0.45));

    return new THREE.CubicBezierCurve3(START_WORLD.clone(), controlA, controlB, END_WORLD.clone());
  }, [prototypeEnabled, enabled, hoveredFacetKey, domAnchorClient, overviewWorldAnchors, camera, size.width, size.height]);

  const sampledPoints = useMemo(() => (curve ? curve.getPoints(24) : null), [curve]);

  const colorGradient = useMemo(() => {
    if (!sampledPoints) return null;

    return sampledPoints.map((_, idx) => {
      const t = idx / Math.max(sampledPoints.length - 1, 1);
      const opacityShape = Math.pow(Math.sin(t * Math.PI), 0.85);
      WORKING_COLOR.set('#9be7ff').lerp(new THREE.Color('#e8f8ff'), t * 0.5);
      return WORKING_COLOR.clone().multiplyScalar(0.2 + opacityShape * 0.8);
    });
  }, [sampledPoints]);

  useFrame((_, delta) => {
    const targetFade = curve ? 1 : 0;
    fadeRef.current = THREE.MathUtils.damp(fadeRef.current, targetFade, targetFade > fadeRef.current ? 8 : 10, delta);

    if (groupRef.current) {
      groupRef.current.visible = fadeRef.current > 0.01;
    }

    if (coreLineRef.current?.material) {
      coreLineRef.current.material.opacity = fadeRef.current * 0.5;
      coreLineRef.current.material.needsUpdate = true;
    }

    if (glowLineRef.current?.material) {
      glowLineRef.current.material.opacity = fadeRef.current * 0.14;
      glowLineRef.current.material.needsUpdate = true;
    }

    if (!curve || !pulseRef.current) return;

    pulseTravelRef.current = (pulseTravelRef.current + delta * 0.72) % 1;
    curve.getPointAt(pulseTravelRef.current, TEMP_VEC);
    pulseRef.current.position.copy(TEMP_VEC);

    const pulseOpacity = (0.25 + 0.55 * Math.sin(pulseTravelRef.current * Math.PI)) * fadeRef.current;
    pulseRef.current.material.opacity = pulseOpacity;
    pulseRef.current.material.needsUpdate = true;
  });

  if (!sampledPoints || !colorGradient) return null;

  return (
    <group ref={groupRef}>
      <Line
        ref={coreLineRef}
        points={sampledPoints}
        vertexColors={colorGradient}
        transparent
        opacity={fadeRef.current * 0.5}
        lineWidth={1.2}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
      <Line
        ref={glowLineRef}
        points={sampledPoints}
        color="#d7f4ff"
        transparent
        opacity={fadeRef.current * 0.14}
        lineWidth={2.2}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
      <mesh ref={pulseRef} renderOrder={11}>
        <sphereGeometry args={[0.022, 10, 10]} />
        <meshBasicMaterial
          color="#f1feff"
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

export default HoverConnectorLine;
