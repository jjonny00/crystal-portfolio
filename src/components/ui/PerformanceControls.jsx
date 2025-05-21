// src/components/ui/PerformanceControls.jsx
import { useState, useEffect } from 'react';

/**
 * UI component for controlling performance-related settings
 */
const PerformanceControls = ({ 
  performanceConfig, 
  onConfigUpdate, 
  visible = false 
}) => {
  // Performance options state
  const [useNormalMaps, setUseNormalMaps] = useState(performanceConfig?.useNormalMaps ?? true);
  const [textureQuality, setTextureQuality] = useState(performanceConfig?.textureQuality ?? 'high');
  const [usePBR, setUsePBR] = useState(performanceConfig?.usePBR ?? true);
  
  // Update local state when config changes externally
  useEffect(() => {
    if (performanceConfig) {
      if (performanceConfig.useNormalMaps !== undefined) setUseNormalMaps(performanceConfig.useNormalMaps);
      if (performanceConfig.textureQuality !== undefined) setTextureQuality(performanceConfig.textureQuality);
      if (performanceConfig.usePBR !== undefined) setUsePBR(performanceConfig.usePBR);
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
  
  const handlePBRToggle = () => {
    const newValue = !usePBR;
    setUsePBR(newValue);
    
    if (onConfigUpdate) {
      onConfigUpdate({
        ...performanceConfig,
        usePBR: newValue
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

  // Styles
  const titleStyle = {
    margin: '0 0 15px 0', 
    fontSize: '16px', 
    display: 'flex', 
    alignItems: 'center'
  };
  
  const toggleContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    transition: 'background-color 0.3s ease'
  };
  
  const toggleLabelStyle = {
    fontSize: '14px',
    fontWeight: '500'
  };
  
  const controlToggleStyle = {
    position: 'relative',
    width: '40px',
    height: '20px'
  };
  
  const radioContainerStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '15px'
  };
  
  const radioGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '5px'
  };
  
  const radioLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  };
  
  const infoTextStyle = {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: '15px',
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    padding: '10px',
    borderRadius: '8px',
    lineHeight: '1.4'
  };
  
  // Custom toggle switch component
  const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
    <div style={controlToggleStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{
          opacity: 0,
          width: 0,
          height: 0
        }}
      />
      <span
        style={{
          position: 'absolute',
          cursor: disabled ? 'not-allowed' : 'pointer',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: disabled ? 'rgba(150, 150, 150, 0.2)' : (checked ? '#64ffda' : 'rgba(255, 255, 255, 0.2)'),
          opacity: disabled ? 0.5 : 1,
          transition: '0.3s',
          borderRadius: '20px',
          '&:before': {
            position: 'absolute',
            content: '""',
            height: '16px',
            width: '16px',
            left: checked ? '20px' : '4px',
            bottom: '2px',
            backgroundColor: 'white',
            transition: '0.3s',
            borderRadius: '50%'
          }
        }}
        onClick={disabled ? null : onChange}
      >
        <span 
          style={{
            position: 'absolute',
            height: '16px',
            width: '16px',
            left: checked ? '20px' : '4px',
            bottom: '2px',
            backgroundColor: 'white',
            transition: '0.3s',
            borderRadius: '50%'
          }}
        />
      </span>
    </div>
  );

  // Only render if visible
  if (!visible) return null;
  
  return (
    <div>
      <h2 style={titleStyle}>
        <span role="img" aria-label="Performance" style={{ marginRight: '8px' }}>⚡</span>
        Performance Settings
      </h2>
      
      {/* Normal Map Toggle */}
      <div 
        style={{
          ...toggleContainerStyle,
          backgroundColor: useNormalMaps ? 'rgba(100, 255, 218, 0.1)' : 'rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={toggleLabelStyle}>Use Normal Maps</div>
        <ToggleSwitch 
          checked={useNormalMaps}
          onChange={handleNormalMapToggle}
        />
      </div>
      
      {/* PBR Toggle */}
      <div 
        style={{
          ...toggleContainerStyle,
          backgroundColor: usePBR ? 'rgba(100, 255, 218, 0.1)' : 'rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={toggleLabelStyle}>Use PBR Materials</div>
        <ToggleSwitch 
          checked={usePBR}
          onChange={handlePBRToggle}
        />
      </div>
      
      {/* Texture Quality Radio Buttons */}
      <div style={radioContainerStyle}>
        <div style={toggleLabelStyle}>Texture Quality</div>
        <div style={radioGroupStyle}>
          <label style={radioLabelStyle}>
            <input 
              type="radio"
              name="textureQuality"
              value="low"
              checked={textureQuality === 'low'}
              onChange={() => handleTextureQualityChange('low')}
            />
            Low (Best Performance)
          </label>
          <label style={radioLabelStyle}>
            <input 
              type="radio"
              name="textureQuality"
              value="medium"
              checked={textureQuality === 'medium'}
              onChange={() => handleTextureQualityChange('medium')}
            />
            Medium
          </label>
          <label style={radioLabelStyle}>
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
      
      <div style={infoTextStyle}>
        <p>These settings can significantly improve performance on lower-end devices or mobile phones. Try disabling normal maps and PBR materials for the best performance boost.</p>
        <p style={{ marginTop: '8px' }}>Changes apply to newly loaded materials and may require refreshing the page to take full effect.</p>
      </div>
    </div>
  );
};

export default PerformanceControls;