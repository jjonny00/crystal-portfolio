import React, { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

const OverviewConnectorLines = ({
  enabled,
  resolvedConnectorPairs,
  alwaysOnDomAnchorsByRuntimeKey,
  overviewWorldAnchors,
  color = '#ff0000',
}) => {
  const { camera, size } = useThree();

  useEffect(() => {
    console.log('[OverviewConnectorLines mounted]', {
      enabled,
      resolvedConnectorPairsCount: resolvedConnectorPairs?.length ?? 0,
      alwaysOnDomAnchorsCount: Object.keys(alwaysOnDomAnchorsByRuntimeKey || {}).length,
      overviewWorldAnchorsExists: Boolean(overviewWorldAnchors),
    });
  }, []);

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

      return [{
        key: `${runtimeDomKey}__${sceneWorldKey}`,
        points: [start.clone(), end.clone()],
      }];
    });
  }, [enabled, resolvedConnectorPairs, alwaysOnDomAnchorsByRuntimeKey, overviewWorldAnchors, camera, size.width, size.height]);

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
