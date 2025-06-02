// src/components/three/MasterAnimationCoordinator.jsx
// UPDATED: Works with new coordinated animation system

import React, { useEffect } from 'react';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { useUnifiedAnimationController } from '../../hooks/useUnifiedAnimationController';

/**
 * Master Animation Coordinator
 * UPDATED: Better integration with coordinated animation system
 */
const MasterAnimationCoordinator = ({ 
  children,
  debugMode = false,
  onAnimationStateChange = null 
}) => {
  // Get scroll progress with optimized frequency for smooth updates
  const scrollData = useScrollProgress({
    throttleMs: 8,
    includeVelocity: true,
    debugMode: debugMode
  });

  // Get unified animation state with enhanced coordination
  const animationController = useUnifiedAnimationController({
    debugMode: debugMode,
    onStateChange: onAnimationStateChange
  });

  // UPDATED: More responsive scroll updates with debouncing
  useEffect(() => {
    // Micro-debounce to prevent jitter during coordinated sequences
    const timeoutId = setTimeout(() => {
      animationController.updateFromScrollProgress(scrollData.scrollProgress);
    }, 4); // Even more responsive
    
    return () => clearTimeout(timeoutId);
  }, [scrollData.scrollProgress, animationController]);

  // UPDATED: Enhanced animation data for 3D components
  const animationData = {
    // Core animation state (UPDATED)
    ...animationController.animationState,
    
    // Enhanced scroll info
    scrollProgress: scrollData.scrollProgress,
    isScrolling: scrollData.isScrolling,
    isFastScrolling: scrollData.isFastScrolling,
    scrollVelocity: scrollData.velocity,
    
    // NEW: Coordinated configurations
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
    
    // NEW: Transition coordination flags
    isInExplosionSequence: ['preparing_explosion', 'exploding', 'explosion_settling'].includes(
      animationController.animationState.state
    ),
    isInReformSequence: ['preparing_reform', 'reforming', 'reform_settling'].includes(
      animationController.animationState.state
    ),
    isInProjectTransition: animationController.animationState.state === 'focusing_project',
    
    // Utility functions
    scrollToZone: (zoneName) => scrollData.scrollToZone?.(zoneName, animationController.config.scrollZones),
    overrideAnimationState: animationController.overrideState || (() => {})
  };

  // Clone children and pass enhanced animation data
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { animationData });
    }
    return child;
  });

  return (
    <>
      {childrenWithProps}
      
      {/* UPDATED: Enhanced debug overlay */}
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
 * UPDATED: Enhanced debug overlay with coordination info
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
      maxWidth: '340px',
      pointerEvents: 'none'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#64ffda' }}>
        🎬 Animation Debug (COORDINATED)
      </div>
      
      {/* Scroll Info */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#bb86fc', fontWeight: 'bold' }}>Scroll:</div>
        <div>Progress: {Math.round(scrollData.scrollProgress * 100)}%</div>
        <div>Velocity: {Math.round(scrollData.velocity * 1000) / 1000}</div>
        <div>Fast: {scrollData.isFastScrolling ? 'YES' : 'NO'}</div>
      </div>
      
      {/* UPDATED: Enhanced Animation State */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#03dac6', fontWeight: 'bold' }}>Animation State:</div>
        <div>State: {animationData.state}</div>
        <div>Zone: {animationData.currentZone}</div>
        <div>Crystal: {animationData.crystalForm}</div>
        <div>Camera: {animationData.cameraState}</div>
        <div>Focus: {animationData.focusedProject || 'none'}</div>
        <div>Transitioning: {animationData.isTransitioning ? 'YES' : 'NO'}</div>
      </div>
      
      {/* NEW: Coordination Status */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#ffd600', fontWeight: 'bold' }}>Coordination:</div>
        <div>Explosion Seq: {animationData.isInExplosionSequence ? 'YES' : 'NO'}</div>
        <div>Reform Seq: {animationData.isInReformSequence ? 'YES' : 'NO'}</div>
        <div>Project Trans: {animationData.isInProjectTransition ? 'YES' : 'NO'}</div>
        <div>Should Rotate: {animationData.crystalConfig?.shouldRotate ? 'YES' : 'NO'}</div>
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
          <div style={{ color: '#8bc34a', fontWeight: 'bold' }}>Camera:</div>
          <div>Pos: [{animationData.cameraConfig.position?.x?.toFixed(1)}, {animationData.cameraConfig.position?.y?.toFixed(1)}, {animationData.cameraConfig.position?.z?.toFixed(1)}]</div>
          <div>FOV: {animationData.cameraConfig.fov}</div>
        </div>
      )}
      
      {/* Debug Controller Info */}
      {animationController.debugInfo && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#cf6679', fontWeight: 'bold' }}>Controller:</div>
          <div>Has Sequence: {animationController.debugInfo.hasActiveSequence ? 'YES' : 'NO'}</div>
          <div>Last Zone: {animationController.debugInfo.lastZone}</div>
          <div>Last Project: {animationController.debugInfo.lastProject || 'none'}</div>
        </div>
      )}
      
      {/* Quick Zone Navigation */}
      <div>
        <div style={{ color: '#ff7043', fontWeight: 'bold' }}>Quick Nav:</div>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
          {Object.keys(animationController.config.scrollZones).map(zone => (
            <button
              key={zone}
              onClick={() => animationData.scrollToZone && animationData.scrollToZone(zone)}
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
    </div>
  );
};

export default MasterAnimationCoordinator;