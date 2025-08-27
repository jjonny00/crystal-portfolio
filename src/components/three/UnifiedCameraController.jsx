import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const UnifiedCameraController = ({
  animationData,
  isMobile = false,
  simplifiedAnimations = false,
  facetRefs = null // Facet refs passed from UnifiedCrystalScene
}) => {
  const { camera } = useThree();

  // Track orbital rotation around the crystal during hero state
  const heroOrbitAngle = useRef(0);
  const isOrbitingRef = useRef(false);
  
  // Current camera target tracking
  const currentTarget = useRef({
    position: new THREE.Vector3(),
    lookAt: new THREE.Vector3(), 
    fov: 45
  });
  
  // Adaptive animation speeds based on distance
  const animationSpeed = useRef({
    position: 0.03,
    lookAt: 0.03,
    fov: 0.03
  });

  // Track last camera config to detect changes
  const lastCameraConfig = useRef(null);

  // Track when camera has reached its target
  const settleFrameCount = useRef(0);
  const cameraSettledRef = useRef(false);
  const SETTLE_EPSILON = 0.01;
  const SETTLE_FRAMES = 5;

  const findAnchorInFacet = (facetKey) => {
    if (!facetRefs) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Camera Controller: No facet refs available for anchor search');
      }
      return null;
    }
    
    const facetKeys = ['empathy', 'narrative', 'craft', 'system', 'leadership', 'exploration'];
    const facetIndex = facetKeys.indexOf(facetKey);
    
    if (facetIndex === -1) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Camera Controller: Unknown facet key: ${facetKey}`);
      }
      return null;
    }
    
    
    const facetRef = facetRefs[facetIndex]; // Direct array access
    
    if (!facetRef || !facetRef.current) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Camera Controller: Facet ref not available for ${facetKey} (index ${facetIndex})`);
      }
      return null;
    }
    
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
      
      const worldPosition = new THREE.Vector3();
      anchorObject.getWorldPosition(worldPosition);
      
      if (import.meta.env.DEV) {
        console.log(`🎯 Camera Controller: Fresh anchor position for ${facetKey}:`, {
          anchorName,
          worldPosition: worldPosition.toArray(),
          facetPosition: facetRef.current.position.toArray(),
          time: Date.now()
        });
      }
      
      return worldPosition;
    } else {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ Camera Controller: Anchor "${anchorName}" not found in facet ${facetKey}`);
      }
      return null;
    }
  };

  const getCameraTarget = (cameraConfig, focusedFacet, cameraState) => {
    // For project cameras, try to find anchor with FRESH position
    if (cameraState === 'project' && focusedFacet && facetRefs) {
      
      const anchorPosition = findAnchorInFacet(focusedFacet);
      
      if (anchorPosition) {
        // Return camera config with FRESH anchor as target
        return {
          ...cameraConfig,
          target: anchorPosition,
          description: `${focusedFacet} project (anchor targeted)` 
        };
      } else {
        // Fallback to default project config if anchor not found
        if (import.meta.env.DEV) {
          console.warn(`⚠️ Camera Controller: No anchor found for ${focusedFacet}, using default target`);
        }
        return {
          ...cameraConfig,
          description: `${focusedFacet} project (default target)`
        };
      }
    }
    
    // Non-project cameras use original target
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

  useEffect(() => {
    // During fracture pauses, hold camera at its current position
    if (
      (animationData?.state === 'overview' && animationData?.cameraState === 'hero') ||
      (animationData?.state === 'hero' && animationData?.cameraState === 'overview')
    ) {
      isOrbitingRef.current = false;
      return;
    }

    if (!animationData?.cameraConfig) return;

    const baseConfig = animationData.cameraConfig;
    const focusedFacet = animationData.focusedFacet;
    const cameraState = animationData.cameraState;
    
    // Get enhanced config with anchor targeting
    const enhancedConfig = getCameraTarget(baseConfig, focusedFacet, cameraState);

    // Guard against missing config (prevents runtime errors when animation state changes
    // before camera configuration is ready)
    if (!enhancedConfig) {
      if (import.meta.env.DEV) {
        console.warn('📹 Camera Controller: No camera configuration available');
      }
      return;
    }

    // Check if config actually changed to avoid unnecessary updates
    const configChanged = !lastCameraConfig.current ||
      !enhancedConfig.position?.equals(lastCameraConfig.current.position) ||
      !enhancedConfig.target?.equals(lastCameraConfig.current.target) ||
      enhancedConfig.fov !== lastCameraConfig.current.fov ||
      enhancedConfig.description !== lastCameraConfig.current.description; // Also check description

    if (configChanged) {
      if (import.meta.env.DEV) {
        console.log('📹 Camera Controller: Enhanced camera target updated:', {
          state: animationData.state,
          cameraState: cameraState,
          focusedFacet: focusedFacet,
          position: enhancedConfig.position?.toArray(),
          target: enhancedConfig.target?.toArray(),
          fov: enhancedConfig.fov,
          description: enhancedConfig.description 
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
      } else if (cameraState === 'project' && focusedFacet) {
        
        animationSpeed.current.position = 0.05;
        animationSpeed.current.lookAt = 0.05;
        animationSpeed.current.fov = 0.05;
        
        if (import.meta.env.DEV) {
          console.log(`📹 Camera Controller: Project focus camera update: ${focusedFacet}, distance: ${positionDistance.toFixed(2)}, using anchor: ${enhancedConfig.description?.includes('anchor')}`);
        }
      } else {
        animationSpeed.current.position = 0.03;
        animationSpeed.current.lookAt = 0.03;
        animationSpeed.current.fov = 0.03;
      }

      // Store current config for comparison (including description)
      lastCameraConfig.current = {
        position: enhancedConfig.position?.clone(),
        target: enhancedConfig.target?.clone(),
        fov: enhancedConfig.fov,
        description: enhancedConfig.description
      };

      // Reset camera settled state when new configuration is applied
      settleFrameCount.current = 0;
      cameraSettledRef.current = false;
      if (animationData?.cameraSettled) {
        animationData.setCameraSettled(false);
      }
    }

    // Reset orbit when switching camera states and derive starting angle for hero
    if (cameraState === 'hero' && enhancedConfig.position) {
      heroOrbitAngle.current = Math.atan2(
        enhancedConfig.position.x,
        enhancedConfig.position.z
      );
      isOrbitingRef.current = false;
    } else {
      isOrbitingRef.current = false;
    }
  }, [
    animationData?.cameraConfig,
    animationData?.state,
    animationData?.cameraState,
    animationData?.focusedFacet,
    facetRefs, // Keep facetRefs as dependency to update when refs change
    camera
  ]);

  /**
   * Smooth animation loop
   */
  useFrame((state, deltaTime) => {
    if (!currentTarget.current || simplifiedAnimations) {
      if (simplifiedAnimations) {
        camera.position.copy(currentTarget.current.position);
        camera.lookAt(currentTarget.current.lookAt);
        camera.fov = currentTarget.current.fov;
        camera.updateProjectionMatrix();
        if (!cameraSettledRef.current) {
          cameraSettledRef.current = true;
          animationData?.setCameraSettled?.(true);
        }
      }
      return;
    }

    // Orbit camera around crystal during hero state once settled
    if (animationData.state === 'hero' && animationData.cameraState === 'hero' && isOrbitingRef.current) {
      const speed = animationData.cameraConfig?.orbitSpeed || 0.0003;
      heroOrbitAngle.current += speed * deltaTime * 60;
      // Use current camera config to determine orbit radius; fall back to current position
      const basePos = animationData.cameraConfig?.position || camera.position;
      const radius = Math.sqrt(basePos.x * basePos.x + basePos.z * basePos.z);
      const x = radius * Math.sin(heroOrbitAngle.current);
      const z = radius * Math.cos(heroOrbitAngle.current);
      const y = basePos.y;

      camera.position.set(x, y, z);
      camera.lookAt(currentTarget.current.lookAt);
      camera.fov = currentTarget.current.fov;
      camera.updateProjectionMatrix();

      currentTarget.current.position.set(x, y, z);

      animationData?.setCameraSettled?.(false);

      return;
    }

    // FIXED: Use exponential smoothing instead of lerp
    const smoothingFactor = 1 - Math.exp(-6 * deltaTime); // Frame-rate independent

    // FIXED: Clamp smoothing to prevent overshooting
    const clampedSmoothing = Math.min(Math.max(smoothingFactor, 0.01), 0.15);

    // Smooth position interpolation
    camera.position.lerp(currentTarget.current.position, clampedSmoothing);

    // Smooth look-at interpolation
    const currentDirection = new THREE.Vector3();
    camera.getWorldDirection(currentDirection);

    const targetDirection = new THREE.Vector3()
      .subVectors(currentTarget.current.lookAt, camera.position)
      .normalize();

    currentDirection.lerp(targetDirection, clampedSmoothing).normalize();

    const newLookAt = new THREE.Vector3()
      .addVectors(camera.position, currentDirection);

    camera.lookAt(newLookAt);

    // Smooth FOV interpolation
    const fovDiff = currentTarget.current.fov - camera.fov;
    camera.fov += fovDiff * clampedSmoothing;
    camera.updateProjectionMatrix();

    // Check if camera has settled at target
    const positionDiff = camera.position.distanceTo(currentTarget.current.position);
    const lookAtDiff = currentDirection.angleTo(targetDirection);

    if (positionDiff < SETTLE_EPSILON && lookAtDiff < SETTLE_EPSILON) {
      settleFrameCount.current += 1;
      if (settleFrameCount.current >= SETTLE_FRAMES && !cameraSettledRef.current) {
        cameraSettledRef.current = true;
        animationData?.setCameraSettled?.(true);
      }
    } else {
      if (cameraSettledRef.current) {
        cameraSettledRef.current = false;
        animationData?.setCameraSettled?.(false);
      }
      settleFrameCount.current = 0;
    }

    // Begin hero orbit once camera reaches hero target
    if (
      animationData.state === 'hero' &&
      animationData.cameraState === 'hero' &&
      cameraSettledRef.current &&
      !isOrbitingRef.current
    ) {
      isOrbitingRef.current = true;
      heroOrbitAngle.current = Math.atan2(
        camera.position.x,
        camera.position.z
      );
    }
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
