// src/components/three/MasterAnimationCoordinator.jsx
// Phase 1: Master coordinator that replaces your current complex system

import React, { useEffect } from 'react';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { useUnifiedAnimationController } from '../../hooks/useUnifiedAnimationController';

/**
 * Master Animation Coordinator
 * Single component that coordinates all animation systems
 * Replaces: useCrystalController, ScrollCameraController, useScrollObserver
 */
const MasterAnimationCoordinator = ({ 
  children,
  debugMode = false,
  onAnimationStateChange = null 
}) => {
  // Get scroll progress (0-1 through entire page)
  const scrollData = useScrollProgress({
    throttleMs: 16,        // 60fps updates
    includeVelocity: true,
    debugMode: debugMode
  });

  // Get unified animation state
  const animationController = useUnifiedAnimationController({
    debugMode: debugMode,
    onStateChange: onAnimationStateChange
  });

  // Update animation state based on scroll progress
  useEffect(() => {
    animationController.updateFromScrollProgress(scrollData.scrollProgress);
  }, [scrollData.scrollProgress, animationController]);

  // Provide animation data to child components via props or context
  const animationData = {
    // Current state
    ...animationController.animationState,
    
    // Scroll info
    scrollProgress: scrollData.scrollProgress,
    isScrolling: scrollData.isScrolling,
    isFastScrolling: scrollData.isFastScrolling,
    scrollVelocity: scrollData.velocity,
    
    // Current configurations for 3D components
    cameraConfig: animationController.cameraConfig,
    crystalConfig: animationController.crystalConfig,
    
    // Zone information
    currentZone: animationController.animationState.zoneInfo?.zone,
    zoneProgress: animationController.animationState.zoneInfo?.zoneProgress,
    
    // Project information
    focusedProject: animationController.animationState.focusedFacet,
    projectProgress: animationController.animationState.projectInfo?.progress,
    
    // Utility functions
    scrollToZone: (zoneName) => scrollData.scrollToZone(zoneName, animationController.config.scrollZones),
    overrideAnimationState: animationController.overrideState
  };

  // Clone children and pass animation data
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { animationData });
    }
    return child;
  });

  return (
    <>
      {childrenWithProps}
      
      {/* Debug overlay in development */}
      {debugMode && (
        <DebugOverlay 
          scrollData={scrollData}
          animationData={animationData}
          animationController={animationController}
        />
      )}
    </>
  );
};

/**
 * Debug overlay for development
 */
const DebugOverlay = ({ scrollData, animationData, animationController }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 10001,
      maxWidth: '300px',
      pointerEvents: 'none'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#64ffda' }}>
        🎬 Animation Debug
      </div>
      
      {/* Scroll Info */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#bb86fc', fontWeight: 'bold' }}>Scroll:</div>
        <div>Progress: {Math.round(scrollData.scrollProgress * 100)}%</div>
        <div>Velocity: {Math.round(scrollData.velocity * 1000) / 1000}</div>
        <div>Scrolling: {scrollData.isScrolling ? 'YES' : 'NO'}</div>
        <div>Fast: {scrollData.isFastScrolling ? 'YES' : 'NO'}</div>
      </div>
      
      {/* Animation State */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#03dac6', fontWeight: 'bold' }}>Animation:</div>
        <div>Zone: {animationData.currentZone}</div>
        <div>Crystal: {animationData.crystalForm}</div>
        <div>Camera: {animationData.cameraState}</div>
        <div>Focus: {animationData.focusedFacet || 'none'}</div>
        <div>Transitioning: {animationData.isTransitioning ? 'YES' : 'NO'}</div>
      </div>
      
      {/* Zone Progress */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#ffd600', fontWeight: 'bold' }}>Zone Progress:</div>
        <div>{Math.round((animationData.zoneProgress || 0) * 100)}%</div>
      </div>
      
      {/* Quick Zone Navigation */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#ff7043', fontWeight: 'bold' }}>Quick Nav:</div>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
          {Object.keys(animationController.config.scrollZones).map(zone => (
            <button
              key={zone}
              onClick={() => animationData.scrollToZone(zone)}
              style={{
                background: animationData.currentZone === zone ? '#64ffda' : 'rgba(255,255,255,0.2)',
                color: animationData.currentZone === zone ? '#000' : '#fff',
                border: 'none',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>
      
      {/* Camera Config */}
      {animationData.cameraConfig && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#cf6679', fontWeight: 'bold' }}>Camera:</div>
          <div>Pos: [{animationData.cameraConfig.position?.x?.toFixed(1)}, {animationData.cameraConfig.position?.y?.toFixed(1)}, {animationData.cameraConfig.position?.z?.toFixed(1)}]</div>
          <div>FOV: {animationData.cameraConfig.fov}</div>
        </div>
      )}
      
      {/* Performance Info */}
      <div>
        <div style={{ color: '#8bc34a', fontWeight: 'bold' }}>Performance:</div>
        <div>FPS: {Math.round(1000 / 16)} target</div>
        <div>Updates: 60fps</div>
      </div>
    </div>
  );
};

export default MasterAnimationCoordinator;