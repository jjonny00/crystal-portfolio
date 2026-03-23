// Added keyboard control for animation debug panel

import React, { useEffect, useMemo, useState } from 'react';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { useUnifiedAnimationController } from '../../hooks/useUnifiedAnimationController';

let exportedAnimationData = {};
let exportedScrollMetrics = {};

/**
 * SIMPLIFIED: Master Animation Coordinator with keyboard-controlled debug
 */
const MasterAnimationCoordinator = ({
  children,
  debugMode = false,
  onAnimationStateChange = null,
  config = null,
  restartToken = 0
}) => {
  const [showAnimationDebug, setShowAnimationDebug] = useState(false);

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
    config: config || undefined,
    introReplayToken: restartToken
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is in an input field
      const isInputField = e.target.tagName === 'INPUT' || 
                          e.target.tagName === 'TEXTAREA' || 
                          e.target.isContentEditable;
      
      if (isInputField) return;
      
      // Toggle animation debug with 'A' key
      if (e.key === 'a' || e.key === 'A') {
        if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault();
          setShowAnimationDebug(prev => {
            const newState = !prev;
            if (import.meta.env.DEV) console.log(`🎬 Animation Debug Panel: ${newState ? 'ON' : 'OFF'}`);
            return newState;
          });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // SIMPLIFIED: Direct scroll updates with minimal debouncing
  useEffect(() => {
    const animationDriverProgress =
      scrollData.rawScrollProgress ?? scrollData.scrollProgress;

    // Only update if scroll progress actually changed significantly
    const significantChange = Math.abs(
      animationDriverProgress - (animationController.animationState.scrollProgress || 0)
    ) > 0.001;
    
    if (significantChange) {
      // Direct update - no complex timing coordination needed
      animationController.updateFromScrollProgress(animationDriverProgress);
    }
  }, [
    scrollData.rawScrollProgress,
    scrollData.scrollProgress,
    animationController
  ]);

  // Memoize scroll metrics separately so components that don't care about
  // scrolling won't re-render on every scroll tick
  const scrollMetrics = useMemo(() => ({
    scrollProgress: scrollData.scrollProgress,
    isScrolling: scrollData.isScrolling,
    isFastScrolling: scrollData.isFastScrolling,
    scrollVelocity: scrollData.velocity
  }), [
    scrollData.scrollProgress,
    scrollData.isScrolling,
    scrollData.isFastScrolling,
    scrollData.velocity
  ]);

  exportedScrollMetrics = scrollMetrics;

  // Stable scroll controls - primarily used for label clicks
  const scrollControls = useMemo(() => ({
    scrollToProgress: scrollData.scrollToProgress,
    scrollToZone: (zoneName) =>
      scrollData.scrollToZone?.(zoneName, animationController.config.scrollZones),
    scrollToProject: (projectKey, behavior = 'smooth') => {
      const projectStart = animationController.getProjectSectionStart?.(projectKey);
      if (projectStart === null || projectStart === undefined) return;
      scrollData.scrollToProgress(projectStart, behavior);
    },
    directSelectProject: (projectKey) =>
      animationController.setDirectProjectOverride?.(projectKey),
    directSelectZone: (zoneKey) =>
      animationController.setDirectZoneOverride?.(zoneKey)
  }), [
    scrollData.scrollToProgress,
    scrollData.scrollToZone,
    animationController.config?.scrollZones,
    animationController.getProjectSectionStart,
    animationController.setDirectProjectOverride,
    animationController.setDirectZoneOverride
  ]);

  // Core animation data consumed by 3D components
  const animationData = useMemo(() => {
    const zone = animationController.animationState.zoneInfo?.zone;
    return {
      state: animationController.animationState.state,
      crystalForm: animationController.animationState.crystalForm,
      cameraState: animationController.animationState.cameraState,
      // Normalize undefined to null so consumers can rely on explicit null check
      focusedFacet: animationController.animationState.focusedFacet ?? null,
      // Only expose a focused project when actually in the projects zone
      focusedProject:
        zone === 'projects'
          ? animationController.animationState.projectInfo?.project
          : null,
      projectProgress: animationController.animationState.projectInfo?.progress,
      isTransitioning: animationController.animationState.isTransitioning,
      cameraConfig: animationController.cameraConfig,
      crystalConfig: animationController.crystalConfig,
      currentZone: zone,
      zoneProgress: animationController.animationState.zoneInfo?.progress,
      isEnteringZone: animationController.animationState.zoneInfo?.isEntering,
      isLeavingZone: animationController.animationState.zoneInfo?.isLeaving,
      cameraSettled: animationController.animationState.cameraSettled,
      cameraMoveProgress: animationController.animationState.cameraMoveProgress,
      setCameraSettled: animationController.setCameraSettled,
      setCameraMoveProgress: animationController.setCameraMoveProgress
    };
  }, [
    animationController.animationState,
    animationController.cameraConfig,
    animationController.crystalConfig,
    animationController.setCameraSettled,
    animationController.setCameraMoveProgress
  ]);

  exportedAnimationData = animationData;

  // Clone children and pass only required fields
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        animationData,
        scrollToProgress: scrollControls.scrollToProgress,
        scrollToProject: scrollControls.scrollToProject,
        onDirectProjectSelect: scrollControls.directSelectProject,
        onDirectZoneSelect: scrollControls.directSelectZone
      });
    }
    return child;
  });

  return (
    <>
      {childrenWithProps}
      
      {showAnimationDebug && (
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
        🎬 Animation Debug (Press 'A' to toggle)
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
        <div style={{ color: '#4caf50', fontWeight: 'bold' }}>✅ KEYBOARD CONTROLS</div>
        <div>• Press 'A' to toggle this panel</div>
        <div>• Press 'C' to toggle crystal debug</div>
        <div>• Same pattern as working projects</div>
      </div>
    </div>
  );
};

export { exportedAnimationData as animationData, exportedScrollMetrics as scrollMetrics };
export default MasterAnimationCoordinator;
