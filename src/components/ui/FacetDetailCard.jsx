// components/ui/FacetDetailCard.jsx
import React, { useState, useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';

/**
 * UI component for displaying detailed information about a selected facet
 */
const FacetDetailCard = ({ facet, visible, onClose }) => {
  const [isVisible, setIsVisible] = useState(visible);
  
  // Update visibility when prop changes
  useEffect(() => {
    if (visible) {
      setIsVisible(true);
    }
  }, [visible]);
  
  // Animation for card entrance/exit
  const springProps = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0px)' : 'translateY(40px)',
    config: {
      tension: 280,
      friction: 24
    },
    onRest: () => {
      if (!visible) {
        setIsVisible(false);
      }
    }
  });
  
  // Animation for individual elements staggered entrance
  const titleSpring = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0px)' : 'translateY(20px)',
    delay: 100,
    config: {
      tension: 300,
      friction: 26
    }
  });
  
  const contentSpring = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0px)' : 'translateY(15px)',
    delay: 200,
    config: {
      tension: 300,
      friction: 26
    }
  });
  
  // Generate tags based on facet
  const generateTags = () => {
    // This is sample data - customize for each facet
    const tagsMap = {
      empathy: ['User Research', 'Personas', 'Journey Maps'],
      narrative: ['Storytelling', 'Presentations', 'Vision'],
      craft: ['Visual Design', 'Interaction', 'Motion'],
      system: ['Design Systems', 'Components', 'Documentation'],
      leadership: ['Mentorship', 'Strategy', 'Team Building'],
      exploration: ['Ideation', 'Prototyping', 'Testing']
    };
    
    return tagsMap[facet.key] || [];
  };
  
  // Generate icon based on facet key - can be extended with custom SVGs
  const getIcon = () => {
    // Default icon if none specified
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
        <path d="M2 17L12 22L22 17" fill="currentColor" />
        <path d="M2 12L12 17L22 12" fill="currentColor" />
      </svg>
    );
  };
  
  // Only render if visible
  if (!isVisible && !visible) return null;
  
  // Generate color variables for styling
  const facetColor = facet ? facet.color : '#ffffff';
  const facetColorLight = facet ? `${facet.color}40` : '#ffffff40'; // 25% opacity version
  
  return (
    <animated.div 
      style={{
        ...springProps,
        position: 'fixed',
        bottom: '80px',
        right: '40px',
        width: '360px',
        maxWidth: 'calc(100vw - 80px)',
        borderRadius: '16px',
        background: 'rgba(25, 25, 30, 0.8)',
        backdropFilter: 'blur(20px)',
        color: 'white',
        padding: '24px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        border: `1px solid ${facetColorLight}`
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'transparent',
          border: 'none',
          color: 'white',
          opacity: 0.7,
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = 1;
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = 0.7;
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor" />
        </svg>
      </button>
      
      {/* Header section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <animated.div 
          style={{
            ...titleSpring,
            backgroundColor: facetColor,
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1a1a1a' // Dark color for the icon
          }}
        >
          {getIcon()}
        </animated.div>
        
        <animated.div style={titleSpring}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '24px', 
            fontWeight: '600',
            background: `linear-gradient(135deg, white, ${facetColor})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {facet.text}
          </h2>
        </animated.div>
      </div>
      
      {/* Tags section */}
      <animated.div 
        style={{
          ...contentSpring,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        {generateTags().map((tag, index) => (
          <span key={index} style={{
            background: facetColorLight,
            color: 'white',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {tag}
          </span>
        ))}
      </animated.div>
      
      {/* Description section */}
      <animated.div 
        style={{
          ...contentSpring,
          fontSize: '14px',
          lineHeight: '1.6',
          color: 'rgba(255, 255, 255, 0.9)'
        }}
      >
        {facet.description}
      </animated.div>
      
      {/* Additional content can be added here */}
    </animated.div>
  );
};

export default FacetDetailCard;