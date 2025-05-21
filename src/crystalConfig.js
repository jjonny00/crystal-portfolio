// crystalConfig.js - Crystal Animation & Visual Control Center
// This file serves as the "cockpit" for controlling all aspects of the crystal experience

import * as THREE from 'three'

// === POSITIONS ===
// Define the starting positions (where they make the whole crystal)
export const startingPositions = {
  empathy: [0, 0, 0],
  narrative: [0, 0, 0],
  craft: [0, 0, 0],
  system: [0, 0, 0],
  leadership: [0, 0, 0],
  exploration: [0, 0, 0]
}

// Define the exploded positions with organic variation
export const explodedPositions = {
  empathy: [0.3, -0.7, -0.2],      // Slightly off-center
  narrative: [0.3, -0.1, -0.7],     // Adds some depth variation
  craft: [1.3, 0.8, 0.5],        // Not perfectly on axis
  system: [-0.5, 0.2, -1.8],        // Slight angle
  leadership: [0.4, 1.2, 0.9],    // Mixed axis movement
  exploration: [-0.6, 0.7, 0.0]   // More dynamic position
}

// Define the fracture positions (5% of the way to final positions)
export const fracturePositions = {
  empathy: [0.015, -0.035, -0.010],
  narrative: [0.015, -0.005, -0.035],
  craft: [0.065, 0.040, 0.025],
  system: [-0.025, 0.010, -0.090],
  leadership: [0.020, 0.060, 0.045],
  exploration: [-0.030, 0.035, 0.000],
}

// === FACET LABELS ===
// Premium label system with descriptions
export const facetLabels = [
  { 
    key: 'empathy', 
    text: 'EMPATHY', 
    description: 'Understanding user needs and pain points',
    color: '#64ffda' 
  },
  { 
    key: 'narrative', 
    text: 'NARRATIVE', 
    description: 'Guiding teams through compelling stories',
    color: '#bb86fc' 
  },
  { 
    key: 'craft', 
    text: 'CRAFT', 
    description: 'Precision in every design detail',
    color: '#03dac6' 
  },
  { 
    key: 'system', 
    text: 'SYSTEM', 
    description: 'Building scalable design systems',
    color: '#cf6679' 
  },
  { 
    key: 'leadership', 
    text: 'LEADERSHIP', 
    description: 'Empowering teams to do their best work',
    color: '#ffd600' 
  },
  { 
    key: 'exploration', 
    text: 'EXPLORATION', 
    description: 'Finding opportunities in ambiguity',
    color: '#ff7043' 
  }
]

// === ANIMATION TIMING ===
export const timing = {
  // Camera animations
  camera: {
    explodeDuration: 1600, // ms
    reformDuration: 900,   // ms
  },
  
  // Crystal animation phases
  crystal: {
    disappearDelay: 50,    // ms - delay before whole crystal disappears
  },
  
  // Fracture phase
  fracture: {
    duration: 350,         // ms - how long the fracture phase lasts
    pulseDuration: 100,    // ms - initial pulse animation
    glowFadeDuration: 200, // ms - how long the glow fades after pulse
  },
  
  // Labels
  labels: {
    appearDelay: 1600,     // ms - when labels appear after explosion starts
    staggerDelay: 100,     // ms - delay between each label appearing
  },
  
  // Reform animation
  reform: {
    crystalAppearTime: 700,  // ms - when whole crystal reappears
    facetsDisappearTime: 800, // ms - when individual facets disappear
  },
  
  // Idle animation
  idle: {
    transitionStartTime: 0.8, // seconds - when idle animation blend starts
    transitionEndTime: 1.5,   // seconds - when idle animation blend completes
    settlingDuration: 5,      // seconds - how long the settling effect lasts
  }
}

// === SPRING PHYSICS CONFIGURATIONS ===
export const springConfigs = {
  // Quick snap to fractured position
  fracture: { 
    tension: 500,
    friction: 20,
    velocity: 10,
    duration: 100
  },
  
  // Slower movement to final exploded position
  explode: { 
    mass: 1.5,
    tension: 120,
    friction: 14,
    clamp: false,
    velocity: 0,
    duration: 1200
  },
  
  // Reform animation
  reform: { 
    duration: 800,
    // Reformed using the custom easing function
  },
  
  // Label animations
  label: {
    appear: { 
      tension: 280, 
      friction: 12 
    },
    hover: { 
      tension: 300, 
      friction: 20 
    },
    description: { 
      tension: 280, 
      friction: 20 
    }
  }
}

// === EASING FUNCTIONS ===
export const easings = {
  // Explosion easing - smoother stop
  explosionEase: (t) => {
    // Smoother end with cubic bezier-like curve
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  },
  
  // Reform easing - smoother start
  reformEase: (t) => {
    // Smooth start and end for reform
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
}

// === VISUAL EFFECTS ===
export const effects = {
  // Idle animation
  idle: {
    float: {
      baseAmplitude: 0.007,  // Base floating movement amount
      xMultiplier: 0.6,      // X-axis movement multiplier  
      zMultiplier: 0.5,      // Z-axis movement multiplier
      yFrequency: 1.2,       // Y-axis wave frequency
      xFrequency: 0.9,       // X-axis wave frequency
      zFrequency: 0.7,       // Z-axis wave frequency
    },
    glow: {
      pulseBase: 0.2,        // Base glow intensity
      pulseStrength: 0.3,    // Amount of pulse variation
      frequencyMultiplier: 0.1, // How much frequency varies per facet
      baseFrequency: 0.5,    // Base pulse frequency
      phaseOffset: 0.5       // Phase difference between facets
    }
  },
  
  // Fracture effect
  fracture: {
    maxScaleFactor: 0.1,     // Maximum scale increase during fracture (10%)
    initialGlow: 3.0,        // Initial bright glow
    secondaryGlow: 1.0       // Secondary glow after initial pulse
  }
}

// === MATERIALS ===
export const materials = {
  // Base crystal material configuration
  crystal: {
    color: new THREE.Color('#0d00bb'),
    transparent: true,
    transmission: 0.9,
    ior: 2.3,
    thickness: 0.1,
    iridescence: 1,
    iridescenceIOR: 1.0,
    metalness: 0.0,
    roughness: 0.1,
    attenuationColor: new THREE.Color('#6bfcff'),
    attenuationDistance: 0.1,
    clearcoat: 0.5,
    clearcoatRoughness: 0.01,
    envMapIntensity: 10.0,
    reflectivity: 0.7,
    specularIntensity: 1.0,
    specularColor: new THREE.Color('#ffffff'),
    emissive: new THREE.Color('#0c00ff'),
    emissiveIntensity: 0 // Default, will be changed dynamically
  },
  
  // Texture settings
  textures: {
    normalMap: {
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      repeat: [5, 5] // Tiling to make scratches smaller
    }
  }
}

// === CAMERA SETTINGS ===
export const camera = {
  zoomAmount: 4,     // How far camera moves during transitions
  startingPosition: [0, 0, 9],
  fov: 45,
  orbitControls: {
    rotateSpeed: 0.5,
    minPolarAngle: Math.PI / 3,
    maxPolarAngle: Math.PI / 1.5,
    enableZoom: false,
    enablePan: false
  }
}

// === POST PROCESSING ===
export const postProcessing = {
  bloom: {
    luminanceThreshold: 0.05,
    luminanceSmoothing: 0.9,
    intensity: 1.0,
    radius: 1.9
  },
  chromaticAberration: {
    offset: [0.003, 0.003],
    radialModulation: true,
    modulationOffset: 0.5
  },
  noise: {
    opacity: 0.1
  },
  vignette: {
    eskil: false,
    offset: 0.1,
    darkness: 1.1
  }
}

// === LIGHTING ===
export const lighting = {
  ambient: {
    intensity: 0.2
  },
  directional: {
    position: [10, 8, 5],
    intensity: 1.8,
    color: "#FFFFFF",
    castShadow: true
  },
  pointLights: [
    {
      position: [-5, 3, -5],
      intensity: 0.8,
      color: "#CCE8FF"
    },
    {
      position: [0, -8, -10],
      intensity: 0.6,
      color: "#FFFFFF"
    }
  ],
  spotLight: {
    position: [0, 0, 10],
    intensity: 1.0,
    angle: Math.PI / 4,
    penumbra: 0.2,
    color: "#FFFFFF"
  }
}

// === ENVIRONMENT ===
export const environment = {
  hdri: "/assets/environment/prismatic09-low.hdr",
  showBackground: true,
  rotation: [0, Math.PI * 0.5, 0]
}

// === ASSET PATHS ===
export const assets = {
  models: {
    crystalWhole: '/assets/models/CrystalWhole.glb',
    facetEmpathy: '/assets/models/FacetEmpathy.glb',
    facetNarrative: '/assets/models/FacetNarrative.glb',
    facetCraft: '/assets/models/FacetCraft.glb',
    facetSystem: '/assets/models/FacetSystem.glb',
    facetLeadership: '/assets/models/FacetLeadership.glb',
    facetExploration: '/assets/models/FacetExploration.glb'
  },
  textures: {
    // normalMap: '/assets/textures/quartz-normal07.png'
  }
}

// === UI ELEMENTS ===
export const ui = {
  button: {
    styles: {
      padding: '10px 20px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      color: 'white',
      background: 'rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '8px',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      pointerEvents: 'auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      transition: 'all 0.3s ease'
    },
    hoverStyles: {
      background: 'rgba(40, 40, 40, 0.7)',
      transform: 'translateY(-2px)'
    },
    defaultStyles: {
      background: 'rgba(0, 0, 0, 0.5)',
      transform: 'translateY(0)'
    }
  },
  labels: {
    styles: {
      main: {
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        fontSize: '16px',
        fontWeight: '600',
        letterSpacing: '1px',
        textAlign: 'center',
        textShadow: '0 0 8px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5)',
        textTransform: 'uppercase',
        marginBottom: '8px',
        lineHeight: '1',
      },
      accent: {
        width: '60px',
        height: '1px',
        margin: '0 auto 12px',
      },
      description: {
        color: 'rgba(255,255,255,0.9)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        fontSize: '12px',
        fontWeight: '400',
        textAlign: 'center',
        maxWidth: '200px',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        lineHeight: '1.4',
        whiteSpace: 'nowrap',
      }
    }
  }
}

// Export a function to create a full set of spring configurations
export const createSpringConfig = (phase, isExploded) => {
  if (isExploded) {
    if (phase === 'fractured') {
      return springConfigs.fracture;
    } else {
      return springConfigs.explode;
    }
  } else {
    return springConfigs.reform;
  }
}

// Create a photorealistic crystal material with controllable emissive intensity
export const createCrystalMaterial = (emissiveIntensity = 0) => {
  const material = new THREE.MeshPhysicalMaterial({
    ...materials.crystal,
    emissiveIntensity
  });
  
  return material;
}