import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';

const OverviewConnectorLines = ({
  enabled,
  domAnchorsClient,
  overviewWorldAnchors,
  labelsReady = false,
  featureFlagEnabled = false,
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

  const debugSnapshot = {
    mounted: true,
    labelsReady,
    featureFlagEnabled,
    domAnchorCount: connectorDebug.domAnchorCount,
    worldAnchorCount: connectorDebug.worldAnchorCount,
    validConnectorPairs: connectorDebug.validPairs.length,
    attemptedRenderLines: connectorDebug.validPairs.length > 0 ? 1 : 0,
    forcedSingleDebugConnectorActive: connectorDebug.validPairs.length > 0,
    skipped: connectorDebug.skipped,
  };

  console.log('🔎 OverviewConnectorLines runtime', debugSnapshot);

  const firstConnector = connectorDebug.validPairs[0] || null;
  const formatPoint = (point) => (point ? `${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)}` : 'n/a');

  return (
    <>
      {import.meta.env.DEV && (
        <Html
          fullscreen
          style={{
            position: 'fixed',
            top: '12px',
            right: '12px',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              minWidth: 290,
              maxWidth: 360,
              background: 'rgba(0,0,0,0.82)',
              color: '#f7f7f7',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 8,
              padding: '10px 12px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 11,
              lineHeight: 1.35,
              whiteSpace: 'pre-wrap',
            }}
          >
            <div><strong>OverviewConnectorLines Debug</strong></div>
            <div>mounted: {String(debugSnapshot.mounted)}</div>
            <div>labelsReady: {String(debugSnapshot.labelsReady)}</div>
            <div>featureFlagEnabled: {String(debugSnapshot.featureFlagEnabled)}</div>
            <div>domAnchorCount: {debugSnapshot.domAnchorCount}</div>
            <div>worldAnchorCount: {debugSnapshot.worldAnchorCount}</div>
            <div>validConnectorPairs: {debugSnapshot.validConnectorPairs}</div>
            <div>attemptedRenderLines: {debugSnapshot.attemptedRenderLines}</div>
            <div>forcedSingleDebugConnectorActive: {String(debugSnapshot.forcedSingleDebugConnectorActive)}</div>
            {firstConnector ? (
              <>
                <div style={{ marginTop: 6 }}>firstValidKey: {firstConnector.facetKey}</div>
                <div>start: {formatPoint(firstConnector.points?.[0])}</div>
                <div>end: {formatPoint(firstConnector.points?.[1])}</div>
                <div>projectedEndpointValid: true</div>
              </>
            ) : (
              <div style={{ marginTop: 6 }}>
                firstFailureReason: {debugSnapshot.skipped[0]?.reason || 'no valid pairs'}
              </div>
            )}
          </div>
        </Html>
      )}

      {firstConnector && (
        <Line
          key={firstConnector.facetKey}
          points={firstConnector.points}
          color="#ff0000"
          lineWidth={1.8}
          depthTest={false}
          transparent={false}
        />
      )}
    </>
  );
};

export default OverviewConnectorLines;
