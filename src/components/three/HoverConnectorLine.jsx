import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

const HoverConnectorLine = ({
  enabled,
  domAnchorsClient,
  overviewWorldAnchors,
  color = '#ff6a6a',
}) => {
  const { camera, size } = useThree();

  const connectorPoints = useMemo(() => {
    if (!enabled || !domAnchorsClient || !overviewWorldAnchors) return [];

    const width = size.width || 1;
    const height = size.height || 1;

    return Object.entries(domAnchorsClient).flatMap(([facetKey, domAnchorClient]) => {
      const start = overviewWorldAnchors[facetKey];
      if (!start || !domAnchorClient) return [];

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
      if (!intersected) return [];

      return [{
        facetKey,
        points: [start.clone(), end.clone()],
      }];
    });
  }, [enabled, domAnchorsClient, overviewWorldAnchors, camera, size.width, size.height]);

  if (!connectorPoints.length) return null;

  return (
    <group>
      {connectorPoints.map((connector) => (
        <Line
          key={connector.facetKey}
          points={connector.points}
          color={color}
          lineWidth={1.2}
          depthTest={false}
        />
      ))}
    </group>
  );
};

export default HoverConnectorLine;
