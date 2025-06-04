// FIXED: src/components/three/MasterAnimationCoordinator.jsx
// Master coordinator with proper timing and state management

import React, { useEffect } from 'react';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { useUnifiedAnimationController } from '../../hooks/useUnifiedAnimationController';

/**
 * FIXED: Master Animation Coordinator with better timing control
 */
const MasterAnimationCoordinator = ({ 
  children,
  debugMode = false,
  onAnimationStateChange = null 
}) => {
  // Get scroll progress with optimized frequency
  const scrollData = useScrollProgress({
    throttleMs: 12,  // Slightly slower to prevent conflicts
    includeVelocity: true,
    debugMode: debugMode
  });

  // Get unified animation state with enhanced coordination
  const animationController = useUnifiedAnimationController({
    debugMode: debugMode,
    onStateChange: onAnimationStateChange
  });

  // FIXED: More conservative scroll updates with better debouncing
  useEffect(() => {
    // Only update if scroll progress actually changed significantly
    const significantChange = Math.abs(
      scrollData.scrollProgress - (animationController.animationState.scrollProgress || 0)
    ) > 0.001;
    
    if (significantChange) {
      // Micro-debounce to prevent jitter during coordinated sequences
      const timeoutId = setTimeout(() => {
        animationController.updateFromScrollProgress(scrollData.scrollProgress);
      }, 8); // Conservative timing
      
      return () => clearTimeout(timeoutId);
    }
  }, [scrollData.scrollProgress, animationController]);

  // FIXED: Enhanced animation data with better coordination flags
  const animationData = {
    // Core animation state
    ...animationController.animationState,
    
    // Enhanced scroll info
    scrollProgress: scrollData.scrollProgress,
    isScrolling: scrollData.isScrolling,
    isFastScrolling: scrollData.isFastScrolling,
    scrollVelocity: scrollData.velocity,
    
    // Coordinated configurations
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
    
    // FIXED: Better transition coordination flags
    isInExplosionSequence: [
      'preparing_explosion', 
      'exploding', 
      'explosion_settling'
    ].includes(animationController.animationState.state),
    
    isInReformSequence: [
      'preparing_reform', 
      'reforming_crystal', 
      'reforming_camera', 
      'reform_settling'
    ].includes(animationController.animationState.state),
    
    isInProjectTransition: animationController.animationState.state === 'focusing_project',
    
    // FIXED: More specific transition states
    isPreparingExplosion: animationController.animationState.state === 'preparing_explosion',
    isExploding: animationController.animationState.state === 'exploding',
    isPreparingReform: animationController.animationState.state === 'preparing_reform',
    isReformingCrystal: animationController.animationState.state === 'reforming_crystal',
    isReformingCamera: animationController.animationState.state === 'reforming_camera',
    
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
      
      {/* FIXED: Enhanced debug overlay with timing info */}
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
 * FIXED: Enhanced debug overlay with coordination and timing info
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
        🎬 Animation Debug (FIXED COORDINATION)
      </div>
      
      {/* Scroll Info */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#bb86fc', fontWeight: 'bold' }}>Scroll:</div>
        <div>Progress: {Math.round(scrollData.scrollProgress * 100)}%</div>
        <div>Velocity: {Math.round(scrollData.velocity * 1000) / 1000}</div>
        <div>Fast: {scrollData.isFastScrolling ? 'YES' : 'NO'}</div>
      </div>
      
      {/* FIXED: Enhanced Animation State */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#03dac6', fontWeight: 'bold' }}>Animation State:</div>
        <div>State: <span style={{ color: '#ffd600' }}>{animationData.state}</span></div>
        <div>Zone: {animationData.currentZone}</div>
        <div>Crystal: {animationData.crystalForm}</div>
        <div>Camera: {animationData.cameraState}</div>
        <div>Focus: {animationData.focusedProject || 'none'}</div>
        <div>Transitioning: {animationData.isTransitioning ? 'YES' : 'NO'}</div>
      </div>
      
      {/* FIXED: Detailed Coordination Status */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#ffd600', fontWeight: 'bold' }}>Coordination:</div>
        <div>Explosion Seq: {animationData.isInExplosionSequence ? 'YES' : 'NO'}</div>
        <div>Reform Seq: {animationData.isInReformSequence ? 'YES' : 'NO'}</div>
        <div>Project Trans: {animationData.isInProjectTransition ? 'YES' : 'NO'}</div>
        <div>Should Rotate: {animationData.crystalConfig?.shouldRotate ? 'YES' : 'NO'}</div>
      </div>
      
      {/* FIXED: Specific State Flags */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#ff7043', fontWeight: 'bold' }}>Specific States:</div>
        <div>Prep Explosion: {animationData.isPreparingExplosion ? 'YES' : 'NO'}</div>
        <div>Exploding: {animationData.isExploding ? 'YES' : 'NO'}</div>
        <div>Prep Reform: {animationData.isPreparingReform ? 'YES' : 'NO'}</div>
        <div>Reform Crystal: {animationData.isReformingCrystal ? 'YES' : 'NO'}</div>
        <div>Reform Camera: {animationData.isReformingCamera ? 'YES' : 'NO'}</div>
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
          <div style={{ color: '#8bc34a', fontWeight: 'bold' }}>Camera Target:</div>
          <div>Pos: [{animationData.cameraConfig.position?.x?.toFixed(1)}, {animationData.cameraConfig.position?.y?.toFixed(1)}, {animationData.cameraConfig.position?.z?.toFixed(1)}]</div>
          <div>Target: [{animationData.cameraConfig.target?.x?.toFixed(1)}, {animationData.cameraConfig.target?.y?.toFixed(1)}, {animationData.cameraConfig.target?.z?.toFixed(1)}]</div>
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
      
      {/* Timing Warning */}
      {(animationData.isInExplosionSequence || animationData.isInReformSequence) && (
        <div style={{
          background: 'rgba(255, 193, 7, 0.2)',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          padding: '8px',
          marginTop: '10px',
          fontSize: '10px'
        }}>
          <div style={{ color: '#ffc107', fontWeight: 'bold' }}>⚠️ COORDINATED SEQUENCE ACTIVE</div>
          <div>Camera and crystal movements are synchronized</div>
        </div>
      )}
    </div>
  );
};

export default MasterAnimationCoordinator;