import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const SEGMENT_COUNT = 12;
const SEGMENT_THICKNESS = 0.016;
const SEGMENT_GAP = 0.82;
const CONNECTOR_COLOR = new THREE.Color('#d6ecff');

const tempVecA = new THREE.Vector3();
const tempVecB = new THREE.Vector3();
const tempVecC = new THREE.Vector3();
const tempQuat = new THREE.Quaternion();
const tempScale = new THREE.Vector3();
const lookMatrix = new THREE.Matrix4();

const easeOutCubic = (t) => 1 - (1 - t) ** 3;

const HoverConnectorLine = ({
  enabled,
  hoveredFacetKey,
  domAnchorClient,
  overviewWorldAnchors,
  color,
}) => {
  const { camera, size } = useThree();
  const meshRef = useRef(null);
  const groupRef = useRef(null);
  const progressRef = useRef(0);
  const dummyRef = useRef(new THREE.Object3D());

  const connectorPath = useMemo(() => {
    if (!enabled || !hoveredFacetKey || !domAnchorClient || !overviewWorldAnchors) return null;

    const start = overviewWorldAnchors[hoveredFacetKey];
    if (!start) return null;

    const width = size.width || 1;
    const height = size.height || 1;
    const ndc = new THREE.Vector2(
      (domAnchorClient.x / width) * 2 - 1,
      -(domAnchorClient.y / height) * 2 + 1,
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, camera);

    const planeNormal = new THREE.Vector3();
    camera.getWorldDirection(planeNormal);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, start);

    const end = new THREE.Vector3();
    const intersected = raycaster.ray.intersectPlane(plane, end);
    if (!intersected) return null;

    const pathDir = end.clone().sub(start);
    const right = new THREE.Vector3();
    camera.getWorldDirection(right);
    right.cross(camera.up).normalize();

    const bend = right.multiplyScalar(pathDir.length() * 0.12);
    const midA = start.clone().lerp(end, 0.35).add(bend);
    const midB = start.clone().lerp(end, 0.72).addScaledVector(bend, -0.45);

    const curve = new THREE.CatmullRomCurve3([start.clone(), midA, midB, end.clone()], false, 'centripetal', 0.05);

    return {
      curve,
      length: curve.getLength(),
    };
  }, [enabled, hoveredFacetKey, domAnchorClient, overviewWorldAnchors, camera, size.width, size.height]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || !groupRef.current) return;

    const targetProgress = connectorPath ? 1 : 0;
    const damping = connectorPath ? 9 : 12;
    progressRef.current = THREE.MathUtils.damp(progressRef.current, targetProgress, damping, delta);

    const progress = progressRef.current;
    const showGroup = progress > 0.01;
    groupRef.current.visible = showGroup;
    if (!showGroup) return;

    const material = mesh.material;
    material.opacity = THREE.MathUtils.clamp(progress * 1.4, 0, 0.9);
    material.color.set(color || CONNECTOR_COLOR);

    const dummy = dummyRef.current;
    const curve = connectorPath?.curve;
    const length = connectorPath?.length || 1;

    for (let i = 0; i < SEGMENT_COUNT; i += 1) {
      const u = (i + 0.35) / SEGMENT_COUNT;
      const assemble = THREE.MathUtils.clamp((progress - i * 0.055) / 0.36, 0, 1);

      if (!curve || assemble <= 0.001) {
        tempScale.set(0.00001, 0.00001, 0.00001);
        dummy.position.set(0, -999, 0);
        dummy.scale.copy(tempScale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      curve.getPointAt(u, tempVecA);
      curve.getTangentAt(u, tempVecB).normalize();
      lookMatrix.lookAt(tempVecA, tempVecA.clone().add(tempVecB), camera.up);
      tempQuat.setFromRotationMatrix(lookMatrix);

      tempVecC.crossVectors(tempVecB, camera.up).normalize();
      const fractureOffset = (1 - assemble) * 0.07 * (i % 2 === 0 ? 1 : -1);
      tempVecA.addScaledVector(tempVecC, fractureOffset);

      const segmentLength = (length / SEGMENT_COUNT) * SEGMENT_GAP;
      const lengthScale = segmentLength * easeOutCubic(assemble);
      const thicknessScale = SEGMENT_THICKNESS * (0.7 + 0.3 * assemble);
      tempScale.set(thicknessScale, thicknessScale * 0.72, Math.max(lengthScale, 0.00001));

      dummy.position.copy(tempVecA);
      dummy.quaternion.copy(tempQuat);
      dummy.scale.copy(tempScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef} visible={false}>
      <instancedMesh ref={meshRef} args={[null, null, SEGMENT_COUNT]} renderOrder={120}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial transparent opacity={0} depthTest={false} toneMapped={false} />
      </instancedMesh>
    </group>
  );
};

export default HoverConnectorLine;
