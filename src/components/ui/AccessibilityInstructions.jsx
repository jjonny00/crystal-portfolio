// components/ui/AccessibilityInstructions.jsx
import React from 'react';

/**
 * Component to display keyboard controls and accessibility instructions
 */
const AccessibilityInstructions = ({ visible = true }) => {
  if (!visible) return null;
  
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        maxWidth: '250px',
        backdropFilter: 'blur(5px)',
        zIndex: 1000,
        pointerEvents: 'none',
        opacity: 0.7,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        marginLeft: '60px', // To avoid overlap with controls toggle
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Keyboard Controls:</div>
      <div>SPACE: Toggle Explode/Reform</div>
      <div>ARROWS: Navigate Facets</div>
      <div>ENTER: Select Facet</div>
      <div>ESC: Back/Deselect</div>
      <div>H: Toggle UI Controls</div>
    </div>
  );
};

export default AccessibilityInstructions;