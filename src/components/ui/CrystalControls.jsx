// CrystalControls.jsx - Updated for tabbed interface
import { useRef, useState } from 'react';
import * as crystalConfig from '../../crystalConfig';

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

const zoneKeys = ['hero', 'overview', 'about'];
const projectKeys = ['empathy', 'narrative', 'craft', 'system', 'leadership', 'exploration'];

const CrystalControls = ({ config, onUpdate, onSceneRemountRequest }) => {
  const [activeTab, setActiveTab] = useState('timing');
  const [exportStatus, setExportStatus] = useState('');
  const fileInputRef = useRef(null);
  const [cameraAccordionState, setCameraAccordionState] = useState({
    globalOffsets: false,
    hero: true,
    overview: false,
    about: false,
    projects: false
  });
  const [projectAccordionState, setProjectAccordionState] = useState(() =>
    projectKeys.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {})
  );
  const [positionAccordionState, setPositionAccordionState] = useState(() =>
    projectKeys.reduce((acc, key, index) => {
      acc[key] = index === 0;
      return acc;
    }, {})
  );
  
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

  const cloneConfig = () => {
    const base = config ?? crystalConfig;
    return JSON.parse(JSON.stringify(base));
  };

  const sanitizeNumber = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback;
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);

  const sanitizeVec3 = (value, options = {}) => {
    if (!Array.isArray(value) || value.length !== 3) return null;
    const numbers = value.map((entry) => sanitizeNumber(entry, 0));
    if (options.clamp) {
      return numbers.map((entry) => clampNumber(entry, options.clamp[0], options.clamp[1]));
    }
    return numbers;
  };

  const buildTuningPayload = (baseConfig) => {
    const payload = {
      version: 1,
      tuning: {
        cameraPositions: baseConfig.cameraPositions,
        cameraTargets: baseConfig.cameraTargets,
        cameraOffsets: baseConfig.cameraOffsets,
        explodedPositions: baseConfig.explodedPositions,
        facetRotationsEulerDeg: baseConfig.facetRotationsEulerDeg
      }
    };

    if (baseConfig.timing?.camera) {
      payload.tuning.timing = {
        camera: baseConfig.timing.camera
      };
    }

    return payload;
  };

  const applyTuningToConfig = (currentConfig, tuningPayload) => {
    const base = currentConfig ?? crystalConfig;
    const updatedConfig = JSON.parse(JSON.stringify(base));
    const tuning = tuningPayload?.tuning ?? tuningPayload ?? {};

    const updateCameraPositions = (positions) => {
      if (!positions) return;
      zoneKeys.forEach((zone) => {
        const vec = sanitizeVec3(positions[zone]);
        if (vec) updatedConfig.cameraPositions[zone] = vec;
      });
      if (positions.projects) {
        projectKeys.forEach((project) => {
          const vec = sanitizeVec3(positions.projects?.[project]);
          if (vec) updatedConfig.cameraPositions.projects[project] = vec;
        });
      }
    };

    const updateCameraTargets = (targets) => {
      if (!targets) return;
      zoneKeys.forEach((zone) => {
        const vec = sanitizeVec3(targets[zone]);
        if (vec) updatedConfig.cameraTargets[zone] = vec;
      });
      if (targets.projects) {
        projectKeys.forEach((project) => {
          const vec = sanitizeVec3(targets.projects?.[project]);
          if (vec) updatedConfig.cameraTargets.projects[project] = vec;
        });
      }
    };

    const updateCameraOffsets = (offsets) => {
      if (!offsets) return;
      const clamp = [-2, 2];
      if (offsets.global) {
        const position = sanitizeVec3(offsets.global.position, { clamp });
        const target = sanitizeVec3(offsets.global.target, { clamp });
        if (position) updatedConfig.cameraOffsets.global.position = position;
        if (target) updatedConfig.cameraOffsets.global.target = target;
      }
      if (offsets.zones) {
        zoneKeys.forEach((zone) => {
          const zoneOffsets = offsets.zones?.[zone];
          if (!zoneOffsets) return;
          const position = sanitizeVec3(zoneOffsets.position, { clamp });
          const target = sanitizeVec3(zoneOffsets.target, { clamp });
          if (position) updatedConfig.cameraOffsets.zones[zone].position = position;
          if (target) updatedConfig.cameraOffsets.zones[zone].target = target;
        });
      }
      if (offsets.projects) {
        projectKeys.forEach((project) => {
          const projectOffsets = offsets.projects?.[project];
          if (!projectOffsets) return;
          const position = sanitizeVec3(projectOffsets.position, { clamp });
          const target = sanitizeVec3(projectOffsets.target, { clamp });
          if (position) updatedConfig.cameraOffsets.projects[project].position = position;
          if (target) updatedConfig.cameraOffsets.projects[project].target = target;
        });
      }
    };

    const updateExplodedPositions = (positions) => {
      if (!positions) return;
      projectKeys.forEach((project) => {
        const vec = sanitizeVec3(positions?.[project]);
        if (vec) updatedConfig.explodedPositions[project] = vec;
      });
    };

    const updateFacetRotations = (rotations) => {
      if (!rotations) return;
      projectKeys.forEach((project) => {
        const vec = sanitizeVec3(rotations?.[project]);
        if (vec) updatedConfig.facetRotationsEulerDeg[project] = vec;
      });
    };

    const updateTiming = (timing) => {
      if (!timing?.camera) return;
      Object.entries(timing.camera).forEach(([key, value]) => {
        const numericValue = sanitizeNumber(value, null);
        if (numericValue === null) return;
        updatedConfig.timing.camera[key] = numericValue;
      });
    };

    updateCameraPositions(tuning.cameraPositions);
    updateCameraTargets(tuning.cameraTargets);
    updateCameraOffsets(tuning.cameraOffsets);
    updateExplodedPositions(tuning.explodedPositions);
    updateFacetRotations(tuning.facetRotationsEulerDeg);
    updateTiming(tuning.timing);

    return updatedConfig;
  };

  const syncStateFromConfig = (updatedConfig) => {
    setTimingValues({
      'camera.explodeDuration': updatedConfig.timing.camera.explodeDuration,
      'camera.reformDuration': updatedConfig.timing.camera.reformDuration
    });

    setCameraValues({
      'camera.hero': updatedConfig.cameraPositions.hero,
      'camera.overview': updatedConfig.cameraPositions.overview,
      'camera.about': updatedConfig.cameraPositions.about,
      'camera.projects.empathy': updatedConfig.cameraPositions.projects.empathy,
      'camera.projects.narrative': updatedConfig.cameraPositions.projects.narrative,
      'camera.projects.craft': updatedConfig.cameraPositions.projects.craft,
      'camera.projects.system': updatedConfig.cameraPositions.projects.system,
      'camera.projects.leadership': updatedConfig.cameraPositions.projects.leadership,
      'camera.projects.exploration': updatedConfig.cameraPositions.projects.exploration
    });

    setCameraTargetValues({
      'cameraTargets.hero': updatedConfig.cameraTargets.hero,
      'cameraTargets.overview': updatedConfig.cameraTargets.overview,
      'cameraTargets.about': updatedConfig.cameraTargets.about,
      'cameraTargets.projects.empathy': updatedConfig.cameraTargets.projects.empathy,
      'cameraTargets.projects.narrative': updatedConfig.cameraTargets.projects.narrative,
      'cameraTargets.projects.craft': updatedConfig.cameraTargets.projects.craft,
      'cameraTargets.projects.system': updatedConfig.cameraTargets.projects.system,
      'cameraTargets.projects.leadership': updatedConfig.cameraTargets.projects.leadership,
      'cameraTargets.projects.exploration': updatedConfig.cameraTargets.projects.exploration
    });

    setCameraOffsetValues({
      'cameraOffsets.global.position': updatedConfig.cameraOffsets.global.position,
      'cameraOffsets.global.target': updatedConfig.cameraOffsets.global.target,
      'cameraOffsets.zones.hero.position': updatedConfig.cameraOffsets.zones.hero.position,
      'cameraOffsets.zones.hero.target': updatedConfig.cameraOffsets.zones.hero.target,
      'cameraOffsets.zones.overview.position': updatedConfig.cameraOffsets.zones.overview.position,
      'cameraOffsets.zones.overview.target': updatedConfig.cameraOffsets.zones.overview.target,
      'cameraOffsets.zones.about.position': updatedConfig.cameraOffsets.zones.about.position,
      'cameraOffsets.zones.about.target': updatedConfig.cameraOffsets.zones.about.target,
      'cameraOffsets.projects.empathy.position': updatedConfig.cameraOffsets.projects.empathy.position,
      'cameraOffsets.projects.empathy.target': updatedConfig.cameraOffsets.projects.empathy.target,
      'cameraOffsets.projects.narrative.position': updatedConfig.cameraOffsets.projects.narrative.position,
      'cameraOffsets.projects.narrative.target': updatedConfig.cameraOffsets.projects.narrative.target,
      'cameraOffsets.projects.craft.position': updatedConfig.cameraOffsets.projects.craft.position,
      'cameraOffsets.projects.craft.target': updatedConfig.cameraOffsets.projects.craft.target,
      'cameraOffsets.projects.system.position': updatedConfig.cameraOffsets.projects.system.position,
      'cameraOffsets.projects.system.target': updatedConfig.cameraOffsets.projects.system.target,
      'cameraOffsets.projects.leadership.position': updatedConfig.cameraOffsets.projects.leadership.position,
      'cameraOffsets.projects.leadership.target': updatedConfig.cameraOffsets.projects.leadership.target,
      'cameraOffsets.projects.exploration.position': updatedConfig.cameraOffsets.projects.exploration.position,
      'cameraOffsets.projects.exploration.target': updatedConfig.cameraOffsets.projects.exploration.target
    });

    setFacetRotationValues({
      'facetRotationsEulerDeg.empathy': updatedConfig.facetRotationsEulerDeg.empathy,
      'facetRotationsEulerDeg.narrative': updatedConfig.facetRotationsEulerDeg.narrative,
      'facetRotationsEulerDeg.craft': updatedConfig.facetRotationsEulerDeg.craft,
      'facetRotationsEulerDeg.system': updatedConfig.facetRotationsEulerDeg.system,
      'facetRotationsEulerDeg.leadership': updatedConfig.facetRotationsEulerDeg.leadership,
      'facetRotationsEulerDeg.exploration': updatedConfig.facetRotationsEulerDeg.exploration
    });

    setPositionValues({
      'explodedPositions.empathy': updatedConfig.explodedPositions.empathy,
      'explodedPositions.narrative': updatedConfig.explodedPositions.narrative,
      'explodedPositions.craft': updatedConfig.explodedPositions.craft,
      'explodedPositions.system': updatedConfig.explodedPositions.system,
      'explodedPositions.leadership': updatedConfig.explodedPositions.leadership,
      'explodedPositions.exploration': updatedConfig.explodedPositions.exploration
    });
  };

  // Handle timing value changes
  const handleTimingChange = (key, value) => {
    const numValue = parseFloat(value);
    setTimingValues({
      ...timingValues,
      [key]: numValue
    });
    
    // Create updated config
    const updatedConfig = cloneConfig();
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
    const updatedConfig = cloneConfig();
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

    const updatedConfig = cloneConfig();

    if (parts.length === 2) {
      updatedConfig.cameraPositions[parts[1]] = newPosition;
    } else if (parts.length === 3) {
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

    const updatedConfig = cloneConfig();

    if (parts.length === 2) {
      updatedConfig.cameraTargets[parts[1]] = newTarget;
    } else if (parts.length === 3) {
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

    const updatedConfig = cloneConfig();

    if (parts.length === 3) {
      updatedConfig.cameraOffsets[parts[1]][parts[2]] = newOffset;
    } else if (parts.length === 4) {
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

    const updatedConfig = cloneConfig();

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
    
    const updatedConfig = cloneConfig();
    const parts = key.split('.');
    
    if (import.meta.env.DEV) console.log(`Updating effect: ${key} = ${numValue}`);
    
    // This is a bit complex due to nested structure
    if (parts.length === 4) {
      const [section, category, property, subproperty] = parts;
      updatedConfig[section][category][property][subproperty] = numValue;
    } else if (parts.length === 5) {
      const [section, category, subCategory, property, subproperty] = parts;
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
    
    const updatedConfig = cloneConfig();
    const [section, category, property] = key.split('.');
    
    if (import.meta.env.DEV) console.log(`Updating material: ${key} = ${numValue}`);
    
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
    onSceneRemountRequest?.();
  };

  const getTuningPayload = () => {
    const base = config ?? crystalConfig;
    const payload = buildTuningPayload(base);
    return JSON.stringify(payload, null, 2);
  };

  const setExportMessage = (message) => {
    setExportStatus(message);
    window.setTimeout(() => setExportStatus(''), 2500);
  };

  const fallbackCopyText = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    let succeeded = false;
    try {
      succeeded = document.execCommand('copy');
    } catch (error) {
      succeeded = false;
    }

    document.body.removeChild(textarea);
    return succeeded;
  };

  const handleCopyJson = async () => {
    const payload = getTuningPayload();

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        setExportMessage('Copied to clipboard ✅');
        return;
      }
    } catch (error) {
      // Fall through to fallback copy.
    }

    const success = fallbackCopyText(payload);
    setExportMessage(success ? 'Copied to clipboard ✅' : 'Copy failed');
  };

  const handleDownloadJson = () => {
    const payload = getTuningPayload();
    const blob = new Blob([payload], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'tuning.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
    setExportMessage('Downloaded tuning.json ✅');
  };

  const handleLoadJson = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const rawPayload = JSON.parse(text);
      const tuningData = rawPayload?.tuning ?? rawPayload;
      const hasKnownKeys =
        tuningData &&
        (tuningData.cameraPositions ||
          tuningData.cameraTargets ||
          tuningData.cameraOffsets ||
          tuningData.explodedPositions ||
          tuningData.facetRotationsEulerDeg ||
          tuningData.timing);

      if (!hasKnownKeys) {
        throw new Error('Missing tuning data');
      }

      const normalizedPayload = rawPayload?.tuning ? rawPayload : { version: 1, tuning: tuningData };
      const updatedConfig = applyTuningToConfig(config ?? crystalConfig, normalizedPayload);
      syncStateFromConfig(updatedConfig);
      onUpdate(updatedConfig);
      onSceneRemountRequest?.();
      setExportMessage('Loaded preset ✅');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setExportMessage(`Invalid JSON (${message})`);
    }
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

  const exportSectionStyle = {
    marginTop: '20px',
    padding: '12px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)'
  };

  const exportButtonStyle = {
    backgroundColor: 'transparent',
    color: '#64ffda',
    border: '1px solid #64ffda',
    padding: '6px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    flex: 1
  };

  const exportStatusStyle = {
    marginTop: '8px',
    fontSize: '11px',
    color: '#9fe8d8',
    minHeight: '14px'
  };

  const accordionHeaderStyle = (isOpen) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: isOpen ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: 'white',
    padding: '8px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    marginBottom: '10px',
    textAlign: 'left'
  });

  const accordionContentStyle = {
    padding: '0 4px 10px 4px'
  };

  const accordionSectionStyle = {
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const accordionSubheadingStyle = {
    fontSize: '12px',
    marginBottom: '8px',
    color: '#64ffda'
  };

  const accordionNoteStyle = {
    fontSize: '11px',
    color: '#9fe8d8',
    marginBottom: '12px'
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
      <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Exploded Transforms</h3>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <button
          type="button"
          style={exportButtonStyle}
          onClick={() =>
            setPositionAccordionState(
              projectKeys.reduce((acc, key) => {
                acc[key] = true;
                return acc;
              }, {})
            )
          }
        >
          Expand all
        </button>
        <button
          type="button"
          style={exportButtonStyle}
          onClick={() =>
            setPositionAccordionState(
              projectKeys.reduce((acc, key) => {
                acc[key] = false;
                return acc;
              }, {})
            )
          }
        >
          Collapse all
        </button>
      </div>

      {projectKeys.map((facet) => {
        const positionKey = `explodedPositions.${facet}`;
        const rotationKey = `facetRotationsEulerDeg.${facet}`;
        const position = positionValues[positionKey];
        const rotation = facetRotationValues[rotationKey];
        const isOpen = positionAccordionState[facet];
        return (
          <div key={facet} style={{ marginBottom: '15px' }}>
            <button
              type="button"
              style={accordionHeaderStyle(isOpen)}
              onClick={() =>
                setPositionAccordionState({
                  ...positionAccordionState,
                  [facet]: !isOpen
                })
              }
            >
              <span>{facet.charAt(0).toUpperCase() + facet.slice(1)}</span>
              <span>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div style={accordionContentStyle}>
                <div style={accordionSectionStyle}>
                  <div style={accordionSubheadingStyle}>Exploded Position</div>
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
                        onChange={(e) => handlePositionChange(positionKey, index, e.target.value)}
                        style={sliderStyle}
                      />
                    </div>
                  ))}
                </div>

                <div style={accordionSectionStyle}>
                  <div style={accordionSubheadingStyle}>Exploded Rotation</div>
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
                        onChange={(e) => handleFacetRotationChange(rotationKey, index, e.target.value)}
                        style={sliderStyle}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderCameraControls = () => (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <button
          type="button"
          style={exportButtonStyle}
          onClick={() => {
            setCameraAccordionState({
              globalOffsets: true,
              hero: true,
              overview: true,
              about: true,
              projects: true
            });
            setProjectAccordionState(
              projectKeys.reduce((acc, key) => {
                acc[key] = true;
                return acc;
              }, {})
            );
          }}
        >
          Expand all
        </button>
        <button
          type="button"
          style={exportButtonStyle}
          onClick={() => {
            setCameraAccordionState({
              globalOffsets: false,
              hero: false,
              overview: false,
              about: false,
              projects: false
            });
            setProjectAccordionState(
              projectKeys.reduce((acc, key) => {
                acc[key] = false;
                return acc;
              }, {})
            );
          }}
        >
          Collapse all
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button
          type="button"
          style={accordionHeaderStyle(cameraAccordionState.globalOffsets)}
          onClick={() =>
            setCameraAccordionState({
              ...cameraAccordionState,
              globalOffsets: !cameraAccordionState.globalOffsets
            })
          }
        >
          <span>Global Offsets</span>
          <span>{cameraAccordionState.globalOffsets ? '−' : '+'}</span>
        </button>
        {cameraAccordionState.globalOffsets && (
          <div style={accordionContentStyle}>
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
          </div>
        )}
      </div>

      {zoneKeys.map((zone) => {
        const cameraKey = `camera.${zone}`;
        const cameraPosition = cameraValues[cameraKey];
        const targetKey = `cameraTargets.${zone}`;
        const target = cameraTargetValues[targetKey];
        const positionOffsetKey = `cameraOffsets.zones.${zone}.position`;
        const targetOffsetKey = `cameraOffsets.zones.${zone}.target`;
        const positionOffset = cameraOffsetValues[positionOffsetKey];
        const targetOffset = cameraOffsetValues[targetOffsetKey];
        const { distance, yaw, pitch } = getPolarCoords(cameraPosition, getCameraTargetForKey(cameraKey));
        const yawDeg = yaw * RAD2DEG;
        const pitchDeg = pitch * RAD2DEG;
        const isOpen = cameraAccordionState[zone];
        return (
          <div key={zone} style={{ marginBottom: '15px' }}>
            <button
              type="button"
              style={accordionHeaderStyle(isOpen)}
              onClick={() =>
                setCameraAccordionState({
                  ...cameraAccordionState,
                  [zone]: !isOpen
                })
              }
            >
              <span>{zone.charAt(0).toUpperCase() + zone.slice(1)}</span>
              <span>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div style={accordionContentStyle}>
                <div style={accordionSectionStyle}>
                  <div style={accordionSubheadingStyle}>Camera Position</div>
                  {['X', 'Y', 'Z'].map((axis, index) => (
                    <div key={axis} style={{ marginBottom: '5px' }}>
                      <div style={sliderLabelStyle}>
                        <span><span style={coordLabelStyle}>{axis}</span> Position</span>
                        <span>{cameraPosition[index].toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="-5"
                        max="5"
                        step="0.1"
                        value={cameraPosition[index]}
                        onChange={(e) => handleCameraPositionChange(cameraKey, index, e.target.value)}
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
                      onChange={(e) => handleCameraRotationChange(cameraKey, 'yaw', e.target.value)}
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
                      onChange={(e) => handleCameraRotationChange(cameraKey, 'pitch', e.target.value)}
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
                      onChange={(e) => handleCameraDistanceChange(cameraKey, e.target.value)}
                      style={sliderStyle}
                    />
                  </div>
                </div>

                <div style={accordionSectionStyle}>
                  <div style={accordionSubheadingStyle}>Camera Target</div>
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
                        onChange={(e) => handleCameraTargetChange(targetKey, index, e.target.value)}
                        style={sliderStyle}
                      />
                    </div>
                  ))}
                </div>

                <div style={accordionSectionStyle}>
                  <div style={accordionSubheadingStyle}>Camera Offsets</div>
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', marginBottom: '6px', color: '#9fe8d8' }}>
                      Position Offset
                    </div>
                    {['X', 'Y', 'Z'].map((axis, index) => (
                      <div key={axis} style={{ marginBottom: '5px' }}>
                        <div style={sliderLabelStyle}>
                          <span><span style={coordLabelStyle}>{axis}</span> Offset</span>
                          <span>{positionOffset[index].toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="-2"
                          max="2"
                          step="0.05"
                          value={positionOffset[index]}
                          onChange={(e) => handleCameraOffsetChange(positionOffsetKey, index, e.target.value)}
                          style={sliderStyle}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', marginBottom: '6px', color: '#9fe8d8' }}>
                      Target Offset
                    </div>
                    {['X', 'Y', 'Z'].map((axis, index) => (
                      <div key={axis} style={{ marginBottom: '5px' }}>
                        <div style={sliderLabelStyle}>
                          <span><span style={coordLabelStyle}>{axis}</span> Offset</span>
                          <span>{targetOffset[index].toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="-2"
                          max="2"
                          step="0.05"
                          value={targetOffset[index]}
                          onChange={(e) => handleCameraOffsetChange(targetOffsetKey, index, e.target.value)}
                          style={sliderStyle}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ marginBottom: '15px' }}>
        <button
          type="button"
          style={accordionHeaderStyle(cameraAccordionState.projects)}
          onClick={() =>
            setCameraAccordionState({
              ...cameraAccordionState,
              projects: !cameraAccordionState.projects
            })
          }
        >
          <span>Projects</span>
          <span>{cameraAccordionState.projects ? '−' : '+'}</span>
        </button>
        {cameraAccordionState.projects && (
          <div style={accordionContentStyle}>
            <div style={accordionNoteStyle}>
              Project camera targets are anchor-driven. Use Target Offset to fine-tune composition.
            </div>
            {projectKeys.map((project) => {
              const cameraKey = `camera.projects.${project}`;
              const cameraPosition = cameraValues[cameraKey];
              const positionOffsetKey = `cameraOffsets.projects.${project}.position`;
              const targetOffsetKey = `cameraOffsets.projects.${project}.target`;
              const positionOffset = cameraOffsetValues[positionOffsetKey];
              const targetOffset = cameraOffsetValues[targetOffsetKey];
              const { distance, yaw, pitch } = getPolarCoords(cameraPosition, getCameraTargetForKey(cameraKey));
              const yawDeg = yaw * RAD2DEG;
              const pitchDeg = pitch * RAD2DEG;
              const isOpen = projectAccordionState[project];
              return (
                <div key={project} style={{ marginBottom: '12px' }}>
                  <button
                    type="button"
                    style={accordionHeaderStyle(isOpen)}
                    onClick={() =>
                      setProjectAccordionState({
                        ...projectAccordionState,
                        [project]: !isOpen
                      })
                    }
                  >
                    <span>{project.charAt(0).toUpperCase() + project.slice(1)}</span>
                    <span>{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div style={accordionContentStyle}>
                      <div style={accordionSectionStyle}>
                        <div style={accordionSubheadingStyle}>Camera Position</div>
                        {['X', 'Y', 'Z'].map((axis, index) => (
                          <div key={axis} style={{ marginBottom: '5px' }}>
                            <div style={sliderLabelStyle}>
                              <span><span style={coordLabelStyle}>{axis}</span> Position</span>
                              <span>{cameraPosition[index].toFixed(2)}</span>
                            </div>
                            <input
                              type="range"
                              min="-5"
                              max="5"
                              step="0.1"
                              value={cameraPosition[index]}
                              onChange={(e) => handleCameraPositionChange(cameraKey, index, e.target.value)}
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
                            onChange={(e) => handleCameraRotationChange(cameraKey, 'yaw', e.target.value)}
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
                            onChange={(e) => handleCameraRotationChange(cameraKey, 'pitch', e.target.value)}
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
                            onChange={(e) => handleCameraDistanceChange(cameraKey, e.target.value)}
                            style={sliderStyle}
                          />
                        </div>
                      </div>

                      <div style={accordionSectionStyle}>
                        <div style={accordionSubheadingStyle}>Camera Offsets</div>
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', marginBottom: '6px', color: '#9fe8d8' }}>
                            Position Offset
                          </div>
                          {['X', 'Y', 'Z'].map((axis, index) => (
                            <div key={axis} style={{ marginBottom: '5px' }}>
                              <div style={sliderLabelStyle}>
                                <span><span style={coordLabelStyle}>{axis}</span> Offset</span>
                                <span>{positionOffset[index].toFixed(2)}</span>
                              </div>
                              <input
                                type="range"
                                min="-2"
                                max="2"
                                step="0.05"
                                value={positionOffset[index]}
                                onChange={(e) => handleCameraOffsetChange(positionOffsetKey, index, e.target.value)}
                                style={sliderStyle}
                              />
                            </div>
                          ))}
                        </div>

                        <div>
                          <div style={{ fontSize: '12px', marginBottom: '6px', color: '#9fe8d8' }}>
                            Target Offset
                          </div>
                          {['X', 'Y', 'Z'].map((axis, index) => (
                            <div key={axis} style={{ marginBottom: '5px' }}>
                              <div style={sliderLabelStyle}>
                                <span><span style={coordLabelStyle}>{axis}</span> Offset</span>
                                <span>{targetOffset[index].toFixed(2)}</span>
                              </div>
                              <input
                                type="range"
                                min="-2"
                                max="2"
                                step="0.05"
                                value={targetOffset[index]}
                                onChange={(e) => handleCameraOffsetChange(targetOffsetKey, index, e.target.value)}
                                style={sliderStyle}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
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
      </div>

      {activeTab === 'timing' && renderTimingControls()}
      {activeTab === 'positions' && renderPositionsControls()}
      {activeTab === 'camera' && renderCameraControls()}
      {activeTab === 'effects' && renderEffectsControls()}
      {activeTab === 'material' && renderMaterialControls()}

      <div style={exportSectionStyle}>
        <h3 style={{ fontSize: '13px', margin: '0 0 10px 0' }}>Export / Copy Tuning JSON</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            style={exportButtonStyle}
            onClick={handleCopyJson}
          >
            Copy JSON
          </button>
          <button
            type="button"
            style={exportButtonStyle}
            onClick={handleDownloadJson}
          >
            Download JSON
          </button>
          <button
            type="button"
            style={exportButtonStyle}
            onClick={() => fileInputRef.current?.click()}
          >
            Load JSON
          </button>
        </div>
        <div style={exportStatusStyle}>{exportStatus}</div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={handleLoadJson}
        />
      </div>
      
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
