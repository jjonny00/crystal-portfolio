// src/components/ui/PerformanceDebugPanel.jsx
// UPDATED: Debug panel reflecting the fixed performance system

import React, { useRef } from 'react';

const PERFORMANCE_STORAGE_KEY = 'crystal-performance-config';

const PerformanceDebugPanel = ({
  performanceConfig,
  hasInitialized,
  initialProfileApplied
}) => {
  if (!import.meta.env.DEV && !window.__PERF_DEBUG__) return null;

  const fileInputRef = useRef(null);

  const exportProfile = () => {
    try {
      const key = PERFORMANCE_STORAGE_KEY;
      const stored = localStorage.getItem(key);
      if (stored) {
        const blob = new Blob([stored], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'profile.json';
        a.click();
        URL.revokeObjectURL(url);
      }
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
        JSON.parse(text);
        const key = PERFORMANCE_STORAGE_KEY;
        localStorage.setItem(key, text);
        window.location.reload();
      } catch (err) {
        console.error('Import failed', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 128, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 20000,
      maxWidth: '900px',
      pointerEvents: 'auto'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#ffff00' }}>
        🔧 FIXED PERFORMANCE SYSTEM (Press F12 for console)
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>

        
        <div>
          <div style={{ color: '#ffd600', fontWeight: 'bold' }}>Active Config:</div>
          <div style={{ color: performanceConfig?.usePBR ? '#4CAF50' : '#F44336' }}>
            PBR: {performanceConfig?.usePBR ? 'YES' : 'NO'}
          </div>
          <div>Material: {performanceConfig?.pbrQuality}</div>
          <div style={{ color: performanceConfig?.useNormalMaps ? '#4CAF50' : '#F44336' }}>
            Normal Maps: {performanceConfig?.useNormalMaps ? 'YES' : 'NO'}
          </div>
          <div>Texture Quality: {performanceConfig?.textureQuality}</div>
          <div>Render Scale: {performanceConfig?.renderScale}</div>
        </div>
      </div>
      
      <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '10px' }}>
        <div style={{ color: '#64ffda', fontWeight: 'bold' }}>System Status:</div>
        <div>Has Initialized: {hasInitialized ? '✅' : '❌'}</div>
        <div>Profile Applied: {initialProfileApplied ? '✅' : '❌'}</div>
      </div>

      <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
        <button onClick={exportProfile} style={{ pointerEvents: 'auto', padding: '6px 8px', fontSize: '11px' }}>
          Export Profile
        </button>
        <button onClick={() => fileInputRef.current?.click()} style={{ pointerEvents: 'auto', padding: '6px 8px', fontSize: '11px' }}>
          Import Profile
        </button>
        <input type="file" accept="application/json" ref={fileInputRef} onChange={importProfile} style={{ display: 'none' }} />
      </div>

      <div style={{
        marginTop: '10px',
        padding: '10px',
        background: 'rgba(76, 175, 80, 0.8)',
        borderRadius: '4px',
        border: '2px solid #4CAF50'
      }}>
        <div style={{ fontWeight: 'bold', color: '#000' }}>✅ PERFORMANCE SYSTEM FIXED!</div>
        <div style={{ color: '#000', fontSize: '10px', marginTop: '5px' }}>
          • Bypass logic removed - no more forced downgrades
        </div>
        <div style={{ color: '#000', fontSize: '10px' }}>
          • Performance test only adjusts for FPS &lt; 30
        </div>
        <div style={{ color: '#000', fontSize: '10px' }}>
          • High-end devices keep high settings unless actually struggling
        </div>
        <div style={{ color: '#000', fontSize: '10px' }}>
          • Asset loading works independently of performance test
        </div>
      </div>
    </div>
  );
};

export default PerformanceDebugPanel;