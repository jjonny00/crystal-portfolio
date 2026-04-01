import React, { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

const DEBUG_LINE_COLOR = '#ff4d4d';

const isFiniteVector3 = (value) => (
  value && Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z)
);

const HoverConnectorLine = ({
  enabled,
  hoveredFacetKey,
  domAnchorsClient = {},
  overviewWorldAnchors,
}) => {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log('🔗 HoverConnectorLine mount/update', {
      enabled,
      hoveredFacetKey,
      domAnchorCount: Object.keys(domAnchorsClient || {}).length,
      worldAnchorCount: Object.keys(overviewWorldAnchors || {}).length,
    });
  }, [enabled, hoveredFacetKey, domAnchorsClient, overviewWorldAnchors]);

  const connectors = useMemo(() => {
    if (!enabled || !overviewWorldAnchors || !domAnchorsClient) return [];

    const width = size.width || 1;
    const height = size.height || 1;
    const raycaster = new THREE.Raycaster();
    const planeNormal = new THREE.Vector3();
    camera.getWorldDirection(planeNormal);

    const nextConnectors = Object.entries(domAnchorsClient).flatMap(([facetKey, anchorClient]) => {
      const start = overviewWorldAnchors[facetKey];
      if (!start || !anchorClient) {
        if (import.meta.env.DEV) {
          console.log('🔗 Skipping connector (missing start or anchor client)', {
            facetKey,
            hasStart: Boolean(start),
            hasAnchorClient: Boolean(anchorClient),
          });
        }
        return [];
      }

      const ndc = new THREE.Vector2(
        (anchorClient.x / width) * 2 - 1,
        -(anchorClient.y / height) * 2 + 1,
      );

      raycaster.setFromCamera(ndc, camera);

      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, start);
      const end = new THREE.Vector3();
      const intersected = raycaster.ray.intersectPlane(plane, end);

      if (!intersected) {
        if (import.meta.env.DEV) {
          console.log('🔗 Skipping connector (ray/plane miss)', { facetKey });
        }
        return [];
      }

      if (!isFiniteVector3(start) || !isFiniteVector3(end)) {
        if (import.meta.env.DEV) {
          console.log('🔗 Skipping connector (invalid geometry)', {
            facetKey,
            start,
            end,
          });
        }
        return [];
      }

      return [{
        facetKey,
        points: [start.clone(), end.clone()],
      }];
    });

    if (import.meta.env.DEV) {
      console.log('🔗 Connector build result', {
        attempted: Object.keys(domAnchorsClient).length,
        rendered: nextConnectors.length,
      });
    }

    return nextConnectors;
  }, [enabled, overviewWorldAnchors, domAnchorsClient, camera, size.width, size.height]);

  if (!connectors.length) return null;

  return (
    <group>
      {connectors.map((connector) => (
        <Line
          key={connector.facetKey}
          points={connector.points}
          color={DEBUG_LINE_COLOR}
          lineWidth={1.25}
          depthTest={false}
          transparent={false}
        />
      ))}
    </group>
  );
};

export default HoverConnectorLine;
