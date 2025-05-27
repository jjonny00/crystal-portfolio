// src/components/three/CameraController.jsx
// Updated with state machine integration
import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Import state machine constants
import { CRYSTAL_STATES } from '../../machines/crystalStateMachine';

/**
 * Component to handle camera animations and transitions based on crystal state
 */
const CameraController = ({ 
  isExploded,
  crystalState, // New prop for state machine integration
  selectedFacet = null,
  facetRefs = { current: [] },
  config,
  facetLabels = []
}) => {
  const { camera, clock } = useThree();
  
  // Animation state reference
  const cameraAnimation = useRef({
    startPosition: null,
    targetPosition: null,
    startRotation: null,
    targetRotation: null,
    active: false,
    startTime: 0,
    duration: 1000
  });
  
  // Keep track of the previous selected facet
  const prevSelectedFacet = useRef(null);
  const prevCrystalState = useRef(CRYSTAL_STATES.WHOLE);
  
  // Store key camera positions
  const initialPosition = useRef(null);
  const explodedPosition = useRef(null);
  
  // Debug flag - set to true to log camera positions
  const DEBUG = true;
  
  // Initialize camera positions
  useEffect(() => {
    // Store initial camera position on first render
    if (!initialPosition.current) {
      initialPosition.current = camera.position.clone();
      if (DEBUG) console.log("Stored initial camera position:", initialPosition.current);
    }
  }, [camera]);
  
  // Store exploded position when transitioning to exploded view
  useEffect(() => {
    if ((crystalState === CRYSTAL_STATES.EXPLODED || crystalState === CRYSTAL_STATES.EXPLODING) && 
        !selectedFacet && !cameraAnimation.current.active) {
      // Wait a moment to ensure the camera has finished animating to exploded view
      const timer = setTimeout(() => {
        explodedPosition.current = camera.position.clone();
        if (DEBUG) console.log("Stored exploded camera position:", explodedPosition.current);
      }, config.timing.camera.explodeDuration + 100);
      
      return () => clearTimeout(timer);
    }
  }, [crystalState, selectedFacet, config.timing.camera.explodeDuration]);
  
  // Handle state transitions
  useEffect(() => {
    if (DEBUG) console.log(`Crystal state changed: ${prevCrystalState.current} -> ${crystalState}`);
    
    // Handle state machine transitions for camera
    switch(crystalState) {
      case CRYSTAL_STATES.WHOLE:
        // Camera is at initial position
        break;
        
      case CRYSTAL_STATES.FRACTURING:
        // No camera movement during fracturing phase
        break;
        
      case CRYSTAL_STATES.EXPLODING:
        // Animate camera to explosion view
        animateExplosionState(true);
        break;
        
      case CRYSTAL_STATES.EXPLODED:
        // If we were in PROJECT_SELECTED state and now in EXPLODED, animate back
        if (prevCrystalState.current === CRYSTAL_STATES.PROJECT_SELECTED) {
          animateToExplodedView();
        }
        break;
        
      case CRYSTAL_STATES.PROJECT_SELECTED:
        // If we were in EXPLODED state and now in PROJECT_SELECTED, animate to project
        if (prevCrystalState.current === CRYSTAL_STATES.EXPLODED && selectedFacet) {
          animateToFacet(selectedFacet);
        }
        break;
        
      case CRYSTAL_STATES.REFORMING:
        // Animate camera back to whole crystal view
        animateExplosionState(false);
        break;
    }
    
    // Update previous state
    prevCrystalState.current = crystalState;
  }, [crystalState, selectedFacet]);
  
  // Set up camera animation when selected facet changes
  useEffect(() => {
    if (DEBUG) console.log("Selected facet changed:", selectedFacet);
    
    // Handle facet selection changes
    if (prevSelectedFacet.current !== selectedFacet) {
      if (selectedFacet) {
        // Animate to selected facet
        animateToFacet(selectedFacet);
      } else if (prevSelectedFacet.current && crystalState === CRYSTAL_STATES.EXPLODED) {
        // Animate back to exploded view
        animateToExplodedView();
      }
      
      // Update previous selected facet
      prevSelectedFacet.current = selectedFacet;
    }
  }, [selectedFacet, crystalState]);
  
  // Animate camera back to exploded view position
  const animateToExplodedView = () => {
    // Use stored exploded position, or calculate a reasonable fallback
    let targetPosition;
    
    if (explodedPosition.current) {
      // Use stored position from previous explosion
      targetPosition = explodedPosition.current.clone();
      if (DEBUG) console.log("Using stored exploded position:", targetPosition);
    } else {
      // Calculate a fallback position
      targetPosition = initialPosition.current.clone().normalize().multiplyScalar(9);
      if (DEBUG) console.log("Using calculated fallback exploded position:", targetPosition);
    }
    
    // Set up camera to look at center
    const target = new THREE.Vector3(0, 0, 0);
    
    // Calculate rotation to look at center
    const lookAtMatrix = new THREE.Matrix4().lookAt(
      targetPosition,
      target,
      camera.up
    );
    const targetRotation = new THREE.Quaternion().setFromRotationMatrix(lookAtMatrix);
    
    // Store animation parameters
    cameraAnimation.current = {
      startPosition: camera.position.clone(),
      targetPosition: targetPosition,
      startRotation: camera.quaternion.clone(),
      targetRotation: targetRotation,
      active: true,
      startTime: clock.getElapsedTime(),
      // Use facet return duration for smoother transition
      duration: config.timing.camera.facetReturnDuration || 1200
    };
    
    if (DEBUG) console.log("Starting camera animation to exploded view");
  };
  
  // Animate camera to a specific facet
  const animateToFacet = (facetKey) => {
    const facetIndex = facetLabels.findIndex(f => f.key === facetKey);
    
    if (facetIndex >= 0 && facetRefs.current[facetIndex]) {
      // Get the facet's position
      const facetPosition = facetRefs.current[facetIndex].position.clone();
      
      if (DEBUG) console.log(`Facet ${facetKey} position:`, facetPosition);
      
      // Calculate target position: back off from facet in the direction from facet to current camera
      const target = facetPosition.clone();
      
      // Calculate a direction vector from facet to camera
      const facetToCamera = camera.position.clone().sub(target);
      facetToCamera.normalize();
      
      // Back the camera off by a distance based on the facet size
      const targetPosition = target.clone().add(facetToCamera.multiplyScalar(3.5));
      
      if (DEBUG) console.log(`Target camera position for facet ${facetKey}:`, targetPosition);
      
      // Create a rotation to look at the facet
      const lookAtMatrix = new THREE.Matrix4().lookAt(
        targetPosition,
        facetPosition,
        camera.up
      );
      const targetRotation = new THREE.Quaternion().setFromRotationMatrix(lookAtMatrix);
      
      // Store animation parameters
      cameraAnimation.current = {
        startPosition: camera.position.clone(),
        targetPosition: targetPosition,
        startRotation: camera.quaternion.clone(),
        targetRotation: targetRotation,
        active: true,
        startTime: clock.getElapsedTime(),
        duration: config.timing.camera.facetZoomDuration || 1000
      };
      
      if (DEBUG) console.log(`Starting camera animation to facet: ${facetKey}`);
    } else {
      if (DEBUG) console.log(`Could not find facet: ${facetKey}`);
    }
  };
  
  // Animate camera for explosion/reform
  const animateExplosionState = (exploded) => {
    // Target point is always the center of the scene
    const target = new THREE.Vector3(0, 0, 0);
    
    // Get direction from camera to target
    const direction = new THREE.Vector3();
    direction.subVectors(target, camera.position).normalize();
    
    // Store current camera position
    const currentPosition = camera.position.clone();
    
    // Calculate target position based on current position and direction
    const targetPosition = currentPosition.clone();
    
    if (exploded) {
      // Move away from target
      targetPosition.addScaledVector(direction, -config.camera.zoomAmount);
      if (DEBUG) console.log("Exploding - target position:", targetPosition);
    } else {
      // Move toward target
      targetPosition.addScaledVector(direction, config.camera.zoomAmount);
      if (DEBUG) console.log("Reforming - target position:", targetPosition);
    }
    
    // Store animation parameters
    cameraAnimation.current = {
      startPosition: currentPosition,
      targetPosition: targetPosition,
      // For explosion/reform, we don't change rotation, just preserve current
      startRotation: camera.quaternion.clone(),
      targetRotation: camera.quaternion.clone(),
      active: true,
      startTime: clock.getElapsedTime(),
      duration: exploded ? config.timing.camera.explodeDuration : config.timing.camera.reformDuration
    };
    
    // If exploding, store the final position once animation completes
    if (exploded) {
      // Set a timeout to store the position after animation completes
      setTimeout(() => {
        explodedPosition.current = camera.position.clone();
        if (DEBUG) console.log("Updated exploded position after animation:", explodedPosition.current);
      }, config.timing.camera.explodeDuration + 50);
    }
  };
  
  // Update camera animation on each frame
  useFrame((state) => {
    if (cameraAnimation.current.active) {
      const elapsed = (state.clock.getElapsedTime() - cameraAnimation.current.startTime) * 1000;
      const duration = cameraAnimation.current.duration;
      const progress = Math.min(elapsed / duration, 1);
      
      // Get appropriate easing function
      let easedProgress;
      
      // Select easing based on the current animation type
      if (crystalState === CRYSTAL_STATES.PROJECT_SELECTED || 
          (prevCrystalState.current === CRYSTAL_STATES.PROJECT_SELECTED && crystalState === CRYSTAL_STATES.EXPLODED)) {
        // Facet transitions - zoom or return
        easedProgress = config.easings.facetZoomEase 
          ? config.easings.facetZoomEase(progress) 
          : config.easings.explosionEase(progress);
      } else if (crystalState === CRYSTAL_STATES.EXPLODING) {
        // Exploding animation
        easedProgress = config.easings.explosionEase(progress);
      } else if (crystalState === CRYSTAL_STATES.REFORMING) {
        // Reforming animation
        easedProgress = config.easings.reformEase(progress);
      } else {
        // Default easing
        easedProgress = progress;
      }
      
      // Apply position interpolation
      if (progress < 1) {
        camera.position.lerpVectors(
          cameraAnimation.current.startPosition, 
          cameraAnimation.current.targetPosition, 
          easedProgress
        );
        
        // Apply rotation interpolation if start and target are different
        if (cameraAnimation.current.startRotation && 
            cameraAnimation.current.targetRotation &&
            !cameraAnimation.current.startRotation.equals(cameraAnimation.current.targetRotation)) {
          
          camera.quaternion.slerpQuaternions(
            cameraAnimation.current.startRotation,
            cameraAnimation.current.targetRotation,
            easedProgress
          );
        }
      } else {
        // Animation complete
        camera.position.copy(cameraAnimation.current.targetPosition);
        
        if (cameraAnimation.current.targetRotation) {
          camera.quaternion.copy(cameraAnimation.current.targetRotation);
        }
        
        cameraAnimation.current.active = false;
        
        if (DEBUG) console.log("Camera animation complete - final position:", camera.position.clone());
        
        // If we're in exploded state with no facet selected, update our stored exploded position
        if (crystalState === CRYSTAL_STATES.EXPLODED && !selectedFacet) {
          explodedPosition.current = camera.position.clone();
          if (DEBUG) console.log("Updated exploded position:", explodedPosition.current);
        }
      }
    }
  });
  
  // Return null since this is a controller component with no visible elements
  return null;
};

export default CameraController;