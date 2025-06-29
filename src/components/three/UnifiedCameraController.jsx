// ENHANCED: src/components/three/UnifiedCameraController.jsx
// Now supports targeting anchor objects within facet models

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * ENHANCED: Camera Controller with anchor targeting support
 */
const UnifiedCameraController = ({ 
  animationData,
  config,
  isMobile = false,
  facetRefs = null // NEW: Pass in refs to facet models to find anchors
}) => {
  const { camera } = useThree();
  
  // Current camera target tracking
  const currentTarget = useRef({
    position: new THREE.Vector3(),
    lookAt: new THREE.Vector3(), 
    fov: 45
  });
  
  // REMOVED: Anchor cache - we'll get fresh positions every time
  
  // Adaptive animation speeds based on distance
  const animationSpeed = useRef({
    position: 0.03,
    lookAt: 0.03,
    fov: 0.03
  });
  
  // Track last camera config to detect changes
  const lastCameraConfig = useRef(null);

  /**
   * FIXED: Find anchor object within a facet model and get FRESH position
   */
  const findAnchorInFacet = (facetRef, facetKey) => {
    if (!facetRef || !facetRef.current) return null;
    
    // Expected anchor name pattern
    const anchorName = `anchor_${facetKey}`;
    
    // Search for anchor in the facet model
    let anchorObject = null;
    
    // Method 1: Direct search by name
    anchorObject = facetRef.current.getObjectByName(anchorName);
    
    if (!anchorObject) {
      // Method 2: Traverse the entire facet model to find anchor
      facetRef.current.traverse((child) => {
        if (child.name === anchorName) {
          anchorObject = child;
        }
      });
    }
    
    if (anchorObject) {
      // FIXED: Get FRESH world position every time - no caching
      const worldPosition = new THREE.Vector3();
      anchorObject.getWorldPosition(worldPosition);
      
      console.log(`🎯 Fresh anchor position for ${facetKey}:`, {
        anchorName,
        worldPosition: worldPosition.toArray(),
        time: Date.now()
      });
      
      return worldPosition;
    } else {
      console.warn(`⚠️ Anchor "${anchorName}" not found in facet ${facetKey}`);
      return null;
    }
  };

  /**
   * FIXED: Get camera target with fresh anchor positions
   */
  const getCameraTarget = (cameraConfig, focusedFacet) => {
    // For project cameras, try to find anchor with FRESH position
    if (animationData?.cameraState === 'project' && focusedFacet && facetRefs) {
      const facetIndex = ['empathy', 'narrative', 'craft', 'system', 'leadership', 'exploration'].indexOf(focusedFacet);
      
      if (facetIndex !== -1 && facetRefs.current && facetRefs.current[facetIndex]) {
        // FIXED: Get fresh anchor position every time
        const anchorPosition = findAnchorInFacet(facetRefs.current[facetIndex], focusedFacet);
        
        if (anchorPosition) {
          // Return camera config with FRESH anchor as target
          return {
            ...cameraConfig,
            target: anchorPosition,
            description: `${cameraConfig.description} (fresh anchor targeted)`
          };
        }
      }
    }
    
    // Fallback to original target
    return cameraConfig;
  };

  /**
   * Initialize camera target from current position
   */
  useEffect(() => {
    currentTarget.current.position.copy(camera.position);
    currentTarget.current.fov = camera.fov;
    
    // Calculate current look-at direction
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    currentTarget.current.lookAt.copy(camera.position).add(direction);
  }, [camera]);

  /**
   * ENHANCED: Update camera targets with anchor support
   */
  useEffect(() => {
    if (!animationData?.cameraConfig) return;

    const baseConfig = animationData.cameraConfig;
    
    // Get enhanced config with anchor targeting
    const enhancedConfig = getCameraTarget(baseConfig, animationData.focusedFacet);
    
    // Check if config actually changed to avoid unnecessary updates
    const configChanged = !lastCameraConfig.current ||
      !enhancedConfig.position?.equals(lastCameraConfig.current.position) ||
      !enhancedConfig.target?.equals(lastCameraConfig.current.target) ||
      enhancedConfig.fov !== lastCameraConfig.current.fov;

    if (configChanged) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📹 Enhanced camera target updated:', {
          state: animationData.state,
          cameraState: animationData.cameraState,
          focusedFacet: animationData.focusedFacet,
          position: enhancedConfig.position?.toArray(),
          target: enhancedConfig.target?.toArray(),
          fov: enhancedConfig.fov,
          usingAnchor: enhancedConfig.description?.includes('fresh anchor')
        });
      }

      // Update targets immediately
      if (enhancedConfig.position) {
        currentTarget.current.position.copy(enhancedConfig.position);
      }
      
      if (enhancedConfig.target) {
        currentTarget.current.lookAt.copy(enhancedConfig.target);
      }
      
      if (enhancedConfig.fov !== undefined) {
        currentTarget.current.fov = enhancedConfig.fov;
      }

      // State-aware animation speeds
      const positionDistance = camera.position.distanceTo(currentTarget.current.position);
      
      if (animationData.state === 'hero' && positionDistance > 3) {
        animationSpeed.current.position = 0.025;
        animationSpeed.current.lookAt = 0.025;
        animationSpeed.current.fov = 0.025;
      } else if (animationData.state === 'overview' && positionDistance > 2) {
        animationSpeed.current.position = 0.035;
        animationSpeed.current.lookAt = 0.035;
        animationSpeed.current.fov = 0.035;
      } else if (animationData.state === 'about' && positionDistance > 2) {
        animationSpeed.current.position = 0.02;
        animationSpeed.current.lookAt = 0.02;
        animationSpeed.current.fov = 0.02;
      } else if (animationData.cameraState === 'project' && animationData.focusedFacet) {
        // Project focus - quick and responsive for anchor targeting
        animationSpeed.current.position = 0.05;
        animationSpeed.current.lookAt = 0.05;
        animationSpeed.current.fov = 0.05;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`📹 Project focus camera update: ${animationData.focusedFacet}, distance: ${positionDistance.toFixed(2)}, using fresh anchor: ${enhancedConfig.description?.includes('fresh anchor')}`);
        }
      } else {
        animationSpeed.current.position = 0.03;
        animationSpeed.current.lookAt = 0.03;
        animationSpeed.current.fov = 0.03;
      }

      // Store current config for comparison
      lastCameraConfig.current = {
        position: enhancedConfig.position?.clone(),
        target: enhancedConfig.target?.clone(),
        fov: enhancedConfig.fov
      };
    }
  }, [
    animationData?.cameraConfig, 
    animationData?.state, 
    animationData?.cameraState, 
    animationData?.focusedFacet,
    facetRefs, // Keep facetRefs as dependency
    camera
  ]);

  // REMOVED: Clear anchor cache effect - no longer needed

  /**
   * Smooth animation loop (unchanged)
   */
  useFrame(() => {
    if (!currentTarget.current) return;

    const currentSpeeds = animationSpeed.current;

    // Smooth position interpolation
    camera.position.lerp(currentTarget.current.position, currentSpeeds.position);
    
    // Smooth look-at interpolation
    const currentDirection = new THREE.Vector3();
    camera.getWorldDirection(currentDirection);
    
    const targetDirection = new THREE.Vector3()
      .subVectors(currentTarget.current.lookAt, camera.position)
      .normalize();
    
    // Interpolate direction vectors
    currentDirection.lerp(targetDirection, currentSpeeds.lookAt);
    
    // Apply new look direction
    const newLookAt = new THREE.Vector3()
      .addVectors(camera.position, currentDirection);
    
    camera.lookAt(newLookAt);
    
    // Smooth FOV interpolation
    const fovDiff = currentTarget.current.fov - camera.fov;
    camera.fov += fovDiff * currentSpeeds.fov;
    camera.updateProjectionMatrix();
  });

  /**
   * Handle mobile optimizations
   */
  useEffect(() => {
    if (isMobile) {
      // Slower animation on mobile for smoother feel
      Object.keys(animationSpeed.current).forEach(key => {
        animationSpeed.current[key] *= 0.7;
      });
    }
  }, [isMobile]);

  // This component doesn't render anything
  return null;
};

export default UnifiedCameraController;