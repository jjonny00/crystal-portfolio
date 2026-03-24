// crystalConfig.js - Crystal Animation & Visual Control Center
// UPDATED: Lighting adjustments to compensate for disabled crystal shadows

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

// === FRACTURE SETTINGS ===
// Centralized controls for fracture/explosion effects
export const fracture = {
  duration: 0.5,          // Seconds facets remain in fractured state
  distance: 0.03,          // Percentage of explode distance applied during fracture
  particles: {
    delay: 0.6,          // Delay before particle burst (seconds)
    count: 200,           // Number of burst particles
    color: '#66ffcc',     // Particle color
    duration: 0.8,        // Particle fade duration (seconds)
    spread: 0.02           // How far particles initially spread from origin
  },
  image: {
    imagePath: '/assets/textures/fractureRing03.jpg',
    baseSize: 0.1,
    maxScale: 16,
    opacity: 1.25,
    duration: 0.4,
    triggerDelay: 0.45,
    fadeInDuration: 0.1,
    fadeOutDuration: 0.4,
    scaleEasing: 'linear'
  },
  emissive: {
    intensity: 3.0,       // Bright glow intensity at fracture
    delay: 0              // Delay before emissive glow starts (seconds)
  }
};

// Define the fracture positions based on distance percentage
export const fracturePositions = Object.fromEntries(
  Object.entries(explodedPositions).map(([key, coords]) => [
    key,
    coords.map(c => c * fracture.distance)
  ])
);

// Optional final rotations for exploded facets (quaternions)
export const explodedRotations = {
  empathy: [0, 0, 0, 1],
  narrative: [0, 0, 0, 1],
  craft: [0, 0, 0, 1],
  system: [0, 0, 0, 1],
  leadership: [0, 0, 0, 1],
  exploration: [0, 0, 0, 1]
}

// === CAMERA POSITIONS ===
export const cameraPositions = {
  intro: [0.16359952088021784, -2.0376618037026195, 1.1719674768510127],
  hero: [0.55, 0.92, 3.94],
  overview: [0.23, 0.53, 6.57],
  about: [1.74, 1.34, 1.87],
  projects: {
    empathy: [0.16, -1.85, 1.79],
    narrative: [-0.66, -1.37, 1.1],
    craft: [-0.88, -0.85, 2.53],
    system: [-1.28, -0.23, 1.58],
    leadership: [-0.09, 0.38, 2.87],
    exploration: [-0.05, 0.28, 3.94]
  }
}

export const cameraTargets = {
  intro: [0.6, -2.9, 0],
  hero: [0, 0.5, 0],
  overview: [0, 0.3, 0],
  about: [0, 0.2, 0],
  projects: {
    empathy: [0.3, -0.7, -0.2],
    narrative: [0.3, -0.1, -0.7],
    craft: [1.3, 0.8, 0.5],
    system: [-0.5, 0.2, -1.8],
    leadership: [0.4, 1.2, 0.9],
    exploration: [-0.6, 0.7, 0.0]
  }
}

export const cameraOffsets = {
  global: {
    position: [0, 0, 0],
    target: [0, 0, 0]
  },
  zones: {
    intro: {
      position: [0, 0, 0],
      target: [0, 0, 0]
    },
    hero: {
      position: [0, 0, 0],
      target: [0, 0, 0]
    },
    overview: {
      position: [0, 0, 0],
      target: [0, 0, 0]
    },
    about: {
      position: [0, 0, 0],
      target: [0, 0, 0]
    }
  },
  projects: {
    empathy: {
      position: [0, 0, 0],
      target: [0, 0, 0]
    },
    narrative: {
      position: [0, 0, 0],
      target: [0, 0, 0]
    },
    craft: {
      position: [0, 0, 0],
      target: [0, 0, 0]
    },
    system: {
      position: [0, 0, 0],
      target: [0, 0, 0]
    },
    leadership: {
      position: [0, 0, 0],
      target: [0, 0, 0]
    },
    exploration: {
      position: [0, 0, 0],
      target: [0, 0, 0]
    }
  }
}

export const facetRotationsEulerDeg = {
  empathy: [0, 0, 0],
  narrative: [0, 0, 0],
  craft: [0, 0, 0],
  system: [0, 0, 0],
  leadership: [0, 0, 0],
  exploration: [0, 0, 0]
}

// Per-project focused rotations (Euler degrees) used while a facet is selected.
export const selectedFacetRotationsEulerDeg = {
  empathy: [25, 121, 13],
  narrative: [10, -16, 0],
  craft: [-2, 65, 45],
  system: [-25, -19, 1],
  leadership: [18, 112, 4],
  exploration: [-15, -13, -17]
}


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
    duration: fracture.duration * 1000, // ms - how long the fracture phase lasts
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
    // Starts extremely fast and glides to a stop smoothly
    return 1 - Math.pow(1 - t, 3);
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
      overviewMultiplier: 3, // Additional movement when all facets float
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
    initialGlow: fracture.emissive.intensity, // Initial bright glow
    secondaryGlow: 1.0       // Secondary glow after initial pulse
  }
}

// === MATERIALS ===
export const materials = {
  // Base crystal material configuration
  crystal: {
    color: new THREE.Color('#0d042b'),
    transparent: true,
    transmission: 0.85,
    ior: 2.3,
    thickness: 0.01,
    iridescence: 0.3,
    iridescenceIOR: 1.3,
    metalness: 0.0,
    roughness: 0.11,
    attenuationColor: new THREE.Color('#00fff2'),
    attenuationDistance: 0.5,
    clearcoat: 0.8,
    clearcoatRoughness: 0.05,
    envMapIntensity: 15.0,
    reflectivity: 0.7,
    specularIntensity: 1.0,
    specularColor: new THREE.Color('#ffffff'),
    emissive: new THREE.Color('#050c4e'),
    emissiveIntensity: 0, // Default, will be changed dynamically
    opacity: 0.98
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
  startingPosition: [0, 0, 4.5],
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
    opacity: 1.5  // UNIFIED: Set to 1.5 for all levels
  },
  vignette: {
    eskil: false,
    offset: 0.1,
    darkness: 0.7  // UNIFIED: Set to 0.7 for all levels
  }
}

// === LIGHTING ===
// UPDATED: Enhanced lighting to compensate for disabled crystal shadows
export const lighting = {
  ambient: {
    intensity: 0.4  // INCREASED: Boost ambient light to compensate for disabled shadows
  },
  directional: {
    position: [2, 8, 5],
    intensity: 10.8,
    color: "#ffdcc1",
    castShadow: false  // CHANGED: Disable shadow casting to improve transparent lighting
  },
  // ADDED: Upward directional light from below the crystal
  directionalBottom: {
    position: [0, -5, 0],    // Position below the crystal
    target: [0, 0, 0],       // Point straight up toward crystal center
    intensity: 10.2,          // Strong enough to illuminate undersides
    color: "#f2feff",        // Slightly cool blue-white
    castShadow: false        // No shadows for better transparency
  },
  pointLights: [
    {
      position: [-5, 3, -5],
      intensity: 10.0,    // INCREASED: Boost intensity
      color: "#00ad1d"
    },
    {
      position: [0, -8, -10],
      intensity: 1.8,    // INCREASED: Boost intensity
      color: "#00e380"
    },
    // ADDED: Additional fill light to brighten dark areas
    {
      position: [5, -3, 5],
      intensity: 5.6,
      color: "#FFE8CC"
    }
  ],
  spotLight: {
    position: [0, 0, 10],
    intensity: 10.2,    // INCREASED: Boost intensity
    angle: Math.PI / 4,
    penumbra: 10.2,
    color: "#ff0051"
  }
}

// === ENVIRONMENT ===
export const environment = {
  hdri: "/assets/environment/prismatic10-low.hdr",
  showBackground: true,
  rotation: [0, Math.PI * 0.5, 0]
}

// === ASSET PATHS ===
export const assets = {
  models: {
    crystalWhole: '/assets/models/CrystalWhole.glb',
    project01: '/assets/models/Project01.glb',
    project02: '/assets/models/Project02.glb',
    project03: '/assets/models/Project03.glb',
    project04: '/assets/models/Project04.glb',
    project05: '/assets/models/Project05.glb',
    project06: '/assets/models/Project06.glb'
  },
  textures: {
    normalMap: '/assets/textures/quartz-normal07_subtle.png'
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
      fontFamily: '"acumin-variable", sans-serif',
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
        fontFamily: '"acumin-variable", sans-serif',
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
        fontFamily: '"acumin-variable", sans-serif',
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
