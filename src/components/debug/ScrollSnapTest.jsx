// src/components/debug/ScrollSnapTest.jsx
// Simple test component to verify scroll snapping is working

import React from 'react';

const ScrollSnapTest = ({ enabled = false }) => {
  if (!enabled) return null;
  
  const testSections = [
    { id: 'test-1', color: '#ff6b6b', title: 'Section 1' },
    { id: 'test-2', color: '#4ecdc4', title: 'Section 2' },
    { id: 'test-3', color: '#45b7d1', title: 'Section 3' },
    { id: 'test-4', color: '#f9ca24', title: 'Section 4' },
    { id: 'test-5', color: '#f0932b', title: 'Section 5' }
  ];
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      backgroundColor: 'white'
    }}>
      {/* Test scroll container */}
      <div style={{
        height: '100vh',
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'smooth'
      }}>
        {testSections.map((section) => (
          <div
            key={section.id}
            id={section.id}
            style={{
              height: '100vh',
              backgroundColor: section.color,
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '4rem',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            {section.title}
          </div>
        ))}
      </div>
      
      {/* Test controls */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        fontFamily: 'monospace'
      }}>
        <h3>Scroll Snap Test</h3>
        <p>Try scrolling - sections should snap into place</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            background: '#ff6b6b',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Exit Test
        </button>
      </div>
    </div>
  );
};

// Usage function you can call from console
window.testScrollSnap = () => {
  const testContainer = document.createElement('div');
  testContainer.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 99999;
      background: white;
    ">
      <div style="
        height: 100vh;
        overflow-y: auto;
        scroll-snap-type: y mandatory;
        scroll-behavior: smooth;
      ">
        <div style="height: 100vh; background: #ff6b6b; scroll-snap-align: start; display: flex; align-items: center; justify-content: center; font-size: 4rem; color: white;">Section 1</div>
        <div style="height: 100vh; background: #4ecdc4; scroll-snap-align: start; display: flex; align-items: center; justify-content: center; font-size: 4rem; color: white;">Section 2</div>
        <div style="height: 100vh; background: #45b7d1; scroll-snap-align: start; display: flex; align-items: center; justify-content: center; font-size: 4rem; color: white;">Section 3</div>
        <div style="height: 100vh; background: #f9ca24; scroll-snap-align: start; display: flex; align-items: center; justify-content: center; font-size: 4rem; color: white;">Section 4</div>
        <div style="height: 100vh; background: #f0932b; scroll-snap-align: start; display: flex; align-items: center; justify-content: center; font-size: 4rem; color: white;">Section 5</div>
      </div>
      <button onclick="this.parentElement.remove()" style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b6b;
        color: white;
        border: none;
        padding: 15px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        z-index: 100000;
      ">Close Test</button>
    </div>
  `;
  
  document.body.appendChild(testContainer);
};

console.log('🧪 Scroll snap test available! Run window.testScrollSnap() to test scroll snapping.');

export default ScrollSnapTest;