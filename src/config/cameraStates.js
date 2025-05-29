// src/config/cameraStates.js - Updated camera positions
// Enhanced camera configuration for smooth intro scroll experience

export const CAMERA_STATES = {
  // NEW: Close-up intro state - zoomed in and raised vertically
  INTRO_CLOSE: {
    position: [0, 1.2, 2.8],     // Closer and raised up
    target: [0, 0.3, 0],         // Look slightly down at crystal center
    rotation: [0, 0, 0],
    fov: 35,                     // Tighter field of view for intimacy
    description: 'Close intimate view of crystal with bottom out of frame'
  },

  // UPDATED: Standard intro state - this becomes the "pulled back" position
  INTRO: {
    position: [0, 0, 4.5],       // Your original intro position
    target: [0, 0, 0],
    rotation: [0, 0, 0],
    fov: 45,
    description: 'Standard intro view - reached after scroll feedback'
  },

  // Keep all your other existing states unchanged...
  EXPLOSION: {
    position: [0, 0, 8],
    target: [0, 0, 0],
    rotation: [0, 0, 0],
    fov: 45,
    description: 'Wide view to see all exploded facets'
  },

  // ... rest of your PROJECT_ states remain the same
  PROJECT_EMPATHY: {
    position: [2.5, -2.0, 3.5],
    target: [0.3, -0.7, -0.2],
    rotation: [0, 0, 0],
    fov: 35,
    description: 'Close-up view of empathy facet'
  },

  // ... (keeping all other existing states as they are)
};

// Updated timing for smooth intro transition
export const CAMERA_TIMING = {
  // ... existing timing configs
  
  // NEW: Smooth scroll-driven transition timing
  INTRO_SCROLL_TRANSITION: 800,  // Smooth camera movement during scroll
  
  // Keep existing timings
  DEFAULT: 1200,
  INTRO_TO_EXPLOSION: 1600,
  // ... rest of your existing timing
};