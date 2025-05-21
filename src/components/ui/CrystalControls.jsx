// CrystalControls.jsx - Updated for tabbed interface
import { useState } from 'react';
import * as crystalConfig from '../../crystalConfig';

const CrystalControls = ({ onUpdate }) => {
  const [activeTab, setActiveTab] = useState('timing');
  
  // Timing state
  const [timingValues, setTimingValues] = useState({
    'camera.explodeDuration': crystalConfig.timing.camera.explodeDuration,
    'camera.reformDuration': crystalConfig.timing.camera.reformDuration,
    'fracture.duration': crystalConfig.timing.fracture.duration,
    'idle.transitionStartTime': crystalConfig.timing.idle.transitionStartTime,
    'idle.transitionEndTime': crystalConfig.timing.idle.transitionEndTime,
  });

  // Position state  
  const [positionValues, setPositionValues] = useState({
    'explodedPositions.empathy': crystalConfig.explodedPositions.empathy,
    'explodedPositions.narrative': crystalConfig.explodedPositions.narrative,
    'explodedPositions.craft': crystalConfig.explodedPositions.craft,
    'explodedPositions.system': crystalConfig.explodedPositions.system,
    'explodedPositions.leadership': crystalConfig.explodedPositions.leadership,
    'explodedPositions.exploration': crystalConfig.explodedPositions.exploration,
  });

  // Effects state
  const [effectValues, setEffectValues] = useState({
    'effects.idle.float.baseAmplitude': crystalConfig.effects.idle.float.baseAmplitude,
    'effects.idle.float.xMultiplier': crystalConfig.effects.idle.float.xMultiplier,
    'effects.idle.float.zMultiplier': crystalConfig.effects.idle.float.zMultiplier,
    'effects.fracture.maxScaleFactor': crystalConfig.effects.fracture.maxScaleFactor,
    'effects.fracture.initialGlow': crystalConfig.effects.fracture.initialGlow,
    'effects.fracture.secondaryGlow': crystalConfig.effects.fracture.secondaryGlow || 1.0, // Fallback
    'effects.idle.glow.pulseBase': crystalConfig.effects.idle.glow.pulseBase,
    'effects.idle.glow.pulseStrength': crystalConfig.effects.idle.glow.pulseStrength,
    'effects.idle.glow.baseFrequency': crystalConfig.effects.idle.glow.baseFrequency || 0.5, // Fallback
  });

  // Material state
  const [materialValues, setMaterialValues] = useState({
    'materials.crystal.transmission': crystalConfig.materials.crystal.transmission,
    'materials.crystal.ior': crystalConfig.materials.crystal.ior,
    'materials.crystal.iridescence': crystalConfig.materials.crystal.iridescence,
    'materials.crystal.roughness': crystalConfig.materials.crystal.roughness,
  });

  // Handle timing value changes
  const handleTimingChange = (key, value) => {
    const numValue = parseFloat(value);
    setTimingValues({
      ...timingValues,
      [key]: numValue
    });
    
    // Create updated config
    const updatedConfig = { ...crystalConfig };
    const [section, property] = key.split('.');
    updatedConfig.timing[section][property] = numValue;
    
    // Notify parent component
    onUpdate(updatedConfig);
  };

  // Handle position value changes
  const handlePositionChange = (key, index, value) => {
    const numValue = parseFloat(value);
    const [section, facet] = key.split('.');
    
    // Create a copy of the current position array
    const newPosition = [...positionValues[key]];
    newPosition[index] = numValue;
    
    // Update the state
    setPositionValues({
      ...positionValues,
      [key]: newPosition
    });
    
    // Create updated config
    const updatedConfig = { ...crystalConfig };
    updatedConfig[section][facet] = newPosition;
    
    // Notify parent component
    onUpdate(updatedConfig);
  };

  // Handle effect value changes
  const handleEffectChange = (key, value) => {
    const numValue = parseFloat(value);
    setEffectValues({
      ...effectValues,
      [key]: numValue
    });
    
    // Create a copy of the config - careful not to lose references to complex objects
    const updatedConfig = { ...crystalConfig };
    const parts = key.split('.');
    
    console.log(`Updating effect: ${key} = ${numValue}`);
    
    // This is a bit complex due to nested structure
    if (parts.length === 4) {
      const [section, category, property, subproperty] = parts;
      
      // Ensure the parent objects exist, but preserve references
      if (!updatedConfig[section]) updatedConfig[section] = {};
      if (!updatedConfig[section][category]) updatedConfig[section][category] = { ...crystalConfig[section]?.[category] };
      if (!updatedConfig[section][category][property]) updatedConfig[section][category][property] = { ...crystalConfig[section]?.[category]?.[property] };
      
      // Update the value
      updatedConfig[section][category][property][subproperty] = numValue;
    } else if (parts.length === 5) {
      const [section, category, subCategory, property, subproperty] = parts;
      
      // Ensure the parent objects exist, but preserve references
      if (!updatedConfig[section]) updatedConfig[section] = {};
      if (!updatedConfig[section][category]) updatedConfig[section][category] = { ...crystalConfig[section]?.[category] };
      if (!updatedConfig[section][category][subCategory]) updatedConfig[section][category][subCategory] = { ...crystalConfig[section]?.[category]?.[subCategory] };
      if (!updatedConfig[section][category][subCategory][property]) updatedConfig[section][category][subCategory][property] = { ...crystalConfig[section]?.[category]?.[subCategory]?.[property] };
      
      // Update the value
      updatedConfig[section][category][subCategory][property][subproperty] = numValue;
    }
    
    // Notify parent component
    onUpdate(updatedConfig);
  };

  // Handle material value changes  
  const handleMaterialChange = (key, value) => {
    const numValue = parseFloat(value);
    setMaterialValues({
      ...materialValues,
      [key]: numValue
    });
    
    // Create a copy of the config - preserve important references
    const updatedConfig = { ...crystalConfig };
    const [section, category, property] = key.split('.');
    
    console.log(`Updating material: ${key} = ${numValue}`);
    
    // Ensure parent objects exist
    if (!updatedConfig[section]) updatedConfig[section] = {};
    if (!updatedConfig[section][category]) updatedConfig[section][category] = { ...crystalConfig[section]?.[category] };
    
    // Special handling for color properties - they are THREE.Color objects
    if (property === 'color' || property === 'emissive' || property === 'attenuationColor' || property === 'specularColor') {
      // Don't update color properties directly through this UI
      // Would need a color picker component
    } else {
      // Update numeric property directly
      updatedConfig[section][category][property] = numValue;
    }
    
    // Notify parent component immediately
    onUpdate(updatedConfig);
  };

  // Reset all values to defaults
  const handleReset = () => {
    setTimingValues({
      'camera.explodeDuration': crystalConfig.timing.camera.explodeDuration,
      'camera.reformDuration': crystalConfig.timing.camera.reformDuration,
      'fracture.duration': crystalConfig.timing.fracture.duration,
      'idle.transitionStartTime': crystalConfig.timing.idle.transitionStartTime,
      'idle.transitionEndTime': crystalConfig.timing.idle.transitionEndTime,
    });
    
    setPositionValues({
      'explodedPositions.empathy': crystalConfig.explodedPositions.empathy,
      'explodedPositions.narrative': crystalConfig.explodedPositions.narrative,
      'explodedPositions.craft': crystalConfig.explodedPositions.craft,
      'explodedPositions.system': crystalConfig.explodedPositions.system,
      'explodedPositions.leadership': crystalConfig.explodedPositions.leadership,
      'explodedPositions.exploration': crystalConfig.explodedPositions.exploration,
    });
    
    setEffectValues({
      'effects.idle.float.baseAmplitude': crystalConfig.effects.idle.float.baseAmplitude,
      'effects.idle.float.xMultiplier': crystalConfig.effects.idle.float.xMultiplier,
      'effects.idle.float.zMultiplier': crystalConfig.effects.idle.float.zMultiplier,
      'effects.fracture.maxScaleFactor': crystalConfig.effects.fracture.maxScaleFactor,
      'effects.fracture.initialGlow': crystalConfig.effects.fracture.initialGlow,
      'effects.fracture.secondaryGlow': crystalConfig.effects.fracture.secondaryGlow || 1.0,
      'effects.idle.glow.pulseBase': crystalConfig.effects.idle.glow.pulseBase,
      'effects.idle.glow.pulseStrength': crystalConfig.effects.idle.glow.pulseStrength,
      'effects.idle.glow.baseFrequency': crystalConfig.effects.idle.glow.baseFrequency || 0.5,
    });
    
    setMaterialValues({
      'materials.crystal.transmission': crystalConfig.materials.crystal.transmission,
      'materials.crystal.ior': crystalConfig.materials.crystal.ior,
      'materials.crystal.iridescence': crystalConfig.materials.crystal.iridescence, 
      'materials.crystal.roughness': crystalConfig.materials.crystal.roughness,
    });
    
    // Notify parent component
    onUpdate(crystalConfig);
  };

  // Container style - no fixed positioning since parent handles that
  const containerStyle = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  };

  const tabStyle = {
    display: 'flex',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    marginBottom: '15px'
  };

  const tabButtonStyle = (isActive) => ({
    padding: '8px 12px',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    border: 'none',
    color: 'white',
    borderBottom: isActive ? '2px solid #64ffda' : '2px solid transparent',
    cursor: 'pointer',
    flex: 1,
    fontSize: '12px'
  });

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
    accentColor: '#64ffda'
  };

  const resetButtonStyle = {
    backgroundColor: '#64ffda',
    color: '#000',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '15px',
    width: '100%',
    fontWeight: 'bold'
  };

  const coordLabelStyle = {
    display: 'inline-block',
    width: '15px',
    color: '#aaa',
    textAlign: 'center',
    fontSize: '10px'
  };

  const renderTimingControls = () => (
    <div>
      <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Animation Timing</h3>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Explode Duration</span>
          <span>{timingValues['camera.explodeDuration']}ms</span>
        </div>
        <input 
          type="range" 
          min="500" 
          max="3000" 
          step="100"
          value={timingValues['camera.explodeDuration']} 
          onChange={(e) => handleTimingChange('camera.explodeDuration', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Reform Duration</span>
          <span>{timingValues['camera.reformDuration']}ms</span>
        </div>
        <input 
          type="range" 
          min="500" 
          max="2000" 
          step="100"
          value={timingValues['camera.reformDuration']} 
          onChange={(e) => handleTimingChange('camera.reformDuration', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Fracture Duration</span>
          <span>{timingValues['fracture.duration']}ms</span>
        </div>
        <input 
          type="range" 
          min="100" 
          max="800" 
          step="50"
          value={timingValues['fracture.duration']} 
          onChange={(e) => handleTimingChange('fracture.duration', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Idle Transition Start</span>
          <span>{timingValues['idle.transitionStartTime']}s</span>
        </div>
        <input 
          type="range" 
          min="0.2" 
          max="2" 
          step="0.1"
          value={timingValues['idle.transitionStartTime']} 
          onChange={(e) => handleTimingChange('idle.transitionStartTime', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Idle Transition End</span>
          <span>{timingValues['idle.transitionEndTime']}s</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="3" 
          step="0.1"
          value={timingValues['idle.transitionEndTime']} 
          onChange={(e) => handleTimingChange('idle.transitionEndTime', e.target.value)}
          style={sliderStyle}
        />
      </div>
    </div>
  );

  const renderPositionsControls = () => (
    <div>
      <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Exploded Positions</h3>
      
      {Object.entries(positionValues).map(([key, position]) => {
        const facet = key.split('.')[1];
        return (
          <div key={key} style={sliderGroupStyle}>
            <div style={{ fontSize: '13px', marginBottom: '8px', color: '#64ffda' }}>
              {facet.charAt(0).toUpperCase() + facet.slice(1)}
            </div>
            
            {['X', 'Y', 'Z'].map((axis, index) => (
              <div key={axis} style={{ marginBottom: '5px' }}>
                <div style={sliderLabelStyle}>
                  <span><span style={coordLabelStyle}>{axis}</span> Position</span>
                  <span>{position[index].toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="-2" 
                  max="2" 
                  step="0.1"
                  value={position[index]} 
                  onChange={(e) => handlePositionChange(key, index, e.target.value)}
                  style={sliderStyle}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );

  const renderEffectsControls = () => (
    <div>
      <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Visual Effects</h3>
      
      <div style={{ fontSize: '13px', marginBottom: '10px', color: '#64ffda' }}>Floating Animation</div>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Base Amplitude</span>
          <span>{effectValues['effects.idle.float.baseAmplitude'].toFixed(4)}</span>
        </div>
        <input 
          type="range" 
          min="0.001" 
          max="0.05" 
          step="0.001"
          value={effectValues['effects.idle.float.baseAmplitude']} 
          onChange={(e) => handleEffectChange('effects.idle.float.baseAmplitude', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>X Multiplier</span>
          <span>{effectValues['effects.idle.float.xMultiplier'].toFixed(2)}</span>
        </div>
        <input 
          type="range" 
          min="0.1" 
          max="3.0" 
          step="0.1"
          value={effectValues['effects.idle.float.xMultiplier']} 
          onChange={(e) => handleEffectChange('effects.idle.float.xMultiplier', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Z Multiplier</span>
          <span>{effectValues['effects.idle.float.zMultiplier'].toFixed(2)}</span>
        </div>
        <input 
          type="range" 
          min="0.1" 
          max="3.0" 
          step="0.1"
          value={effectValues['effects.idle.float.zMultiplier']} 
          onChange={(e) => handleEffectChange('effects.idle.float.zMultiplier', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      <div style={{ fontSize: '13px', marginBottom: '10px', color: '#64ffda' }}>Fracture Effects</div>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Scale Factor</span>
          <span>{effectValues['effects.fracture.maxScaleFactor'].toFixed(2)}</span>
        </div>
        <input 
          type="range" 
          min="0.05" 
          max="0.5" 
          step="0.01"
          value={effectValues['effects.fracture.maxScaleFactor']} 
          onChange={(e) => handleEffectChange('effects.fracture.maxScaleFactor', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Initial Glow</span>
          <span>{effectValues['effects.fracture.initialGlow'].toFixed(1)}</span>
        </div>
        <input 
          type="range" 
          min="0.5" 
          max="15.0" 
          step="0.5"
          value={effectValues['effects.fracture.initialGlow']} 
          onChange={(e) => handleEffectChange('effects.fracture.initialGlow', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Secondary Glow</span>
          <span>{effectValues['effects.fracture.secondaryGlow'].toFixed(1)}</span>
        </div>
        <input 
          type="range" 
          min="0.1" 
          max="8.0" 
          step="0.1"
          value={effectValues['effects.fracture.secondaryGlow']} 
          onChange={(e) => handleEffectChange('effects.fracture.secondaryGlow', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      <div style={{ fontSize: '13px', marginBottom: '10px', color: '#64ffda' }}>Idle Glow Effects</div>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Base Glow</span>
          <span>{effectValues['effects.idle.glow.pulseBase'].toFixed(2)}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="5.0" 
          step="0.1"
          value={effectValues['effects.idle.glow.pulseBase']} 
          onChange={(e) => handleEffectChange('effects.idle.glow.pulseBase', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Pulse Strength</span>
          <span>{effectValues['effects.idle.glow.pulseStrength'].toFixed(2)}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="4.0" 
          step="0.1"
          value={effectValues['effects.idle.glow.pulseStrength']} 
          onChange={(e) => handleEffectChange('effects.idle.glow.pulseStrength', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Pulse Frequency</span>
          <span>{effectValues['effects.idle.glow.baseFrequency'].toFixed(2)}</span>
        </div>
        <input 
          type="range" 
          min="0.1" 
          max="3.0" 
          step="0.1"
          value={effectValues['effects.idle.glow.baseFrequency']} 
          onChange={(e) => handleEffectChange('effects.idle.glow.baseFrequency', e.target.value)}
          style={sliderStyle}
        />
      </div>
    </div>
  );

  const renderMaterialControls = () => (
    <div>
      <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Crystal Material</h3>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Transmission</span>
          <span>{materialValues['materials.crystal.transmission'].toFixed(2)}</span>
        </div>
        <input 
          type="range" 
          min="0.1" 
          max="1.0" 
          step="0.01"
          value={materialValues['materials.crystal.transmission']} 
          onChange={(e) => handleMaterialChange('materials.crystal.transmission', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Index of Refraction</span>
          <span>{materialValues['materials.crystal.ior'].toFixed(1)}</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="5" 
          step="0.1"
          value={materialValues['materials.crystal.ior']} 
          onChange={(e) => handleMaterialChange('materials.crystal.ior', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Iridescence</span>
          <span>{materialValues['materials.crystal.iridescence'].toFixed(1)}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="2.0" 
          step="0.1"
          value={materialValues['materials.crystal.iridescence']} 
          onChange={(e) => handleMaterialChange('materials.crystal.iridescence', e.target.value)}
          style={sliderStyle}
        />
      </div>
      
      <div style={sliderGroupStyle}>
        <div style={sliderLabelStyle}>
          <span>Roughness</span>
          <span>{materialValues['materials.crystal.roughness'].toFixed(2)}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="1.0" 
          step="0.01"
          value={materialValues['materials.crystal.roughness']} 
          onChange={(e) => handleMaterialChange('materials.crystal.roughness', e.target.value)}
          style={sliderStyle}
        />
      </div>
    </div>
  );

  // Updated return statement for tabbed interface
  return (
    <div style={containerStyle}>
      <h2 style={{ margin: '0 0 15px 0', fontSize: '16px', display: 'flex', alignItems: 'center' }}>
        <span role="img" aria-label="Crystal" style={{ marginRight: '8px' }}>💎</span>
        Crystal Controls
      </h2>
      
      <div style={tabStyle}>
        <button 
          style={tabButtonStyle(activeTab === 'timing')}
          onClick={() => setActiveTab('timing')}
        >
          Timing
        </button>
        <button 
          style={tabButtonStyle(activeTab === 'positions')}
          onClick={() => setActiveTab('positions')}
        >
          Positions
        </button>
        <button 
          style={tabButtonStyle(activeTab === 'effects')}
          onClick={() => setActiveTab('effects')}
        >
          Effects
        </button>
        <button 
          style={tabButtonStyle(activeTab === 'material')}
          onClick={() => setActiveTab('material')}
        >
          Material
        </button>
      </div>
      
      {activeTab === 'timing' && renderTimingControls()}
      {activeTab === 'positions' && renderPositionsControls()}
      {activeTab === 'effects' && renderEffectsControls()}
      {activeTab === 'material' && renderMaterialControls()}
      
      <button 
        style={resetButtonStyle}
        onClick={handleReset}
      >
        Reset to Defaults
      </button>
    </div>
  );
};

export default CrystalControls;