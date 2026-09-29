// Updated PostProcessingControls.jsx for tabbed interface
import { useState, useEffect } from 'react';
import { postProcessing as defaultPostProcessing } from '../../crystalConfig';

const vignetteSliders = [
  { key: 'strength', label: 'Strength (− darken / + brighten)', min: -1, max: 2, step: 0.01 },
  { key: 'radius', label: 'Radius', min: 0, max: 1, step: 0.001 },
  { key: 'softness', label: 'Softness', min: 0.01, max: 1.5, step: 0.001 },
  { key: 'wash', label: 'Wash (0 multiply / 1 wash to tint)', min: 0, max: 1, step: 0.01 },
  { key: 'roundness', label: 'Roundness (0 frame / 1 circle)', min: 0, max: 1, step: 0.01 }
];

/**
 * UI component for toggling post-processing effects
 * Modified to work within a tabbed interface
 */
const PostProcessingControls = ({ 
  effectsEnabled, 
  onToggleEffect, 
  visible = false,
  config,
  postProcessingConfig
}) => {
  // Remove expanded state as it's now handled by parent 
  
  // Effects configuration state for sliders
  const [bloomIntensity, setBloomIntensity] = useState(config?.postProcessing?.bloom?.intensity || 1.0);
  const [chromaticAberrationStrength, setChromaticAberrationStrength] = useState(
    config?.postProcessing?.chromaticAberration?.offset?.[0] * 1000 || 3
  );
  const [noiseOpacity, setNoiseOpacity] = useState(config?.postProcessing?.noise?.opacity || 0.1);
  const [vignetteCopyStatus, setVignetteCopyStatus] = useState('');

  // The vignette controls read the live settings (App's postProcessingConfig)
  // rather than crystalConfig, so they always show what's on screen.
  const vignette = { ...defaultPostProcessing.vignette, ...postProcessingConfig?.vignette };

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
  
  const handleVignetteChange = (key, value) => {
    if (onToggleEffect) {
      onToggleEffect('vignette', true, { [key]: value });
    }
  };

  const handleVignetteReset = () => {
    if (onToggleEffect) {
      onToggleEffect('vignette', true, { ...defaultPostProcessing.vignette });
    }
  };

  // Copies the current values in the shape crystalConfig.postProcessing.vignette
  // uses, ready to paste over it to keep a tuned look.
  const handleCopyVignette = async () => {
    const text = `vignette: ${JSON.stringify(vignette, null, 2)}`;
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      copied = false;
    }
    if (!copied) console.log(text);
    setVignetteCopyStatus(copied ? 'Copied — paste over postProcessing.vignette in crystalConfig.js' : 'Copy failed — values logged to console');
    window.setTimeout(() => setVignetteCopyStatus(''), 3000);
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
    <label
      style={{
        ...controlToggleStyle,
        cursor: "pointer",
        position: "relative",
        display: "inline-block"
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{
          opacity: 0,
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          margin: 0,
          cursor: "inherit"
        }}
      />
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: checked ? "#64ffda" : "rgba(255, 255, 255, 0.2)",
          transition: "background-color 0.3s",
          borderRadius: "20px"
        }}
      />
      <span
        style={{
          position: "absolute",
          top: "2px",
          left: checked ? "22px" : "2px",
          width: "16px",
          height: "16px",
          backgroundColor: "white",
          borderRadius: "50%",
          transition: "left 0.3s"
        }}
      />
    </label>
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
      
      {/* Vignette controls (only shown when enabled) — see EdgeVignette.jsx */}
      {effectsEnabled.vignette && (
        <div style={sliderGroupStyle}>
          {vignetteSliders.map(({ key, label, min, max, step }) => (
            <div key={key} style={{ marginBottom: '8px' }}>
              <div style={sliderLabelStyle}>
                <span>{label}</span>
                <span>{Number(vignette[key]).toFixed(step < 0.01 ? 3 : 2)}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={vignette[key]}
                onChange={(e) => handleVignetteChange(key, parseFloat(e.target.value))}
                style={sliderStyle}
              />
            </div>
          ))}

          {['X', 'Y'].map((axis, axisIndex) => (
            <div key={axis} style={{ marginBottom: '8px' }}>
              <div style={sliderLabelStyle}>
                <span>Centre {axis}</span>
                <span>{Number(vignette.center[axisIndex]).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={vignette.center[axisIndex]}
                onChange={(e) => {
                  const center = [...vignette.center];
                  center[axisIndex] = parseFloat(e.target.value);
                  handleVignetteChange('center', center);
                }}
                style={sliderStyle}
              />
            </div>
          ))}

          <div style={{ ...sliderLabelStyle, marginBottom: '10px' }}>
            <span>Tint (brighten target)</span>
            <input
              type="color"
              value={vignette.tint}
              onChange={(e) => handleVignetteChange('tint', e.target.value)}
              style={{ width: '48px', height: '24px', border: 'none', background: 'transparent', cursor: 'pointer' }}
            />
          </div>

          <div style={buttonContainerStyle}>
            <button type="button" style={toggleAllButtonStyle(true)} onClick={handleCopyVignette}>
              Copy Values
            </button>
            <button type="button" style={toggleAllButtonStyle(false)} onClick={handleVignetteReset}>
              Reset
            </button>
          </div>
          {vignetteCopyStatus && (
            <div style={{ fontSize: '11px', marginTop: '8px', color: '#64ffda' }}>{vignetteCopyStatus}</div>
          )}
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