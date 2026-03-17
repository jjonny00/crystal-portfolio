// src/components/ui/PerformanceControls.jsx
import { useState, useEffect } from 'react';
import styles from './performanceControlsStyles';

/**
 * UI component for controlling performance-related settings
 */
const PerformanceControls = ({
  performanceConfig,
  onConfigUpdate,
  visible = false,
  onToggleDebug,
  debugEnabled = false
}) => {
  // Performance options state
  const [useNormalMaps, setUseNormalMaps] = useState(performanceConfig?.useNormalMaps ?? true);
  const [textureQuality, setTextureQuality] = useState(performanceConfig?.textureQuality ?? 'high');
  const [pbrQuality, setPbrQuality] = useState(performanceConfig?.pbrQuality ?? 'high');
  const [renderScale, setRenderScale] = useState(performanceConfig?.renderScale ?? 1.0);
  const [simplifiedAnimations, setSimplifiedAnimations] = useState(performanceConfig?.simplifiedAnimations ?? false);
  const [enableHybridHoverConnector, setEnableHybridHoverConnector] = useState(performanceConfig?.enableHybridHoverConnector ?? false);
  
  // Update local state when config changes externally
  useEffect(() => {
    if (performanceConfig) {
      if (performanceConfig.useNormalMaps !== undefined) setUseNormalMaps(performanceConfig.useNormalMaps);
      if (performanceConfig.textureQuality !== undefined) setTextureQuality(performanceConfig.textureQuality);
      if (performanceConfig.pbrQuality !== undefined) setPbrQuality(performanceConfig.pbrQuality);
      if (performanceConfig.renderScale !== undefined) setRenderScale(performanceConfig.renderScale);
      if (performanceConfig.simplifiedAnimations !== undefined) setSimplifiedAnimations(performanceConfig.simplifiedAnimations);
      if (performanceConfig.enableHybridHoverConnector !== undefined) setEnableHybridHoverConnector(performanceConfig.enableHybridHoverConnector);
    }
  }, [performanceConfig]);

  // Handle toggle changes
  const handleNormalMapToggle = () => {
    const newValue = !useNormalMaps;
    setUseNormalMaps(newValue);
    
    if (onConfigUpdate) {
      onConfigUpdate({
        ...performanceConfig,
        useNormalMaps: newValue
      });
    }
  };

  const handleSimplifiedToggle = () => {
    const newValue = !simplifiedAnimations;
    setSimplifiedAnimations(newValue);

    if (onConfigUpdate) {
      onConfigUpdate({
        ...performanceConfig,
        simplifiedAnimations: newValue
      });
    }
  };
  

  const handleHybridConnectorToggle = () => {
    const newValue = !enableHybridHoverConnector;
    setEnableHybridHoverConnector(newValue);

    if (onConfigUpdate) {
      onConfigUpdate({
        ...performanceConfig,
        enableHybridHoverConnector: newValue,
      });
    }
  };
  const handlePbrQualityChange = (value) => {
    setPbrQuality(value);

    if (onConfigUpdate) {
      onConfigUpdate({
        ...performanceConfig,
        pbrQuality: value,
        usePBR: value !== 'low'
      });
    }
  };
  
  const handleTextureQualityChange = (value) => {
    setTextureQuality(value);

    if (onConfigUpdate) {
      onConfigUpdate({
        ...performanceConfig,
        textureQuality: value
      });
    }
  };

  const handleRenderScaleChange = (value) => {
    const numeric = parseFloat(value);
    setRenderScale(numeric);

    if (onConfigUpdate) {
      onConfigUpdate({
        ...performanceConfig,
        renderScale: numeric,
      });
    }
  };
  
  // Custom toggle switch component
    const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
      <label
        style={{
          ...styles.controlToggle,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          style={styles.toggleSwitchInput}
        />
        <span
          style={{
            ...styles.toggleSwitchTrack,
            backgroundColor: disabled
              ? "rgba(150, 150, 150, 0.2)"
              : checked
                ? "#64ffda"
                : "rgba(255, 255, 255, 0.2)",
          }}
        />
        <span
          style={{
            ...styles.toggleSwitchThumb,
            left: checked ? "22px" : "2px",
          }}
        />
      </label>
    );

  // Only render if visible
  if (!visible) return null;
  
  return (
    <div>
      <h2 style={styles.title}>
        <span role="img" aria-label="Performance" style={styles.titleIcon}>⚡</span>
        Performance Settings
      </h2>
      
      {/* Normal Map Toggle */}
      <div
        style={{
          ...styles.toggleContainer,
          backgroundColor: useNormalMaps ? 'rgba(100, 255, 218, 0.1)' : 'rgba(0, 0, 0, 0.2)'
        }}
      >
      <div style={styles.toggleLabel}>Use Normal Maps</div>
      <ToggleSwitch
        checked={useNormalMaps}
        onChange={handleNormalMapToggle}
      />
      </div>

      {/* Simplified Animations Toggle */}
      <div
        style={{
          ...styles.toggleContainer,
          backgroundColor: simplifiedAnimations ? 'rgba(100, 255, 218, 0.1)' : 'rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={styles.toggleLabel}>Simplified Animations</div>
        <ToggleSwitch
          checked={simplifiedAnimations}
          onChange={handleSimplifiedToggle}
        />
      </div>

      <div
        style={{
          ...styles.toggleContainer,
          backgroundColor: enableHybridHoverConnector ? 'rgba(100, 255, 218, 0.1)' : 'rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={styles.toggleLabel}>Hybrid Hover Connector Prototype</div>
        <ToggleSwitch
          checked={enableHybridHoverConnector}
          onChange={handleHybridConnectorToggle}
        />
      </div>

      {/* Material Quality */}
      <div style={styles.radioContainer}>
        <div style={styles.toggleLabel}>Material Quality</div>
        <div style={styles.radioGroup}>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              name="pbrQuality"
              value="low"
              checked={pbrQuality === 'low'}
              onChange={() => handlePbrQualityChange('low')}
            />
            Low (Non-PBR)
          </label>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              name="pbrQuality"
              value="medium"
              checked={pbrQuality === 'medium'}
              onChange={() => handlePbrQualityChange('medium')}
            />
            Medium
          </label>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              name="pbrQuality"
              value="high"
              checked={pbrQuality === 'high'}
              onChange={() => handlePbrQualityChange('high')}
            />
            High
          </label>
        </div>
      </div>

      {/* Texture Quality Radio Buttons */}
      <div style={styles.radioContainer}>
        <div style={styles.toggleLabel}>Texture Quality</div>
        <div style={styles.radioGroup}>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              name="textureQuality"
              value="low"
              checked={textureQuality === 'low'}
              onChange={() => handleTextureQualityChange('low')}
            />
            Low (Best Performance)
          </label>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              name="textureQuality"
              value="medium"
              checked={textureQuality === 'medium'}
              onChange={() => handleTextureQualityChange('medium')}
            />
            Medium
          </label>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              name="textureQuality"
              value="high"
              checked={textureQuality === 'high'}
              onChange={() => handleTextureQualityChange('high')}
            />
            High (Best Visuals)
          </label>
        </div>
      </div>

      {/* Render Scale Slider */}
      <div style={styles.sliderGroup}>
        <div style={styles.sliderLabel}>
          <span>Render Scale</span>
          <span>{renderScale.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0.35"
          max="1"
          step="0.05"
          value={renderScale}
          onChange={(e) => handleRenderScaleChange(e.target.value)}
          style={styles.slider}
        />
      </div>

      <div style={styles.infoText}>
        <p>These settings can significantly improve performance on lower-end devices or mobile phones. Try lowering material quality and disabling normal maps for the best boost.</p>
        <p style={styles.infoParagraph}>Changes apply to newly loaded materials and may require refreshing the page to take full effect.</p>
      </div>

      <button
        onClick={onToggleDebug}
        style={{
          ...styles.debugButton,
          backgroundColor: debugEnabled ? '#ffd600' : '#64ffda',
        }}
      >
        {debugEnabled ? 'Hide Debug Panel' : 'Show Debug Panel'}
      </button>
    </div>
  );
};

export default PerformanceControls;