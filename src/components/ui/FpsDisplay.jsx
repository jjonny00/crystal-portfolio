// src/components/ui/FpsDisplay.jsx
// Simple FPS monitoring and display component

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * FPS Monitor Hook for Canvas components
 * Calculates and tracks frame rate using useFrame
 */
export const useFPSMonitor = (sampleSize = 60) => {
  const [fps, setFPS] = useState(0);
  const [avgFps, setAvgFps] = useState(0);
  const [minFps, setMinFps] = useState(0);
  const [maxFps, setMaxFps] = useState(0);
  
  const frameTimesRef = useRef([]);
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  
  useFrame(() => {
    const now = performance.now();
    const delta = now - lastTimeRef.current;
    
    if (delta > 0) {
      const currentFPS = 1000 / delta;
      
      // Add to sample array
      frameTimesRef.current.push(currentFPS);
      
      // Keep only recent samples
      if (frameTimesRef.current.length > sampleSize) {
        frameTimesRef.current.shift();
      }
      
      // Update every 10 frames to avoid too frequent updates
      frameCountRef.current++;
      if (frameCountRef.current % 10 === 0) {
        const samples = frameTimesRef.current;
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
        const min = Math.min(...samples);
        const max = Math.max(...samples);
        
        setFPS(Math.round(currentFPS));
        setAvgFps(Math.round(avg));
        setMinFps(Math.round(min));
        setMaxFps(Math.round(max));
      }
    }
    
    lastTimeRef.current = now;
  });
  
  return { fps, avgFps, minFps, maxFps };
};

/**
 * FPS Monitor Hook for DOM components (outside Canvas)
 * Uses requestAnimationFrame instead of useFrame
 */
export const useFPSMonitorDOM = (sampleSize = 60) => {
  const [fps, setFPS] = useState(0);
  const [avgFps, setAvgFps] = useState(0);
  const [minFps, setMinFps] = useState(0);
  const [maxFps, setMaxFps] = useState(0);
  
  const frameTimesRef = useRef([]);
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const rafIdRef = useRef(null);
  
  const updateFPS = useCallback(() => {
    const now = performance.now();
    const delta = now - lastTimeRef.current;
    
    if (delta > 0) {
      const currentFPS = 1000 / delta;
      
      // Add to sample array
      frameTimesRef.current.push(currentFPS);
      
      // Keep only recent samples
      if (frameTimesRef.current.length > sampleSize) {
        frameTimesRef.current.shift();
      }
      
      // Update every 10 frames to avoid too frequent updates
      frameCountRef.current++;
      if (frameCountRef.current % 10 === 0) {
        const samples = frameTimesRef.current;
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
        const min = Math.min(...samples);
        const max = Math.max(...samples);
        
        setFPS(Math.round(currentFPS));
        setAvgFps(Math.round(avg));
        setMinFps(Math.round(min));
        setMaxFps(Math.round(max));
      }
    }
    
    lastTimeRef.current = now;
    rafIdRef.current = requestAnimationFrame(updateFPS);
  }, [sampleSize]);
  
  useEffect(() => {
    rafIdRef.current = requestAnimationFrame(updateFPS);
    
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [updateFPS]);
  
  return { fps, avgFps, minFps, maxFps };
};

/**
 * Performance Level Indicator
 * Shows color-coded performance status
 */
const getPerformanceLevel = (fps) => {
  if (fps >= 55) return { level: 'excellent', color: '#4CAF50' };
  if (fps >= 45) return { level: 'good', color: '#8BC34A' };
  if (fps >= 30) return { level: 'fair', color: '#FFC107' };
  if (fps >= 20) return { level: 'poor', color: '#FF9800' };
  return { level: 'critical', color: '#F44336' };
};

/**
 * FPS Display Component
 * Shows current frame rate and performance metrics
 */
const FpsDisplay = ({ 
  visible = true,
  position = 'top-left',
  showDetails = false,
  style = {}
}) => {
  const { fps, avgFps, minFps, maxFps } = useFPSMonitorDOM(); // Use DOM version
  const [showExtended, setShowExtended] = useState(showDetails);
  
  // Don't render if not visible
  if (!visible) return null;
  
  const performance = getPerformanceLevel(fps);
  
  // Position styles
  const positionStyles = {
    'top-left': { top: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'bottom-right': { bottom: '20px', right: '20px' }
  };
  
  const containerStyle = {
    position: 'fixed',
    zIndex: 10000,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: showExtended ? '12px 16px' : '8px 12px',
    borderRadius: '8px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", monospace',
    fontSize: '14px',
    backdropFilter: 'blur(5px)',
    border: `2px solid ${performance.color}`,
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'all 0.2s ease',
    ...positionStyles[position],
    ...style
  };
  
  const handleClick = () => {
    setShowExtended(!showExtended);
  };
  
  return (
    <div style={containerStyle} onClick={handleClick}>
      {/* Main FPS Display */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        marginBottom: showExtended ? '8px' : '0'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: performance.color,
          animation: fps > 0 ? 'pulse 1s infinite' : 'none'
        }} />
        <span style={{ 
          fontWeight: 'bold', 
          color: performance.color,
          minWidth: '40px' 
        }}>
          {fps} FPS
        </span>
      </div>
      
      {/* Extended Details */}
      {showExtended && (
        <div style={{ 
          fontSize: '12px', 
          opacity: 0.9,
          lineHeight: '1.4'
        }}>
          <div>Avg: {avgFps} fps</div>
          <div>Min: {minFps} fps</div>
          <div>Max: {maxFps} fps</div>
          <div style={{ 
            marginTop: '4px', 
            fontSize: '10px', 
            opacity: 0.7 
          }}>
            Status: {performance.level}
          </div>
        </div>
      )}
      
      {/* Click hint */}
      {!showExtended && (
        <div style={{ 
          fontSize: '10px', 
          opacity: 0.5, 
          marginTop: '2px' 
        }}>
          Click for details
        </div>
      )}
      
      {/* CSS Animation */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

/**
 * Simple FPS Counter for Three.js scenes
 * Use this inside your Canvas component
 */
export const FPSCounter = () => {
  const { fps } = useFPSMonitor();
  
  // This component doesn't render anything visible in the 3D scene
  // It just provides FPS data to the parent
  useEffect(() => {
    // You could dispatch FPS data to a global state here if needed
    // For now, we'll just log performance warnings
    if (fps > 0 && fps < 20) {
      console.warn(`⚠️ Low FPS detected: ${fps}fps`);
    }
  }, [fps]);
  
  return null;
};

/**
 * Performance Alert Component
 * Shows warnings when performance drops
 */
export const PerformanceAlert = ({ 
  visible = true,
  threshold = 25,
  onPerformanceIssue
}) => {
  const { fps, avgFps } = useFPSMonitorDOM(); // Use DOM version
  const [showAlert, setShowAlert] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  
  useEffect(() => {
    if (fps > 0 && avgFps < threshold) {
      setShowAlert(true);
      setAlertCount(prev => prev + 1);
      
      if (onPerformanceIssue) {
        onPerformanceIssue({ fps, avgFps, alertCount });
      }
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [fps, avgFps, threshold, onPerformanceIssue, alertCount]);
  
  if (!visible || !showAlert) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(244, 67, 54, 0.9)',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '8px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      zIndex: 10001,
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        ⚠️ Performance Issue Detected
      </div>
      <div style={{ fontSize: '12px', opacity: 0.9 }}>
        Frame rate dropped to {avgFps}fps. Consider reducing quality settings.
      </div>
      <button
        onClick={() => setShowAlert(false)}
        style={{
          marginTop: '12px',
          padding: '6px 12px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '4px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Dismiss
      </button>
    </div>
  );
};

/**
 * Performance Summary Component
 * Shows a summary of performance over time
 */
export const PerformanceSummary = ({ visible = true }) => {
  const { fps, avgFps, minFps, maxFps } = useFPSMonitorDOM(); // Use DOM version
  const [sessionStats, setSessionStats] = useState({
    startTime: Date.now(),
    totalFrames: 0,
    lowFpsEvents: 0
  });
  
  useEffect(() => {
    if (fps > 0) {
      setSessionStats(prev => ({
        ...prev,
        totalFrames: prev.totalFrames + 1,
        lowFpsEvents: fps < 30 ? prev.lowFpsEvents + 1 : prev.lowFpsEvents
      }));
    }
  }, [fps]);
  
  if (!visible) return null;
  
  const sessionTime = Math.round((Date.now() - sessionStats.startTime) / 1000);
  const avgSessionFps = sessionStats.totalFrames / sessionTime;
  const performanceScore = Math.round((avgFps / 60) * 100);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", monospace',
      fontSize: '11px',
      zIndex: 10000,
      minWidth: '200px',
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        Performance Summary
      </div>
      <div>Session: {sessionTime}s</div>
      <div>Current: {fps} fps</div>
      <div>Average: {avgFps} fps</div>
      <div>Range: {minFps}-{maxFps} fps</div>
      <div>Score: {performanceScore}%</div>
      <div>Low FPS Events: {sessionStats.lowFpsEvents}</div>
    </div>
  );
};

export default FpsDisplay;