// Updated PostProcessingControls.jsx for tabbed interface
import { useState, useEffect } from 'react';

/**
 * UI component for toggling post-processing effects
 * Modified to work within a tabbed interface
 */
const PostProcessingControls = ({ 
  effectsEnabled, 
  onToggleEffect, 
  visible = false,
  config
}) => {
  // Remove expanded state as it's now handled by parent 
  
  // Effects configuration state for sliders
  const [bloomIntensity, setBloomIntensity] = useState(config?.postProcessing?.bloom?.intensity || 1.0);
  const [chromaticAberrationStrength, setChromaticAberrationStrength] = useState(
    config?.postProcessing?.chromaticAberration?.offset?.[0] * 1000 || 3
  );
  const [noiseOpacity, setNoiseOpacity] = useState(config?.postProcessing?.noise?.opacity || 0.1);
  const [vignetteDarkness, setVignetteDarkness] = useState(config?.postProcessing?.vignette?.darkness || 1.1);
  
  // Update slider values when config changes
  useEffect(() => {
    if (config?.postProcessing) {
      if (config.postProcessing.bloom?.intensity !== undefined) {
        setBloomIntensity(config.postProcessing.bloom.intensity);
      }
      
      if (config.postProcessing.chromaticAberration?.offset?.[0] !== undefined) {
        setChromaticAberrationStrength(config.postProcessing.chromaticAberration.offset[0] * 1000);
      }
      
      if (config.postProcessing.noise?.opacity !== undefined) {
        setNoiseOpacity(config.postProcessing.noise.opacity);
      }
      
      if (config.postProcessing.vignette?.darkness !== undefined) {
        setVignetteDarkness(config.postProcessing.vignette.darkness);
      }
    }
  }, [config?.postProcessing]);
  
  // Handle slider value changes
  const handleBloomChange = (value) => {
    const numValue = parseFloat(value);
    setBloomIntensity(numValue);
    
    if (onToggleEffect) {
      onToggleEffect('bloom', true, { intensity: numValue });
    }
  };
  
  const handleChromaticAberrationChange = (value) => {
    const numValue = parseFloat(value);
    setChromaticAberrationStrength(numValue);
    
    // Convert from slider range (0-10) to actual offset (0-0.01)
    const offset = numValue / 1000;
    
    if (onToggleEffect) {
      onToggleEffect('chromaticAberration', true, { 
        offset: [offset, offset]
      });
    }
  };
  
  const handleNoiseChange = (value) => {
    const numValue = parseFloat(value);
    setNoiseOpacity(numValue);
    
    if (onToggleEffect) {
      onToggleEffect('noise', true, { opacity: numValue });
    }
  };
  
  const handleVignetteChange = (value) => {
    const numValue = parseFloat(value);
    setVignetteDarkness(numValue);
    
    if (onToggleEffect) {
      onToggleEffect('vignette', true, { darkness: numValue });
    }
  };
  
  // Toggle all effects on/off
  const handleToggleAll = (enabled) => {
    if (onToggleEffect) {
      onToggleEffect('bloom', enabled);
      onToggleEffect('chromaticAberration', enabled);
      onToggleEffect('noise', enabled);
      onToggleEffect('vignette', enabled);
    }
  };
  
  // Updated styles for the tabbed interface
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
  
  const dividerStyle = {
    width: '100%',
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: '15px 0'
  };
  
  const controlToggleStyle = {
    position: 'relative',
    width: '40px',
    height: '20px'
  };
  
  const toggleLabelStyle = {
    fontSize: '14px',
    fontWeight: '500'
  };
  
  const sliderGroupStyle = {
    marginBottom: '15px',
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
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
    accentColor: '#64ffda'
  };
  
  const toggleAllButtonStyle = (enabled) => ({
    backgroundColor: enabled ? 'rgba(100, 255, 218, 0.2)' : 'rgba(255, 255, 255, 0.1)',
    color: enabled ? '#64ffda' : 'white',
    border: `1px solid ${enabled ? '#64ffda' : 'rgba(255, 255, 255, 0.3)'}`,
    padding: '8px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
    width: '48%',
    fontWeight: 'bold',
    fontSize: '13px',
    transition: 'all 0.2s ease'
  });
  
  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%'
  };
  
  const titleStyle = {
    margin: '0 0 15px 0', 
    fontSize: '16px', 
    display: 'flex', 
    alignItems: 'center'
  };
  
  // Custom toggle switch component
  const ToggleSwitch = ({ checked, onChange }) => (
    <div style={controlToggleStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{
          opacity: 0,
          width: 0,
          height: 0
        }}
      />
      <span
        style={{
          position: 'absolute',
          cursor: 'pointer',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: checked ? '#64ffda' : 'rgba(255, 255, 255, 0.2)',
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
        onClick={onChange}
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
        <span role="img" aria-label="Post Processing" style={{ marginRight: '8px' }}>🔮</span>
        Post-Processing Effects
      </h2>
      
      {/* Bloom Effect Toggle */}
      <div 
        style={{
          ...toggleContainerStyle,
          backgroundColor: effectsEnabled.bloom ? 'rgba(100, 255, 218, 0.1)' : 'rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={toggleLabelStyle}>Bloom</div>
        <ToggleSwitch 
          checked={effectsEnabled.bloom}
          onChange={() => onToggleEffect('bloom', !effectsEnabled.bloom)}
        />
      </div>
      
      {/* Bloom Intensity Slider (only shown when enabled) */}
      {effectsEnabled.bloom && (
        <div style={sliderGroupStyle}>
          <div style={sliderLabelStyle}>
            <span>Bloom Intensity</span>
            <span>{bloomIntensity.toFixed(1)}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="3" 
            step="0.1"
            value={bloomIntensity} 
            onChange={(e) => handleBloomChange(e.target.value)}
            style={sliderStyle}
          />
        </div>
      )}
      
      {/* Chromatic Aberration Toggle */}
      <div 
        style={{
          ...toggleContainerStyle,
          backgroundColor: effectsEnabled.chromaticAberration ? 'rgba(100, 255, 218, 0.1)' : 'rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={toggleLabelStyle}>Chromatic Aberration</div>
        <ToggleSwitch 
          checked={effectsEnabled.chromaticAberration}
          onChange={() => onToggleEffect('chromaticAberration', !effectsEnabled.chromaticAberration)}
        />
      </div>
      
      {/* Chromatic Aberration Strength Slider (only shown when enabled) */}
      {effectsEnabled.chromaticAberration && (
        <div style={sliderGroupStyle}>
          <div style={sliderLabelStyle}>
            <span>Aberration Strength</span>
            <span>{chromaticAberrationStrength.toFixed(1)}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="10" 
            step="0.1"
            value={chromaticAberrationStrength} 
            onChange={(e) => handleChromaticAberrationChange(e.target.value)}
            style={sliderStyle}
          />
        </div>
      )}
      
      {/* Noise Toggle */}
      <div 
        style={{
          ...toggleContainerStyle,
          backgroundColor: effectsEnabled.noise ? 'rgba(100, 255, 218, 0.1)' : 'rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={toggleLabelStyle}>Noise</div>
        <ToggleSwitch 
          checked={effectsEnabled.noise}
          onChange={() => onToggleEffect('noise', !effectsEnabled.noise)}
        />
      </div>
      
      {/* Noise Opacity Slider (only shown when enabled) */}
      {effectsEnabled.noise && (
        <div style={sliderGroupStyle}>
          <div style={sliderLabelStyle}>
            <span>Noise Opacity</span>
            <span>{noiseOpacity.toFixed(2)}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="0.5" 
            step="0.01"
            value={noiseOpacity} 
            onChange={(e) => handleNoiseChange(e.target.value)}
            style={sliderStyle}
          />
        </div>
      )}
      
      {/* Vignette Toggle */}
      <div 
        style={{
          ...toggleContainerStyle,
          backgroundColor: effectsEnabled.vignette ? 'rgba(100, 255, 218, 0.1)' : 'rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={toggleLabelStyle}>Vignette</div>
        <ToggleSwitch 
          checked={effectsEnabled.vignette}
          onChange={() => onToggleEffect('vignette', !effectsEnabled.vignette)}
        />
      </div>
      
      {/* Vignette Darkness Slider (only shown when enabled) */}
      {effectsEnabled.vignette && (
        <div style={sliderGroupStyle}>
          <div style={sliderLabelStyle}>
            <span>Vignette Darkness</span>
            <span>{vignetteDarkness.toFixed(1)}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="2" 
            step="0.1"
            value={vignetteDarkness} 
            onChange={(e) => handleVignetteChange(e.target.value)}
            style={sliderStyle}
          />
        </div>
      )}
      
      <div style={dividerStyle} />
      
      {/* Toggle All Buttons */}
      <div style={buttonContainerStyle}>
        <button 
          style={toggleAllButtonStyle(true)}
          onClick={() => handleToggleAll(true)}
        >
          Enable All
        </button>
        <button 
          style={toggleAllButtonStyle(false)}
          onClick={() => handleToggleAll(false)}
        >
          Disable All
        </button>
      </div>
    </div>
  );
};

export default PostProcessingControls;