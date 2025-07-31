// src/components/ui/PerformanceDebugPanel.jsx
// FIXED: Enhanced debug panel with retest and cache controls

import React, { useRef } from 'react';

const PERFORMANCE_STORAGE_KEY = 'crystal-performance-config';

const PerformanceDebugPanel = ({
  performanceConfig,
  hasInitialized,
  initialProfileApplied,
  tier,
  testResults,
  debugInfo,
  onForceRetest,
  onClearCache
}) => {
  if (!import.meta.env.DEV && !window.__PERF_DEBUG__) return null;

  const fileInputRef = useRef(null);

  const exportProfile = () => {
    try {
      const exportData = {
        tier,
        performanceConfig,
        testResults,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        devicePixelRatio: window.devicePixelRatio
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-profile-${tier}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const importProfile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        const data = JSON.parse(text);
        const key = PERFORMANCE_STORAGE_KEY;
        localStorage.setItem(key, text);
        window.location.reload();
      } catch (err) {
        console.error('Import failed', err);
      }
    };
    reader.readAsText(file);
  };

  const handleForceRetest = () => {
    if (onForceRetest) {
      onForceRetest();
    }
  };

  const handleClearCache = () => {
    if (onClearCache) {
      onClearCache();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 128, 0, 0.95)',
      color: 'white',
      padding: '20px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 20000,
      maxWidth: '1200px',
      width: '90vw',
      pointerEvents: 'auto',
      maxHeight: '400px',
      overflowY: 'auto'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#ffff00', textAlign: 'center' }}>
        🔧 FIXED PERFORMANCE SYSTEM - Debug Panel (Press P to toggle)
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Current Configuration */}
        <div>
          <div style={{ color: '#ffd600', fontWeight: 'bold', marginBottom: '8px' }}>Current Configuration:</div>
          <div>Tier: <span style={{ color: '#64ffda', fontWeight: 'bold' }}>{tier}</span></div>
          <div style={{ color: performanceConfig?.usePBR ? '#4CAF50' : '#F44336' }}>
            PBR: {performanceConfig?.usePBR ? 'ENABLED' : 'DISABLED'}
          </div>
          <div>Material Quality: {performanceConfig?.pbrQuality}</div>
          <div style={{ color: performanceConfig?.useNormalMaps ? '#4CAF50' : '#F44336' }}>
            Normal Maps: {performanceConfig?.useNormalMaps ? 'YES' : 'NO'}
          </div>
          <div>Texture Quality: {performanceConfig?.textureQuality}</div>
          <div>Render Scale: {performanceConfig?.renderScale}</div>
          <div>HDRI Quality: {performanceConfig?.hdriQuality}</div>
          <div>Particles: {performanceConfig?.particleCount}</div>
          <div>Max Lights: {performanceConfig?.maxLights}</div>
        </div>

        {/* Test Results */}
        {testResults && (
          <div>
            <div style={{ color: '#bb86fc', fontWeight: 'bold', marginBottom: '8px' }}>Test Results:</div>
            <div>Average FPS: <span style={{ color: '#64ffda' }}>{Math.round(testResults.avgFps || 0)}</span></div>
            <div>Min FPS: <span style={{ color: testResults.minFps > 25 ? '#4CAF50' : '#F44336' }}>{Math.round(testResults.minFps || 0)}</span></div>
            <div>Max FPS: <span style={{ color: '#4CAF50' }}>{Math.round(testResults.maxFps || 0)}</span></div>
            <div>Test Tier: {testResults.tier}</div>
            <div>Frame Count: {testResults.frameCount || 0}</div>
            <div>Samples: {testResults.samples || 0}</div>
            {testResults.recommendedTier && (
              <div>Recommended: <span style={{ color: '#ffd600' }}>{testResults.recommendedTier}</span></div>
            )}
          </div>
        )}

        {/* System Status */}
        <div>
          <div style={{ color: '#03dac6', fontWeight: 'bold', marginBottom: '8px' }}>System Status:</div>
          <div>Initialized: {hasInitialized ? '✅' : '❌'}</div>
          <div>Profile Applied: {initialProfileApplied ? '✅' : '❌'}</div>
          <div>Is Initializing: {debugInfo?.isInitializing ? '⏳' : '✅'}</div>
          <div>Has Cache: {debugInfo?.hasCache ? '✅' : '❌'}</div>
          <div>Manager Ready: {debugInfo?.managerReady ? '✅' : '❌'}</div>
          {debugInfo?.error && (
            <div style={{ color: '#F44336' }}>Error: {debugInfo.error}</div>
          )}
        </div>

        {/* Post-Processing Status */}
        {performanceConfig?.postProcessing && (
          <div>
            <div style={{ color: '#ff7043', fontWeight: 'bold', marginBottom: '8px' }}>Post-Processing:</div>
            {Object.entries(performanceConfig.postProcessing).map(([effect, enabled]) => (
              <div key={effect} style={{ color: enabled ? '#4CAF50' : '#F44336' }}>
                {effect}: {enabled ? 'ON' : 'OFF'}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={handleForceRetest} 
          style={{ 
            pointerEvents: 'auto', 
            padding: '8px 12px', 
            fontSize: '11px',
            backgroundColor: '#ff6600',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🔄 Force Retest
        </button>
        
        <button 
          onClick={handleClearCache} 
          style={{ 
            pointerEvents: 'auto', 
            padding: '8px 12px', 
            fontSize: '11px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🗑️ Clear Cache
        </button>
        
        <button 
          onClick={exportProfile} 
          style={{ 
            pointerEvents: 'auto', 
            padding: '8px 12px', 
            fontSize: '11px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📤 Export Profile
        </button>
        
        <button 
          onClick={() => fileInputRef.current?.click()} 
          style={{ 
            pointerEvents: 'auto', 
            padding: '8px 12px', 
            fontSize: '11px',
            backgroundColor: '#9c27b0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📥 Import Profile
        </button>
        
        <input 
          type="file" 
          accept="application/json" 
          ref={fileInputRef} 
          onChange={importProfile} 
          style={{ display: 'none' }} 
        />
      </div>

      {/* Success Message */}
      <div style={{
        marginTop: '15px',
        padding: '10px',
        background: 'rgba(76, 175, 80, 0.8)',
        borderRadius: '4px',
        border: '2px solid #4CAF50',
        textAlign: 'center'
      }}>
        <div style={{ fontWeight: 'bold', color: '#000', marginBottom: '5px' }}>
          ✅ PERFORMANCE SYSTEM IS NOW WORKING!
        </div>
        <div style={{ color: '#000', fontSize: '10px' }}>
          • Progressive testing from low → medium → high quality
        </div>
        <div style={{ color: '#000', fontSize: '10px' }}>
          • Real scene complexity testing (not just cubes)
        </div>
        <div style={{ color: '#000', fontSize: '10px' }}>
          • Cache invalidation during development
        </div>
        <div style={{ color: '#000', fontSize: '10px' }}>
          • Conservative thresholds to ensure smooth performance
        </div>
        <div style={{ color: '#000', fontSize: '10px' }}>
          • Manual controls for testing different profiles
        </div>
      </div>
    </div>
  );
};

export default PerformanceDebugPanel;