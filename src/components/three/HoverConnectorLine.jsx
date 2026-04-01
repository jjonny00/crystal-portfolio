import React, { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

const IDLE_CONNECTOR_COLOR = '#5a2a1a';
const DROOP_OFFSET = 0.55;
const TENSION_IN_MS = 220;
const COLOR_IN_MS = 250;
const TENSION_OUT_MS = 460;
const COLOR_OUT_MS = 420;

const ConnectorSegment = React.memo(function ConnectorSegment({
  start,
  end,
  isActive,
  activeHex,
}) {
  const tensionRef = useRef(0);
  const colorStrengthRef = useRef(0);
  const [, forceFrame] = useState(0);
  const curveRef = useRef(new THREE.QuadraticBezierCurve3());
  const midpointRef = useRef(new THREE.Vector3());
  const droopRef = useRef(new THREE.Vector3());
  const controlRef = useRef(new THREE.Vector3());
  const idleColorRef = useRef(new THREE.Color(IDLE_CONNECTOR_COLOR));
  const activeColorRef = useRef(new THREE.Color(activeHex || '#ffffff'));
  const displayColorRef = useRef(new THREE.Color(IDLE_CONNECTOR_COLOR));

  useFrame((_, delta) => {
    const tensionTarget = isActive ? 1 : 0;
    const colorTarget = isActive ? 1 : 0;

    const tensionTau = (isActive ? TENSION_IN_MS : TENSION_OUT_MS) / 1000;
    const colorTau = (isActive ? COLOR_IN_MS : COLOR_OUT_MS) / 1000;
    const tensionLerp = 1 - Math.exp(-delta / Math.max(tensionTau, 0.0001));
    const colorLerp = 1 - Math.exp(-delta / Math.max(colorTau, 0.0001));

    const nextTension = THREE.MathUtils.lerp(tensionRef.current, tensionTarget, tensionLerp);
    const nextColorStrength = THREE.MathUtils.lerp(colorStrengthRef.current, colorTarget, colorLerp);

    if (
      Math.abs(nextTension - tensionRef.current) < 0.0005 &&
      Math.abs(nextColorStrength - colorStrengthRef.current) < 0.0005
    ) {
      return;
    }

    tensionRef.current = nextTension;
    colorStrengthRef.current = nextColorStrength;
    forceFrame((value) => (value + 1) % 100000);
  });

  const points = useMemo(() => {
    midpointRef.current.copy(start).lerp(end, 0.5);
    droopRef.current.copy(midpointRef.current).setY(midpointRef.current.y - DROOP_OFFSET);
    controlRef.current.copy(droopRef.current).lerp(midpointRef.current, tensionRef.current);

    curveRef.current.v0 = start;
    curveRef.current.v1 = controlRef.current;
    curveRef.current.v2 = end;

    return curveRef.current.getPoints(18);
  }, [start, end, tensionRef.current]);

  const color = useMemo(() => {
    activeColorRef.current.set(activeHex || '#ffffff');
    displayColorRef.current.lerpColors(
      idleColorRef.current,
      activeColorRef.current,
      colorStrengthRef.current,
    );
    return `#${displayColorRef.current.getHexString()}`;
  }, [activeHex, colorStrengthRef.current]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={isActive ? 1.1 : 1}
      depthTest={false}
    />
  );
});

const HoverConnectorLine = ({
  enabled,
  hoveredFacetKey,
  domAnchorsClient = {},
  overviewWorldAnchors,
  projectColors = {},
}) => {
  const { camera, size } = useThree();

  const connectors = useMemo(() => {
    if (!enabled || !overviewWorldAnchors || !domAnchorsClient) return [];

    const width = size.width || 1;
    const height = size.height || 1;
    const raycaster = new THREE.Raycaster();
    const planeNormal = new THREE.Vector3();
    camera.getWorldDirection(planeNormal);

    return Object.entries(domAnchorsClient).flatMap(([facetKey, anchorClient]) => {
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

      return [{
        facetKey,
        start: start.clone(),
        end: end.clone(),
      }];
    });
  }, [enabled, overviewWorldAnchors, domAnchorsClient, camera, size.width, size.height]);

  if (!connectors.length) return null;

  return (
    <group>
      {connectors.map((connector) => (
        <ConnectorSegment
          key={connector.facetKey}
          start={connector.start}
          end={connector.end}
          isActive={hoveredFacetKey === connector.facetKey}
          activeHex={projectColors[connector.facetKey]}
        />
      ))}
    </group>
  );
};

export default HoverConnectorLine;
