// components/ui/ScrollAccessibilityInstructions.jsx
// Updated accessibility instructions for scroll experience

import React, { useState, useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';

const ScrollAccessibilityInstructions = ({ visible = true, scrollCrystalData }) => {
  const [expanded, setExpanded] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Animation for panel visibility
  const panelSpring = useSpring({
    opacity: showInstructions ? 1 : 0,
    right: showInstructions ? '20px' : '-280px',
    config: {
      tension: 280,
      friction: 24
    }
  });
  
  // Animation for expansion
  const contentSpring = useSpring({
    height: expanded ? 'auto' : '200px',
    opacity: 1,
    config: {
      tension: 280,
      friction: 24
    }
  });
  
  // Listen for 'K' key to toggle instructions
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputField = e.target.tagName === 'INPUT' || 
                          e.target.tagName === 'TEXTAREA' || 
                          e.target.isContentEditable;
      
      if (isInputField) return;
      
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
        aria-label="Toggle Navigation Help"
        role="button"
        tabIndex={0}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(20, 20, 20, 0.9)';
          e.currentTarget.style.transform = 'scale(1.05)';
          const tooltip = e.currentTarget.querySelector('.tooltip');
          if (tooltip) tooltip.style.opacity = 1;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          e.currentTarget.style.transform = 'scale(1)';
          const tooltip = e.currentTarget.querySelector('.tooltip');
          if (tooltip) tooltip.style.opacity = 0;
        }}
      >
        {/* Navigation icon */}
        <span aria-hidden="true">🧭</span>
        
        {/* Tooltip */}
        <div className="tooltip" style={tooltipStyle}>
          Navigation Help (press K)
        </div>
      </button>
      
      {/* Instructions Panel */}
      <animated.div 
        style={{
          ...panelSpring,
          position: 'fixed',
          bottom: '80px',
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
        aria-label="Navigation Instructions"
        tabIndex={showInstructions ? 0 : -1}
      >
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: '8px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Navigation Controls</span>
          <span style={{ opacity: 0.7, fontSize: '11px' }}>
            {expanded ? '(click to collapse)' : '(click to expand)'}
          </span>
        </div>
        
        <animated.div style={{ ...contentSpring, overflow: 'hidden' }}>
          <div style={{ marginBottom: '10px' }}>
            <div><strong>Scroll</strong>: Primary navigation</div>
            <div><strong>SPACE</strong>: Next section</div>
            <div><strong>↑/↓</strong>: Navigate sections</div>
            <div><strong>←/→</strong>: Navigate projects</div>
            <div><strong>ESC</strong>: Return to start</div>
            <div><strong>K</strong>: Toggle this help</div>
          </div>
          
          {expanded && (
            <>
              <div style={{ 
                width: '100%', 
                height: '1px', 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                margin: '8px 0'
              }} />
              
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Quick Navigation:</div>
              <div><strong>HOME</strong>: Go to beginning</div>
              <div><strong>END</strong>: Go to end</div>
              <div><strong>1-9</strong>: Jump to project</div>
              
              <div style={{ 
                width: '100%', 
                height: '1px', 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                margin: '8px 0'
              }} />
              
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Current Section:</div>
              <div style={{ color: '#64ffda' }}>
                {scrollCrystalData.isInIntro && 'Introduction'}
                {scrollCrystalData.isInExplosion && 'Exploration'}
                {scrollCrystalData.isInProjects && `Project ${scrollCrystalData.currentProjectIndex + 1}`}
                {scrollCrystalData.isInReform && 'Completion'}
              </div>
              
              {scrollCrystalData.isInProjects && (
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                  {scrollCrystalData.getCurrentProject()?.title}
                </div>
              )}
            </>
          )}
        </animated.div>
      </animated.div>
    </>
  );
};

export default ScrollAccessibilityInstructions;