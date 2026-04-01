import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

const OverviewConnectorLines = ({
  enabled,
  domAnchorsClient,
  overviewWorldAnchors,
  color = 'rgba(255,255,255,0.72)',
}) => {
  const { camera, size } = useThree();

  const connectorDebug = useMemo(() => {
    const domAnchorCount = Object.keys(domAnchorsClient || {}).length;
    const worldAnchorCount = Object.keys(overviewWorldAnchors || {}).length;
    const skipped = [];

    if (!enabled) {
      return {
        domAnchorCount,
        worldAnchorCount,
        validPairs: [],
        skipped: [{ reason: 'render gate false (enabled=false)' }],
      };
    }

    if (!domAnchorsClient || !overviewWorldAnchors) {
      return {
        domAnchorCount,
        worldAnchorCount,
        validPairs: [],
        skipped: [{ reason: 'missing anchor maps' }],
      };
    }

    const width = size.width || 1;
    const height = size.height || 1;

    const validPairs = Object.entries(domAnchorsClient).flatMap(([facetKey, domAnchorClient]) => {
      const start = overviewWorldAnchors[facetKey];
      if (!domAnchorClient) {
        skipped.push({ facetKey, reason: 'missing DOM anchor' });
        return [];
      }
      if (!start) {
        skipped.push({ facetKey, reason: 'missing world anchor / bad key mapping' });
        return [];
      }

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
      if (!intersected) {
        skipped.push({ facetKey, reason: 'invalid projected endpoint (ray/plane miss)' });
        return [];
      }

      if (!Number.isFinite(start.x) || !Number.isFinite(start.y) || !Number.isFinite(start.z) ||
          !Number.isFinite(end.x) || !Number.isFinite(end.y) || !Number.isFinite(end.z)) {
        skipped.push({ facetKey, reason: 'invalid points (NaN/Infinity)' });
        return [];
      }

      return [{
        facetKey,
        points: [start.clone(), end.clone()],
      }];
    });

    return {
      domAnchorCount,
      worldAnchorCount,
      validPairs,
      skipped,
    };
  }, [enabled, domAnchorsClient, overviewWorldAnchors, camera, size.width, size.height]);

  console.log('🔎 OverviewConnectorLines runtime', {
    mounted: true,
    domAnchorCount: connectorDebug.domAnchorCount,
    worldAnchorCount: connectorDebug.worldAnchorCount,
    validConnectorPairs: connectorDebug.validPairs.length,
    attemptedRenderLines: connectorDebug.validPairs.length > 0 ? 1 : 0,
    skipped: connectorDebug.skipped,
  });

  const firstConnector = connectorDebug.validPairs[0] || null;
  if (!firstConnector) return null;

  return (
    <Line
      key={firstConnector.facetKey}
      points={firstConnector.points}
      color="#ff0000"
      lineWidth={1.8}
      depthTest={false}
      transparent={false}
    />
  );
};

export default OverviewConnectorLines;
