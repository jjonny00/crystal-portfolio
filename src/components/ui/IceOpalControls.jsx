// IceOpalControls.jsx
import { useState, useEffect } from 'react';

/**
 * UI component for controlling Ice Opal material properties
 */
const IceOpalControls = ({ onConfigUpdate, currentConfig, visible = false }) => {
  // Material property sliders
  const [roughness, setRoughness] = useState(0.3);
  const [metalness, setMetalness] = useState(0.05);
  const [clearcoat, setClearcoat] = useState(0.8);
  const [transmission, setTransmission] = useState(0.6);
  const [iridescence, setIridescence] = useState(0.4);
  const [normalScale, setNormalScale] = useState(0.6);
  const [emissiveIntensity, setEmissiveIntensity] = useState(0.4);
  
  // Update local state when config changes externally
  useEffect(() => {
    if (currentConfig) {
      if (currentConfig.roughness !== undefined && typeof currentConfig.roughness === 'number') setRoughness(currentConfig.roughness);
      if (currentConfig.metalness !== undefined && typeof currentConfig.metalness === 'number') setMetalness(currentConfig.metalness);
      if (currentConfig.clearcoat !== undefined && typeof currentConfig.clearcoat === 'number') setClearcoat(currentConfig.clearcoat);
      if (currentConfig.transmission !== undefined && typeof currentConfig.transmission === 'number') setTransmission(currentConfig.transmission);
      if (currentConfig.iridescence !== undefined && typeof currentConfig.iridescence === 'number') setIridescence(currentConfig.iridescence);
      if (currentConfig.normalScale !== undefined && typeof currentConfig.normalScale === 'number') setNormalScale(currentConfig.normalScale);
      if (currentConfig.emissiveIntensity !== undefined && typeof currentConfig.emissiveIntensity === 'number') setEmissiveIntensity(currentConfig.emissiveIntensity);
    }
  }, [currentConfig]);
  
  // Handle property changes
  const handlePropertyChange = (property, value) => {
    // Convert value to number and ensure it's valid
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      console.warn(`Invalid value for ${property}: ${value}`);
      return;
    }
    
    // Update local state
    switch(property) {
      case 'roughness':
        setRoughness(numValue);
        break;
      case 'metalness':
        setMetalness(numValue);
        break;
      case 'clearcoat':
        setClearcoat(numValue);
        break;
      case 'transmission':
        setTransmission(numValue);
        break;
      case 'iridescence':
        setIridescence(numValue);
        break;
      case 'normalScale':
        setNormalScale(numValue);
        break;
      case 'emissiveIntensity':
        setEmissiveIntensity(numValue);
        break;
      default:
        break;
    }
    
    // Notify parent component with validated numeric value
    if (onConfigUpdate) {
      onConfigUpdate({
        ...currentConfig,
        [property]: numValue
      });
    }
  };
  
  // Styles
  const panelStyle = {
    position: 'fixed',
    right: visible ? '340px' : '-320px',
    top: '240px', // Positioned below the other controls
    width: '320px',
    backgroundColor: 'rgba(0, 0, 100, 0.7)', // Blue tint for Ice Opal
    backdropFilter: 'blur(10px)',
    color: 'white',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 0 20px rgba(0, 0, 100, 0.5)',
    transition: 'right 0.3s ease',
    zIndex: 1000,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    maxHeight: '90vh',
    overflowY: 'auto'
  };
  
  const sliderGroupStyle = {
    marginBottom: '15px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '15px'
  };

  const sliderLabelStyle = {
    fontSize: '12px',
    marginBottom: '5px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const sliderStyle = {
    width: '100%',
    backgroundColor: 'transparent',
    accentColor: '#88bbff' // Blue accent for Ice Opal
  };
  
  // Only show if visible
  if (!visible) return null;
  
  return (
    <div style={panelStyle}>
      <h2 style={{ margin: '0 0 15px 0', fontSize: '16px', display: 'flex', alignItems: 'center' }}>
        <span role="img" aria-label="Ice Opal" style={{ marginRight: '8px' }}>❄️</span>
        Ice Opal Properties
      </h2>
      
      {/* Roughness Slider */}
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Roughness</span>
          <span>{typeof roughness === 'number' ? roughness.toFixed(2) : "0.00"}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01"
          value={roughness} 
          onChange={(e) => handlePropertyChange('roughness', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      {/* Metalness Slider */}
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Metalness</span>
          <span>{typeof metalness === 'number' ? metalness.toFixed(2) : "0.00"}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01"
          value={metalness} 
          onChange={(e) => handlePropertyChange('metalness', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      {/* Clearcoat Slider */}
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Clearcoat</span>
          <span>{typeof clearcoat === 'number' ? clearcoat.toFixed(2) : "0.00"}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01"
          value={clearcoat} 
          onChange={(e) => handlePropertyChange('clearcoat', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      {/* Transmission Slider */}
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Transmission</span>
          <span>{typeof transmission === 'number' ? transmission.toFixed(2) : "0.00"}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01"
          value={transmission} 
          onChange={(e) => handlePropertyChange('transmission', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      {/* Iridescence Slider */}
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Iridescence</span>
          <span>{typeof iridescence === 'number' ? iridescence.toFixed(2) : "0.00"}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01"
          value={iridescence} 
          onChange={(e) => handlePropertyChange('iridescence', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      {/* Normal Scale Slider */}
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Normal Scale</span>
          <span>{typeof normalScale === 'number' ? normalScale.toFixed(2) : "0.00"}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="2" 
          step="0.1"
          value={normalScale} 
          onChange={(e) => handlePropertyChange('normalScale', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      {/* Emissive Intensity Slider */}
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Emissive Intensity</span>
          <span>{typeof emissiveIntensity === 'number' ? emissiveIntensity.toFixed(2) : "0.00"}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="2" 
          step="0.1"
          value={emissiveIntensity} 
          onChange={(e) => handlePropertyChange('emissiveIntensity', e.target.value)}
          style={sliderStyle}
        />
      </div>
    </div>
  );
};

export default IceOpalControls;