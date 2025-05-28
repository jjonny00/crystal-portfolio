// src/components/three/CameraController.jsx
// Enhanced camera controller with configuration system and debug tools

import { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Import camera configuration system
import { 
  getCameraState, 
  getProjectCameraState, 
  getTransitionTiming, 
  getTransitionEasing,
  exportCameraPosition,
  validateCameraState 
} from '../../config/cameraStates';

// Import state machine constants
import { CRYSTAL_STATES } from '../../machines/crystalStateMachine';

/**
 * Enhanced Camera Controller with configuration-driven system
 */
const CameraController = ({ 
  isExploded,
  crystalState,
  selectedFacet = null,
  facetRefs = { current: [] },
  config,
  facetLabels = [],
  debugMode = false
}) => {
  const { camera, clock } = useThree();
  
  // Camera animation state
  const cameraAnimation = useRef({
    active: false,
    startTime: 0,
    duration: 1000,
    startPosition: null,
    targetPosition: null,
    startRotation: null,
    targetRotation: null,
    startFOV: null,
    targetFOV: null,
    easingFunction: null
  });
  
  // State tracking
  const [currentCameraState, setCurrentCameraState] = useState('INTRO');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevCrystalState = useRef(CRYSTAL_STATES.WHOLE);
  const prevSelectedFacet = useRef(null);
  
  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    position: [0, 0, 0],
    target: [0, 0, 0],
    fov: 45
  });
  
  // Initialize camera to intro position
  useEffect(() => {
    const introState = getCameraState('INTRO');
    if (introState && !cameraAnimation.current.active) {
      camera.position.set(...introState.position);
      camera.lookAt(...introState.target);
      camera.fov = introState.fov;
      camera.updateProjectionMatrix();
      setCurrentCameraState('INTRO');
      
      if (debugMode) {
        console.log('📹 Camera initialized to INTRO state');
      }
    }
  }, [camera, debugMode]);
  
  // Handle crystal state changes - UPDATED for scroll integration
  useEffect(() => {
    if (prevCrystalState.current === crystalState) return;
    
    const newCameraState = mapCrystalStateToCameraState(crystalState, selectedFacet);
    
    if (newCameraState && newCameraState !== currentCameraState) {
      transitionToState(newCameraState, currentCameraState);
      setCurrentCameraState(newCameraState);
    }
    
    prevCrystalState.current = crystalState;
  }, [crystalState, selectedFacet, currentCameraState]);
  
  // Handle facet selection changes
  useEffect(() => {
    if (prevSelectedFacet.current === selectedFacet) return;
    
    if (selectedFacet) {
      const projectState = getProjectCameraState(selectedFacet);
      if (projectState) {
        const stateKey = `PROJECT_${selectedFacet.toUpperCase()}`;
        transitionToState(stateKey, currentCameraState);
        setCurrentCameraState(stateKey);
      }
    } else if (prevSelectedFacet.current && crystalState === CRYSTAL_STATES.EXPLODED) {
      // Return to explosion view
      transitionToState('EXPLOSION', currentCameraState);
      setCurrentCameraState('EXPLOSION');
    }
    
    prevSelectedFacet.current = selectedFacet;
  }, [selectedFacet, crystalState, currentCameraState]);
  
  /**
   * Map crystal state to camera state - UPDATED for better scroll integration
   */
  const mapCrystalStateToCameraState = (crystalState, selectedFacet) => {
    switch (crystalState) {
      case CRYSTAL_STATES.WHOLE:
        return 'INTRO';
      case CRYSTAL_STATES.FRACTURING:
        return 'INTRO'; // Stay at intro during fracturing
      case CRYSTAL_STATES.EXPLODING:
        return 'EXPLOSION'; // Move to explosion view during exploding
      case CRYSTAL_STATES.EXPLODED:
        return selectedFacet ? `PROJECT_${selectedFacet.toUpperCase()}` : 'EXPLOSION';
      case CRYSTAL_STATES.PROJECT_SELECTED:
        return selectedFacet ? `PROJECT_${selectedFacet.toUpperCase()}` : 'EXPLOSION';
      case CRYSTAL_STATES.REFORMING:
        return 'INTRO';
      default:
        return 'INTRO';
    }
  };
  
  /**
   * Transition camera to a new state
   */
  const transitionToState = (newStateKey, fromStateKey) => {
    const targetState = getCameraState(newStateKey);
    
    if (!targetState) {
      console.warn(`❌ Camera state '${newStateKey}' not found`);
      return;
    }
    
    if (debugMode) {
      console.log(`📹 Transitioning camera: ${fromStateKey} → ${newStateKey}`);
      validateCameraState(newStateKey);
    }
    
    // Get timing and easing for this transition
    const duration = getTransitionTiming(fromStateKey, newStateKey);
    const easingFunction = getTransitionEasing(fromStateKey, newStateKey);
    
    // Set up animation
    cameraAnimation.current = {
      active: true,
      startTime: clock.getElapsedTime(),
      duration: duration / 1000, // Convert to seconds
      
      // Position
      startPosition: camera.position.clone(),
      targetPosition: new THREE.Vector3(...targetState.position),
      
      // Rotation (calculate from target)
      startRotation: camera.quaternion.clone(),
      targetRotation: calculateLookAtQuaternion(targetState.position, targetState.target),
      
      // FOV
      startFOV: camera.fov,
      targetFOV: targetState.fov,
      
      // Easing
      easingFunction
    };
    
    setIsTransitioning(true);
    
    if (debugMode) {
      console.log(`📹 Animation setup:`, {
        duration: duration,
        from: camera.position.toArray(),
        to: targetState.position,
        easing: easingFunction.name || 'custom'
      });
    }
  };
  
  /**
   * Calculate quaternion for looking at target
   */
  const calculateLookAtQuaternion = (position, target) => {
    const tempCamera = new THREE.PerspectiveCamera();
    tempCamera.position.set(...position);
    tempCamera.lookAt(...target);
    return tempCamera.quaternion.clone();
  };
  
  /**
   * Public method to transition to specific states
   * Can be called from other components
   */
  const goToState = (stateKey) => {
    if (isTransitioning) {
      if (debugMode) {
        console.warn('📹 Camera transition already in progress, ignoring new request');
      }
      return;
    }
    
    transitionToState(stateKey, currentCameraState);
    setCurrentCameraState(stateKey);
  };
  
  /**
   * Public method for scroll-based camera control
   */
  const goToScrollState = (sectionName) => {
    const stateMap = {
      'intro': 'INTRO',
      'projects': 'EXPLOSION',
      'about': 'ABOUT',
      'footer': 'FOOTER'
    };
    
    const targetState = stateMap[sectionName];
    if (targetState) {
      goToState(targetState);
    }
  };
  
  // Expose methods to parent component via ref callback
  useEffect(() => {
    if (typeof facetRefs === 'object' && facetRefs.current) {
      facetRefs.current.cameraController = {
        goToState,
        goToScrollState,
        getCurrentState: () => currentCameraState,
        isTransitioning: () => isTransitioning,
        exportCurrentPosition: (name) => exportCameraPosition(camera, name || 'current')
      };
    }
  }, [currentCameraState, isTransitioning]);
  
  // Animation frame loop
  useFrame((state) => {
    if (!cameraAnimation.current.active) {
      // Update debug info even when not animating
      if (debugMode) {
        setDebugInfo({
          position: [
            Math.round(camera.position.x * 100) / 100,
            Math.round(camera.position.y * 100) / 100,
            Math.round(camera.position.z * 100) / 100
          ],
          target: [0, 0, 0], // Would need to track target from controls
          fov: Math.round(camera.fov * 10) / 10
        });
      }
      return;
    }
    
    const elapsed = state.clock.getElapsedTime() - cameraAnimation.current.startTime;
    const progress = Math.min(elapsed / cameraAnimation.current.duration, 1);
    
    // Apply easing
    const easedProgress = cameraAnimation.current.easingFunction 
      ? cameraAnimation.current.easingFunction(progress)
      : progress;
    
    // Interpolate position
    camera.position.lerpVectors(
      cameraAnimation.current.startPosition,
      cameraAnimation.current.targetPosition,
      easedProgress
    );
    
    // Interpolate rotation
    camera.quaternion.slerpQuaternions(
      cameraAnimation.current.startRotation,
      cameraAnimation.current.targetRotation,
      easedProgress
    );
    
    // Interpolate FOV
    camera.fov = THREE.MathUtils.lerp(
      cameraAnimation.current.startFOV,
      cameraAnimation.current.targetFOV,
      easedProgress
    );
    camera.updateProjectionMatrix();
    
    // Check if animation is complete
    if (progress >= 1) {
      // Ensure final values are set exactly
      camera.position.copy(cameraAnimation.current.targetPosition);
      camera.quaternion.copy(cameraAnimation.current.targetRotation);
      camera.fov = cameraAnimation.current.targetFOV;
      camera.updateProjectionMatrix();
      
      // Clean up
      cameraAnimation.current.active = false;
      setIsTransitioning(false);
      
      if (debugMode) {
        console.log(`📹 Camera transition complete: ${currentCameraState}`);
        console.log('Final position:', camera.position.toArray());
      }
    }
    
    // Update debug info during animation
    if (debugMode) {
      setDebugInfo({
        position: [
          Math.round(camera.position.x * 100) / 100,
          Math.round(camera.position.y * 100) / 100,
          Math.round(camera.position.z * 100) / 100
        ],
        target: cameraAnimation.current.targetPosition ? [
          Math.round(cameraAnimation.current.targetPosition.x * 100) / 100,
          Math.round(cameraAnimation.current.targetPosition.y * 100) / 100,
          Math.round(cameraAnimation.current.targetPosition.z * 100) / 100
        ] : [0, 0, 0],
        fov: Math.round(camera.fov * 10) / 10,
        progress: Math.round(progress * 100) / 100,
        eased: Math.round(easedProgress * 100) / 100
      });
    }
  });

  // Debug UI - only render in debug mode
  if (debugMode) {
    return (
      <group>
        <Html
          position={[2, 2, 0]}
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            pointerEvents: 'none',
            zIndex: 10000
          }}
        >
          <div>
            <div style={{ color: '#64ffda', fontWeight: 'bold' }}>Camera Debug</div>
            <div>State: {currentCameraState}</div>
            <div>Position: {debugInfo.position.join(', ')}</div>
            <div>Target: {debugInfo.target.join(', ')}</div>
            <div>FOV: {debugInfo.fov}°</div>
            {debugInfo.progress !== undefined && (
              <>
                <div>Progress: {debugInfo.progress}</div>
                <div>Eased: {debugInfo.eased}</div>
              </>
            )}
            <div style={{ marginTop: '5px', fontSize: '10px', opacity: 0.7 }}>
              Press C in console: exportCurrentPosition('stateName')
            </div>
          </div>
        </Html>
      </group>
    );
  }
  
  return null;
};

export default CameraController;