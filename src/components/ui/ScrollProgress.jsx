// components/ui/ScrollProgress.jsx
// Progress indicator for scroll-driven experience

import React from 'react';
import { animated, useSpring } from '@react-spring/web';

const ScrollProgress = ({ scrollCrystalData, visible = true }) => {
  // Animation for progress bar
  const progressSpring = useSpring({
    width: `${scrollCrystalData.scrollProgress * 100}%`,
    config: { tension: 300, friction: 30 }
  });
  
  // Animation for section indicators
  const sectionSpring = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0px)' : 'translateY(20px)',
    config: { tension: 200, friction: 20 }
  });
  
  if (!visible) return null;
  
  // Section labels
  const sections = [
    { label: 'Intro', key: 'intro' },
    { label: 'Explore', key: 'explosion' },
    ...scrollCrystalData.projectCount > 0 ? 
      Array.from({ length: scrollCrystalData.projectCount }, (_, i) => ({
        label: `Project ${i + 1}`,
        key: `project-${i}`
      })) : [],
    { label: 'Return', key: 'reform' }
  ];
  
  return (
    <animated.div 
      style={{
        ...sectionSpring,
        position: 'fixed',
        top: '20px',
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
      {/* Progress bar */}
      <div style={{
        width: '200px',
        height: '2px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '1px',
        overflow: 'hidden'
      }}>
        <animated.div 
          style={{
            ...progressSpring,
            height: '100%',
            backgroundColor: '#64ffda',
            borderRadius: '1px'
          }}
        />
      </div>
      
      {/* Current section indicator */}
      <div style={{
        color: 'white',
        fontSize: '12px',
        fontWeight: '500',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}>
        {scrollCrystalData.getCurrentProject()?.title || 
         (scrollCrystalData.isInIntro ? 'Welcome' :
          scrollCrystalData.isInExplosion ? 'Exploring' :
          scrollCrystalData.isInReform ? 'Complete' : 'Navigation')}
      </div>
      
      {/* Section dots */}
      <div style={{
        display: 'flex',
        gap: '6px',
        alignItems: 'center'
      }}>
        {sections.map((section, index) => {
          const isActive = 
            (index === 0 && scrollCrystalData.isInIntro) ||
            (index === 1 && scrollCrystalData.isInExplosion) ||
            (index >= 2 && index < 2 + scrollCrystalData.projectCount && 
             scrollCrystalData.currentProjectIndex === index - 2) ||
            (index === sections.length - 1 && scrollCrystalData.isInReform);
          
          return (
            <div
              key={section.key}
              style={{
                width: isActive ? '8px' : '4px',
                height: isActive ? '8px' : '4px',
                borderRadius: '50%',
                backgroundColor: isActive ? '#64ffda' : 'rgba(255, 255, 255, 0.4)',
                transition: 'all 0.3s ease',
                boxShadow: isActive ? '0 0 8px rgba(100, 255, 218, 0.6)' : 'none'
              }}
            />
          );
        })}
      </div>
    </animated.div>
  );
};

export default ScrollProgress;