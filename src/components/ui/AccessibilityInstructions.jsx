// components/ui/AccessibilityInstructions.jsx
import React, { useState, useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';

/**
 * Component to display keyboard controls and accessibility instructions
 * Hidden by default with improved accessibility support and safer hotkeys
 */
const AccessibilityInstructions = ({ visible = true }) => {
  const [expanded, setExpanded] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false); // Start hidden
  
  // Animation for panel visibility
  const panelSpring = useSpring({
    opacity: showInstructions ? 1 : 0,
    right: showInstructions ? '20px' : '-250px',
    config: {
      tension: 280,
      friction: 24
    }
  });
  
  // Animation for expansion
  const contentSpring = useSpring({
    height: expanded ? 'auto' : '165px', // Slightly increased to show more content
    opacity: 1,
    config: {
      tension: 280,
      friction: 24
    }
  });
  
  // Listen for 'K' key to toggle instructions (safer alternative to '?')
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if the user is in an input field - if so, don't trigger shortcuts
      const isInputField = e.target.tagName === 'INPUT' || 
                          e.target.tagName === 'TEXTAREA' || 
                          e.target.isContentEditable;
      
      if (isInputField) return;
      
      // Toggle instructions when 'K' key is pressed (safe browser shortcut)
      if (e.key === 'k' || e.key === 'K') {
        if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault();
          setShowInstructions(prev => !prev);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Toggle button style with universal design principles
  const toggleButtonStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(5px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    outline: 'none',
    zIndex: 1000,
    fontSize: '18px',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
    transition: 'all 0.2s ease'
  };
  
  const tooltipStyle = {
    position: 'absolute',
    right: '50px',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    opacity: 0,
    transition: 'opacity 0.2s ease',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
  };
  
  if (!visible) return null;
  
  return (
    <>
      {/* Toggle Button */}
      <button 
        style={toggleButtonStyle} 
        onClick={() => setShowInstructions(!showInstructions)}
        aria-label="Toggle Keyboard Shortcuts"
        role="button"
        tabIndex={0}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(20, 20, 20, 0.9)';
          e.currentTarget.style.transform = 'scale(1.05)';
          // Show tooltip
          const tooltip = e.currentTarget.querySelector('.tooltip');
          if (tooltip) tooltip.style.opacity = 1;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          e.currentTarget.style.transform = 'scale(1)';
          // Hide tooltip
          const tooltip = e.currentTarget.querySelector('.tooltip');
          if (tooltip) tooltip.style.opacity = 0;
        }}
        onFocus={(e) => {
          // Show tooltip on focus (for keyboard navigation)
          const tooltip = e.currentTarget.querySelector('.tooltip');
          if (tooltip) tooltip.style.opacity = 1;
        }}
        onBlur={(e) => {
          // Hide tooltip when focus is lost
          const tooltip = e.currentTarget.querySelector('.tooltip');
          if (tooltip) tooltip.style.opacity = 0;
        }}
      >
        {/* Keyboard icon */}
        <span aria-hidden="true">⌨️</span>
        
        {/* Tooltip explaining the button and showing hotkey */}
        <div className="tooltip" style={tooltipStyle}>
          Keyboard Shortcuts (press K to toggle)
        </div>
      </button>
      
      {/* Instructions Panel */}
      <animated.div 
        style={{
          ...panelSpring,
          position: 'fixed',
          bottom: '80px', // Position above the button
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          maxWidth: '280px',
          backdropFilter: 'blur(20px)',
          zIndex: 1000,
          pointerEvents: 'auto',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          overflowY: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        onClick={() => setExpanded(!expanded)}
        role="dialog"
        aria-label="Keyboard Shortcuts"
        tabIndex={showInstructions ? 0 : -1}
      >
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: '8px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Keyboard Controls</span>
          <span style={{ opacity: 0.7, fontSize: '11px' }}>{expanded ? '(click to collapse)' : '(click to expand)'}</span>
        </div>
        
        <animated.div style={{ ...contentSpring, overflow: 'hidden' }}>
          <div style={{ marginBottom: '10px' }}>
            <div><strong>K</strong>: Toggle this help panel</div>
            <div><strong>SPACE</strong>: Toggle Explode/Reform</div>
            <div><strong>ARROWS</strong>: Navigate Facets</div>
            <div><strong>ENTER</strong>: Select Facet</div>
            <div><strong>ESC</strong>: Back/Deselect</div>
            <div><strong>H</strong>: Toggle UI Controls</div>
            <div><strong>1-4</strong>: Switch UI Control Tabs</div> {/* Added numeric tab switching */}
          </div>
          
          {expanded && (
            <>
              <div style={{ 
                width: '100%', 
                height: '1px', 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                margin: '8px 0'
              }} />
              
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Effects Controls:</div>
              <div><strong>B</strong>: Toggle Bloom</div>
              <div><strong>C</strong>: Toggle Chromatic Aberration</div>
              <div><strong>N</strong>: Toggle Noise</div>
              <div><strong>V</strong>: Toggle Vignette</div>
              <div><strong>P</strong>: Toggle All Effects</div>
              
              <div style={{ 
                width: '100%', 
                height: '1px', 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                margin: '8px 0'
              }} />
              
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Performance Options:</div>
              <div><strong>M</strong>: Toggle Normal Maps</div>
              <div><strong>R</strong>: Reset to High Quality</div>
            </>
          )}
        </animated.div>
      </animated.div>
    </>
  );
};

export default AccessibilityInstructions;