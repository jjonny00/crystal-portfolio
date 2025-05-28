// src/config/cameraStates.js
// Comprehensive camera configuration system for all application states

/**
 * Camera state definitions
 * Each state defines position, target, and rotation for the camera
 */
export const CAMERA_STATES = {
  // Landing/intro state - wide establishing shot
  INTRO: {
    position: [0, 0, 4.5],
    target: [0, 0, 0],
    rotation: [0, 0, 0],
    fov: 45,
    description: 'Initial landing view of the whole crystal'
  },

  // Project exploration state - pulled back to see all facets
  EXPLOSION: {
    position: [0, 0, 8],
    target: [0, 0, 0],
    rotation: [0, 0, 0],
    fov: 45,
    description: 'Wide view to see all exploded facets'
  },

  // Individual project views - close-ups of each facet
  PROJECT_EMPATHY: {
    position: [2.5, -2.0, 3.5],
    target: [0.3, -0.7, -0.2], // Position of empathy facet
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Close-up view of empathy facet'
  },

  PROJECT_NARRATIVE: {
    position: [2.8, 0.5, 3.2],
    target: [0.3, -0.1, -0.7], // Position of narrative facet
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Close-up view of narrative facet'
  },

  PROJECT_CRAFT: {
    position: [3.8, 2.3, 2.0],
    target: [1.3, 0.8, 0.5], // Position of craft facet
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Close-up view of craft facet'
  },

  PROJECT_SYSTEM: {
    position: [-2.0, 1.2, 1.5],
    target: [-0.5, 0.2, -1.8], // Position of system facet
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Close-up view of system facet'
  },

  PROJECT_LEADERSHIP: {
    position: [2.9, 3.7, 2.4],
    target: [0.4, 1.2, 0.9], // Position of leadership facet
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Close-up view of leadership facet'
  },

  PROJECT_EXPLORATION: {
    position: [-2.1, 2.2, 2.5],
    target: [-0.6, 0.7, 0.0], // Position of exploration facet
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Close-up view of exploration facet'
  },

  // About section - reformed crystal, closer and more intimate
  ABOUT: {
    position: [0, 0.5, 2.8],
    target: [0, 0, 0],
    rotation: [0, 0, 0],
    fov: 40,
    description: 'Intimate view of reformed crystal for about section'
  },

  // Footer section - pulled back slightly, elegant final view
  FOOTER: {
    position: [0, -0.3, 3.5],
    target: [0, 0, 0],
    rotation: [0, 0, 0],
    fov: 42,
    description: 'Elegant final view for footer section'
  }
};

/**
 * Animation timing configuration for camera transitions
 */
export const CAMERA_TIMING = {
  // Default timing for different types of transitions
  DEFAULT: 1200,
  QUICK: 800,
  SLOW: 1800,
  
  // Specific timings for state transitions
  INTRO_TO_EXPLOSION: 1600,
  EXPLOSION_TO_PROJECT: 1000,
  PROJECT_TO_PROJECT: 1200,
  PROJECT_TO_ABOUT: 1400,
  ABOUT_TO_FOOTER: 1000,
  FOOTER_TO_INTRO: 2000, // Longer for loop back
  
  // Easing configuration
  EASING: {
    // Smooth start and end
    DEFAULT: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    
    // Ease out for arrivals
    EASE_OUT: (t) => 1 - Math.pow(1 - t, 3),
    
    // Ease in for departures
    EASE_IN: (t) => t * t * t,
    
    // Bounce for special transitions
    BOUNCE: (t) => {
      const n1 = 7.5625;
      const d1 = 2.75;
      
      if (t < 1 / d1) {
        return n1 * t * t;
      } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
      } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
      } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
      }
    }
  }
};

/**
 * Get camera state by name
 * @param {string} stateName - Name of the camera state
 * @returns {Object|null} Camera state object or null if not found
 */
export const getCameraState = (stateName) => {
  return CAMERA_STATES[stateName] || null;
};

/**
 * Get all project camera states
 * @returns {Object} Object containing all project camera states
 */
export const getProjectCameraStates = () => {
  return Object.keys(CAMERA_STATES)
    .filter(key => key.startsWith('PROJECT_'))
    .reduce((acc, key) => {
      acc[key] = CAMERA_STATES[key];
      return acc;
    }, {});
};

/**
 * Get camera state for a specific project by facet key
 * @param {string} facetKey - The facet key (e.g., 'empathy', 'narrative')
 * @returns {Object|null} Camera state for the project or null if not found
 */
export const getProjectCameraState = (facetKey) => {
  const stateKey = `PROJECT_${facetKey.toUpperCase()}`;
  return CAMERA_STATES[stateKey] || null;
};

/**
 * Get timing for a specific transition
 * @param {string} fromState - Starting state
 * @param {string} toState - Ending state
 * @returns {number} Transition duration in milliseconds
 */
export const getTransitionTiming = (fromState, toState) => {
  // Check for specific timing configurations
  const transitionKey = `${fromState}_TO_${toState}`;
  if (CAMERA_TIMING[transitionKey]) {
    return CAMERA_TIMING[transitionKey];
  }
  
  // Default timing based on state types
  if (fromState === 'INTRO' && toState === 'EXPLOSION') {
    return CAMERA_TIMING.INTRO_TO_EXPLOSION;
  }
  
  if (fromState === 'EXPLOSION' && toState.startsWith('PROJECT_')) {
    return CAMERA_TIMING.EXPLOSION_TO_PROJECT;
  }
  
  if (fromState.startsWith('PROJECT_') && toState.startsWith('PROJECT_')) {
    return CAMERA_TIMING.PROJECT_TO_PROJECT;
  }
  
  if (fromState.startsWith('PROJECT_') && toState === 'ABOUT') {
    return CAMERA_TIMING.PROJECT_TO_ABOUT;
  }
  
  if (fromState === 'ABOUT' && toState === 'FOOTER') {
    return CAMERA_TIMING.ABOUT_TO_FOOTER;
  }
  
  if (fromState === 'FOOTER' && toState === 'INTRO') {
    return CAMERA_TIMING.FOOTER_TO_INTRO;
  }
  
  // Default fallback
  return CAMERA_TIMING.DEFAULT;
};

/**
 * Get appropriate easing function for transition
 * @param {string} fromState - Starting state
 * @param {string} toState - Ending state
 * @returns {Function} Easing function
 */
export const getTransitionEasing = (fromState, toState) => {
  // Special cases for specific transitions
  if (fromState === 'FOOTER' && toState === 'INTRO') {
    return CAMERA_TIMING.EASING.BOUNCE; // Fun bounce for loop back
  }
  
  if (toState.startsWith('PROJECT_')) {
    return CAMERA_TIMING.EASING.EASE_OUT; // Smooth arrival at projects
  }
  
  if (fromState.startsWith('PROJECT_')) {
    return CAMERA_TIMING.EASING.EASE_IN; // Smooth departure from projects
  }
  
  // Default smooth easing
  return CAMERA_TIMING.EASING.DEFAULT;
};

/**
 * Development helper: Log all camera states
 */
export const logCameraStates = () => {
  console.group('📹 Camera States Configuration');
  Object.entries(CAMERA_STATES).forEach(([key, state]) => {
    console.log(`${key}:`, {
      position: state.position,
      target: state.target,
      fov: state.fov,
      description: state.description
    });
  });
  console.groupEnd();
};

/**
 * Development helper: Validate camera state
 * @param {string} stateName - Name of the state to validate
 * @returns {boolean} True if state is valid
 */
export const validateCameraState = (stateName) => {
  const state = CAMERA_STATES[stateName];
  
  if (!state) {
    console.warn(`❌ Camera state '${stateName}' not found`);
    return false;
  }
  
  const required = ['position', 'target', 'fov'];
  const missing = required.filter(prop => !state[prop]);
  
  if (missing.length > 0) {
    console.warn(`❌ Camera state '${stateName}' missing properties:`, missing);
    return false;
  }
  
  console.log(`✅ Camera state '${stateName}' is valid`);
  return true;
};

/**
 * Development helper: Export current camera position for config
 * Use this in development to capture camera positions
 * @param {Object} camera - Three.js camera object
 * @param {string} stateName - Name for this state
 */
export const exportCameraPosition = (camera, stateName) => {
  const position = [
    Math.round(camera.position.x * 100) / 100,
    Math.round(camera.position.y * 100) / 100,
    Math.round(camera.position.z * 100) / 100
  ];
  
  // If camera has a target (from controls), use that, otherwise use default
  const target = camera.target ? [
    Math.round(camera.target.x * 100) / 100,
    Math.round(camera.target.y * 100) / 100,
    Math.round(camera.target.z * 100) / 100
  ] : [0, 0, 0];
  
  const config = {
    position,
    target,
    rotation: [0, 0, 0],
    fov: camera.fov || 45,
    description: `Camera state for ${stateName}`
  };
  
  console.log(`📹 Camera position for ${stateName}:`);
  console.log(JSON.stringify(config, null, 2));
  
  return config;
};