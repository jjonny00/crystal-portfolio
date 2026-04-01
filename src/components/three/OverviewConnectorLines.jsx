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
  const connectorAnimationRef = useRef({});

  const IDLE_DROOP = 0.52;
  const ACTIVE_DROOP = 0;
  const STRAIGHTEN_SNAP_DURATION = 0.2;
  const STRAIGHTEN_OVERSHOOT_DURATION = 0.1;
  const STRAIGHTEN_REBOUND_DURATION = 0.14;
  const STRAIGHTEN_SETTLE_DURATION = 0.12;
  const RELAX_DURATION = 0.62;
  const RELAX_OVERSHOOT_DURATION = 0.16;
  const RELAX_REBOUND_DURATION = 0.18;
  const RELAX_SETTLE_DURATION = 0.2;
  const STRAIGHT_OVERSHOOT_PROGRESS = 1.08;
  const STRAIGHT_REBOUND_PROGRESS = 0.985;
  const RELAX_OVERSHOOT_PROGRESS = -0.045;
  const RELAX_REBOUND_PROGRESS = 0.012;
  const MAX_DROOP_WORLD_UNITS = 0.3;
  const MIN_DROOP_WORLD_UNITS = 0.02;
  const CONTROL_POINT_DROOP_MULTIPLIER = 1.85;
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
    const liveConnectorKeys = new Set();

    resolvedConnectorPairs.forEach(({ runtimeDomKey, sceneWorldKey }) => {
      const connectorKey = `${runtimeDomKey}__${sceneWorldKey}`;
      liveConnectorKeys.add(connectorKey);

      const state = connectorAnimationRef.current[connectorKey] || {
        phase: 'idle',
        progress: 0,
        isHovered: false,
      };
      const previousProgress = state.progress;
      const previousPhase = state.phase;

      switch (state.phase) {
        case 'straightening': {
          state.progress = Math.min(1, state.progress + delta / STRAIGHTEN_SNAP_DURATION);
          if (state.progress >= 1) {
            state.phase = 'overshoot';
          }
          break;
        }
        case 'overshoot': {
          state.progress = Math.min(
            STRAIGHT_OVERSHOOT_PROGRESS,
            state.progress + delta / STRAIGHTEN_OVERSHOOT_DURATION,
          );
          if (state.progress >= STRAIGHT_OVERSHOOT_PROGRESS) {
            state.phase = 'rebound';
          }
          break;
        }
        case 'rebound': {
          state.progress = Math.max(
            STRAIGHT_REBOUND_PROGRESS,
            state.progress - delta / STRAIGHTEN_REBOUND_DURATION,
          );
          if (state.progress <= STRAIGHT_REBOUND_PROGRESS) {
            state.phase = 'settle';
          }
          break;
        }
        case 'settle': {
          state.progress = Math.min(1, state.progress + delta / STRAIGHTEN_SETTLE_DURATION);
          if (state.progress >= 1) {
            state.phase = state.isHovered ? 'holding' : 'relaxing';
          }
          break;
        }
        case 'holding': {
          state.progress = 1;
          if (!state.isHovered) {
            state.phase = 'relaxing';
          }
          break;
        }
        case 'relaxing': {
          state.progress = Math.max(0, state.progress - delta / RELAX_DURATION);
          if (state.progress <= 0) {
            state.phase = 'relaxOvershoot';
          }
          break;
        }
        case 'relaxOvershoot': {
          state.progress = Math.max(
            RELAX_OVERSHOOT_PROGRESS,
            state.progress - delta / RELAX_OVERSHOOT_DURATION,
          );
          if (state.progress <= RELAX_OVERSHOOT_PROGRESS) {
            state.phase = 'relaxRebound';
          }
          break;
        }
        case 'relaxRebound': {
          state.progress = Math.min(
            RELAX_REBOUND_PROGRESS,
            state.progress + delta / RELAX_REBOUND_DURATION,
          );
          if (state.progress >= RELAX_REBOUND_PROGRESS) {
            state.phase = 'relaxSettle';
          }
          break;
        }
        case 'relaxSettle': {
          state.progress = Math.max(0, state.progress - delta / RELAX_SETTLE_DURATION);
          if (state.progress <= 0) {
            state.phase = 'idle';
          }
          break;
        }
        default: {
          state.progress = 0;
          state.phase = state.isHovered ? 'straightening' : 'idle';
        }
      }

      if (
        Math.abs(state.progress - previousProgress) > 0.0006 ||
        state.phase !== previousPhase
      ) {
        changed = true;
      }
      connectorAnimationRef.current[connectorKey] = state;
    });

    Object.keys(connectorAnimationRef.current).forEach((connectorKey) => {
      if (liveConnectorKeys.has(connectorKey)) return;
      delete connectorAnimationRef.current[connectorKey];
      changed = true;
    });

    if (changed) {
      setGeometryVersion((version) => version + 1);
    }
  });

  useEffect(() => {
    if (!resolvedConnectorPairs?.length) return;

    resolvedConnectorPairs.forEach(({ runtimeDomKey, sceneWorldKey }) => {
      const connectorKey = `${runtimeDomKey}__${sceneWorldKey}`;
      const state = connectorAnimationRef.current[connectorKey] || {
        phase: 'idle',
        progress: 0,
        isHovered: false,
      };
      const nextHovered = hoveredSceneFacetKey === sceneWorldKey;
      const wasHovered = state.isHovered;
      state.isHovered = nextHovered;

      if (!wasHovered && nextHovered) {
        if (
          state.phase === 'idle' ||
          state.phase === 'relaxing' ||
          state.phase === 'relaxOvershoot' ||
          state.phase === 'relaxRebound' ||
          state.phase === 'relaxSettle'
        ) {
          state.phase = 'straightening';
        }
      }

      if (wasHovered && !nextHovered && state.phase === 'holding') {
        state.phase = 'relaxing';
      }

      connectorAnimationRef.current[connectorKey] = state;
    });
  }, [hoveredSceneFacetKey, resolvedConnectorPairs]);

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
      const animationState = connectorAnimationRef.current[connectorKey] || {
        phase: 'idle',
        progress: 0,
        isHovered: false,
      };
      const droopTension = THREE.MathUtils.lerp(
        IDLE_DROOP,
        ACTIVE_DROOP,
        animationState.progress,
      );
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

      const rawSagDistance = distance * droopTension;
      const absSagDistance = Math.abs(rawSagDistance);
      let sagDistance = 0;
      if (absSagDistance > Number.EPSILON) {
        const clampedMagnitude = THREE.MathUtils.clamp(
          absSagDistance,
          MIN_DROOP_WORLD_UNITS,
          MAX_DROOP_WORLD_UNITS,
        );
        sagDistance = Math.sign(rawSagDistance) * clampedMagnitude;
      }
      const midpoint = start.clone().lerp(end, 0.5);
      const controlPoint = midpoint.addScaledVector(
        droopDirection,
        sagDistance * CONTROL_POINT_DROOP_MULTIPLIER,
      );

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
