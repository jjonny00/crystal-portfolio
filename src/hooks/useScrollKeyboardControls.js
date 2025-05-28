// hooks/useScrollKeyboardControls.js
// Updated keyboard controls for scroll-driven experience

import { useEffect } from 'react';

/**
 * Custom hook for keyboard controls in scroll-driven crystal experience
 * Provides navigation shortcuts while scroll is the primary interaction
 */
const useScrollKeyboardControls = ({ scrollCrystalData }) => {
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent handling if in an input field
      if (e.target.tagName === 'INPUT' || 
          e.target.tagName === 'TEXTAREA' || 
          e.target.isContentEditable) {
        return;
      }
      
      // Skip if any modifier key is pressed
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      
      switch (e.code) {
        case 'Space':
          // Quick navigation to next section
          e.preventDefault();
          if (scrollCrystalData.isInIntro) {
            scrollCrystalData.goToSection('explosion');
          } else if (scrollCrystalData.isInExplosion) {
            scrollCrystalData.goToSection('projects', 0);
          } else if (scrollCrystalData.isInProjects) {
            scrollCrystalData.goToNextProject();
          } else if (scrollCrystalData.isInReform) {
            scrollCrystalData.goToSection('intro');
          }
          break;
          
        case 'ArrowDown':
          // Navigate forward through experience
          e.preventDefault();
          if (scrollCrystalData.isInIntro) {
            scrollCrystalData.goToSection('explosion');
          } else if (scrollCrystalData.isInExplosion) {
            scrollCrystalData.goToSection('projects', 0);
          } else if (scrollCrystalData.isInProjects) {
            scrollCrystalData.goToNextProject();
          }
          break;
          
        case 'ArrowUp':
          // Navigate backward through experience
          e.preventDefault();
          if (scrollCrystalData.isInProjects) {
            scrollCrystalData.goToPrevProject();
          } else if (scrollCrystalData.isInExplosion) {
            scrollCrystalData.goToSection('intro');
          } else if (scrollCrystalData.isInReform) {
            if (scrollCrystalData.projectCount > 0) {
              scrollCrystalData.goToSection('projects', scrollCrystalData.projectCount - 1);
            } else {
              scrollCrystalData.goToSection('explosion');
            }
          }
          break;
          
        case 'ArrowLeft':
          // Previous project (when in projects section)
          if (scrollCrystalData.isInProjects) {
            e.preventDefault();
            scrollCrystalData.goToPrevProject();
          }
          break;
          
        case 'ArrowRight':
          // Next project (when in projects section)
          if (scrollCrystalData.isInProjects) {
            e.preventDefault();
            scrollCrystalData.goToNextProject();
          }
          break;
          
        case 'Home':
          // Go to beginning
          e.preventDefault();
          scrollCrystalData.goToSection('intro');
          break;
          
        case 'End':
          // Go to end
          e.preventDefault();
          scrollCrystalData.goToSection('reform');
          break;
          
        case 'Escape':
          // Go back to intro
          scrollCrystalData.goToSection('intro');
          break;
          
        // Number keys for direct project navigation
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
        case 'Digit9':
          const projectIndex = parseInt(e.code.replace('Digit', '')) - 1;
          if (projectIndex >= 0 && projectIndex < scrollCrystalData.projectCount) {
            e.preventDefault();
            scrollCrystalData.goToSection('projects', projectIndex);
          }
          break;
          
        default:
          break;
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scrollCrystalData]);
};

export default useScrollKeyboardControls;