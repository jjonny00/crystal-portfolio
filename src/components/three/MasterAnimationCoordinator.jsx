// src/components/three/MasterAnimationCoordinator.jsx
// FIXED: Better data flow and timing for crystal explosions

import React, { useEffect } from 'react';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { useUnifiedAnimationController } from '../../hooks/useUnifiedAnimationController';

/**
 * Master Animation Coordinator
 * FIXED: Better scroll handling and timing
 */
const MasterAnimationCoordinator = ({ 
  children,
  debugMode = false,
  onAnimationStateChange = null 
}) => {
  // Get scroll progress with higher frequency for smoother updates
  const scrollData = useScrollProgress({
    throttleMs: 8,         // INCREASED frequency for smoother updates (was 16)
    includeVelocity: true,
    debugMode: debugMode
  });

  // Get unified animation state
  const animationController = useUnifiedAnimationController({
    debugMode: debugMode,
    onStateChange: onAnimationStateChange
  });

  // FIXED: Update animation state with micro-debouncing to prevent jitter
  useEffect(() => {
    // Small debounce to prevent micro-movements from causing camera jumps
    const timeoutId = setTimeout(() => {
      animationController.updateFromScrollProgress(scrollData.scrollProgress);
    }, 8); // REDUCED delay for more responsive updates
    
    return () => clearTimeout(timeoutId);
  }, [scrollData.scrollProgress, animationController]);

  // Provide animation data to child components via props
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
 * FIXED: Enhanced debug overlay for better troubleshooting
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
      maxWidth: '320px',
      pointerEvents: 'none'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#64ffda' }}>
        🎬 Animation Debug (FIXED)
      </div>
      
      {/* Scroll Info */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#bb86fc', fontWeight: 'bold' }}>Scroll:</div>
        <div>Progress: {Math.round(scrollData.scrollProgress * 100)}%</div>
        <div>Velocity: {Math.round(scrollData.velocity * 1000) / 1000}</div>
        <div>Scrolling: {scrollData.isScrolling ? 'YES' : 'NO'}</div>
        <div>Fast: {scrollData.isFastScrolling ? 'YES' : 'NO'}</div>
        <div>Page Y: {Math.round(window.pageYOffset)}px</div>
      </div>
      
      {/* Animation State */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#03dac6', fontWeight: 'bold' }}>Animation:</div>
        <div>Zone: {animationData.currentZone}</div>
        <div>Crystal: {animationData.crystalForm}</div>
        <div>Camera: {animationData.cameraState}</div>
        <div>Focus: {animationData.focusedProject || 'none'}</div>
        <div>Transitioning: {animationData.isTransitioning ? 'YES' : 'NO'}</div>
      </div>
      
      {/* Zone Progress */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#ffd600', fontWeight: 'bold' }}>Zone Progress:</div>
        <div>{Math.round((animationData.zoneProgress || 0) * 100)}%</div>
        <div>In Transition: {animationData.isInZoneTransition ? 'YES' : 'NO'}</div>
      </div>
      
      {/* Project Info */}
      {animationData.focusedProject && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#ff7043', fontWeight: 'bold' }}>Project:</div>
          <div>Current: {animationData.focusedProject}</div>
          <div>Progress: {Math.round((animationData.projectProgress || 0) * 100)}%</div>
          <div>In Transition: {animationData.isInProjectTransition ? 'YES' : 'NO'}</div>
        </div>
      )}
      
      {/* Scroll Zone Breakdown */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ color: '#cf6679', fontWeight: 'bold' }}>Scroll Zones:</div>
        <div style={{ fontSize: '10px' }}>
          <div>Hero: 0-12.5% {scrollData.scrollProgress <= 0.125 ? '← HERE' : ''}</div>
          <div>Overview: 12.5-25% {scrollData.scrollProgress > 0.125 && scrollData.scrollProgress <= 0.25 ? '← HERE' : ''}</div>
          <div>Projects: 25-87.5% {scrollData.scrollProgress > 0.25 && scrollData.scrollProgress <= 0.875 ? '← HERE' : ''}</div>
          <div>About: 87.5-100% {scrollData.scrollProgress > 0.875 ? '← HERE' : ''}</div>
        </div>
      </div>
      
      {/* Camera Config */}
      {animationData.cameraConfig && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#8bc34a', fontWeight: 'bold' }}>Camera:</div>
          <div>Pos: [{animationData.cameraConfig.position?.x?.toFixed(1)}, {animationData.cameraConfig.position?.y?.toFixed(1)}, {animationData.cameraConfig.position?.z?.toFixed(1)}]</div>
          <div>FOV: {animationData.cameraConfig.fov}</div>
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