import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import { a, useSpring } from '@react-spring/three'
import { animated } from '@react-spring/web'
import * as THREE from 'three'

// Import default configuration (will be overridden by props)
import * as defaultConfig from '../../crystalConfig'

// Import material components
import CrystalMaterial from '../materials/CrystalMaterial'
import BlackOpalMaterial from '../materials/BlackOpalMaterial'
import BlackOpalSolidBase from '../materials/BlackOpalSolidBase'
import BlackOpalSolidEmissive from '../materials/BlackOpalSolidEmissive'
import IceOpalMaterial from '../materials/IceOpalMaterial'

// Premium label component with simple billboard behavior
const PremiumLabel = ({ label, index, position, visible, config }) => {
  const labelRef = useRef()
  const [hovered, setHovered] = useState(false)
  
  // Main label animation (no scale, just opacity)
  const { opacity } = useSpring({
    from: { opacity: 0 },
    to: { 
      opacity: visible ? 1 : 0
    },
    delay: visible ? index * config.timing.labels.staggerDelay : 0,
    config: config.springConfigs.label.appear
  })
  
  // Hover animation (subtle)
  const { hoverScale } = useSpring({
    hoverScale: hovered ? 1.05 : 1,
    config: config.springConfigs.label.hover
  })
  
  // Description animation
  const { descriptionOpacity } = useSpring({
    descriptionOpacity: hovered ? 1 : 0,
    config: config.springConfigs.label.description
  })
  
  // Calculate position relative to facet
  const labelPosition = position ? [position[0], position[1] - 1, position[2]] : [0, 0, 0]
  
  return (
    <group position={labelPosition}>
      <Html
        center
        transform
        distanceFactor={3}
        sprite // This automatically makes it face the camera
        ref={labelRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        prepend={false} 
        style={{ zIndex: 10 }}
        // Make labels non-interactive to prevent interfering with UI
        pointerEvents="none"
      >
        <animated.div 
          style={{
            opacity,
            transform: hoverScale.to(h => `scale(${h})`),
            pointerEvents: 'none', // Explicitly make labels non-interactive
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none'
          }}
        >
          {/* Main label */}
          <div style={config.ui.labels.styles.main}>
            {label.text}
          </div>
          
          {/* Premium accent line */}
          <animated.div style={{
            ...config.ui.labels.styles.accent,
            background: `linear-gradient(90deg, transparent, ${label.color}, transparent)`,
            opacity: descriptionOpacity.to(o => 0.7 + 0.3 * o),
          }} />
          
          {/* Description on hover */}
          <animated.div style={{
            opacity: descriptionOpacity,
            transition: 'all 0.3s ease',
          }}>
            <div style={config.ui.labels.styles.description}>
              {label.description}
            </div>
          </animated.div>
        </animated.div>
      </Html>
    </group>
  )
}

// Main crystal scene component
const CrystalScene = ({ isExploded, config = defaultConfig, materialVariant = 'default', blackOpalConfig, iceOpalConfig }) => {
  const facetRefs = useRef([])
  const [showFacets, setShowFacets] = useState(false)
  const [showLabels, setShowLabels] = useState(false)
  const [showCrystal, setShowCrystal] = useState(true)
  const [labelPositions, setLabelPositions] = useState(Array(6).fill([0, 0, 0]))
  const [explosionPhase, setExplosionPhase] = useState('initial'); // 'initial', 'fractured', 'exploded'
  const [fractureGlowComplete, setFractureGlowComplete] = useState(false);
  
  // Local state for material configs
  const [blackOpalConfigState, setBlackOpalConfig] = useState({
    emissiveIntensity: 0.5,
    roughness: 0.4,
    metalness: 0.1,
    clearcoat: 0.6,
    transmission: 0.2,
    iridescence: 0.9,
    normalScale: 0.8
  });
  
  const { camera, clock, scene } = useThree()
  const cameraAnimation = useRef({
    startPosition: null,
    targetPosition: null,
    initialDistance: null,
    active: false
  })
  const explosionStartTime = useRef(0) // Track when explosion starts for settling effects
  const fractureStartTime = useRef(0) // Track when fracture starts for effects
  
  // Variables to track glow transitions
  const lastGlowValue = useRef(0);
  
  // Add missing effect properties to crystalConfig if needed
  useEffect(() => {
    // Check for missing properties and add them with defaults if necessary
    if (config.effects.fracture && config.effects.fracture.secondaryGlow === undefined) {
      console.log("Adding missing secondaryGlow property to config");
      config.effects.fracture.secondaryGlow = 1.0; // Default value
    }
    
    if (config.effects.idle && config.effects.idle.glow && 
        config.effects.idle.glow.baseFrequency === undefined) {
      console.log("Adding missing baseFrequency property to config");
      config.effects.idle.glow.baseFrequency = 0.5; // Default value  
    }
    
    // Add timing fallbacks if needed
    if (config.timing.fracture.pulseDuration === undefined) {
      console.log("Adding missing pulseDuration property to config");
      config.timing.fracture.pulseDuration = 100; // Default value in ms
    }
    
    if (config.timing.fracture.glowFadeDuration === undefined) {
      console.log("Adding missing glowFadeDuration property to config");
      config.timing.fracture.glowFadeDuration = 200; // Default value in ms
    }
  }, [config]);

  // Update timing properties when config changes
  useEffect(() => {
    console.log("Timing config updated:", config.timing);
  }, [config.timing]);
  
  // Track effect changes
  useEffect(() => {
    console.log("Effects config updated:", config.effects);
  }, [config.effects]);
  
  // Create a shared material ref that will be used by CrystalMaterial
  const crystalMaterialRef = useRef();
  
  // Log material variant changes
  useEffect(() => {
    console.log("Material variant in CrystalScene:", materialVariant);
  }, [materialVariant]);
  
  // Update black opal config when needed
  useEffect(() => {
    if (materialVariant === 'blackOpal' && blackOpalConfig) {
      // Use external blackOpalConfig if provided
      setBlackOpalConfig(blackOpalConfig);
    } else if (materialVariant === 'blackOpal') {
      // Initialize with default values if external config not provided
      setBlackOpalConfig({
        emissiveIntensity: 0.5,
        roughness: 0.4,
        metalness: 0.1,
        clearcoat: 0.6,
        transmission: 0.2,
        iridescence: 0.9,
        normalScale: 0.8
      });
    }
  }, [materialVariant, blackOpalConfig]);
  
  // Load all the models
  const crystalWhole = useGLTF(config.assets.models.crystalWhole)
  const facetEmpathy = useGLTF(config.assets.models.facetEmpathy)
  const facetNarrative = useGLTF(config.assets.models.facetNarrative)
  const facetCraft = useGLTF(config.assets.models.facetCraft)
  const facetSystem = useGLTF(config.assets.models.facetSystem)
  const facetLeadership = useGLTF(config.assets.models.facetLeadership)
  const facetExploration = useGLTF(config.assets.models.facetExploration)
  
  // Apply shared material to all models
  useEffect(() => {
    if (!crystalMaterialRef.current) return;
    
    // Function to apply the shared material
    const applyMaterial = (modelScene) => {
      modelScene.traverse((child) => {
        if (child.isMesh) {
          child.material = crystalMaterialRef.current;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    };
    
    // Apply the material to all models
    applyMaterial(crystalWhole.scene);
    applyMaterial(facetEmpathy.scene);
    applyMaterial(facetNarrative.scene);
    applyMaterial(facetCraft.scene);
    applyMaterial(facetSystem.scene);
    applyMaterial(facetLeadership.scene);
    applyMaterial(facetExploration.scene);
    
  }, [crystalWhole, facetEmpathy, facetNarrative, facetCraft, facetSystem, facetLeadership, facetExploration, crystalMaterialRef.current]);
  
  // Setup camera animation that respects orbital position with improved easing
  useEffect(() => {
    // Target point is always the center of the scene (where the crystal is)
    const target = new THREE.Vector3(0, 0, 0);
    
    // Get direction from camera to target (this is the look direction)
    const direction = new THREE.Vector3();
    direction.subVectors(target, camera.position).normalize();
    
    // Store current camera position
    const currentPosition = camera.position.clone();
    
    // Calculate target position based on current position and direction
    const targetPosition = currentPosition.clone();
    
    if (isExploded) {
      // Move away from target (backward along direction)
      targetPosition.addScaledVector(direction, -config.camera.zoomAmount);
    } else {
      // Move toward target (forward along direction)
      targetPosition.addScaledVector(direction, config.camera.zoomAmount);
    }
    
    // Store animation parameters with longer durations
    cameraAnimation.current = {
      startPosition: currentPosition,
      targetPosition: targetPosition,
      active: true,
      startTime: clock.getElapsedTime(),
      duration: isExploded ? config.timing.camera.explodeDuration : config.timing.camera.reformDuration
    };
    
  }, [isExploded, camera, clock, config.camera.zoomAmount, config.timing.camera]);
  
  // Manage visibility transitions and explosion phases with updated timing
  useEffect(() => {
    if (isExploded) {
      // Record explosion start time for settling effect calculations
      explosionStartTime.current = clock.getElapsedTime();
      
      // Show facets first to ensure explosion is visible
      setShowFacets(true);
      
      // Hide crystal after a small delay to ensure overlap
      const crystalTimer = setTimeout(() => {
        setShowCrystal(false);
      }, config.timing.crystal.disappearDelay);
      
      // First set to fractured state immediately
      setExplosionPhase('fractured');
      fractureStartTime.current = clock.getElapsedTime();
      
      // Then transition to fully exploded after a longer delay
      const explodeTimer = setTimeout(() => {
        setExplosionPhase('exploded');
        console.log("Transitioning to exploded phase");
      }, config.timing.fracture.duration);
      
      // Show labels after explosion animation completes
      const labelTimer = setTimeout(() => {
        setShowLabels(true);
      }, config.timing.labels.appearDelay);
      
      return () => {
        clearTimeout(crystalTimer);
        clearTimeout(explodeTimer);
        clearTimeout(labelTimer);
      };
    } else {
      // Reset explosion phase
      setExplosionPhase('initial');
      setFractureGlowComplete(false);
      
      // Hide labels immediately when reforming starts
      setShowLabels(false);
      
      // Schedule showing the whole crystal near the end of animation
      const crystalTimer = setTimeout(() => {
        setShowCrystal(true);
      }, config.timing.reform.crystalAppearTime);
      
      // Hide facets after animation completes
      const facetsTimer = setTimeout(() => {
        setShowFacets(false);
      }, config.timing.reform.facetsDisappearTime);
      
      return () => {
        clearTimeout(crystalTimer);
        clearTimeout(facetsTimer);
      };
    }
  }, [isExploded, clock, config.timing]);

  // Animate camera in useFrame for smoother control with orbiting
  useFrame((state) => {
    // Handle camera animation if active
    if (cameraAnimation.current.active) {
      const elapsed = (state.clock.getElapsedTime() - cameraAnimation.current.startTime) * 1000; // convert to ms
      const duration = cameraAnimation.current.duration;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing based on animation direction
      const easedProgress = isExploded ? 
        config.easings.explosionEase(progress) : 
        config.easings.reformEase(progress);
      
      // Interpolate between start and target positions
      if (progress < 1) {
        camera.position.lerpVectors(
          cameraAnimation.current.startPosition, 
          cameraAnimation.current.targetPosition, 
          easedProgress
        );
      } else {
        // Animation complete
        camera.position.copy(cameraAnimation.current.targetPosition);
        cameraAnimation.current.active = false;
      }
    }
    
    // Add fracture effect - subtle scale pulse and glow when the crystal first breaks
    if (isExploded && explosionPhase === 'fractured') {
      const timeSinceFracture = state.clock.getElapsedTime() - fractureStartTime.current;
      const pulseDuration = (config.timing.fracture.pulseDuration || 100) / 1000;
      const glowFadeDuration = (config.timing.fracture.glowFadeDuration || 200) / 1000;
      
      // Only during the first pulse duration of fracture
      if (timeSinceFracture < pulseDuration) {
        setFractureGlowComplete(false);
        
        // Add subtle scale increase to each facet
        facetRefs.current.forEach((ref) => {
          if (ref) {
            // Scale up quickly then back down
            const scaleFactor = 1 + config.effects.fracture.maxScaleFactor * 
                               Math.sin(timeSinceFracture * Math.PI * 10);
            ref.scale.set(scaleFactor, scaleFactor, scaleFactor);
          }
        });
        
        // Update glow during fracture - reduced default values for more subtle effect
        if (crystalMaterialRef.current) {
          const initialGlow = config.effects.fracture.initialGlow || 0.8; // Reduced from 3.0
          
          if (materialVariant !== 'blackOpal' && materialVariant !== 'iceOpal') {
            crystalMaterialRef.current.emissiveIntensity = initialGlow;
            lastGlowValue.current = initialGlow; // Store for smooth transition
            crystalMaterialRef.current.needsUpdate = true;
          } else {
            // For BlackOpal material, update through config
            setBlackOpalConfig({
              ...blackOpalConfigState,
              emissiveIntensity: initialGlow
            });
            lastGlowValue.current = initialGlow; // Store for smooth transition
          }
        }
      } else if (timeSinceFracture < (pulseDuration + glowFadeDuration)) {
        // Reset scales after effect but keep fading glow 
        facetRefs.current.forEach((ref) => {
          if (ref) {
            ref.scale.set(1, 1, 1);
          }
        });
        
        // Gradually fade from initial glow to secondary glow level
        if (crystalMaterialRef.current) {
          const fadeProgress = (timeSinceFracture - pulseDuration) / glowFadeDuration;
          const initialGlow = config.effects.fracture.initialGlow || 0.8; // Reduced from 3.0
          const secondaryGlow = config.effects.fracture.secondaryGlow || 0.3; // Reduced from 1.0
          
          // Smoothly interpolate between the two values
          const currentGlow = initialGlow + (secondaryGlow - initialGlow) * fadeProgress;
          
          if (materialVariant !== 'blackOpal' && materialVariant !== 'iceOpal') {
            crystalMaterialRef.current.emissiveIntensity = currentGlow;
            lastGlowValue.current = currentGlow; // Store for smooth transition
            crystalMaterialRef.current.needsUpdate = true;
          } else {
            // For Opal materials, update through config
            setBlackOpalConfig({
              ...blackOpalConfigState,
              emissiveIntensity: currentGlow
            });
            lastGlowValue.current = currentGlow; // Store for smooth transition
          }
        }
      } else if (!fractureGlowComplete) {
        // Set final glow value before switching to idle phase
        if (crystalMaterialRef.current) {
          // Use the secondary glow value for the transition to idle phase
          const secondaryGlow = config.effects.fracture.secondaryGlow || 0.3; // Reduced from 1.0
          
          if (materialVariant !== 'blackOpal' && materialVariant !== 'iceOpal') {
            crystalMaterialRef.current.emissiveIntensity = secondaryGlow;
            lastGlowValue.current = secondaryGlow;
            crystalMaterialRef.current.needsUpdate = true;
          } else {
            // For Opal materials, update through config
            setBlackOpalConfig({
              ...blackOpalConfigState,
              emissiveIntensity: secondaryGlow
            });
            lastGlowValue.current = secondaryGlow;
          }
          
          setFractureGlowComplete(true);
        }
      }
    }
    
    // Handle floating animation and subtle pulsing glow in exploded phase
    if (isExploded && showFacets && facetRefs.current && explosionPhase === 'exploded') {
      const time = state.clock.getElapsedTime();
      const elapsedSinceExplosion = time - explosionStartTime.current;
      
      // Create a smoother transition between explosion and idle floating
      const transitionStart = config.timing.idle.transitionStartTime;
      const transitionEnd = config.timing.idle.transitionEndTime;
      let transitionProgress = 0;
      
      // Calculate transition progress (0 to 1)
      if (elapsedSinceExplosion < transitionStart) {
        transitionProgress = 0; // Still in main explosion
      } else if (elapsedSinceExplosion > transitionEnd) {
        transitionProgress = 1; // Fully in idle floating
      } else {
        // Smooth transition phase - use sine easing for super smooth handoff
        const normalizedProgress = (elapsedSinceExplosion - transitionStart) / 
                                 (transitionEnd - transitionStart);
        transitionProgress = Math.sin(normalizedProgress * Math.PI / 2);
      }
      
      // Calculate general settling factor (for amplitude)
      const settlingDuration = config.timing.idle.settlingDuration || 5.0; // Fallback value
      const settlingFactor = Math.min(1, elapsedSinceExplosion / settlingDuration);
      const dampingFactor = Math.pow(1 - settlingFactor, 2); // Quadratic falloff for smoother effect
      
      // Add subtle pulsing glow for exploded pieces
      if (crystalMaterialRef.current) {
        // Calculate smooth glow value
        const pulseBase = config.effects.idle.glow.pulseBase || 0.1; // Reduced from 0.2
        const pulseStrength = config.effects.idle.glow.pulseStrength || 0.1; // Reduced from 0.3
        const pulseFrequency = config.effects.idle.glow.baseFrequency || 0.5; // Default if missing
        
        let pulseValue;
        
        if (elapsedSinceExplosion < transitionStart) {
          // Keep the last fracture glow value during early phase
          pulseValue = lastGlowValue.current;
        } else if (elapsedSinceExplosion > transitionEnd) {
          // Full pulsing when in idle state
          pulseValue = pulseBase + pulseStrength * Math.sin(time * pulseFrequency);
        } else {
          // Blend between the fracture glow and the pulsing glow
          const blendFactor = (elapsedSinceExplosion - transitionStart) / (transitionEnd - transitionStart);
          
          // Calculate the current pulse value
          const currentPulse = pulseBase + pulseStrength * Math.sin(time * pulseFrequency);
          
          // Blend between last fracture glow and current pulse
          pulseValue = lastGlowValue.current * (1 - blendFactor) + currentPulse * blendFactor;
        }
        
        // Update material glow
        if (materialVariant !== 'blackOpal' && materialVariant !== 'iceOpal') {
          crystalMaterialRef.current.emissiveIntensity = pulseValue;
          crystalMaterialRef.current.needsUpdate = true;
        } else {
          // For Opal materials, update through config
          setBlackOpalConfig({
            ...blackOpalConfigState,
            emissiveIntensity: pulseValue
          });
        }
      }
      
      const newPositions = [];
      facetRefs.current.forEach((ref, index) => {
        if (ref) {
          // Get base positions from spring (for explosion phase)
          // and from explodedPositions (for idle phase)
          const springPos = [
            springs[index].position.get()[0],
            springs[index].position.get()[1],
            springs[index].position.get()[2]
          ];
          
          const targetPos = config.explodedPositions[Object.keys(config.explodedPositions)[index]];
          
          // Calculate floating offsets (for idle phase)
          const floatPhase = index * 0.5; // Different starting phase per facet
          const floatAmplitude = config.effects.idle.float.baseAmplitude * (1 + dampingFactor);
          
          const floatOffsetY = Math.sin(time * config.effects.idle.float.yFrequency + floatPhase) * floatAmplitude;
          const floatOffsetX = Math.sin(time * config.effects.idle.float.xFrequency + floatPhase * 1.7) * 
                             floatAmplitude * config.effects.idle.float.xMultiplier;
          const floatOffsetZ = Math.sin(time * config.effects.idle.float.zFrequency + floatPhase * 0.3) * 
                             floatAmplitude * config.effects.idle.float.zMultiplier;
          
          // Apply floating offsets to target position
          const floatingPos = [
            targetPos[0] + floatOffsetX,
            targetPos[1] + floatOffsetY,
            targetPos[2] + floatOffsetZ
          ];
          
          // Blend between spring position and floating position based on transition progress
          ref.position.x = springPos[0] * (1 - transitionProgress) + 
                           floatingPos[0] * transitionProgress;
          ref.position.y = springPos[1] * (1 - transitionProgress) + 
                           floatingPos[1] * transitionProgress;
          ref.position.z = springPos[2] * (1 - transitionProgress) + 
                           floatingPos[2] * transitionProgress;
          
          // Update label position
          newPositions[index] = [ref.position.x, ref.position.y, ref.position.z];
        }
      });
      
      setLabelPositions(newPositions);
    }
    
    // Reset material glow when reforming
    if (!isExploded && crystalMaterialRef.current) {
      if (materialVariant !== 'blackOpal' && materialVariant !== 'iceOpal') {
        crystalMaterialRef.current.emissiveIntensity = 0;
        crystalMaterialRef.current.needsUpdate = true;
      } else {
        // For Opal materials, update through config
        setBlackOpalConfig({
          ...blackOpalConfigState,
          emissiveIntensity: 0
        });
      }
    }
  });

  // Create a spring config based on phase and animation direction
  const createSpringConfig = (phase, isExploded) => {
    if (isExploded) {
      if (phase === 'fractured') {
        return config.springConfigs.fracture;
      } else {
        return config.springConfigs.explode;
      }
    } else {
      return {
        ...config.springConfigs.reform,
        easing: config.easings.reformEase
      };
    }
  };

  // Physics-based spring animation configurations with multi-stage animation
  const empathySpring = useSpring({
    from: { position: config.startingPositions.empathy },
    to: { 
      position: 
        explosionPhase === 'initial' ? config.startingPositions.empathy : 
        explosionPhase === 'fractured' ? config.fracturePositions.empathy : 
        config.explodedPositions.empathy 
    },
    config: createSpringConfig(explosionPhase, isExploded)
  });
  
  const narrativeSpring = useSpring({
    from: { position: config.startingPositions.narrative },
    to: { 
      position: 
        explosionPhase === 'initial' ? config.startingPositions.narrative : 
        explosionPhase === 'fractured' ? config.fracturePositions.narrative : 
        config.explodedPositions.narrative 
    },
    config: createSpringConfig(explosionPhase, isExploded)
  });
  
  const craftSpring = useSpring({
    from: { position: config.startingPositions.craft },
    to: { 
      position: 
        explosionPhase === 'initial' ? config.startingPositions.craft : 
        explosionPhase === 'fractured' ? config.fracturePositions.craft : 
        config.explodedPositions.craft 
    },
    config: createSpringConfig(explosionPhase, isExploded)
  });
  
  const systemSpring = useSpring({
    from: { position: config.startingPositions.system },
    to: { 
      position: 
        explosionPhase === 'initial' ? config.startingPositions.system : 
        explosionPhase === 'fractured' ? config.fracturePositions.system : 
        config.explodedPositions.system 
    },
    config: createSpringConfig(explosionPhase, isExploded)
  });
  
  const leadershipSpring = useSpring({
    from: { position: config.startingPositions.leadership },
    to: { 
      position: 
        explosionPhase === 'initial' ? config.startingPositions.leadership : 
        explosionPhase === 'fractured' ? config.fracturePositions.leadership : 
        config.explodedPositions.leadership 
    },
    config: createSpringConfig(explosionPhase, isExploded)
  });
  
  const explorationSpring = useSpring({
    from: { position: config.startingPositions.exploration },
    to: { 
      position: 
        explosionPhase === 'initial' ? config.startingPositions.exploration : 
        explosionPhase === 'fractured' ? config.fracturePositions.exploration : 
        config.explodedPositions.exploration 
    },
    config: createSpringConfig(explosionPhase, isExploded)
  });
  
  // Springs array for easier access
  const springs = [empathySpring, narrativeSpring, craftSpring, systemSpring, leadershipSpring, explorationSpring]
  const models = [facetEmpathy, facetNarrative, facetCraft, facetSystem, facetLeadership, facetExploration]

  return (
    <group>
      {/* Material Components - Only show the appropriate one */}
      {materialVariant === 'blackOpal' ? (
        <BlackOpalMaterial 
          config={blackOpalConfigState} 
          materialRef={crystalMaterialRef} 
        />
      ) : materialVariant === 'blackOpalSolidBase' ? (
        <BlackOpalSolidBase
          config={blackOpalConfigState}
          materialRef={crystalMaterialRef}
        />
      ) : materialVariant === 'blackOpalSolidEmissive' ? (
        <BlackOpalSolidEmissive
          config={blackOpalConfigState}
          materialRef={crystalMaterialRef}
        />
      ) : materialVariant === 'iceOpal' ? (
        <IceOpalMaterial
          config={iceOpalConfig}  // Use the dedicated Ice Opal config
          materialRef={crystalMaterialRef}
        />
      ) : (
        <CrystalMaterial 
          config={config} 
          materialRef={crystalMaterialRef} 
          variant={materialVariant} 
        />
      )}
      
      {/* Show the whole crystal */}
      {showCrystal && (
        <primitive object={crystalWhole.scene} />
      )}
      
      {/* Show the facets during explosion/collapse */}
      {showFacets && (
        <group>
          {models.map((model, index) => (
            <a.group 
              key={index}
              ref={(el) => facetRefs.current[index] = el}
              position={springs[index].position}
            >
              <primitive object={model.scene} />
            </a.group>
          ))}
          </group>
      )}
      
      {/* Premium labels with spring animations */}
      {config.facetLabels.map((label, index) => (
        <PremiumLabel
          key={label.key}
          label={label}
          index={index}
          position={labelPositions[index]}
          visible={showFacets && showLabels}
          config={config}
        />
      ))}
    </group>
  );
};

export default CrystalScene;