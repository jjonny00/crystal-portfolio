// hooks/useKeyboardControls.js - Updated with browser-friendly shortcuts
import { useEffect } from 'react';

/**
 * Custom hook to manage keyboard controls for the crystal experience
 * Updated with safer browser-friendly hotkeys
 */
const useKeyboardControls = ({
  isExploded,
  setIsExploded,
  hoveredFacet,
  setHoveredFacet,
  selectedFacet,
  setSelectedFacet,
  showUI,
  setShowUI,
  showDetailCard,
  setShowDetailCard,
  setOrbitControlsEnabled,
  config,
  isTransitioning,
  setIsTransitioning,
  effectsEnabled,
  handleToggleEffect,
  performanceConfig,
  toggleNormalMaps
}) => {
  // Set up keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent handling if in an input field
      if (e.target.tagName === 'INPUT' || 
          e.target.tagName === 'TEXTAREA' || 
          e.target.isContentEditable) {
        return;
      }
      
      // Check for modifier keys - we want to avoid conflicts with browser shortcuts
      const hasModifier = e.ctrlKey || e.altKey || e.metaKey;
      
      // Skip if any modifier key is pressed (to avoid OS/browser shortcut conflicts)
      if (hasModifier) return;
      
      // Process key presses without modifiers
      switch (e.code) {
        case 'Space':
          // Toggle exploded state
          e.preventDefault(); // Prevent scrolling
          setIsExploded(prev => !prev);
          
          // If a facet is selected, deselect it
          if (selectedFacet) {
            setSelectedFacet(null);
            setShowDetailCard(false);
            setOrbitControlsEnabled(true);
          }
          break;
          
        case 'Enter':
          // Select currently hovered facet
          if (hoveredFacet && isExploded) {
            handleFacetSelection(hoveredFacet);
          }
          break;
          
        case 'Escape':
          // Deselect current facet or reform crystal
          if (selectedFacet) {
            setSelectedFacet(null);
            setShowDetailCard(false);
            setOrbitControlsEnabled(true);
          } else if (isExploded) {
            setIsExploded(false);
          }
          break;
          
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown':
          if (isExploded) {
            handleArrowNavigation(e.code);
          }
          break;
          
        case 'KeyH':
          // Toggle UI controls visibility
          setShowUI(prev => !prev);
          break;
          
        // Tab selection using number keys 1-4
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
          // Handle tab selection if UI is visible
          if (showUI) {
            const tabIndex = parseInt(e.code.replace('Digit', '')) - 1;
            // You'd need to add a function or state to handle tab switching
            // This is a placeholder - implement switchTab function
            if (typeof window.switchUITab === 'function') {
              window.switchUITab(tabIndex);
            }
          }
          break;
          
        // Effects Controls - Single key (no modifier)  
        case 'KeyB':
          // Toggle Bloom effect
          if (handleToggleEffect) {
            handleToggleEffect('bloom', !effectsEnabled.bloom);
          }
          break;
          
        case 'KeyC':
          // Toggle Chromatic Aberration
          if (handleToggleEffect) {
            handleToggleEffect('chromaticAberration', !effectsEnabled.chromaticAberration);
          }
          break;
          
        case 'KeyN':
          // Toggle Noise
          if (handleToggleEffect) {
            handleToggleEffect('noise', !effectsEnabled.noise);
          }
          break;
          
        case 'KeyV':
          // Toggle Vignette
          if (handleToggleEffect) {
            handleToggleEffect('vignette', !effectsEnabled.vignette);
          }
          break;
          
        case 'KeyP':
          // Toggle all post-processing effects
          if (handleToggleEffect) {
            const allEnabled = Object.values(effectsEnabled).every(Boolean);
            const newState = !allEnabled;
            
            handleToggleEffect('bloom', newState);
            handleToggleEffect('chromaticAberration', newState);
            handleToggleEffect('noise', newState);
            handleToggleEffect('vignette', newState);
          }
          break;
          
        case 'KeyM':
          // Toggle normal maps
          if (toggleNormalMaps) {
            toggleNormalMaps();
          }
          break;
          
        case 'KeyR':
          // Reset to high quality
          if (performanceConfig) {
            // Set all performance settings to high quality
            const highQualityConfig = {
              useNormalMaps: true,
              textureQuality: 'high',
              usePBR: true
            };
            
            // Function to update performance config would be called here
            // This is a placeholder - implement a proper function
            if (typeof window.updatePerformanceConfig === 'function') {
              window.updatePerformanceConfig(highQualityConfig);
            }
          }
          break;
          
        case 'KeyK':
          // K key is handled by AccessibilityInstructions component
          // We're just adding it here for documentation
          break;
          
        default:
          break;
      }
    };
    
    // Helper function to handle facet selection
    const handleFacetSelection = (facetKey) => {
      if (facetKey === selectedFacet) {
        // Deselect if already selected
        setSelectedFacet(null);
        setShowDetailCard(false);
        setOrbitControlsEnabled(true);
      } else {
        // Select new facet
        setSelectedFacet(facetKey);
        setOrbitControlsEnabled(false);
        
        // Show detail card after camera animation completes
        setTimeout(() => {
          setShowDetailCard(true);
        }, config.timing.camera.facetZoomDuration + 100);
      }
    };
    
    // Helper function for arrow key navigation between facets
    const handleArrowNavigation = (arrowKey) => {
      // Get array of facet keys
      const facetKeys = config.facetLabels.map(f => f.key);
      const currentIndex = hoveredFacet ? facetKeys.indexOf(hoveredFacet) : -1;
      
      // If no facet is currently hovered, start with the first one
      if (currentIndex === -1) {
        setHoveredFacet(facetKeys[0]);
        return;
      }
      
      // Get positions of all facets
      const facetPositions = Object.entries(config.explodedPositions).map(([key, pos]) => ({
        key,
        x: pos[0],
        y: pos[1],
        z: pos[2]
      }));
      
      // Get current facet position
      const currentPos = facetPositions.find(f => f.key === hoveredFacet);
      
      // Find next facet based on arrow direction
      let nextFacet;
      
      switch (arrowKey) {
        case 'ArrowLeft':
          // Find facet most to the left of current
          nextFacet = findClosestFacetInDirection(facetPositions, currentPos, 'left');
          break;
          
        case 'ArrowRight':
          // Find facet most to the right of current
          nextFacet = findClosestFacetInDirection(facetPositions, currentPos, 'right');
          break;
          
        case 'ArrowUp':
          // Find facet most above current
          nextFacet = findClosestFacetInDirection(facetPositions, currentPos, 'up');
          break;
          
        case 'ArrowDown':
          // Find facet most below current
          nextFacet = findClosestFacetInDirection(facetPositions, currentPos, 'down');
          break;
      }
      
      if (nextFacet) {
        setHoveredFacet(nextFacet.key);
      }
    };
    
    // Helper function to find closest facet in a given direction
    const findClosestFacetInDirection = (facetPositions, currentPos, direction) => {
      // Filter facets based on direction
      let candidateFacets;
      
      switch (direction) {
        case 'left':
          candidateFacets = facetPositions.filter(f => f.x < currentPos.x);
          if (candidateFacets.length === 0) {
            // Wrap around to rightmost facet
            candidateFacets = facetPositions.sort((a, b) => b.x - a.x);
            return candidateFacets[0];
          }
          break;
          
        case 'right':
          candidateFacets = facetPositions.filter(f => f.x > currentPos.x);
          if (candidateFacets.length === 0) {
            // Wrap around to leftmost facet
            candidateFacets = facetPositions.sort((a, b) => a.x - b.x);
            return candidateFacets[0];
          }
          break;
          
        case 'up':
          candidateFacets = facetPositions.filter(f => f.y > currentPos.y);
          if (candidateFacets.length === 0) {
            // Wrap around to bottom-most facet
            candidateFacets = facetPositions.sort((a, b) => a.y - b.y);
            return candidateFacets[0];
          }
          break;
          
        case 'down':
          candidateFacets = facetPositions.filter(f => f.y < currentPos.y);
          if (candidateFacets.length === 0) {
            // Wrap around to top-most facet
            candidateFacets = facetPositions.sort((a, b) => b.y - a.y);
            return candidateFacets[0];
          }
          break;
      }
      
      // Sort by distance and pick closest
      return candidateFacets.sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.x - currentPos.x, 2) + Math.pow(a.y - currentPos.y, 2));
        const distB = Math.sqrt(Math.pow(b.x - currentPos.x, 2) + Math.pow(b.y - currentPos.y, 2));
        return distA - distB;
      })[0];
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isExploded, 
    setIsExploded, 
    hoveredFacet, 
    setHoveredFacet,
    selectedFacet, 
    setSelectedFacet,
    showUI, 
    setShowUI,
    setShowDetailCard,
    setOrbitControlsEnabled,
    config,
    isTransitioning,
    effectsEnabled,
    handleToggleEffect,
    performanceConfig,
    toggleNormalMaps
  ]);
};

export default useKeyboardControls;