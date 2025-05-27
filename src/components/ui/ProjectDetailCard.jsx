// src/components/ui/ProjectDetailCard.jsx
import React, { useState, useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';

/**
 * UI component for displaying detailed information about a selected project
 */
const ProjectDetailCard = ({ project, visible, onClose }) => {
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

  // Only render if visible
  if (!isVisible && !visible) return null;
  
  if (!project) {
    console.warn('ProjectDetailCard: No project provided');
    return null;
  }
  
  // Generate color variables for styling
  const projectColor = project.color || '#64ffda';
  const projectColorLight = `${projectColor}40`; // 25% opacity version
  
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
        border: `1px solid ${projectColorLight}`
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
      
      {/* Header section with project title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <animated.div 
          style={{
            ...titleSpring,
            backgroundColor: projectColor,
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1a1a1a' // Dark color for the icon
          }}
        >
          {getProjectIcon(project)}
        </animated.div>
        
        <animated.div style={titleSpring}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '24px', 
            fontWeight: '600',
            background: `linear-gradient(135deg, white, ${projectColor})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {project.title}
          </h2>
        </animated.div>
      </div>
      
      {/* Technologies section */}
      <animated.div 
        style={{
          ...contentSpring,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        {project.technologies && project.technologies.map((tech, index) => (
          <span key={index} style={{
            background: projectColorLight,
            color: 'white',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {tech}
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
        {project.description}
      </animated.div>
      
      {/* Project image (if available) */}
      {project.imageUrl && (
        <animated.div 
          style={{
            ...contentSpring,
            width: '100%',
            overflow: 'hidden',
            borderRadius: '8px',
            marginTop: '8px'
          }}
        >
          <img 
            src={project.imageUrl} 
            alt={project.title}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              objectFit: 'cover'
            }}
          />
        </animated.div>
      )}
      
      {/* Links section */}
      <animated.div
        style={{
          ...contentSpring,
          display: 'flex',
          gap: '10px',
          marginTop: '10px'
        }}
      >
        {project.demoUrl && (
          <a 
            href={project.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: projectColor,
              color: '#1a1a1a',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 19H5V5H12V3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V12H19V19ZM14 3V5H17.59L7.76 14.83L9.17 16.24L19 6.41V10H21V3H14Z" fill="currentColor" />
            </svg>
            View Demo
          </a>
        )}
        
        {project.githubUrl && (
          <a 
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 16.42 4.87 20.17 8.84 21.5C9.34 21.58 9.5 21.27 9.5 21C9.5 20.77 9.5 20.14 9.5 19.31C6.73 19.91 6.14 17.97 6.14 17.97C5.68 16.81 5.03 16.5 5.03 16.5C4.12 15.88 5.1 15.9 5.1 15.9C6.1 15.97 6.63 16.93 6.63 16.93C7.5 18.45 8.97 18 9.54 17.76C9.63 17.11 9.89 16.67 10.17 16.42C7.95 16.17 5.62 15.31 5.62 11.5C5.62 10.39 6 9.5 6.65 8.79C6.55 8.54 6.2 7.5 6.75 6.15C6.75 6.15 7.59 5.88 9.5 7.17C10.29 6.95 11.15 6.84 12 6.84C12.85 6.84 13.71 6.95 14.5 7.17C16.41 5.88 17.25 6.15 17.25 6.15C17.8 7.5 17.45 8.54 17.35 8.79C18 9.5 18.38 10.39 18.38 11.5C18.38 15.32 16.04 16.16 13.81 16.41C14.17 16.72 14.5 17.33 14.5 18.26C14.5 19.6 14.5 20.68 14.5 21C14.5 21.27 14.66 21.59 15.17 21.5C19.14 20.16 22 16.42 22 12C22 6.48 17.52 2 12 2Z" fill="currentColor" />
            </svg>
            View Code
          </a>
        )}
      </animated.div>
    </animated.div>
  );
};

// Helper function to generate icon based on project type
const getProjectIcon = (project) => {
  // You can customize this with different icons based on project type
  // For now, we'll use a default icon
  const facetIcons = {
    empathy: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="currentColor" />
      </svg>
    ),
    narrative: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H9V17H7V10ZM11 7H13V17H11V7ZM15 13H17V17H15V13Z" fill="currentColor" />
      </svg>
    ),
    craft: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 21C5.9 21 5 20.1 5 19V15H3V19C3 21.21 4.79 23 7 23H11V21H7M21 3H13V5H21C21.55 5 22 5.45 22 6V10H20V6.5C19.96 6.22 19.73 6 19.45 6C19.2 6 19 6.2 19 6.45V12.95C19 13.65 18.65 14.12 18 14.5V14.5C17.35 14.88 17 15.35 17 16.05V19.55C17 19.8 17.2 20 17.45 20C17.73 20 17.96 19.78 18 19.5V16H20V20C20 20.55 19.55 21 19 21H11V23H19C21.21 23 23 21.21 23 19V5C23 3.9 22.1 3 21 3M5 13C5 13.55 5.45 14 6 14H9V16H3V12H5V13M15 5H7V11C7 11.55 7.45 12 8 12H11V14H5V12.56C3.22 12.04 2 10.43 2 8.5V5C2 3.9 2.9 3 4 3H15V5Z" fill="currentColor" />
      </svg>
    ),
    system: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 11V3H15V6H9V3H2V11H9V8H11V18H9V15H2V21H9V18H15V21H22V15H15V18H13V8H15V11H22ZM7 7H4V5H7V7ZM4 17H7V19H4V17ZM20 19H17V17H20V19ZM17 7V5H20V7H17Z" fill="currentColor" />
      </svg>
    ),
    leadership: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" fill="currentColor" />
      </svg>
    ),
    exploration: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.5 3C9.67 3 9.84 3.09 9.93 3.22L12.59 7.44L17.19 8.28C17.32 8.3 17.44 8.39 17.5 8.52C17.56 8.65 17.55 8.8 17.47 8.92L14.18 13.25L14.97 18.02C15 18.16 14.94 18.29 14.83 18.37C14.72 18.46 14.57 18.47 14.45 18.4L10 15.82L5.55 18.4C5.43 18.47 5.28 18.46 5.17 18.37C5.06 18.29 5 18.16 5.03 18.02L5.82 13.25L2.53 8.92C2.45 8.8 2.44 8.65 2.5 8.52C2.56 8.39 2.68 8.3 2.81 8.28L7.41 7.44L10.07 3.22C10.16 3.09 10.33 3 10.5 3H9.5ZM10 5.29L7.97 8.6C7.89 8.71 7.78 8.79 7.66 8.82L4.16 9.45L6.69 12.76C6.78 12.87 6.82 13 6.81 13.14L6.2 16.76L9.53 14.79C9.66 14.72 9.81 14.72 9.94 14.79L13.28 16.76L12.66 13.14C12.65 13 12.69 12.87 12.78 12.76L15.31 9.45L11.81 8.82C11.68 8.79 11.57 8.71 11.49 8.6L10 5.29Z" fill="currentColor" />
      </svg>
    )
  };

  const facetKey = project.facetKey || 'default';
  
  // Return the icon for the facet, or a default icon
  return facetIcons[facetKey] || (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" />
      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
};

export default ProjectDetailCard;