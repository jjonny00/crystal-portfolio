// Add this debug component to your Fixed3DCanvas to see what's happening

import React from 'react';
import { Html } from '@react-three/drei';

const AnimationDebugDisplay = ({ animationData }) => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <Html>
      <div style={{
        position: 'fixed',
        top: '100px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '10px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 10003,
        pointerEvents: 'none',
        maxWidth: '300px'
      }}>
        <div><strong>🎬 Animation Debug:</strong></div>
        <div>Camera State: {animationData?.cameraState}</div>
        <div>Crystal Form: {animationData?.crystalForm}</div>
        <div>Focused Facet: {animationData?.focusedFacet || 'none'}</div>
        <div>Scroll Progress: {Math.round((animationData?.scrollProgress || 0) * 100)}%</div>
        <div>Is Transitioning: {animationData?.isTransitioning ? 'YES' : 'NO'}</div>
        <div>Zone: {animationData?.currentZone}</div>
        
        {animationData?.cameraConfig && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ color: '#64ffda' }}><strong>Camera Config:</strong></div>
            <div>Pos: [{animationData.cameraConfig.position?.x?.toFixed(1)}, {animationData.cameraConfig.position?.y?.toFixed(1)}, {animationData.cameraConfig.position?.z?.toFixed(1)}]</div>
            <div>Target: [{animationData.cameraConfig.target?.x?.toFixed(1)}, {animationData.cameraConfig.target?.y?.toFixed(1)}, {animationData.cameraConfig.target?.z?.toFixed(1)}]</div>
            <div>FOV: {animationData.cameraConfig.fov}</div>
          </div>
        )}
        
        {animationData?.projectInfo && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ color: '#ff7043' }}><strong>Project Info:</strong></div>
            <div>Project: {animationData.projectInfo.project || 'none'}</div>
            <div>Progress: {Math.round((animationData.projectInfo.progress || 0) * 100)}%</div>
          </div>
        )}
      </div>
    </Html>
  );
};

export default AnimationDebugDisplay;