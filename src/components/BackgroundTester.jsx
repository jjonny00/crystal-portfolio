// TEST COMPONENT: BackgroundTester.jsx
// Create this as a temporary component to test if the background system works at all

import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import GradientBackground from '../components/three/GradientBackground';
import { projectBackgrounds } from '../data/projectBackgrounds';

const BackgroundTester = () => {
  const backgroundRef = useRef();
  const [currentKey, setCurrentKey] = useState('default');
  const [testMode, setTestMode] = useState(false);

  // Auto-cycle through backgrounds for testing
  useEffect(() => {
    if (!testMode) return;
    
    const keys = Object.keys(projectBackgrounds);
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % keys.length;
      const nextKey = keys[currentIndex];
      setCurrentKey(nextKey);
      backgroundRef.current?.updateBackground(nextKey);
      console.log(`🎨 Test: Updated background to ${nextKey}`);
    }, 2000); // Change every 2 seconds
    
    return () => clearInterval(interval);
  }, [testMode]);

  // Manual controls
  const handleManualUpdate = (key) => {
    setCurrentKey(key);
    backgroundRef.current?.updateBackground(key);
    console.log(`🎨 Manual: Updated background to ${key}`);
  };

  const toggleAutoTest = () => {
    setTestMode(!testMode);
    console.log(`🎨 Auto-test: ${!testMode ? 'ON' : 'OFF'}`);
  };

  const keys = Object.keys(projectBackgrounds);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1 }}>
      {/* 3D Background */}
      <Canvas camera={{ position: [0, 0, 5] }}>
        <GradientBackground 
          ref={backgroundRef} 
          backgrounds={projectBackgrounds} 
          initialKey="default"
        />
      </Canvas>

      {/* Test Controls */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 10000
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>🎨 Background Tester</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>Current: {currentKey}</strong>
        </div>

        <button 
          onClick={toggleAutoTest}
          style={{
            background: testMode ? '#ff4444' : '#44ff44',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '15px',
            width: '100%'
          }}
        >
          {testMode ? 'Stop Auto-Test' : 'Start Auto-Test'}
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {keys.map(key => (
            <button
              key={key}
              onClick={() => handleManualUpdate(key)}
              style={{
                background: currentKey === key ? '#0066ff' : '#333',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {key}
            </button>
          ))}
        </div>

        <div style={{ 
          marginTop: '15px', 
          fontSize: '12px', 
          opacity: 0.7,
          lineHeight: '1.4'
        }}>
          <div>• Auto-test cycles every 2s</div>
          <div>• Manual buttons override auto-test</div>
          <div>• Check console for update logs</div>
          <div>• Colors should be very distinct</div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundTester;