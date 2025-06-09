// FIXED: src/components/three/MasterAnimationCoordinator.jsx
// Simplified master coordinator with immediate state changes

import React, { useEffect } from 'react';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { useUnifiedAnimationController } from '../../hooks/useUnifiedAnimationController';

/**
 * SIMPLIFIED: Master Animation Coordinator with immediate state changes
 */
const MasterAnimationCoordinator = ({
  children,
  debugMode = false,
  onAnimationStateChange = null,
  config = null
}) => {
  // Get scroll progress with optimized frequency
  const scrollData = useScrollProgress({
    throttleMs: 16,
    includeVelocity: true,
    debugMode: debugMode
  });

  // Get unified animation state with simplified coordination
  const animationController = useUnifiedAnimationController({
    debugMode: debugMode,
    onStateChange: onAnimationStateChange,
    config: config || undefined
  });

  // SIMPLIFIED: Direct scroll updates with minimal debouncing
  useEffect(() => {
    // Only update if scroll progress actually changed significantly
    const significantChange = Math.abs(
      scrollData.scrollProgress - (animationController.animationState.scrollProgress || 0)
    ) > 0.001;
    
    if (significantChange) {
      // Direct update - no complex timing coordination needed
      animationController.updateFromScrollProgress(scrollData.scrollProgress);
    }
  }, [scrollData.scrollProgress, animationController]);

  // SIMPLIFIED: Animation data with immediate state information
  const animationData = {
    // Core animation state (immediate)
    ...animationController.animationState,
    
    // Enhanced scroll info
    scrollProgress: scrollData.scrollProgress,
    isScrolling: scrollData.isScrolling,
    isFastScrolling: scrollData.isFastScrolling,
    scrollVelocity: scrollData.velocity,
    
    // Immediate configurations (no complex coordination needed)
    cameraConfig: animationController.cameraConfig,
    crystalConfig: animationController.crystalConfig,
    
    // Enhanced zone information
    currentZone: animationController.animationState.zoneInfo?.zone,
    zoneProgress: animationController.animationState.zoneInfo?.progress,
    isEnteringZone: animationController.animationState.zoneInfo?.isEntering,
    isLeavingZone: animationController.animationState.zoneInfo?.isLeaving,
    
    // Enhanced project information
    focusedProject: animationController.animationState.focusedFacet,
    projectProgress: animationController.animationState.projectInfo?.progress,
    
    // SIMPLIFIED: isTransitioning is managed by individual components
    isTransitioning: false, // Components handle their own smooth transitions
    
    // Utility functions
    scrollToZone: (zoneName) => scrollData.scrollToZone?.(zoneName, animationController.config.scrollZones),
    overrideAnimationState: animationController.overrideState || (() => {})
  };

  // Clone children and pass simplified animation data
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { animationData });
    }
    return child;
  });

  return (
    <>
      {childrenWithProps}
      
      {/* SIMPLIFIED: Debug overlay with immediate state info */}
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
 * SIMPLIFIED: Debug overlay with immediate state information
 */
const DebugOverlay = ({ scrollData, animationData, animationController }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.95)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 10001,
      maxWidth: '360px',
      pointerEvents: 'none',
      border: '1px solid rgba(100, 255, 218, 0.3)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#64ffda' }}>
        🎬 Animation Debug (SIMPLIFIED)
      </div>
      
      {/* Scroll Info */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#bb86fc', fontWeight: 'bold' }}>Scroll:</div>
        <div>Progress: {Math.round(scrollData.scrollProgress * 100)}%</div>
        <div>Velocity: {Math.round(scrollData.velocity * 1000) / 1000}</div>
        <div>Fast: {scrollData.isFastScrolling ? 'YES' : 'NO'}</div>
      </div>
      
      {/* SIMPLIFIED: Animation State */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#03dac6', fontWeight: 'bold' }}>Animation State (IMMEDIATE):</div>
        <div>State: <span style={{ color: '#ffd600' }}>{animationData.state}</span></div>
        <div>Zone: {animationData.currentZone}</div>
        <div>Crystal: {animationData.crystalForm}</div>
        <div>Camera: {animationData.cameraState}</div>
        <div>Focus: {animationData.focusedProject || 'none'}</div>
        <div>Components Handle Transitions: YES</div>
      </div>
      
      {/* Zone Progress */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#ff7043', fontWeight: 'bold' }}>Zone Info:</div>
        <div>Progress: {Math.round((animationData.zoneProgress || 0) * 100)}%</div>
        <div>Entering: {animationData.isEnteringZone ? 'YES' : 'NO'}</div>
        <div>Leaving: {animationData.isLeavingZone ? 'YES' : 'NO'}</div>
      </div>
      
      {/* Camera Info */}
      {animationData.cameraConfig && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#8bc34a', fontWeight: 'bold' }}>Camera Target (IMMEDIATE):</div>
          <div>Pos: [{animationData.cameraConfig.position?.x?.toFixed(1)}, {animationData.cameraConfig.position?.y?.toFixed(1)}, {animationData.cameraConfig.position?.z?.toFixed(1)}]</div>
          <div>Target: [{animationData.cameraConfig.target?.x?.toFixed(1)}, {animationData.cameraConfig.target?.y?.toFixed(1)}, {animationData.cameraConfig.target?.z?.toFixed(1)}]</div>
          <div>FOV: {animationData.cameraConfig.fov}</div>
        </div>
      )}
      
      {/* Debug Controller Info */}
      {animationController.debugInfo && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#cf6679', fontWeight: 'bold' }}>Controller (SIMPLIFIED):</div>
          <div>Last Zone: {animationController.debugInfo.lastZone}</div>
          <div>Last Project: {animationController.debugInfo.lastProject || 'none'}</div>
          <div>No Complex Sequences: YES</div>
        </div>
      )}
      
      {/* Success Message */}
      <div style={{
        background: 'rgba(76, 175, 80, 0.2)',
        border: '1px solid #4caf50',
        borderRadius: '4px',
        padding: '8px',
        marginTop: '10px',
        fontSize: '10px'
      }}>
        <div style={{ color: '#4caf50', fontWeight: 'bold' }}>✅ SIMPLIFIED APPROACH</div>
        <div>• Immediate state changes</div>
        <div>• Components handle smooth transitions</div>
        <div>• No complex timing coordination</div>
        <div>• Same pattern as working projects</div>
      </div>
    </div>
  );
};

export default MasterAnimationCoordinator;