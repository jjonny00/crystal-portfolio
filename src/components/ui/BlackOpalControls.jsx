// BlackOpalControls.jsx - Completely revised for stability
import { useState, useEffect } from 'react';

/**
 * UI component for controlling Black Opal material properties
 */
const BlackOpalControls = ({ onConfigUpdate, currentConfig, visible = false }) => {
  // Default values to use when state is invalid
  const defaultValues = {
    roughness: 0.4,
    metalness: 0.1,
    clearcoat: 0.6,
    transmission: 0.2,
    iridescence: 0.9,
    normalScale: 0.8,
    emissiveIntensity: 0.5
  };

  // Material property sliders with safe initial values
  const [roughness, setRoughness] = useState(defaultValues.roughness);
  const [metalness, setMetalness] = useState(defaultValues.metalness);
  const [clearcoat, setClearcoat] = useState(defaultValues.clearcoat);
  const [transmission, setTransmission] = useState(defaultValues.transmission);
  const [iridescence, setIridescence] = useState(defaultValues.iridescence);
  const [normalScale, setNormalScale] = useState(defaultValues.normalScale);
  const [emissiveIntensity, setEmissiveIntensity] = useState(defaultValues.emissiveIntensity);
  
  // Safely get a numeric value with fallback
  const getNumericValue = (value, defaultValue) => {
    if (value === undefined || value === null) return defaultValue;
    const numValue = parseFloat(value);
    return isNaN(numValue) ? defaultValue : numValue;
  };
  
  // Update local state when config changes externally
  useEffect(() => {
    if (currentConfig) {
      // Safely update each value
      setRoughness(getNumericValue(currentConfig.roughness, defaultValues.roughness));
      setMetalness(getNumericValue(currentConfig.metalness, defaultValues.metalness));
      setClearcoat(getNumericValue(currentConfig.clearcoat, defaultValues.clearcoat));
      setTransmission(getNumericValue(currentConfig.transmission, defaultValues.transmission));
      setIridescence(getNumericValue(currentConfig.iridescence, defaultValues.iridescence));
      setNormalScale(getNumericValue(currentConfig.normalScale, defaultValues.normalScale));
      setEmissiveIntensity(getNumericValue(currentConfig.emissiveIntensity, defaultValues.emissiveIntensity));
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
    
    // Create a clean config object with only numeric values
    const updatedConfig = {
      ...defaultValues, // Start with defaults as a fallback
      ...currentConfig, // Apply current config
      [property]: numValue // Override with the new value
    };
    
    // Ensure all values are numeric before updating
    Object.keys(updatedConfig).forEach(key => {
      if (typeof updatedConfig[key] !== 'number' || isNaN(updatedConfig[key])) {
        updatedConfig[key] = defaultValues[key] || 0;
      }
    });
    
    // Notify parent component with sanitized config
    if (onConfigUpdate) {
      console.log("Updating BlackOpal config with:", updatedConfig);
      onConfigUpdate(updatedConfig);
    }
  };
  
  // Styles
  const panelStyle = {
    position: 'fixed',
    right: visible ? '340px' : '-320px',
    top: '20px',
    width: '320px',
    backgroundColor: 'rgba(20, 0, 20, 0.7)',
    backdropFilter: 'blur(10px)',
    color: 'white',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
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
    accentColor: '#bb86fc'
  };
  
  // Safely format a number for display
  const formatNumber = (value) => {
    try {
      if (typeof value !== 'number' || isNaN(value)) return "0.00";
      return value.toFixed(2);
    } catch (error) {
      console.error("Error formatting number:", error);
      return "0.00";
    }
  };
  
  // Only show if visible
  if (!visible) return null;
  
  return (
    <div style={panelStyle}>
      <h2 style={{ margin: '0 0 15px 0', fontSize: '16px', display: 'flex', alignItems: 'center' }}>
        <span role="img" aria-label="Black Opal" style={{ marginRight: '8px' }}>💎</span>
        Black Opal Properties
      </h2>
      
      {/* Roughness Slider */}
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Roughness</span>
          <span>{formatNumber(roughness)}</span>
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
          <span>{formatNumber(metalness)}</span>
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
          <span>{formatNumber(clearcoat)}</span>
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
          <span>{formatNumber(transmission)}</span>
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
          <span>{formatNumber(iridescence)}</span>
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
          <span>{formatNumber(normalScale)}</span>
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
          <span>{formatNumber(emissiveIntensity)}</span>
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

export default BlackOpalControls;