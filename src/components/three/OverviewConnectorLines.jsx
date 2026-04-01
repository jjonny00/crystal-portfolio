import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

const OverviewConnectorLines = ({
  enabled,
  resolvedConnectorPairs,
  alwaysOnDomAnchorsByRuntimeKey,
  overviewWorldAnchors,
  color = '#ff0000',
  hoveredSceneFacetKey = null,
}) => {
  const { camera, size } = useThree();
  const [geometryVersion, setGeometryVersion] = useState(0);
  const tensionByConnectorRef = useRef({});

  const IDLE_DROOP = 0.26;
  const ACTIVE_DROOP = 0;
  const DROOP_LERP_SPEED = 8.5;
  const MAX_DROOP_WORLD_UNITS = 0.22;
  const MIN_DROOP_WORLD_UNITS = 0.02;
  const CURVE_SAMPLES = 14;

  useEffect(() => {
    console.log('[OverviewConnectorLines mounted]', {
      enabled,
      resolvedConnectorPairsCount: resolvedConnectorPairs?.length ?? 0,
      alwaysOnDomAnchorsCount: Object.keys(alwaysOnDomAnchorsByRuntimeKey || {}).length,
      overviewWorldAnchorsExists: Boolean(overviewWorldAnchors),
    });
  }, []);

  useFrame((_, delta) => {
    if (!enabled || !resolvedConnectorPairs?.length) return;

    let changed = false;

    resolvedConnectorPairs.forEach(({ runtimeDomKey, sceneWorldKey }) => {
      const connectorKey = `${runtimeDomKey}__${sceneWorldKey}`;
      const current = tensionByConnectorRef.current[connectorKey] ?? IDLE_DROOP;
      const target = hoveredSceneFacetKey === sceneWorldKey ? ACTIVE_DROOP : IDLE_DROOP;
      const next = THREE.MathUtils.damp(current, target, DROOP_LERP_SPEED, delta);

      if (Math.abs(next - current) > 0.0006) {
        changed = true;
      }
      tensionByConnectorRef.current[connectorKey] = next;
    });

    if (changed) {
      setGeometryVersion((version) => version + 1);
    }
  });

  const connectors = useMemo(() => {
    if (!enabled || !resolvedConnectorPairs?.length || !overviewWorldAnchors) return [];

    const width = size.width || 1;
    const height = size.height || 1;
    const raycaster = new THREE.Raycaster();
    const planeNormal = new THREE.Vector3();
    camera.getWorldDirection(planeNormal);

    return resolvedConnectorPairs.flatMap(({ runtimeDomKey, sceneWorldKey }) => {
      const domAnchor = alwaysOnDomAnchorsByRuntimeKey?.[runtimeDomKey];
      const start = overviewWorldAnchors?.[sceneWorldKey];
      if (!domAnchor || !start) return [];

      const ndc = new THREE.Vector2(
        (domAnchor.x / width) * 2 - 1,
        -(domAnchor.y / height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, start);
      const end = new THREE.Vector3();
      const intersected = raycaster.ray.intersectPlane(plane, end);
      if (!intersected) return [];

      const connectorKey = `${runtimeDomKey}__${sceneWorldKey}`;
      const droopTension = tensionByConnectorRef.current[connectorKey] ?? IDLE_DROOP;
      const straightVec = end.clone().sub(start);
      const distance = straightVec.length();

      if (distance <= Number.EPSILON) {
        return [{
          key: connectorKey,
          points: [start.clone(), end.clone()],
        }];
      }

      const cameraRight = new THREE.Vector3().crossVectors(planeNormal, camera.up).normalize();
      const droopDirection = new THREE.Vector3().crossVectors(cameraRight, planeNormal).normalize().negate();

      const sagDistance = THREE.MathUtils.clamp(
        distance * droopTension,
        MIN_DROOP_WORLD_UNITS,
        MAX_DROOP_WORLD_UNITS,
      );
      const midpoint = start.clone().lerp(end, 0.5);
      const controlPoint = midpoint.addScaledVector(droopDirection, sagDistance);

      const curvePoints = [];
      for (let i = 0; i <= CURVE_SAMPLES; i += 1) {
        const t = i / CURVE_SAMPLES;
        const oneMinusT = 1 - t;
        const curvePoint = new THREE.Vector3()
          .addScaledVector(start, oneMinusT * oneMinusT)
          .addScaledVector(controlPoint, 2 * oneMinusT * t)
          .addScaledVector(end, t * t);
        curvePoints.push(curvePoint);
      }

      return [{
        key: connectorKey,
        points: curvePoints,
      }];
    });
  }, [enabled, resolvedConnectorPairs, alwaysOnDomAnchorsByRuntimeKey, overviewWorldAnchors, camera, size.width, size.height, geometryVersion]);

  if (!connectors.length) return null;

  return (
    <>
      {connectors.map((connector) => (
        <Line
          key={connector.key}
          points={connector.points}
          color={color}
          lineWidth={1.8}
          depthTest={false}
          transparent={false}
        />
      ))}
    </>
  );
};

export default OverviewConnectorLines;
