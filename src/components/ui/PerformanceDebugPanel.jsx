// src/components/ui/PerformanceDebugPanel.jsx
// UPDATED: Debug panel reflecting the fixed performance system

import React from 'react';

const PerformanceDebugPanel = ({ 
  deviceProfile,
  performanceConfig,
  devicePerformanceProfile,
  initialPerformanceConfig,
  hasInitialized,
  initialProfileApplied
}) => {
  if (!import.meta.env.DEV) return null;

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
      pointerEvents: 'none'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#ffff00' }}>
        🔧 FIXED PERFORMANCE SYSTEM (Press F12 for console)
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
        <div>
          <div style={{ color: '#64ffda', fontWeight: 'bold' }}>Device Detection:</div>
          <div>Category: {deviceProfile?.category}</div>
          <div>Tier: {deviceProfile?.performanceTier}</div>
          <div>Is Mobile: {deviceProfile?.isMobile ? 'YES' : 'NO'}</div>
          <div>Is iPad: {deviceProfile?.isIPad ? 'YES' : 'NO'}</div>
        </div>
        
        <div>
          <div style={{ color: '#bb86fc', fontWeight: 'bold' }}>Device Profile:</div>
          <div>Material: {devicePerformanceProfile?.pbrQuality}</div>
          <div>PBR: {devicePerformanceProfile?.usePBR ? 'YES' : 'NO'}</div>
          <div>Normal Maps: {devicePerformanceProfile?.useNormalMaps ? 'YES' : 'NO'}</div>
          <div>Texture Quality: {devicePerformanceProfile?.textureQuality}</div>
          <div>Render Scale: {devicePerformanceProfile?.renderScale}</div>
        </div>
        
        <div>
          <div style={{ color: '#03dac6', fontWeight: 'bold' }}>Performance Test:</div>
          <div style={{ color: initialPerformanceConfig ? '#4CAF50' : '#FF9800' }}>
            Completed: {initialPerformanceConfig ? 'YES' : 'RUNNING'}
          </div>
          {initialPerformanceConfig && (
            <>
              <div>Material: {initialPerformanceConfig.pbrQuality}</div>
              <div>PBR: {initialPerformanceConfig.usePBR ? 'YES' : 'NO'}</div>
              <div>Normal Maps: {initialPerformanceConfig.useNormalMaps ? 'YES' : 'NO'}</div>
              <div>Texture: {initialPerformanceConfig.textureQuality}</div>
              <div>Render Scale: {initialPerformanceConfig.renderScale}</div>
            </>
          )}
        </div>
        
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
        <div>Performance Test: {initialPerformanceConfig ? '✅ Completed' : '⏳ Running'}</div>
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