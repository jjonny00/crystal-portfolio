// Updated ControlsToggle.jsx with transition handling
import React, { useState } from 'react';
import { animated, useSpring } from '@react-spring/web';

/**
 * UI component for toggling the visibility of control panels
 */
const ControlsToggle = ({ showUI, toggleUI, disabled = false }) => {
  const [hovered, setHovered] = useState(false);
  
  // Animation for hover effect
  const springProps = useSpring({
    scale: hovered && !disabled ? 1.05 : 1,
    opacity: hovered && !disabled ? 1 : disabled ? 0.6 : 0.8,
    config: {
      tension: 300,
      friction: 20
    }
  });
  
  // Animation for toggle state
  const toggleSpring = useSpring({
    rotate: showUI ? 180 : 0,
    config: {
      tension: 300,
      friction: 20
    }
  });
  
  // Handle click
  const handleClick = () => {
    if (!disabled) {
      toggleUI();
    }
  };
  
  return (
    <animated.div
      style={{
        ...springProps,
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px 12px',
        borderRadius: '50%',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(5px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={handleClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Settings gear icon that rotates when UI is shown */}
      <animated.div
        style={{
          transform: toggleSpring.rotate.to(r => `rotate(${r}deg)`)
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22l-1.92 3.32c-.12.22-.07.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
            fill="currentColor"
          />
        </svg>
      </animated.div>
    </animated.div>
  );
};

export default ControlsToggle;