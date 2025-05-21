// components/ui/AccessibilityInstructions.jsx
import React, { useState } from 'react';
import { animated, useSpring } from '@react-spring/web';

/**
 * Component to display keyboard controls and accessibility instructions
 * Updated with toggle functionality
 */
const AccessibilityInstructions = ({ visible = true }) => {
  const [expanded, setExpanded] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  
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
    height: expanded ? 'auto' : '145px',
    opacity: 1,
    config: {
      tension: 280,
      friction: 24
    }
  });
  
  // Toggle button style
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
    border: 'none',
    outline: 'none',
    zIndex: 1000,
    fontSize: '18px'
  };
  
  if (!visible) return null;
  
  return (
    <>
      {/* Toggle Button */}
      <button 
        style={toggleButtonStyle} 
        onClick={() => setShowInstructions(!showInstructions)}
        aria-label="Toggle Keyboard Shortcuts"
      >
        ⌨️
      </button>
      
      {/* Instructions Panel */}
      <animated.div 
        style={{
          ...panelSpring,
          position: 'fixed',
          bottom: '80px', // Position above the button
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '250px',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          pointerEvents: 'auto',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          overflowY: 'hidden'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: '5px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Keyboard Controls</span>
          <span style={{ opacity: 0.7, fontSize: '11px' }}>{expanded ? '(click to collapse)' : '(click to expand)'}</span>
        </div>
        
        <animated.div style={{ ...contentSpring, overflow: 'hidden' }}>
          <div style={{ marginBottom: '8px' }}>
            <div>SPACE: Toggle Explode/Reform</div>
            <div>ARROWS: Navigate Facets</div>
            <div>ENTER: Select Facet</div>
            <div>ESC: Back/Deselect</div>
            <div>H: Toggle UI Controls</div>
          </div>
          
          {expanded && (
            <>
              <div style={{ 
                width: '100%', 
                height: '1px', 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                margin: '8px 0'
              }} />
              
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Post-Processing Effects:</div>
              <div>ALT+B: Toggle Bloom</div>
              <div>ALT+C: Toggle Chromatic Aberration</div>
              <div>ALT+N: Toggle Noise</div>
              <div>ALT+V: Toggle Vignette</div>
              <div>ALT+P: Toggle All Effects</div>
              
              <div style={{ 
                width: '100%', 
                height: '1px', 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                margin: '8px 0'
              }} />
              
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Performance Options:</div>
              <div>ALT+M: Toggle Normal Maps</div>
              <div>ALT+E: Toggle All Effects</div>
            </>
          )}
        </animated.div>
      </animated.div>
    </>
  );
};

export default AccessibilityInstructions;