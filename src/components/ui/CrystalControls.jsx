// CrystalControls.jsx - Updated for tabbed interface
import { useState } from 'react';
import * as crystalConfig from '../../crystalConfig';

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

const zoneKeys = ['hero', 'overview', 'about'];
const projectKeys = ['empathy', 'narrative', 'craft', 'system', 'leadership', 'exploration'];

const CrystalControls = ({ config, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('timing');
  
  // Timing state
  const [timingValues, setTimingValues] = useState({
    'camera.explodeDuration': crystalConfig.timing.camera.explodeDuration,
    'camera.reformDuration': crystalConfig.timing.camera.reformDuration
  });

  // Camera position state
  const [cameraValues, setCameraValues] = useState({
    'camera.hero': crystalConfig.cameraPositions.hero,
    'camera.overview': crystalConfig.cameraPositions.overview,
    'camera.about': crystalConfig.cameraPositions.about,
    'camera.projects.empathy': crystalConfig.cameraPositions.projects.empathy,
    'camera.projects.narrative': crystalConfig.cameraPositions.projects.narrative,
    'camera.projects.craft': crystalConfig.cameraPositions.projects.craft,
    'camera.projects.system': crystalConfig.cameraPositions.projects.system,
    'camera.projects.leadership': crystalConfig.cameraPositions.projects.leadership,
    'camera.projects.exploration': crystalConfig.cameraPositions.projects.exploration
  });

  const [cameraTargetValues, setCameraTargetValues] = useState({
    'cameraTargets.hero': crystalConfig.cameraTargets.hero,
    'cameraTargets.overview': crystalConfig.cameraTargets.overview,
    'cameraTargets.about': crystalConfig.cameraTargets.about,
    'cameraTargets.projects.empathy': crystalConfig.cameraTargets.projects.empathy,
    'cameraTargets.projects.narrative': crystalConfig.cameraTargets.projects.narrative,
    'cameraTargets.projects.craft': crystalConfig.cameraTargets.projects.craft,
    'cameraTargets.projects.system': crystalConfig.cameraTargets.projects.system,
    'cameraTargets.projects.leadership': crystalConfig.cameraTargets.projects.leadership,
    'cameraTargets.projects.exploration': crystalConfig.cameraTargets.projects.exploration
  });

  const [cameraOffsetValues, setCameraOffsetValues] = useState({
    'cameraOffsets.global.position': crystalConfig.cameraOffsets.global.position,
    'cameraOffsets.global.target': crystalConfig.cameraOffsets.global.target,
    'cameraOffsets.zones.hero.position': crystalConfig.cameraOffsets.zones.hero.position,
    'cameraOffsets.zones.hero.target': crystalConfig.cameraOffsets.zones.hero.target,
    'cameraOffsets.zones.overview.position': crystalConfig.cameraOffsets.zones.overview.position,
    'cameraOffsets.zones.overview.target': crystalConfig.cameraOffsets.zones.overview.target,
    'cameraOffsets.zones.about.position': crystalConfig.cameraOffsets.zones.about.position,
    'cameraOffsets.zones.about.target': crystalConfig.cameraOffsets.zones.about.target,
    'cameraOffsets.projects.empathy.position': crystalConfig.cameraOffsets.projects.empathy.position,
    'cameraOffsets.projects.empathy.target': crystalConfig.cameraOffsets.projects.empathy.target,
    'cameraOffsets.projects.narrative.position': crystalConfig.cameraOffsets.projects.narrative.position,
    'cameraOffsets.projects.narrative.target': crystalConfig.cameraOffsets.projects.narrative.target,
    'cameraOffsets.projects.craft.position': crystalConfig.cameraOffsets.projects.craft.position,
    'cameraOffsets.projects.craft.target': crystalConfig.cameraOffsets.projects.craft.target,
    'cameraOffsets.projects.system.position': crystalConfig.cameraOffsets.projects.system.position,
    'cameraOffsets.projects.system.target': crystalConfig.cameraOffsets.projects.system.target,
    'cameraOffsets.projects.leadership.position': crystalConfig.cameraOffsets.projects.leadership.position,
    'cameraOffsets.projects.leadership.target': crystalConfig.cameraOffsets.projects.leadership.target,
    'cameraOffsets.projects.exploration.position': crystalConfig.cameraOffsets.projects.exploration.position,
    'cameraOffsets.projects.exploration.target': crystalConfig.cameraOffsets.projects.exploration.target
  });

  const [facetRotationValues, setFacetRotationValues] = useState({
    'facetRotationsEulerDeg.empathy': crystalConfig.facetRotationsEulerDeg.empathy,
    'facetRotationsEulerDeg.narrative': crystalConfig.facetRotationsEulerDeg.narrative,
    'facetRotationsEulerDeg.craft': crystalConfig.facetRotationsEulerDeg.craft,
    'facetRotationsEulerDeg.system': crystalConfig.facetRotationsEulerDeg.system,
    'facetRotationsEulerDeg.leadership': crystalConfig.facetRotationsEulerDeg.leadership,
    'facetRotationsEulerDeg.exploration': crystalConfig.facetRotationsEulerDeg.exploration
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
    const base = config ?? crystalConfig;
    const updatedConfig = JSON.parse(JSON.stringify(base));
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
    const base = config ?? crystalConfig;
    const updatedConfig = JSON.parse(JSON.stringify(base));
    updatedConfig[section][facet] = newPosition;
    
    // Notify parent component
    onUpdate(updatedConfig);
  };

  const updateCameraPosition = (key, newPosition) => {
    const parts = key.split('.');
    setCameraValues({
      ...cameraValues,
      [key]: newPosition
    });

    const base = config ?? crystalConfig;
    const updatedConfig = JSON.parse(JSON.stringify(base));

    if (parts.length === 2) {
      updatedConfig.cameraPositions[parts[1]] = newPosition;
    } else if (parts.length === 3) {
      if (!updatedConfig.cameraPositions[parts[1]]) {
        updatedConfig.cameraPositions[parts[1]] = { ...base.cameraPositions[parts[1]] };
      }
      updatedConfig.cameraPositions[parts[1]][parts[2]] = newPosition;
    }

    onUpdate(updatedConfig);
  };

  const getCameraTargetForKey = (cameraKey) => {
    const targetKey = cameraKey.replace('camera.', 'cameraTargets.');
    if (cameraTargetValues[targetKey]) {
      return cameraTargetValues[targetKey];
    }
    const parts = targetKey.split('.');
    if (parts.length === 2) {
      return crystalConfig.cameraTargets[parts[1]] ?? [0, 0, 0];
    }
    if (parts.length === 3) {
      return crystalConfig.cameraTargets[parts[1]]?.[parts[2]] ?? [0, 0, 0];
    }
    return [0, 0, 0];
  };

  const updateCameraTarget = (key, newTarget) => {
    const parts = key.split('.');
    setCameraTargetValues({
      ...cameraTargetValues,
      [key]: newTarget
    });

    const updatedConfig = { ...crystalConfig };
    updatedConfig.cameraTargets = { ...crystalConfig.cameraTargets };

    if (parts.length === 2) {
      updatedConfig.cameraTargets[parts[1]] = newTarget;
    } else if (parts.length === 3) {
      updatedConfig.cameraTargets[parts[1]] = {
        ...crystalConfig.cameraTargets[parts[1]]
      };
      updatedConfig.cameraTargets[parts[1]][parts[2]] = newTarget;
    }

    onUpdate(updatedConfig);
  };

  const handleCameraTargetChange = (key, index, value) => {
    const numValue = parseFloat(value);
    const newTarget = [...cameraTargetValues[key]];
    newTarget[index] = numValue;
    updateCameraTarget(key, newTarget);
  };

  const updateCameraOffset = (key, newOffset) => {
    const parts = key.split('.');
    setCameraOffsetValues({
      ...cameraOffsetValues,
      [key]: newOffset
    });

    const updatedConfig = { ...crystalConfig };
    updatedConfig.cameraOffsets = { ...crystalConfig.cameraOffsets };

    if (parts.length === 3) {
      updatedConfig.cameraOffsets[parts[1]] = {
        ...crystalConfig.cameraOffsets[parts[1]]
      };
      updatedConfig.cameraOffsets[parts[1]][parts[2]] = newOffset;
    } else if (parts.length === 4) {
      updatedConfig.cameraOffsets[parts[1]] = {
        ...crystalConfig.cameraOffsets[parts[1]]
      };
      updatedConfig.cameraOffsets[parts[1]][parts[2]] = {
        ...crystalConfig.cameraOffsets[parts[1]][parts[2]]
      };
      updatedConfig.cameraOffsets[parts[1]][parts[2]][parts[3]] = newOffset;
    }

    onUpdate(updatedConfig);
  };

  const handleCameraOffsetChange = (key, index, value) => {
    const numValue = parseFloat(value);
    const newOffset = [...cameraOffsetValues[key]];
    newOffset[index] = numValue;
    updateCameraOffset(key, newOffset);
  };

  const updateFacetRotation = (key, newRotation) => {
    const parts = key.split('.');
    setFacetRotationValues({
      ...facetRotationValues,
      [key]: newRotation
    });

    const updatedConfig = { ...crystalConfig };
    updatedConfig.facetRotationsEulerDeg = { ...crystalConfig.facetRotationsEulerDeg };

    if (parts.length === 2) {
      updatedConfig.facetRotationsEulerDeg[parts[1]] = newRotation;
    }

    onUpdate(updatedConfig);
  };

  const handleFacetRotationChange = (key, index, value) => {
    const numValue = parseFloat(value);
    const newRotation = [...facetRotationValues[key]];
    newRotation[index] = numValue;
    updateFacetRotation(key, newRotation);
  };

  // Handle camera position value changes for XYZ sliders
  const handleCameraPositionChange = (key, index, value) => {
    const numValue = parseFloat(value);
    const newPosition = [...cameraValues[key]];
    newPosition[index] = numValue;
    updateCameraPosition(key, newPosition);
  };

  // Convert Cartesian coordinates to polar (distance, yaw, pitch)
  const getPolarCoords = (position, target) => {
    const dx = position[0] - target[0];
    const dy = position[1] - target[1];
    const dz = position[2] - target[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const yaw = Math.atan2(dx, dz);
    const pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
    return { distance, yaw, pitch };
  };

  const updateFromPolar = (key, { distance, yaw, pitch }) => {
    const target = getCameraTargetForKey(key);
    const horizontal = distance * Math.cos(pitch);
    const x = target[0] + horizontal * Math.sin(yaw);
    const z = target[2] + horizontal * Math.cos(yaw);
    const y = target[1] + distance * Math.sin(pitch);
    updateCameraPosition(key, [x, y, z]);
  };

  const handleCameraRotationChange = (key, axis, value) => {
    const target = getCameraTargetForKey(key);
    const { distance, yaw, pitch } = getPolarCoords(cameraValues[key], target);
    if (axis === 'yaw') {
      updateFromPolar(key, { distance, yaw: parseFloat(value) * DEG2RAD, pitch });
    } else if (axis === 'pitch') {
      updateFromPolar(key, { distance, yaw, pitch: parseFloat(value) * DEG2RAD });
    }
  };

  const handleCameraDistanceChange = (key, value) => {
    const target = getCameraTargetForKey(key);
    const { yaw, pitch } = getPolarCoords(cameraValues[key], target);
    updateFromPolar(key, { distance: parseFloat(value), yaw, pitch });
  };

  // Handle effect value changes
  const handleEffectChange = (key, value) => {
    const numValue = parseFloat(value);
    setEffectValues({
      ...effectValues,
      [key]: numValue
    });
    
    // Create a copy of the config - careful not to lose references to complex objects
    const base = config ?? crystalConfig;
    const updatedConfig = JSON.parse(JSON.stringify(base));
    const parts = key.split('.');
    
    if (import.meta.env.DEV) console.log(`Updating effect: ${key} = ${numValue}`);
    
    // This is a bit complex due to nested structure
    if (parts.length === 4) {
      const [section, category, property, subproperty] = parts;
      
      // Ensure the parent objects exist, but preserve references
      if (!updatedConfig[section]) updatedConfig[section] = {};
      if (!updatedConfig[section][category]) updatedConfig[section][category] = { ...base[section]?.[category] };
      if (!updatedConfig[section][category][property]) updatedConfig[section][category][property] = { ...base[section]?.[category]?.[property] };
      
      // Update the value
      updatedConfig[section][category][property][subproperty] = numValue;
    } else if (parts.length === 5) {
      const [section, category, subCategory, property, subproperty] = parts;
      
      // Ensure the parent objects exist, but preserve references
      if (!updatedConfig[section]) updatedConfig[section] = {};
      if (!updatedConfig[section][category]) updatedConfig[section][category] = { ...base[section]?.[category] };
      if (!updatedConfig[section][category][subCategory]) updatedConfig[section][category][subCategory] = { ...base[section]?.[category]?.[subCategory] };
      if (!updatedConfig[section][category][subCategory][property]) updatedConfig[section][category][subCategory][property] = { ...base[section]?.[category]?.[subCategory]?.[property] };
      
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
    const base = config ?? crystalConfig;
    const updatedConfig = JSON.parse(JSON.stringify(base));
    const [section, category, property] = key.split('.');
    
    if (import.meta.env.DEV) console.log(`Updating material: ${key} = ${numValue}`);
    
    // Ensure parent objects exist
    if (!updatedConfig[section]) updatedConfig[section] = {};
    if (!updatedConfig[section][category]) updatedConfig[section][category] = { ...base[section]?.[category] };
    
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
    });

    setCameraValues({
      'camera.hero': crystalConfig.cameraPositions.hero,
      'camera.overview': crystalConfig.cameraPositions.overview,
      'camera.about': crystalConfig.cameraPositions.about,
      'camera.projects.empathy': crystalConfig.cameraPositions.projects.empathy,
      'camera.projects.narrative': crystalConfig.cameraPositions.projects.narrative,
      'camera.projects.craft': crystalConfig.cameraPositions.projects.craft,
      'camera.projects.system': crystalConfig.cameraPositions.projects.system,
      'camera.projects.leadership': crystalConfig.cameraPositions.projects.leadership,
      'camera.projects.exploration': crystalConfig.cameraPositions.projects.exploration,
    });

    setCameraTargetValues({
      'cameraTargets.hero': crystalConfig.cameraTargets.hero,
      'cameraTargets.overview': crystalConfig.cameraTargets.overview,
      'cameraTargets.about': crystalConfig.cameraTargets.about,
      'cameraTargets.projects.empathy': crystalConfig.cameraTargets.projects.empathy,
      'cameraTargets.projects.narrative': crystalConfig.cameraTargets.projects.narrative,
      'cameraTargets.projects.craft': crystalConfig.cameraTargets.projects.craft,
      'cameraTargets.projects.system': crystalConfig.cameraTargets.projects.system,
      'cameraTargets.projects.leadership': crystalConfig.cameraTargets.projects.leadership,
      'cameraTargets.projects.exploration': crystalConfig.cameraTargets.projects.exploration
    });

    setCameraOffsetValues({
      'cameraOffsets.global.position': crystalConfig.cameraOffsets.global.position,
      'cameraOffsets.global.target': crystalConfig.cameraOffsets.global.target,
      'cameraOffsets.zones.hero.position': crystalConfig.cameraOffsets.zones.hero.position,
      'cameraOffsets.zones.hero.target': crystalConfig.cameraOffsets.zones.hero.target,
      'cameraOffsets.zones.overview.position': crystalConfig.cameraOffsets.zones.overview.position,
      'cameraOffsets.zones.overview.target': crystalConfig.cameraOffsets.zones.overview.target,
      'cameraOffsets.zones.about.position': crystalConfig.cameraOffsets.zones.about.position,
      'cameraOffsets.zones.about.target': crystalConfig.cameraOffsets.zones.about.target,
      'cameraOffsets.projects.empathy.position': crystalConfig.cameraOffsets.projects.empathy.position,
      'cameraOffsets.projects.empathy.target': crystalConfig.cameraOffsets.projects.empathy.target,
      'cameraOffsets.projects.narrative.position': crystalConfig.cameraOffsets.projects.narrative.position,
      'cameraOffsets.projects.narrative.target': crystalConfig.cameraOffsets.projects.narrative.target,
      'cameraOffsets.projects.craft.position': crystalConfig.cameraOffsets.projects.craft.position,
      'cameraOffsets.projects.craft.target': crystalConfig.cameraOffsets.projects.craft.target,
      'cameraOffsets.projects.system.position': crystalConfig.cameraOffsets.projects.system.position,
      'cameraOffsets.projects.system.target': crystalConfig.cameraOffsets.projects.system.target,
      'cameraOffsets.projects.leadership.position': crystalConfig.cameraOffsets.projects.leadership.position,
      'cameraOffsets.projects.leadership.target': crystalConfig.cameraOffsets.projects.leadership.target,
      'cameraOffsets.projects.exploration.position': crystalConfig.cameraOffsets.projects.exploration.position,
      'cameraOffsets.projects.exploration.target': crystalConfig.cameraOffsets.projects.exploration.target
    });

    setFacetRotationValues({
      'facetRotationsEulerDeg.empathy': crystalConfig.facetRotationsEulerDeg.empathy,
      'facetRotationsEulerDeg.narrative': crystalConfig.facetRotationsEulerDeg.narrative,
      'facetRotationsEulerDeg.craft': crystalConfig.facetRotationsEulerDeg.craft,
      'facetRotationsEulerDeg.system': crystalConfig.facetRotationsEulerDeg.system,
      'facetRotationsEulerDeg.leadership': crystalConfig.facetRotationsEulerDeg.leadership,
      'facetRotationsEulerDeg.exploration': crystalConfig.facetRotationsEulerDeg.exploration
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
    fontFamily: '"acumin-variable", sans-serif',
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

  const renderCameraControls = () => (
    <div>
      <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Camera Positions</h3>

      {Object.entries(cameraValues).map(([key, position]) => {
        const parts = key.split('.');
        const label = parts.length === 2 ? parts[1] : parts[2];
        const target = getCameraTargetForKey(key);
        const { distance, yaw, pitch } = getPolarCoords(position, target);
        const yawDeg = yaw * RAD2DEG;
        const pitchDeg = pitch * RAD2DEG;
        return (
          <div key={key} style={sliderGroupStyle}>
            <div style={{ fontSize: '13px', marginBottom: '8px', color: '#64ffda' }}>
              {label.charAt(0).toUpperCase() + label.slice(1)}
            </div>

            {['X', 'Y', 'Z'].map((axis, index) => (
              <div key={axis} style={{ marginBottom: '5px' }}>
                <div style={sliderLabelStyle}>
                  <span><span style={coordLabelStyle}>{axis}</span> Position</span>
                  <span>{position[index].toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.1"
                  value={position[index]}
                  onChange={(e) => handleCameraPositionChange(key, index, e.target.value)}
                  style={sliderStyle}
                />
              </div>
            ))}

            <div style={{ marginBottom: '5px' }}>
              <div style={sliderLabelStyle}>
                <span>Yaw</span>
                <span>{yawDeg.toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={yawDeg}
                onChange={(e) => handleCameraRotationChange(key, 'yaw', e.target.value)}
                style={sliderStyle}
              />
            </div>

            <div style={{ marginBottom: '5px' }}>
              <div style={sliderLabelStyle}>
                <span>Pitch</span>
                <span>{pitchDeg.toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min="-89"
                max="89"
                step="1"
                value={pitchDeg}
                onChange={(e) => handleCameraRotationChange(key, 'pitch', e.target.value)}
                style={sliderStyle}
              />
            </div>

            <div style={{ marginBottom: '5px' }}>
              <div style={sliderLabelStyle}>
                <span>Distance</span>
                <span>{distance.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15"
                step="0.1"
                value={distance}
                onChange={(e) => handleCameraDistanceChange(key, e.target.value)}
                style={sliderStyle}
              />
            </div>
          </div>
        );
      })}

      <h3 style={{ fontSize: '14px', margin: '20px 0 15px' }}>Camera Targets (Zones)</h3>
      {zoneKeys.map((zone) => {
        const key = `cameraTargets.${zone}`;
        const target = cameraTargetValues[key];
        return (
          <div key={key} style={sliderGroupStyle}>
            <div style={{ fontSize: '13px', marginBottom: '8px', color: '#64ffda' }}>
              {zone.charAt(0).toUpperCase() + zone.slice(1)}
            </div>

            {['X', 'Y', 'Z'].map((axis, index) => (
              <div key={axis} style={{ marginBottom: '5px' }}>
                <div style={sliderLabelStyle}>
                  <span><span style={coordLabelStyle}>{axis}</span> Target</span>
                  <span>{target[index].toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.1"
                  value={target[index]}
                  onChange={(e) => handleCameraTargetChange(key, index, e.target.value)}
                  style={sliderStyle}
                />
              </div>
            ))}
          </div>
        );
      })}

      <h3 style={{ fontSize: '14px', margin: '20px 0 15px' }}>Camera Targets (Projects)</h3>
      {projectKeys.map((project) => {
        const key = `cameraTargets.projects.${project}`;
        const target = cameraTargetValues[key];
        return (
          <div key={key} style={sliderGroupStyle}>
            <div style={{ fontSize: '13px', marginBottom: '8px', color: '#64ffda' }}>
              {project.charAt(0).toUpperCase() + project.slice(1)}
            </div>

            {['X', 'Y', 'Z'].map((axis, index) => (
              <div key={axis} style={{ marginBottom: '5px' }}>
                <div style={sliderLabelStyle}>
                  <span><span style={coordLabelStyle}>{axis}</span> Target</span>
                  <span>{target[index].toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.1"
                  value={target[index]}
                  onChange={(e) => handleCameraTargetChange(key, index, e.target.value)}
                  style={sliderStyle}
                />
              </div>
            ))}
          </div>
        );
      })}

      <h3 style={{ fontSize: '14px', margin: '20px 0 15px' }}>Camera Offsets (Global)</h3>
      {['position', 'target'].map((offsetType) => {
        const key = `cameraOffsets.global.${offsetType}`;
        const offset = cameraOffsetValues[key];
        return (
          <div key={key} style={sliderGroupStyle}>
            <div style={{ fontSize: '13px', marginBottom: '8px', color: '#64ffda' }}>
              Global {offsetType.charAt(0).toUpperCase() + offsetType.slice(1)}
            </div>

            {['X', 'Y', 'Z'].map((axis, index) => (
              <div key={axis} style={{ marginBottom: '5px' }}>
                <div style={sliderLabelStyle}>
                  <span><span style={coordLabelStyle}>{axis}</span> Offset</span>
                  <span>{offset[index].toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.05"
                  value={offset[index]}
                  onChange={(e) => handleCameraOffsetChange(key, index, e.target.value)}
                  style={sliderStyle}
                />
              </div>
            ))}
          </div>
        );
      })}

      <h3 style={{ fontSize: '14px', margin: '20px 0 15px' }}>Camera Offsets (Zones)</h3>
      {zoneKeys.map((zone) => (
        <div key={zone} style={sliderGroupStyle}>
          <div style={{ fontSize: '13px', marginBottom: '8px', color: '#64ffda' }}>
            {zone.charAt(0).toUpperCase() + zone.slice(1)}
          </div>

          {['position', 'target'].map((offsetType) => {
            const key = `cameraOffsets.zones.${zone}.${offsetType}`;
            const offset = cameraOffsetValues[key];
            return (
              <div key={key} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', marginBottom: '6px', color: '#9fe8d8' }}>
                  {offsetType.charAt(0).toUpperCase() + offsetType.slice(1)}
                </div>
                {['X', 'Y', 'Z'].map((axis, index) => (
                  <div key={axis} style={{ marginBottom: '5px' }}>
                    <div style={sliderLabelStyle}>
                      <span><span style={coordLabelStyle}>{axis}</span> Offset</span>
                      <span>{offset[index].toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.05"
                      value={offset[index]}
                      onChange={(e) => handleCameraOffsetChange(key, index, e.target.value)}
                      style={sliderStyle}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}

      <h3 style={{ fontSize: '14px', margin: '20px 0 15px' }}>Camera Offsets (Projects)</h3>
      {projectKeys.map((project) => (
        <div key={project} style={sliderGroupStyle}>
          <div style={{ fontSize: '13px', marginBottom: '8px', color: '#64ffda' }}>
            {project.charAt(0).toUpperCase() + project.slice(1)}
          </div>

          {['position', 'target'].map((offsetType) => {
            const key = `cameraOffsets.projects.${project}.${offsetType}`;
            const offset = cameraOffsetValues[key];
            return (
              <div key={key} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', marginBottom: '6px', color: '#9fe8d8' }}>
                  {offsetType.charAt(0).toUpperCase() + offsetType.slice(1)}
                </div>
                {['X', 'Y', 'Z'].map((axis, index) => (
                  <div key={axis} style={{ marginBottom: '5px' }}>
                    <div style={sliderLabelStyle}>
                      <span><span style={coordLabelStyle}>{axis}</span> Offset</span>
                      <span>{offset[index].toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.05"
                      value={offset[index]}
                      onChange={(e) => handleCameraOffsetChange(key, index, e.target.value)}
                      style={sliderStyle}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  const renderFacetRotationControls = () => (
    <div>
      <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Facet Rotations (Euler Degrees)</h3>

      {projectKeys.map((facet) => {
        const key = `facetRotationsEulerDeg.${facet}`;
        const rotation = facetRotationValues[key];
        return (
          <div key={key} style={sliderGroupStyle}>
            <div style={{ fontSize: '13px', marginBottom: '8px', color: '#64ffda' }}>
              {facet.charAt(0).toUpperCase() + facet.slice(1)}
            </div>

            {['X', 'Y', 'Z'].map((axis, index) => (
              <div key={axis} style={{ marginBottom: '5px' }}>
                <div style={sliderLabelStyle}>
                  <span><span style={coordLabelStyle}>{axis}</span> Rotation</span>
                  <span>{rotation[index].toFixed(0)}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={rotation[index]}
                  onChange={(e) => handleFacetRotationChange(key, index, e.target.value)}
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
          style={tabButtonStyle(activeTab === 'camera')}
          onClick={() => setActiveTab('camera')}
        >
          Camera
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
        <button
          style={tabButtonStyle(activeTab === 'facets')}
          onClick={() => setActiveTab('facets')}
        >
          Facets
        </button>
      </div>

      {activeTab === 'timing' && renderTimingControls()}
      {activeTab === 'positions' && renderPositionsControls()}
      {activeTab === 'camera' && renderCameraControls()}
      {activeTab === 'effects' && renderEffectsControls()}
      {activeTab === 'material' && renderMaterialControls()}
      {activeTab === 'facets' && renderFacetRotationControls()}
      
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
