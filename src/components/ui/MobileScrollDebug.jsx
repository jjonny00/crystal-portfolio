// Mobile Scroll Debug Component - Add this temporarily to diagnose the issue

import { useState, useEffect } from 'react';

const MobileScrollDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  
  useEffect(() => {
    const updateDebugInfo = () => {
      const info = {
        // Window dimensions
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        
        // Document dimensions
        documentHeight: document.documentElement.scrollHeight,
        bodyHeight: document.body.scrollHeight,
        
        // Scroll position
        scrollTop: window.pageYOffset || document.documentElement.scrollTop,
        
        // Computed styles that might block scroll
        bodyOverflow: getComputedStyle(document.body).overflow,
        bodyOverflowY: getComputedStyle(document.body).overflowY,
        htmlOverflow: getComputedStyle(document.documentElement).overflow,
        htmlOverflowY: getComputedStyle(document.documentElement).overflowY,
        
        // Touch properties
        touchAction: getComputedStyle(document.body).touchAction,
        webkitOverflowScrolling: getComputedStyle(document.body).webkitOverflowScrolling,
        
        // Device info
        userAgent: navigator.userAgent.substring(0, 50) + '...',
        maxTouchPoints: navigator.maxTouchPoints,
        
        // Check if scroll is possible
        canScroll: document.documentElement.scrollHeight > window.innerHeight,
        scrollableAmount: document.documentElement.scrollHeight - window.innerHeight
      };
      
      setDebugInfo(info);
    };
    
    // Update on scroll and resize
    updateDebugInfo();
    window.addEventListener('scroll', updateDebugInfo);
    window.addEventListener('resize', updateDebugInfo);
    
    // Also update periodically in case something changes
    const interval = setInterval(updateDebugInfo, 1000);
    
    return () => {
      window.removeEventListener('scroll', updateDebugInfo);
      window.removeEventListener('resize', updateDebugInfo);
      clearInterval(interval);
    };
  }, []);
  
  const testScroll = () => {
    console.log('🧪 Testing programmatic scroll...');
    window.scrollTo({
      top: 100,
      behavior: 'smooth'
    });
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.95)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 10000,
      maxHeight: '90vh',
      overflowY: 'auto',
      border: '2px solid #ff6b6b'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#ff6b6b' }}>
        🚨 MOBILE SCROLL DEBUG
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '10px' }}>
        <div>
          <div><strong>Window:</strong> {debugInfo.windowWidth}x{debugInfo.windowHeight}</div>
          <div><strong>Doc Height:</strong> {debugInfo.documentHeight}px</div>
          <div><strong>Body Height:</strong> {debugInfo.bodyHeight}px</div>
          <div><strong>Scroll Top:</strong> {debugInfo.scrollTop}px</div>
          <div><strong>Can Scroll:</strong> {debugInfo.canScroll ? '✅ YES' : '❌ NO'}</div>
          <div><strong>Scrollable:</strong> {debugInfo.scrollableAmount}px</div>
        </div>
        
        <div>
          <div><strong>Body Overflow:</strong> {debugInfo.bodyOverflow}</div>
          <div><strong>Body OverflowY:</strong> {debugInfo.bodyOverflowY}</div>
          <div><strong>HTML Overflow:</strong> {debugInfo.htmlOverflow}</div>
          <div><strong>HTML OverflowY:</strong> {debugInfo.htmlOverflowY}</div>
          <div><strong>Touch Action:</strong> {debugInfo.touchAction}</div>
          <div><strong>Touch Points:</strong> {debugInfo.maxTouchPoints}</div>
        </div>
      </div>
      
      <div style={{ marginTop: '10px' }}>
        <button 
          onClick={testScroll}
          style={{
            background: '#64ffda',
            color: '#000',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Test Scroll
        </button>
        
        <button 
          onClick={() => {
            console.log('📋 Debug Info:', debugInfo);
            // Copy to clipboard if available
            if (navigator.clipboard) {
              navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
            }
          }}
          style={{
            background: '#bb86fc',
            color: '#000',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Log Debug Info
        </button>
      </div>
      
      <div style={{ marginTop: '10px', fontSize: '9px', opacity: 0.7 }}>
        Try scrolling - if numbers don't change, scroll is blocked
      </div>
    </div>
  );
};

export default MobileScrollDebug;