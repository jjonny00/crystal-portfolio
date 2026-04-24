// src/components/ui/CrystalDebugPanels.jsx
// FIXED: Separate debug panels component that renders outside Three.js Canvas

import React from 'react';
import * as THREE from 'three';
import { facetKeys as canonicalFacetKeys } from '../../data/projects';

/**
 * FIXED: Crystal Debug Panels - Renders outside Three.js Canvas
 */
const CrystalDebugPanels = ({
  showCrystalDebug,
  animationData,
  facetKeys = canonicalFacetKeys,
  facetModels = [],
  facetRefs = { current: [] },
  showWholeCrystal,
  showFacets,
  sphereVisible,
  onForceShowFacets,
  onForceShowWhole,
  onInspectModels,
  shardTuning,
  onUpdateShardTuning,
  lastCrystalForm,
  focusedSceneFacetKey,
  focusedProjectKey,
  focusedFacetSlot
}) => {
  
  if (!showCrystalDebug) return null;

  return (
    <>
      {/* FIXED: Main Debug Panel - DOM based, stays fixed */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.95)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 20000, // Very high z-index
        pointerEvents: 'auto', // FIXED: Enable interactions
        width: '500px', // FIXED: Doubled width
        maxHeight: '60vh',
        overflowY: 'auto',
        border: '1px solid rgba(100, 255, 218, 0.3)'
      }}>
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: '15px',
          color: '#64ffda',
          borderBottom: '1px solid rgba(100, 255, 218, 0.3)',
          paddingBottom: '10px',
          fontSize: '14px'
        }}>
          💎 Crystal Debug (Press 'C' to toggle)
        </div>

        {/* Shard Controls */}
        {shardTuning && onUpdateShardTuning && (
          <div style={{
            marginBottom: '15px',
            borderTop: '1px solid rgba(100, 255, 218, 0.3)',
            paddingTop: '10px'
          }}>
            <div style={{ color: '#64ffda', fontWeight: 'bold', marginBottom: '8px' }}>🪨 Shard Controls:</div>
            {[
              { key: 'spreadMultiplier', label: 'Spread', min: 0.2, max: 4, step: 0.05 },
              { key: 'largeDistanceCenter', label: 'Large Dist', min: 0.5, max: 1, step: 0.01 },
              { key: 'mediumDistanceCenter', label: 'Medium Dist', min: 0.2, max: 0.9, step: 0.01 },
              { key: 'smallDistanceCenter', label: 'Small Dist', min: 0.05, max: 0.7, step: 0.01 },
              { key: 'distanceJitter', label: 'Dist Jitter', min: 0, max: 0.3, step: 0.01 },
              { key: 'opacityMultiplier', label: 'Opacity', min: 0.1, max: 1, step: 0.01 }
            ].map(({ key, label, min, max, step }) => (
              <label key={key} style={{ display: 'block', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>{label}</span>
                  <span>{Number(shardTuning[key]).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={shardTuning[key]}
                  onChange={(event) => onUpdateShardTuning({ [key]: Number(event.target.value) })}
                  style={{ width: '100%' }}
                />
              </label>
            ))}
          </div>
        )}
        
        {/* Crystal State */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ color: '#bb86fc', fontWeight: 'bold', marginBottom: '5px' }}>Crystal State:</div>
          <div>State: {animationData?.state || 'undefined'}</div>
          <div>Form: {animationData?.crystalForm || 'undefined'}</div>
          <div style={{ color: showWholeCrystal ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
            Show Whole: {showWholeCrystal ? 'YES' : 'NO'}
          </div>
          <div style={{ color: showFacets ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
            Show Facets: {showFacets ? 'YES' : 'NO'}
          </div>
          <div>Focused Facet Slot (A-F): {focusedFacetSlot || 'none'}</div>
          <div>Focused Project: {focusedProjectKey || animationData?.focusedProject || 'none'}</div>
          <div>Focused Scene Facet (internal): {focusedSceneFacetKey || animationData?.focusedFacet || 'none'}</div>
          <div>Camera State: {animationData?.cameraState || 'undefined'}</div>
        </div>

        {/* FIXED: Force Controls - Guaranteed to work */}
        <div style={{ 
          marginBottom: '15px',
          borderTop: '1px solid rgba(100, 255, 218, 0.3)',
          paddingTop: '10px'
        }}>
          <div style={{ color: '#ffd600', fontWeight: 'bold', marginBottom: '8px' }}>🔧 Force Controls:</div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button 
              onClick={() => {
                if (import.meta.env.DEV) console.log('🔥 FORCING FACETS VISIBLE');
                if (onForceShowFacets) onForceShowFacets();
              }}
              style={{
                background: '#ff6600',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                flex: 1
              }}
            >
              SHOW FACETS
            </button>
            
            <button 
              onClick={() => {
                if (import.meta.env.DEV) console.log('🔄 RESETTING TO WHOLE');
                if (onForceShowWhole) onForceShowWhole();
              }}
              style={{
                background: '#0066ff',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                flex: 1
              }}
            >
              SHOW WHOLE
            </button>
          </div>
          
          <button 
            onClick={() => {
              if (import.meta.env.DEV) console.log('🔍 MANUAL FACET INSPECTION');
              if (onInspectModels) onInspectModels();
            }}
            style={{
              background: '#9900ff',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            INSPECT MODELS (Check Console)
          </button>
        </div>

        {/* Anchor Status */}
        {showFacets && (
          <div style={{ 
            marginBottom: '15px',
            borderTop: '1px solid rgba(100, 255, 218, 0.3)',
            paddingTop: '10px'
          }}>
            <div style={{ color: '#64ffda', fontWeight: 'bold', marginBottom: '8px' }}>🎯 Anchor Status:</div>
            {facetKeys.map((facetKey, index) => {
              const facetRef = facetRefs.current?.[index];
              let status = 'No Ref';
              let position = null;
              
              if (facetRef?.current) {
                const anchor = facetRef.current.getObjectByName(`anchor_${facetKey}`);
                if (anchor) {
                  status = '✅ Found';
                  const worldPos = new THREE.Vector3();
                  anchor.getWorldPosition(worldPos);
                  position = worldPos.toArray().map(v => v.toFixed(2));
                } else {
                  status = '❌ Missing';
                }
              }
              
              return (
                <div key={facetKey} style={{ 
                  fontSize: '11px', 
                  marginBottom: '4px',
                  color: status.includes('✅') ? '#4CAF50' : '#F44336'
                }}>
                  {facetKey}: {status}
                  {position && ` [${position.join(', ')}]`}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FIXED: Diagnostic Panel - DOM based, stays fixed */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(255, 0, 0, 0.95)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 20001, // Higher than main panel
        pointerEvents: 'auto', // FIXED: Enable interactions
        width: '500px', // FIXED: Doubled width
        maxHeight: '80vh',
        overflowY: 'auto',
        border: '2px solid #ff0000'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#ffff00' }}>
          🔍 FACET LOADING DIAGNOSTIC
        </div>
        
        {/* Critical Status */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ 
            background: showFacets ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
            padding: '8px',
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            <strong>showFacets:</strong> 
            <span style={{ color: showFacets ? '#00ff00' : '#ff0000', fontWeight: 'bold' }}>
              {showFacets ? ' TRUE ✅' : ' FALSE ❌'}
            </span>
            {!showFacets && <div style={{ color: '#ffff00', fontSize: '11px', marginTop: '5px' }}>
              ⚠️ This is why anchors show "Not Loaded" - facets aren't rendering!
            </div>}
          </div>
          
          <div>Crystal Form: <strong>{animationData?.crystalForm || 'undefined'}</strong></div>
          <div>Animation State: <strong>{animationData?.state || 'undefined'}</strong></div>
          <div>Scroll Progress: <strong>{(animationData?.scrollProgress * 100)?.toFixed(1) || 0}%</strong></div>
        </div>
        
        {/* Model Loading Status */}
        <div style={{ marginBottom: '15px' }}>
          <strong>Model Loading Status:</strong>
          <div style={{ marginLeft: '10px', fontSize: '11px', marginTop: '5px' }}>
            {facetKeys.map((facetKey, index) => {
              const model = facetModels[index];
              const hasScene = model?.scene;
              const childCount = hasScene ? model.scene.children.length : 0;
              
              return (
                <div key={facetKey} style={{ 
                  color: hasScene ? '#00ff00' : '#ff0000',
                  marginBottom: '3px'
                }}>
                  {facetKey}: {hasScene ? `✅ Loaded (${childCount} objects)` : '❌ Failed'}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Ref Status */}
        <div style={{ marginBottom: '15px' }}>
          <strong>Facet Refs:</strong>
          <div style={{ marginLeft: '10px', fontSize: '11px', marginTop: '5px' }}>
            {facetRefs.current?.map((ref, index) => (
              <div key={index} style={{ 
                color: ref ? '#00ff00' : '#ff0000',
                marginBottom: '2px'
              }}>
                [{index}] {facetKeys[index]}: {ref ? '✅ Active' : '❌ Null'}
              </div>
            )) || <div style={{ color: '#ff0000' }}>❌ Refs array is null</div>}
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          background: 'rgba(255, 255, 0, 0.2)',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '11px',
          marginTop: '15px'
        }}>
          <div style={{ color: '#ffff00', fontWeight: 'bold', marginBottom: '5px' }}>Quick Fix:</div>
          <div>1. Click "SHOW FACETS" in the other panel</div>
          <div>2. Check if anchors appear in the 3D scene</div>
          <div>3. Use "INSPECT MODELS" to see what's in the GLB files</div>
        </div>
      </div>
    </>
  );
};

export default CrystalDebugPanels;
