// components/ui/ScrollHint.jsx
// Scroll instruction component

import React, { useState, useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';

const ScrollHint = ({ visible = true, scrollCrystalData }) => {
  const [show, setShow] = useState(true);
  
  // Hide hint after user starts scrolling
  useEffect(() => {
    if (scrollCrystalData.scrollProgress > 0.05) {
      setShow(false);
    }
  }, [scrollCrystalData.scrollProgress]);
  
  const hintSpring = useSpring({
    opacity: visible && show && scrollCrystalData.isInIntro ? 1 : 0,
    transform: visible && show && scrollCrystalData.isInIntro ? 
      'translateY(0px)' : 'translateY(20px)',
    config: { tension: 200, friction: 20 }
  });
  
  const bounceSpring = useSpring({
    from: { transform: 'translateY(0px)' },
    to: async (next) => {
      while (show && scrollCrystalData.isInIntro) {
        await next({ transform: 'translateY(-5px)' });
        await next({ transform: 'translateY(0px)' });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    },
    config: { tension: 300, friction: 8 }
  });
  
  return (
    <animated.div 
      style={{
        ...hintSpring,
        position: 'fixed',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        pointerEvents: 'none'
      }}
    >
      <div style={{
        color: 'white',
        fontSize: '14px',
        fontWeight: '400',
        letterSpacing: '0.5px',
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        opacity: 0.8
      }}>
        Scroll to explore
      </div>
      
      <animated.div style={bounceSpring}>
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity: 0.8 }}
        >
          <path 
            d="M7 10L12 15L17 10H7Z" 
            fill="white"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))'
            }}
          />
        </svg>
      </animated.div>
    </animated.div>
  );
};

export default ScrollHint;