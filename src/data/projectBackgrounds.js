// ENHANCED: src/data/projectBackgrounds.js
// Define color schemes for background gradients per project with better contrast and visual distinctiveness

export const projectBackgrounds = {
  // Default - Deep purple to gold (elegant, professional)
  default: {
    colorA: '#28212e', // deeper purple  
    colorB: '#3d2400'  // darker gold
  },
  
  // Overview - Bright contrast for projects overview
  overview: {
    colorA: '#03d1cd', // deep red-orange
    colorB: '#19141b'  // deep teal
  },
  
  // Empathy - Warm and inviting (red to cyan)
  empathy: {
    colorA: '#4d0000', // deep red
    colorB: '#004d4d'  // deep cyan
  },
  
  // Narrative - Creative and inspiring (green to magenta) 
  narrative: {
    colorA: '#1a4d00', // deep forest green
    colorB: '#4d004d'  // deep magenta
  },
  
  // Craft - Precision and focus (blue to yellow)
  craft: {
    colorA: '#001a4d', // deep navy blue
    colorB: '#4d4d00'  // deep golden yellow
  },
  
  // System - Technical and structured (orange to azure)
  system: {
    colorA: '#4d2600', // deep orange
    colorB: '#00264d'  // deep azure
  },
  
  // Leadership - Authority and vision (violet to chartreuse)
  leadership: {
    colorA: '#2d004d', // deep violet
    colorB: '#334d00'  // deep chartreuse  
  },
  
  // Exploration - Discovery and innovation (spring green to fuchsia)
  exploration: {
    colorA: '#004d26', // deep spring green
    colorB: '#4d0026'  // deep fuchsia
  }
};

// ADDED: Helper function to get background info
export const getBackgroundInfo = (key) => {
  const background = projectBackgrounds[key] || projectBackgrounds.default;
  return {
    colorA: background.colorA,
    colorB: background.colorB,
    exists: !!projectBackgrounds[key]
  };
};

// ADDED: Helper to get all available background keys
export const getAvailableBackgroundKeys = () => {
  return Object.keys(projectBackgrounds);
};

// ADDED: Debug helper to log all colors
export const logAllBackgrounds = () => {
  if (import.meta.env.DEV) {
    console.group('🎨 All Project Backgrounds:');
    Object.entries(projectBackgrounds).forEach(([key, colors]) => {
      console.log(`${key}:`, colors);
    });
    console.groupEnd();
  }
};