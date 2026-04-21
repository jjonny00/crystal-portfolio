import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { getProjectColorByFacetKey } from '../../data/projects';

const OverviewConnectorLines = ({
  enabled,
  resolvedConnectorPairs,
  alwaysOnDomAnchorsByRuntimeKey,
  overviewWorldAnchors,
  hoveredSceneFacetKey = null,
}) => {
  const { camera, size } = useThree();
  const [geometryVersion, setGeometryVersion] = useState(0);
  const connectorAnimationRef = useRef({});

  const IDLE_DROOP = 0.52;
  const ACTIVE_DROOP = 0;
  const ENTRANCE_DRAW_DURATION = 0.3;
  const ENTRANCE_STAGGER_STEP = 0.14;
  const STRAIGHTEN_SNAP_DURATION = 0.2;
  const STRAIGHTEN_OVERSHOOT_DURATION = 0.1;
  const STRAIGHTEN_REBOUND_DURATION = 0.14;
  const STRAIGHTEN_SETTLE_DURATION = 0.12;
  const RELAX_DECAY = 4.8;
  const RELAX_OSC_FREQ = 10.5;
  const RELAX_SIN_WEIGHT = 0.24;
  const RELAX_MIN_TIME = 0.42;
  const RELAX_MAX_TIME = 1.35;
  const RELAX_STOP_POS = 0.003;
  const RELAX_STOP_VEL = 0.02;
  const STRAIGHT_OVERSHOOT_PROGRESS = 1.08;
  const STRAIGHT_REBOUND_PROGRESS = 0.985;
  const MAX_DROOP_WORLD_UNITS = 0.3;
  const CONTROL_POINT_DROOP_MULTIPLIER = 1.85;
  const CURVE_SAMPLES = 14;
  const IDLE_CONNECTOR_COLOR = '#170607';
  const COLOR_HOVER_IN_DURATION = 0.2;
  const COLOR_HOVER_OUT_DURATION = 0.24;
  const makeInitialConnectorState = (startDelay = 0) => ({
    phase: 'enter-draw',
    progress: 1,
    drawProgress: 0,
    enterElapsed: 0,
    startDelay,
    isHovered: false,
    releaseTime: 0,
    colorMix: 0,
  });

  const easeInOutQuart = (t) => (
    t < 0.5
      ? 8 * t * t * t * t
      : 1 - (Math.pow(-2 * t + 2, 4) / 2)
  );

  const getEntranceOrderIndex = (runtimeDomKey, fallbackIndex) => {
    const match = /^project(\d+)$/i.exec(runtimeDomKey || '');
    if (!match) return fallbackIndex;
    const parsed = Number.parseInt(match[1], 10);
    if (!Number.isFinite(parsed)) return fallbackIndex;
    return Math.max(0, parsed - 1);
  };

  useFrame((_, delta) => {
    if (!enabled || !resolvedConnectorPairs?.length) return;

    let changed = false;
    const liveConnectorKeys = new Set();

    resolvedConnectorPairs.forEach(({ runtimeDomKey, sceneWorldKey }, pairIndex) => {
      const connectorKey = `${runtimeDomKey}__${sceneWorldKey}`;
      liveConnectorKeys.add(connectorKey);
      const entranceOrderIndex = getEntranceOrderIndex(runtimeDomKey, pairIndex);
      const startDelay = entranceOrderIndex * ENTRANCE_STAGGER_STEP;

      const state = connectorAnimationRef.current[connectorKey] || makeInitialConnectorState(startDelay);
      const previousProgress = state.progress;
      const previousPhase = state.phase;
      const previousDrawProgress = state.drawProgress || 0;
      const previousColorMix = state.colorMix || 0;

      switch (state.phase) {
        case 'enter-draw': {
          state.enterElapsed = (state.enterElapsed || 0) + delta;
          const elapsedAfterDelay = Math.max(0, state.enterElapsed - (state.startDelay || 0));
          const linearProgress = THREE.MathUtils.clamp(
            elapsedAfterDelay / ENTRANCE_DRAW_DURATION,
            0,
            1,
          );
          state.drawProgress = easeInOutQuart(linearProgress);
          state.progress = 1;
          if (state.drawProgress >= 1) {
            state.phase = state.isHovered ? 'holding' : 'relaxing';
            state.releaseTime = 0;
          }
          break;
        }
        case 'straightening': {
          state.drawProgress = 1;
          state.enterElapsed = state.startDelay || 0;
          state.progress = Math.min(1, state.progress + delta / STRAIGHTEN_SNAP_DURATION);
          if (state.progress >= 1) {
            state.phase = 'overshoot';
          }
          break;
        }
        case 'overshoot': {
          state.drawProgress = 1;
          state.enterElapsed = state.startDelay || 0;
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
          state.drawProgress = 1;
          state.enterElapsed = state.startDelay || 0;
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
          state.drawProgress = 1;
          state.enterElapsed = state.startDelay || 0;
          state.progress = Math.min(1, state.progress + delta / STRAIGHTEN_SETTLE_DURATION);
          if (state.progress >= 1) {
            state.phase = state.isHovered ? 'holding' : 'relaxing';
            state.releaseTime = 0;
          }
          break;
        }
        case 'holding': {
          state.drawProgress = 1;
          state.enterElapsed = state.startDelay || 0;
          state.progress = 1;
          if (!state.isHovered) {
            state.phase = 'relaxing';
            state.releaseTime = 0;
          }
          break;
        }
        case 'relaxing': {
          state.drawProgress = 1;
          state.enterElapsed = state.startDelay || 0;
          state.releaseTime = (state.releaseTime || 0) + delta;
          const t = state.releaseTime;
          const decay = Math.exp(-RELAX_DECAY * t);
          const cosTerm = Math.cos(RELAX_OSC_FREQ * t);
          const sinTerm = Math.sin(RELAX_OSC_FREQ * t);
          const composite = cosTerm + RELAX_SIN_WEIGHT * sinTerm;

          state.progress = decay * composite;

          const velocity = decay * (
            (-RELAX_DECAY * composite) +
            (-RELAX_OSC_FREQ * sinTerm + RELAX_SIN_WEIGHT * RELAX_OSC_FREQ * cosTerm)
          );

          const settled =
            t >= RELAX_MIN_TIME &&
            Math.abs(state.progress) <= RELAX_STOP_POS &&
            Math.abs(velocity) <= RELAX_STOP_VEL;

          if (settled || t >= RELAX_MAX_TIME) {
            state.phase = 'idle';
            state.progress = 0;
            state.releaseTime = 0;
          }
          break;
        }
        default: {
          state.drawProgress = 1;
          state.enterElapsed = state.startDelay || 0;
          state.progress = 0;
          state.phase = state.isHovered ? 'straightening' : 'idle';
          state.releaseTime = 0;
        }
      }

      const targetColorMix = state.isHovered ? 1 : 0;
      const colorDuration = state.isHovered ? COLOR_HOVER_IN_DURATION : COLOR_HOVER_OUT_DURATION;
      state.colorMix = THREE.MathUtils.damp(
        state.colorMix || 0,
        targetColorMix,
        8 / Math.max(colorDuration, 0.001),
        delta,
      );

      if (
        Math.abs(state.progress - previousProgress) > 0.0006 ||
        Math.abs((state.drawProgress || 0) - previousDrawProgress) > 0.0006 ||
        state.phase !== previousPhase ||
        Math.abs(state.colorMix - previousColorMix) > 0.0006
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

    resolvedConnectorPairs.forEach(({ runtimeDomKey, sceneWorldKey }, pairIndex) => {
      const connectorKey = `${runtimeDomKey}__${sceneWorldKey}`;
      const entranceOrderIndex = getEntranceOrderIndex(runtimeDomKey, pairIndex);
      const startDelay = entranceOrderIndex * ENTRANCE_STAGGER_STEP;
      const state = connectorAnimationRef.current[connectorKey] || makeInitialConnectorState(startDelay);
      const nextHovered = hoveredSceneFacetKey === sceneWorldKey;
      const wasHovered = state.isHovered;
      state.isHovered = nextHovered;

      if (!wasHovered && nextHovered) {
        if (
          state.phase === 'enter-draw' ||
          state.phase === 'idle' ||
          state.phase === 'relaxing'
        ) {
          state.drawProgress = 1;
          state.enterElapsed = state.startDelay || 0;
          state.phase = 'straightening';
          state.releaseTime = 0;
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

    return resolvedConnectorPairs.flatMap(({ runtimeDomKey, sceneWorldKey }, pairIndex) => {
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
      const entranceOrderIndex = getEntranceOrderIndex(runtimeDomKey, pairIndex);
      const startDelay = entranceOrderIndex * ENTRANCE_STAGGER_STEP;
      const animationState = connectorAnimationRef.current[connectorKey] || makeInitialConnectorState(startDelay);
      const animationPhase = animationState.phase;
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
          color: new THREE.Color(IDLE_CONNECTOR_COLOR)
            .lerp(new THREE.Color(getProjectColorByFacetKey(sceneWorldKey)), THREE.MathUtils.clamp(animationState.colorMix || 0, 0, 1))
            .getStyle(),
        }];
      }

      const drawProgress = THREE.MathUtils.clamp(animationState.drawProgress || 0, 0, 1);
      const drawHead = end.clone().lerp(start, drawProgress);

      if (animationPhase === 'enter-draw' && drawProgress < 1) {
        return [{
          key: connectorKey,
          points: [end.clone(), drawHead],
          color: new THREE.Color(IDLE_CONNECTOR_COLOR)
            .lerp(new THREE.Color(getProjectColorByFacetKey(sceneWorldKey)), THREE.MathUtils.clamp(animationState.colorMix || 0, 0, 1))
            .getStyle(),
        }];
      }

      const cameraRight = new THREE.Vector3().crossVectors(planeNormal, camera.up).normalize();
      const droopDirection = new THREE.Vector3().crossVectors(cameraRight, planeNormal).normalize().negate();

      const rawSagDistance = distance * droopTension;
      const absSagDistance = Math.abs(rawSagDistance);
      let sagDistance = 0;
      if (absSagDistance > Number.EPSILON) {
        const compressedMagnitude =
          MAX_DROOP_WORLD_UNITS * Math.tanh(absSagDistance / MAX_DROOP_WORLD_UNITS);
        const compressedSagDistance = Math.sign(rawSagDistance) * compressedMagnitude;

        const animatedSagCap = MAX_DROOP_WORLD_UNITS * 2.4;
        const expandedSagDistance = THREE.MathUtils.clamp(
          rawSagDistance,
          -animatedSagCap,
          animatedSagCap,
        );

        let releaseTailBlend = 0;
        if (animationPhase === 'relaxing') {
          const releaseTime = animationState.releaseTime || 0;
          const nearDroopWeight = Math.exp(-Math.abs(animationState.progress) * 12);
          const decayWeight = Math.exp(-releaseTime * 1.8);
          releaseTailBlend = 0.24 * nearDroopWeight * decayWeight;
        }

        sagDistance = THREE.MathUtils.lerp(
          compressedSagDistance,
          expandedSagDistance,
          releaseTailBlend,
        );
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
        color: new THREE.Color(IDLE_CONNECTOR_COLOR)
          .lerp(new THREE.Color(getProjectColorByFacetKey(sceneWorldKey)), THREE.MathUtils.clamp(animationState.colorMix || 0, 0, 1))
          .getStyle(),
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
          color={connector.color}
          lineWidth={1.8}
          depthTest={false}
          transparent={false}
        />
      ))}
    </>
  );
};

export default OverviewConnectorLines;
