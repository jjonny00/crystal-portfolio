import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const SEGMENTS = 20;
const EPSILON = 0.001;

const HoverConnectorLine = ({
  enabled,
  hoveredFacetKey,
  domAnchorClient,
  overviewWorldAnchors,
}) => {
  const { camera, size, clock } = useThree();
  const lineRef = useRef(null);
  const materialRef = useRef(null);
  const visibilityRef = useRef(0);

  const scratch = useMemo(() => ({
    ndc: new THREE.Vector2(),
    raycaster: new THREE.Raycaster(),
    planeNormal: new THREE.Vector3(),
    cameraRight: new THREE.Vector3(),
    domWorld: new THREE.Vector3(),
    midpoint: new THREE.Vector3(),
    control: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    side: new THREE.Vector3(),
    curve: new THREE.QuadraticBezierCurve3(),
    points: Array.from({ length: SEGMENTS + 1 }, () => new THREE.Vector3()),
    positions: new Float32Array((SEGMENTS + 1) * 3),
  }), []);

  useEffect(() => {
    if (!lineRef.current) return;
    lineRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(scratch.positions, 3));
  }, [scratch]);

  useFrame((_, delta) => {
    const facetAnchor = hoveredFacetKey ? overviewWorldAnchors?.[hoveredFacetKey] : null;
    const shouldShow = Boolean(enabled && facetAnchor && domAnchorClient);

    const damping = 1 - Math.exp(-delta * 18);
    visibilityRef.current += ((shouldShow ? 1 : 0) - visibilityRef.current) * damping;

    const visibility = visibilityRef.current;
    if (!lineRef.current || !materialRef.current) return;

    if (!shouldShow && visibility < EPSILON) {
      lineRef.current.visible = false;
      return;
    }

    if (!facetAnchor || !domAnchorClient) return;

    lineRef.current.visible = true;

    scratch.ndc.set(
      (domAnchorClient.x / (size.width || 1)) * 2 - 1,
      -(domAnchorClient.y / (size.height || 1)) * 2 + 1,
    );

    scratch.raycaster.setFromCamera(scratch.ndc, camera);

    camera.getWorldDirection(scratch.planeNormal);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(scratch.planeNormal, facetAnchor);

    if (!scratch.raycaster.ray.intersectPlane(plane, scratch.domWorld)) {
      lineRef.current.visible = false;
      return;
    }

    scratch.midpoint.copy(facetAnchor).lerp(scratch.domWorld, 0.5);
    scratch.direction.copy(scratch.domWorld).sub(facetAnchor);

    const length = Math.max(scratch.direction.length(), 0.0001);
    scratch.side.copy(scratch.direction).cross(scratch.planeNormal).normalize();
    scratch.control
      .copy(scratch.midpoint)
      .addScaledVector(scratch.side, length * 0.12)
      .addScaledVector(camera.up, length * 0.055);

    scratch.cameraRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    const sway = Math.sin(clock.elapsedTime * 6.5) * length * 0.012 * visibility;
    scratch.control.addScaledVector(scratch.cameraRight, sway);

    scratch.curve.v0.copy(facetAnchor);
    scratch.curve.v1.copy(scratch.control);
    scratch.curve.v2.copy(scratch.domWorld);

    for (let i = 0; i <= SEGMENTS; i += 1) {
      scratch.curve.getPoint(i / SEGMENTS, scratch.points[i]);
    }

    for (let i = 0; i <= SEGMENTS; i += 1) {
      const p = scratch.points[i];
      const offset = i * 3;
      scratch.positions[offset] = p.x;
      scratch.positions[offset + 1] = p.y;
      scratch.positions[offset + 2] = p.z;
    }

    const geometry = lineRef.current.geometry;
    geometry.setDrawRange(0, Math.max(2, Math.floor((SEGMENTS + 1) * visibility)));
    geometry.attributes.position.needsUpdate = true;

    materialRef.current.opacity = 0.85 * visibility;
  });

  return (
    <line ref={lineRef} renderOrder={9000}>
      <bufferGeometry />
      <lineBasicMaterial
        ref={materialRef}
        color="#dff5ff"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </line>
  );
};

export default HoverConnectorLine;
