// src/components/ui/PerformanceDebugPanel.jsx
// TEMPORARY: Debug component to see what's happening with performance configs

import React from 'react';

const PerformanceDebugPanel = ({ 
  deviceProfile,
  performanceConfig,
  devicePerformanceProfile,
  initialPerformanceConfig,
  hasInitialized,
  initialProfileApplied
}) => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(255, 0, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 20000,
      maxWidth: '800px',
      pointerEvents: 'none'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#ffff00' }}>
        🐛 PERFORMANCE CONFIG DEBUG (Press F12 to see console)
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
        <div>
          <div style={{ color: '#64ffda', fontWeight: 'bold' }}>Device Detection:</div>
          <div>Category: {deviceProfile?.category}</div>
          <div>Tier: {deviceProfile?.performanceTier}</div>
          <div>Is Mobile: {deviceProfile?.isMobile ? 'YES' : 'NO'}</div>
        </div>
        
        <div>
          <div style={{ color: '#bb86fc', fontWeight: 'bold' }}>Profile Config:</div>
          <div>PBR: {devicePerformanceProfile?.usePBR ? 'YES' : 'NO'}</div>
          <div>Normal Maps: {devicePerformanceProfile?.useNormalMaps ? 'YES' : 'NO'}</div>
          <div>Texture Quality: {devicePerformanceProfile?.textureQuality}</div>
          <div>Render Scale: {devicePerformanceProfile?.renderScale}</div>
        </div>
        
        <div>
          <div style={{ color: '#03dac6', fontWeight: 'bold' }}>Active Config:</div>
          <div style={{ color: performanceConfig?.usePBR ? '#4CAF50' : '#F44336' }}>
            PBR: {performanceConfig?.usePBR ? 'YES' : 'NO'}
          </div>
          <div style={{ color: performanceConfig?.useNormalMaps ? '#4CAF50' : '#F44336' }}>
            Normal Maps: {performanceConfig?.useNormalMaps ? 'YES' : 'NO'}
          </div>
          <div>Texture Quality: {performanceConfig?.textureQuality}</div>
          <div>Render Scale: {performanceConfig?.renderScale}</div>
        </div>
      </div>
      
      <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '10px' }}>
        <div style={{ color: '#ffd600', fontWeight: 'bold' }}>Initialization Status:</div>
        <div>Has Initialized: {hasInitialized ? '✅' : '❌'}</div>
        <div>Profile Applied: {initialProfileApplied ? '✅' : '❌'}</div>
        <div>Initial Config Available: {initialPerformanceConfig ? '✅' : '❌'}</div>
      </div>
      
      {deviceProfile?.performanceTier === 'high' && !performanceConfig?.usePBR && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          background: 'rgba(244, 67, 54, 0.8)',
          borderRadius: '4px',
          border: '2px solid #F44336'
        }}>
          <div style={{ fontWeight: 'bold', color: '#ffff00' }}>⚠️ PERFORMANCE MISMATCH DETECTED!</div>
          <div>Your gaming PC was detected as HIGH tier but PBR is disabled.</div>
          <div>Check console logs for initialization flow issues.</div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDebugPanel;