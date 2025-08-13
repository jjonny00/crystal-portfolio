// src/ui/LoaderV2.jsx
// FIXED: Correct progress ring mapping and smooth progress tracking

import React, { useState, useEffect, useRef } from 'react';

const LoaderV2 = ({
  phase = 'initializing',
  overallProgress = 0,
  phaseProgress = 0,
  subProgress = 0,
  statusMessage = ''
}) => {
  const [smoothOverall, setSmoothOverall] = useState(0);
  const [smoothPhase, setSmoothPhase] = useState(0);
  const [smoothSub, setSmoothSub] = useState(0);

  const animationFrameRef = useRef();

  // Smooth progress animation
  useEffect(() => {
    const animate = () => {
      setSmoothOverall(prev => {
        const diff = overallProgress - prev;
        return prev + diff * 0.1; // Smooth interpolation
      });

      setSmoothPhase(prev => {
        const diff = phaseProgress - prev;
        return prev + diff * 0.15;
      });

      setSmoothSub(prev => {
        const diff = subProgress - prev;
        return prev + diff * 0.12;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [overallProgress, phaseProgress, subProgress]);

  // FIXED: Correct ring mapping
  const ringProgress = {
    // Outer ring: Overall progress across all phases
    outer: Math.min(smoothOverall * 100, 100),

    // Middle ring: Current phase progress
    middle: Math.min(smoothPhase * 100, 100),

    // Inner ring: Sub-task progress within the phase
    inner: Math.min(smoothSub * 100, 100)
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'initializing':
        return 'Initializing System';
      case 'testing':
        return 'Testing Performance';
      case 'loading':
        return 'Loading Assets';
      default:
        return 'Starting...';
    }
  };

  const getStatusText = () => {
    if (statusMessage) {
      return statusMessage;
    }
    
    switch (phase) {
      case 'testing':
        return 'Finding optimal quality settings...';
      case 'loading':
        return 'Loading 3D models and textures...';
      default:
        return 'Preparing crystal experience...';
    }
  };

  // Ring colors match phases: blue/overall, purple/assets, yellow/testing
  const ringColors = {
    outer: '#64ffda',   // Teal - overall initialization
    middle: '#bb86fc',  // Purple - asset loading
    inner: '#ffd600'    // Gold - performance testing
  };

  const ringSize = 120;
  const strokeWidth = 8;
  const center = ringSize;
  const radii = [
    ringSize - strokeWidth,      // Outer ring
    ringSize - strokeWidth * 3,  // Middle ring  
    ringSize - strokeWidth * 5   // Inner ring
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0B0B0C',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#E9E7F0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      zIndex: 100000
    }}>
      
      {/* Main Title */}
      <h1 style={{
        fontSize: 'clamp(2rem, 6vw, 4rem)',
        fontWeight: '700',
        background: 'linear-gradient(90deg, #64ffda, #bb86fc)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        Multifaceted Designer
      </h1>

      {/* Progress Rings Container */}
      <div style={{
        position: 'relative',
        width: ringSize * 2,
        height: ringSize * 2,
        marginBottom: '2rem'
      }}>
        
        {/* SVG Progress Rings */}
        <svg 
          width={ringSize * 2} 
          height={ringSize * 2}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Ring backgrounds */}
          {radii.map((radius, index) => (
            <circle
              key={`bg-${index}`}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={strokeWidth}
            />
          ))}
          
          {/* Progress rings */}
          {[
            { radius: radii[0], progress: ringProgress.outer, color: ringColors.outer },
            { radius: radii[1], progress: ringProgress.middle, color: ringColors.middle },
            { radius: radii[2], progress: ringProgress.inner, color: ringColors.inner }
          ].map((ring, index) => {
            const circumference = 2 * Math.PI * ring.radius;
            const strokeDashoffset = circumference - (ring.progress / 100) * circumference;
            
            return (
              <circle
                key={`progress-${index}`}
                cx={center}
                cy={center}
                r={ring.radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(-90 ${center} ${center})`}
                style={{
                  transition: 'stroke-dashoffset 0.3s ease'
                }}
              />
            );
          })}
        </svg>

        {/* Center Text */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: '#F4F2E6',
            marginBottom: '0.25rem'
          }}>
            {Math.round(smoothOverall * 100)}%
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'rgba(244, 242, 230, 0.7)',
            fontWeight: '500'
          }}>
            {getPhaseText()}
          </div>
        </div>
      </div>

      {/* Status Information */}
      <div style={{
        textAlign: 'center',
        maxWidth: '500px',
        padding: '0 2rem'
      }}>
        <div style={{
          fontSize: '1.125rem',
          color: '#E9E7F0',
          marginBottom: '0.5rem',
          fontWeight: '500'
        }}>
          {getStatusText()}
        </div>
        
        {/* Progress Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginTop: '1.5rem',
          fontSize: '0.875rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: ringColors.outer, fontWeight: '600' }}>
              Overall
            </div>
            <div style={{ color: 'rgba(244, 242, 230, 0.8)' }}>
              {Math.round(ringProgress.outer)}%
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: ringColors.middle, fontWeight: '600' }}>
              {phase === 'testing' ? 'Testing' : phase === 'loading' ? 'Assets' : 'Phase'}
            </div>
            <div style={{ color: 'rgba(244, 242, 230, 0.8)' }}>
              {Math.round(ringProgress.middle)}%
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ color: ringColors.inner, fontWeight: '600' }}>
              {phase === 'testing' ? 'Step' : phase === 'loading' ? 'Asset' : 'Task'}
            </div>
            <div style={{ color: 'rgba(244, 242, 230, 0.8)' }}>
              {Math.round(ringProgress.inner)}%
            </div>
          </div>
        </div>
      </div>

      {/* Loading Animation */}
      <div style={{
        marginTop: '2rem',
        display: 'flex',
        gap: '0.5rem'
      }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#64ffda',
              animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite alternate`,
              opacity: 0.7
            }}
          />
        ))}
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.3; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1.2); }
          }
        `}
      </style>
    </div>
  );
};

export default LoaderV2;