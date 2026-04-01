import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

const IDLE_CONNECTOR_COLOR = new THREE.Color('#5a2a1a');
const TENSION_IN_MS = 220;
const TENSION_OUT_MS = 420;
const COLOR_IN_MS = 240;
const COLOR_OUT_MS = 420;

const HoverConnectorLine = ({
  enabled,
  hoveredFacetKey,
  domAnchorClient,
  overviewWorldAnchors,
  projectColors = {},
}) => {
  const { camera, size } = useThree();
  const [domAnchorsSnapshot, setDomAnchorsSnapshot] = useState({});
  const [frameVersion, setFrameVersion] = useState(0);
  const tensionRef = useRef({});
  const colorStrengthRef = useRef({});

  const measureDomAnchors = useCallback(() => {
    if (!enabled) {
      setDomAnchorsSnapshot({});
      return;
    }

    const nodes = Array.from(document.querySelectorAll('.facet-label-optimized[data-facet-key]'));
    const next = {};

    nodes.forEach((node) => {
      const facetKey = node.getAttribute('data-facet-key');
      if (!facetKey) return;
      const rect = node.getBoundingClientRect();
      next[facetKey] = {
        x: rect.left,
        y: rect.top + rect.height * 0.5,
      };
    });

    setDomAnchorsSnapshot(next);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const rafA = requestAnimationFrame(measureDomAnchors);
    const rafB = requestAnimationFrame(measureDomAnchors);
    const timeoutId = setTimeout(measureDomAnchors, 180);
    window.addEventListener('resize', measureDomAnchors);

    return () => {
      cancelAnimationFrame(rafA);
      cancelAnimationFrame(rafB);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', measureDomAnchors);
    };
  }, [enabled, measureDomAnchors]);

  useFrame((_, delta) => {
    if (!enabled) return;

    const keys = Object.keys(domAnchorsSnapshot);
    let changed = false;

    keys.forEach((key) => {
      const target = hoveredFacetKey === key ? 1 : 0;
      const tensionCurrent = tensionRef.current[key] ?? 0;
      const colorCurrent = colorStrengthRef.current[key] ?? 0;

      const tensionTau = (target > tensionCurrent ? TENSION_IN_MS : TENSION_OUT_MS) / 1000;
      const colorTau = (target > colorCurrent ? COLOR_IN_MS : COLOR_OUT_MS) / 1000;
      const tensionLerp = 1 - Math.exp(-delta / Math.max(tensionTau, 0.0001));
      const colorLerp = 1 - Math.exp(-delta / Math.max(colorTau, 0.0001));

      const nextTension = THREE.MathUtils.lerp(tensionCurrent, target, tensionLerp);
      const nextColor = THREE.MathUtils.lerp(colorCurrent, target, colorLerp);

      if (Math.abs(nextTension - tensionCurrent) > 0.0005 || Math.abs(nextColor - colorCurrent) > 0.0005) {
        tensionRef.current[key] = nextTension;
        colorStrengthRef.current[key] = nextColor;
        changed = true;
      }
    });

    if (changed) {
      setFrameVersion((value) => value + 1);
    }
  });

  const connectors = useMemo(() => {
    if (!enabled || !overviewWorldAnchors) return [];

    const width = size.width || 1;
    const height = size.height || 1;
    const raycaster = new THREE.Raycaster();
    const planeNormal = new THREE.Vector3();
    camera.getWorldDirection(planeNormal);

    const anchorsForConnectors = Object.keys(domAnchorsSnapshot).length
      ? domAnchorsSnapshot
      : (hoveredFacetKey && domAnchorClient ? { [hoveredFacetKey]: domAnchorClient } : {});

    return Object.entries(anchorsForConnectors).flatMap(([facetKey, anchorClient]) => {
      const start = overviewWorldAnchors[facetKey];
      if (!start || !anchorClient) return [];

      const ndc = new THREE.Vector2(
        (anchorClient.x / width) * 2 - 1,
        -(anchorClient.y / height) * 2 + 1,
      );

      raycaster.setFromCamera(ndc, camera);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, start);
      const end = new THREE.Vector3();
      const intersected = raycaster.ray.intersectPlane(plane, end);
      if (!intersected) return [];

      const midpoint = start.clone().lerp(end, 0.5);
      const distance = start.distanceTo(end);
      const droopAmount = THREE.MathUtils.clamp(distance * 0.12, 0.12, 0.45);
      const droopControl = midpoint.clone().setY(midpoint.y - droopAmount);
      const tension = tensionRef.current[facetKey] ?? 0;
      const control = droopControl.lerp(midpoint, tension);
      const curve = new THREE.QuadraticBezierCurve3(start.clone(), control, end.clone());

      const colorStrength = colorStrengthRef.current[facetKey] ?? 0;
      const active = new THREE.Color(projectColors[facetKey] || '#ffffff');
      const color = new THREE.Color().copy(IDLE_CONNECTOR_COLOR).lerp(active, colorStrength);

      return [{
        facetKey,
        points: curve.getPoints(16),
        color: `#${color.getHexString()}`,
      }];
    });
  }, [
    enabled,
    overviewWorldAnchors,
    domAnchorsSnapshot,
    hoveredFacetKey,
    domAnchorClient,
    camera,
    size.width,
    size.height,
    projectColors,
    frameVersion,
  ]);

  if (!connectors.length) return null;

  return (
    <group>
      {connectors.map((connector) => (
        <Line
          key={connector.facetKey}
          points={connector.points}
          color={connector.color}
          lineWidth={1}
          depthTest={false}
        />
      ))}
    </group>
  );
};

export default HoverConnectorLine;
