import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

const HoverConnectorLine = ({
  enabled,
  hoveredFacetKey,
  domAnchorClient,
  domAnchorsClient,
  overviewWorldAnchors,
  color = 'rgba(255,255,255,0.72)',
}) => {
  const { camera, size } = useThree();

  const connectorPoints = useMemo(() => {
    if (!enabled || !overviewWorldAnchors) return [];
    const width = size.width || 1;
    const height = size.height || 1;

    const buildPoints = (facetKey, anchorClient) => {
      const start = overviewWorldAnchors[facetKey];
      if (!start || !anchorClient) return null;

      const ndc = new THREE.Vector2(
        (anchorClient.x / width) * 2 - 1,
        -(anchorClient.y / height) * 2 + 1,
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(ndc, camera);

      const planeNormal = new THREE.Vector3();
      camera.getWorldDirection(planeNormal);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, start);

      const end = new THREE.Vector3();
      const intersected = raycaster.ray.intersectPlane(plane, end);
      if (!intersected) return null;

      return [start.clone(), end.clone()];
    };

    const allAnchors = domAnchorsClient && Object.keys(domAnchorsClient).length > 0
      ? Object.entries(domAnchorsClient)
      : (hoveredFacetKey && domAnchorClient ? [[hoveredFacetKey, domAnchorClient]] : []);

    return allAnchors.flatMap(([facetKey, anchorClient]) => {
      const points = buildPoints(facetKey, anchorClient);
      return points ? [{ facetKey, points }] : [];
    });
  }, [enabled, hoveredFacetKey, domAnchorClient, domAnchorsClient, overviewWorldAnchors, camera, size.width, size.height]);

  if (!connectorPoints.length) return null;

  return (
    <group>
      {connectorPoints.map((connector) => (
        <Line
          key={connector.facetKey}
          points={connector.points}
          color={color}
          lineWidth={1}
          depthTest={false}
        />
      ))}
    </group>
  );
};

export default HoverConnectorLine;
