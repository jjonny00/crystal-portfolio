import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

const OverviewConnectorLines = ({
  enabled,
  connectorFacetKey,
  domAnchorClient,
  overviewWorldAnchors,
  color = '#ff0000',
}) => {
  const { camera, size } = useThree();

  const points = useMemo(() => {
    if (!enabled || !connectorFacetKey || !domAnchorClient || !overviewWorldAnchors) return null;
    const start = overviewWorldAnchors[connectorFacetKey];
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

    return [start.clone(), end.clone()];
  }, [enabled, connectorFacetKey, domAnchorClient, overviewWorldAnchors, camera, size.width, size.height]);

  if (!points) return null;

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1.8}
      depthTest={false}
      transparent={false}
    />
  );
};

export default OverviewConnectorLines;
