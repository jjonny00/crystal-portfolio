// CrystalControls.jsx - Updated for tabbed interface
import { useRef, useState } from 'react';
import * as THREE from 'three';
import * as crystalConfig from '../../crystalConfig';
import { isMobileDevice } from '../../utils/isMobileDevice';
import { getProjectIdBySceneFacetKey, getSceneFacetKeyByProjectId } from '../../data/projects';
import desktopLayoutJson from '../../config/layout/desktop.json';
import mobileLayoutJson from '../../config/layout/mobile.json';

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

const zoneKeys = ['intro', 'hero', 'overview', 'about'];
const projectKeys = ['empathy', 'narrative', 'craft', 'system', 'leadership', 'exploration'];
const projectCameraKeys = ['project01', 'project02', 'project03', 'project04', 'project05', 'project06'];
const getProjectDisplayLabel = (sceneFacetKey) => getProjectIdBySceneFacetKey(sceneFacetKey) || sceneFacetKey;
const DEFAULT_SHARD_TUNING = {
  spreadMultiplier: 1.45,
  largeDistanceCenter: 0.6,
  mediumDistanceCenter: 0.6,
  smallDistanceCenter: 0.58,
  distanceJitter: 0.3,
  opacityMultiplier: 0.9,
  smallScaleBase: 0.02,
  mediumScaleBase: 0.03,
  largeScaleBase: 0.13,
  smallScaleJitter: 0.05,
  mediumScaleJitter: 0.09,
  largeScaleJitter: 0.06,
  rotationBaseDeg: 32,
  rotationJitterDeg: 0
};

const CrystalControls = ({ config, onUpdate, onRestartScene = null }) => {
  const [activeTab, setActiveTab] = useState('timing');
  const [exportStatus, setExportStatus] = useState('');
  const fileInputRef = useRef(null);
  const [cameraAccordionState, setCameraAccordionState] = useState({
    globalOffsets: false,
    intro: true,
    hero: false,
    overview: false,
    about: false,
    projects: false
  });
  const [projectAccordionState, setProjectAccordionState] = useState(() =>
    projectCameraKeys.reduce((acc, key) => {
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
  const [projectCameraMode, setProjectCameraMode] = useState('selected');
  const editDeviceKey = isMobileDevice() ? 'mobile' : 'desktop';
  
  // Timing state
  const [timingValues, setTimingValues] = useState({
    'camera.explodeDuration': crystalConfig.timing.camera.explodeDuration,
    'camera.reformDuration': crystalConfig.timing.camera.reformDuration
  });

  // Camera position state
  const [cameraValues, setCameraValues] = useState({
    'camera.intro': crystalConfig.cameraPositions.intro,
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
    'cameraTargets.intro': crystalConfig.cameraTargets.intro,
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
    'cameraOffsets.zones.intro.position': crystalConfig.cameraOffsets.zones.intro.position,
    'cameraOffsets.zones.hero.position': crystalConfig.cameraOffsets.zones.hero.position,
    'cameraOffsets.zones.intro.target': crystalConfig.cameraOffsets.zones.intro.target,
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

  const [selectedFacetRotationValues, setSelectedFacetRotationValues] = useState({
    'selectedFacetRotationsEulerDeg.empathy': crystalConfig.selectedFacetRotationsEulerDeg.empathy,
    'selectedFacetRotationsEulerDeg.narrative': crystalConfig.selectedFacetRotationsEulerDeg.narrative,
    'selectedFacetRotationsEulerDeg.craft': crystalConfig.selectedFacetRotationsEulerDeg.craft,
    'selectedFacetRotationsEulerDeg.system': crystalConfig.selectedFacetRotationsEulerDeg.system,
    'selectedFacetRotationsEulerDeg.leadership': crystalConfig.selectedFacetRotationsEulerDeg.leadership,
    'selectedFacetRotationsEulerDeg.exploration': crystalConfig.selectedFacetRotationsEulerDeg.exploration
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
  const [shardValues, setShardValues] = useState({
    ...DEFAULT_SHARD_TUNING,
    ...(config?.shardTuning || {})
  });

  const normalizeCrystalConfig = (input) => {
    const base = input ?? crystalConfig;
    const cloneVec3 = (value) => (Array.isArray(value) ? [...value] : value);
    const cloneOffsetGroup = (group) => Object.fromEntries(
      Object.entries(group ?? {}).map(([key, value]) => [
        key,
        {
          position: cloneVec3(value?.position),
          target: cloneVec3(value?.target)
        }
      ])
    );
    const normalizeColor = (value) => {
      if (!value) return value;
      if (value.isColor && typeof value.clone === 'function') {
        return value.clone();
      }
      try {
        return new THREE.Color(value);
      } catch {
        if (typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
          return new THREE.Color(value.r, value.g, value.b);
        }
      }
      return value;
    };
    const cloneMaterials = (materials) => {
      if (!materials) return materials;
      return {
        ...materials,
        crystal: {
          ...materials.crystal,
          color: normalizeColor(materials.crystal?.color),
          emissive: normalizeColor(materials.crystal?.emissive),
          attenuationColor: normalizeColor(materials.crystal?.attenuationColor),
          specularColor: normalizeColor(materials.crystal?.specularColor)
        },
        textures: {
          ...materials.textures,
          normalMap: {
            ...materials.textures?.normalMap,
            repeat: Array.isArray(materials.textures?.normalMap?.repeat)
              ? [...materials.textures.normalMap.repeat]
              : materials.textures?.normalMap?.repeat
          }
        }
      };
    };

    return {
      ...base,
      cameraPositions: {
        ...base.cameraPositions,
        intro: cloneVec3(base.cameraPositions?.intro),
        hero: cloneVec3(base.cameraPositions?.hero),
        overview: cloneVec3(base.cameraPositions?.overview),
        about: cloneVec3(base.cameraPositions?.about),
        projects: {
          ...base.cameraPositions?.projects,
          empathy: cloneVec3(base.cameraPositions?.projects?.empathy),
          narrative: cloneVec3(base.cameraPositions?.projects?.narrative),
          craft: cloneVec3(base.cameraPositions?.projects?.craft),
          system: cloneVec3(base.cameraPositions?.projects?.system),
          leadership: cloneVec3(base.cameraPositions?.projects?.leadership),
          exploration: cloneVec3(base.cameraPositions?.projects?.exploration)
        }
      },
      cameraTargets: {
        ...base.cameraTargets,
        intro: cloneVec3(base.cameraTargets?.intro),
        hero: cloneVec3(base.cameraTargets?.hero),
        overview: cloneVec3(base.cameraTargets?.overview),
        about: cloneVec3(base.cameraTargets?.about),
        projects: {
          ...base.cameraTargets?.projects,
          empathy: cloneVec3(base.cameraTargets?.projects?.empathy),
          narrative: cloneVec3(base.cameraTargets?.projects?.narrative),
          craft: cloneVec3(base.cameraTargets?.projects?.craft),
          system: cloneVec3(base.cameraTargets?.projects?.system),
          leadership: cloneVec3(base.cameraTargets?.projects?.leadership),
          exploration: cloneVec3(base.cameraTargets?.projects?.exploration)
        }
      },
      cameraOffsets: {
        ...base.cameraOffsets,
        global: {
          position: cloneVec3(base.cameraOffsets?.global?.position),
          target: cloneVec3(base.cameraOffsets?.global?.target)
        },
        zones: cloneOffsetGroup(base.cameraOffsets?.zones),
        projects: cloneOffsetGroup(base.cameraOffsets?.projects)
      },
      explodedPositions: {
        ...base.explodedPositions,
        empathy: cloneVec3(base.explodedPositions?.empathy),
        narrative: cloneVec3(base.explodedPositions?.narrative),
        craft: cloneVec3(base.explodedPositions?.craft),
        system: cloneVec3(base.explodedPositions?.system),
        leadership: cloneVec3(base.explodedPositions?.leadership),
        exploration: cloneVec3(base.explodedPositions?.exploration)
      },
      facetRotationsEulerDeg: {
        ...base.facetRotationsEulerDeg,
        empathy: cloneVec3(base.facetRotationsEulerDeg?.empathy),
        narrative: cloneVec3(base.facetRotationsEulerDeg?.narrative),
        craft: cloneVec3(base.facetRotationsEulerDeg?.craft),
        system: cloneVec3(base.facetRotationsEulerDeg?.system),
        leadership: cloneVec3(base.facetRotationsEulerDeg?.leadership),
        exploration: cloneVec3(base.facetRotationsEulerDeg?.exploration)
      },
      selectedFacetRotationsEulerDeg: {
        ...base.selectedFacetRotationsEulerDeg,
        empathy: cloneVec3(base.selectedFacetRotationsEulerDeg?.empathy),
        narrative: cloneVec3(base.selectedFacetRotationsEulerDeg?.narrative),
        craft: cloneVec3(base.selectedFacetRotationsEulerDeg?.craft),
        system: cloneVec3(base.selectedFacetRotationsEulerDeg?.system),
        leadership: cloneVec3(base.selectedFacetRotationsEulerDeg?.leadership),
        exploration: cloneVec3(base.selectedFacetRotationsEulerDeg?.exploration)
      },
      projectCameraSettings: Object.fromEntries(
        projectCameraKeys.map((project) => [
          project,
          {
            desktop: {
              selected: {
                position: cloneVec3(base.projectCameraSettings?.[project]?.desktop?.selected?.position),
                target: cloneVec3(base.projectCameraSettings?.[project]?.desktop?.selected?.target)
              },
              caseStudy: {
                position: cloneVec3(base.projectCameraSettings?.[project]?.desktop?.caseStudy?.position),
                target: cloneVec3(base.projectCameraSettings?.[project]?.desktop?.caseStudy?.target),
                facetRotation: cloneVec3(base.projectCameraSettings?.[project]?.desktop?.caseStudy?.facetRotation)
              }
            },
            mobile: {
              selected: {
                position: cloneVec3(base.projectCameraSettings?.[project]?.mobile?.selected?.position),
                target: cloneVec3(base.projectCameraSettings?.[project]?.mobile?.selected?.target)
              },
              caseStudy: {
                position: cloneVec3(base.projectCameraSettings?.[project]?.mobile?.caseStudy?.position),
                target: cloneVec3(base.projectCameraSettings?.[project]?.mobile?.caseStudy?.target),
                facetRotation: cloneVec3(base.projectCameraSettings?.[project]?.mobile?.caseStudy?.facetRotation)
              }
            }
          }
        ])
      ),
      timing: {
        ...base.timing,
        camera: { ...base.timing?.camera },
        crystal: { ...base.timing?.crystal },
        fracture: { ...base.timing?.fracture },
        labels: { ...base.timing?.labels },
        reform: { ...base.timing?.reform },
        idle: { ...base.timing?.idle }
      },
      effects: {
        ...base.effects,
        idle: {
          ...base.effects?.idle,
          float: { ...base.effects?.idle?.float },
          glow: { ...base.effects?.idle?.glow }
        },
        fracture: { ...base.effects?.fracture }
      },
      materials: cloneMaterials(base.materials)
    };
  };

  const cloneConfig = () => normalizeCrystalConfig(config ?? crystalConfig);

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

  const buildLayoutPayload = (baseConfig, deviceKey) => {
    const baseLayout = JSON.parse(
      JSON.stringify(deviceKey === 'mobile' ? mobileLayoutJson : desktopLayoutJson)
    );
    const payload = {
      ...baseLayout,
      schemaVersion: 2,
      camera: {
        ...(baseLayout.camera || {}),
        positions: {
          ...(baseLayout.camera?.positions || {}),
          intro: baseConfig.cameraPositions?.intro,
          hero: baseConfig.cameraPositions?.hero,
          overview: baseConfig.cameraPositions?.overview,
          about: baseConfig.cameraPositions?.about,
          projects: baseConfig.cameraPositions?.projects
        },
        targets: {
          ...(baseLayout.camera?.targets || {}),
          intro: baseConfig.cameraTargets?.intro,
          hero: baseConfig.cameraTargets?.hero,
          overview: baseConfig.cameraTargets?.overview,
          about: baseConfig.cameraTargets?.about,
          projects: baseConfig.cameraTargets?.projects
        },
        offsets: {
          ...(baseLayout.camera?.offsets || {}),
          global: baseConfig.cameraOffsets?.global,
          zones: baseConfig.cameraOffsets?.zones,
          projects: baseConfig.cameraOffsets?.projects
        },
        projects: Object.fromEntries(
          projectKeys.map((sceneKey) => {
            const projectId = getProjectIdBySceneFacetKey(sceneKey);
            const selected = baseConfig.projectCameraSettings?.[projectId]?.[deviceKey]?.selected;
            const caseStudy = baseConfig.projectCameraSettings?.[projectId]?.[deviceKey]?.caseStudy;
            return [
              sceneKey,
              {
                selected: {
                  position: selected?.position ?? [0, 0, 0],
                  target: selected?.target ?? [0, 0, 0]
                },
                caseStudy: {
                  position: caseStudy?.position ?? [0, 0, 0],
                  target: caseStudy?.target ?? [0, 0, 0],
                  facetRotation: caseStudy?.facetRotation ?? [0, 0, 0]
                }
              }
            ];
          })
        )
      },
      projects: {
        ...(baseLayout.projects || {}),
        explodedPositions: baseConfig.explodedPositions,
        facetRotationsEulerDeg: baseConfig.facetRotationsEulerDeg,
        selectedFacetRotationsEulerDeg: baseConfig.selectedFacetRotationsEulerDeg
      },
      timing: {
        ...(baseLayout.timing || {}),
        camera: {
          ...(baseLayout.timing?.camera || {}),
          ...(baseConfig.timing?.camera || {})
        }
      }
    };

    return payload;
  };

  const applyLayoutToConfig = (currentConfig, layoutPayload) => {
    const base = currentConfig ?? crystalConfig;
    const updatedConfig = JSON.parse(JSON.stringify(base));
    const layout = layoutPayload ?? {};
    const camera = layout?.camera ?? {};
    const projects = layout?.projects ?? {};
    const timing = layout?.timing ?? {};

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

    const updateSelectedFacetRotations = (rotations) => {
      if (!rotations) return;
      projectKeys.forEach((project) => {
        const vec = sanitizeVec3(rotations?.[project]);
        if (vec) updatedConfig.selectedFacetRotationsEulerDeg[project] = vec;
      });
    };

    const updateProjectCameraSettings = (settings) => {
      if (!settings) return;
      projectCameraKeys.forEach((project) => {
        [editDeviceKey].forEach((device) => {
          const selectedPosition = sanitizeVec3(settings?.[project]?.[device]?.selected?.position);
          const selectedTarget = sanitizeVec3(settings?.[project]?.[device]?.selected?.target);
          const caseStudyPosition = sanitizeVec3(settings?.[project]?.[device]?.caseStudy?.position);
          const caseStudyTarget = sanitizeVec3(settings?.[project]?.[device]?.caseStudy?.target);
          const caseStudyFacetRotation = sanitizeVec3(settings?.[project]?.[device]?.caseStudy?.facetRotation);

          if (selectedPosition) updatedConfig.projectCameraSettings[project][device].selected.position = selectedPosition;
          if (selectedTarget) updatedConfig.projectCameraSettings[project][device].selected.target = selectedTarget;
          if (caseStudyPosition) updatedConfig.projectCameraSettings[project][device].caseStudy.position = caseStudyPosition;
          if (caseStudyTarget) updatedConfig.projectCameraSettings[project][device].caseStudy.target = caseStudyTarget;
          if (caseStudyFacetRotation) updatedConfig.projectCameraSettings[project][device].caseStudy.facetRotation = caseStudyFacetRotation;
        });
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

    updateCameraPositions(camera.positions);
    updateCameraTargets(camera.targets);
    updateCameraOffsets(camera.offsets);
    updateExplodedPositions(projects.explodedPositions);
    updateFacetRotations(projects.facetRotationsEulerDeg);
    updateSelectedFacetRotations(projects.selectedFacetRotationsEulerDeg);
    updateTiming(timing);

    if (camera.projects) {
      projectKeys.forEach((sceneKey) => {
        const projectId = getProjectIdBySceneFacetKey(sceneKey);
        if (!projectId) return;
        [editDeviceKey].forEach((device) => {
          const selectedPosition = sanitizeVec3(camera.projects?.[sceneKey]?.selected?.position);
          const selectedTarget = sanitizeVec3(camera.projects?.[sceneKey]?.selected?.target);
          const caseStudyPosition = sanitizeVec3(camera.projects?.[sceneKey]?.caseStudy?.position);
          const caseStudyTarget = sanitizeVec3(camera.projects?.[sceneKey]?.caseStudy?.target);
          const caseStudyFacetRotation = sanitizeVec3(camera.projects?.[sceneKey]?.caseStudy?.facetRotation);

          if (selectedPosition) updatedConfig.projectCameraSettings[projectId][device].selected.position = selectedPosition;
          if (selectedTarget) updatedConfig.projectCameraSettings[projectId][device].selected.target = selectedTarget;
          if (caseStudyPosition) updatedConfig.projectCameraSettings[projectId][device].caseStudy.position = caseStudyPosition;
          if (caseStudyTarget) updatedConfig.projectCameraSettings[projectId][device].caseStudy.target = caseStudyTarget;
          if (caseStudyFacetRotation) updatedConfig.projectCameraSettings[projectId][device].caseStudy.facetRotation = caseStudyFacetRotation;
        });
      });
    }

    return updatedConfig;
  };

  const syncStateFromConfig = (updatedConfig) => {
    setTimingValues({
      'camera.explodeDuration': updatedConfig.timing.camera.explodeDuration,
      'camera.reformDuration': updatedConfig.timing.camera.reformDuration
    });

    setCameraValues({
      'camera.intro': updatedConfig.cameraPositions.intro,
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
      'cameraTargets.intro': updatedConfig.cameraTargets.intro,
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
      'cameraOffsets.zones.intro.position': updatedConfig.cameraOffsets.zones.intro.position,
      'cameraOffsets.zones.hero.position': updatedConfig.cameraOffsets.zones.hero.position,
      'cameraOffsets.zones.intro.target': updatedConfig.cameraOffsets.zones.intro.target,
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

    setSelectedFacetRotationValues({
      'selectedFacetRotationsEulerDeg.empathy': updatedConfig.selectedFacetRotationsEulerDeg.empathy,
      'selectedFacetRotationsEulerDeg.narrative': updatedConfig.selectedFacetRotationsEulerDeg.narrative,
      'selectedFacetRotationsEulerDeg.craft': updatedConfig.selectedFacetRotationsEulerDeg.craft,
      'selectedFacetRotationsEulerDeg.system': updatedConfig.selectedFacetRotationsEulerDeg.system,
      'selectedFacetRotationsEulerDeg.leadership': updatedConfig.selectedFacetRotationsEulerDeg.leadership,
      'selectedFacetRotationsEulerDeg.exploration': updatedConfig.selectedFacetRotationsEulerDeg.exploration
    });

    setShardValues({
      ...DEFAULT_SHARD_TUNING,
      ...(updatedConfig.shardTuning || {})
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

  const updateSelectedFacetRotation = (key, newRotation) => {
    const parts = key.split('.');
    setSelectedFacetRotationValues({
      ...selectedFacetRotationValues,
      [key]: newRotation
    });

    const updatedConfig = cloneConfig();

    if (parts.length === 2) {
      updatedConfig.selectedFacetRotationsEulerDeg[parts[1]] = newRotation;
    }

    onUpdate(updatedConfig);
  };

  const handleSelectedFacetRotationChange = (key, index, value) => {
    const numValue = parseFloat(value);
    const newRotation = [...selectedFacetRotationValues[key]];
    newRotation[index] = numValue;
    updateSelectedFacetRotation(key, newRotation);
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

  const updateProjectCameraSettingVec3 = (project, mode, field, axisIndex, value) => {
    const visibleSceneKey = getSceneFacetKeyByProjectId(project) || project;
    const resolvedProjectId = getProjectIdBySceneFacetKey(project) || project;
    const writeProjectKey = resolvedProjectId;
    const previousConfig = config ?? crystalConfig;
    const previousProjectCameraSettings = previousConfig.projectCameraSettings || {};
    const previousProject = previousProjectCameraSettings[writeProjectKey] || {};
    const previousDevice = previousProject[editDeviceKey] || {};
    const previousMode = previousDevice[mode] || {};
    const current = previousMode[field] || [0, 0, 0];
    const next = [...current];
    next[axisIndex] = parseFloat(value);

    const nextMode = {
      ...previousMode,
      [field]: next
    };
    const nextDevice = {
      ...previousDevice,
      [mode]: nextMode
    };
    const nextProject = {
      ...previousProject,
      [editDeviceKey]: nextDevice
    };
    const nextProjectCameraSettings = {
      ...previousProjectCameraSettings,
      [writeProjectKey]: nextProject
    };
    const updatedConfig = {
      ...previousConfig,
      projectCameraSettings: nextProjectCameraSettings
    };

    if (import.meta.env.DEV) {
      console.groupCollapsed('🛠️ [ProjectCameraControl Write]');
      console.log('visibleSceneKey:', visibleSceneKey);
      console.log('resolvedProjectId:', resolvedProjectId);
      console.log('finalWriteKey:', writeProjectKey);
      console.log('editDeviceKey:', editDeviceKey);
      console.log('mode:', mode);
      console.log('field:', field);
      console.log('newValue:', updatedConfig.projectCameraSettings[writeProjectKey][editDeviceKey][mode][field]);
      console.log('refChanged.updatedConfig:', updatedConfig !== previousConfig);
      console.log('refChanged.projectCameraSettings:', updatedConfig.projectCameraSettings !== previousProjectCameraSettings);
      console.log(
        'refChanged.project:',
        updatedConfig.projectCameraSettings[writeProjectKey] !== previousProject
      );
      console.log(
        'refChanged.device:',
        updatedConfig.projectCameraSettings[writeProjectKey]?.[editDeviceKey] !== previousDevice
      );
      console.log(
        'refChanged.mode:',
        updatedConfig.projectCameraSettings[writeProjectKey]?.[editDeviceKey]?.[mode] !== previousMode
      );
      console.groupEnd();
    }
    onUpdate(updatedConfig);
  };

  const getProjectCameraVec3 = (project, mode, field) =>
    config?.projectCameraSettings?.[project]?.[editDeviceKey]?.[mode]?.[field] || [0, 0, 0];

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

  const handleShardChange = (key, value) => {
    const numValue = parseFloat(value);
    const nextValues = {
      ...shardValues,
      [key]: numValue
    };
    setShardValues(nextValues);

    const updatedConfig = cloneConfig();
    updatedConfig.shardTuning = {
      ...DEFAULT_SHARD_TUNING,
      ...(updatedConfig.shardTuning || {}),
      ...nextValues
    };
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
      'camera.intro': crystalConfig.cameraPositions.intro,
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
      'cameraTargets.intro': crystalConfig.cameraTargets.intro,
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
      'cameraOffsets.zones.intro.position': crystalConfig.cameraOffsets.zones.intro.position,
      'cameraOffsets.zones.hero.position': crystalConfig.cameraOffsets.zones.hero.position,
      'cameraOffsets.zones.intro.target': crystalConfig.cameraOffsets.zones.intro.target,
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

    setSelectedFacetRotationValues({
      'selectedFacetRotationsEulerDeg.empathy': crystalConfig.selectedFacetRotationsEulerDeg.empathy,
      'selectedFacetRotationsEulerDeg.narrative': crystalConfig.selectedFacetRotationsEulerDeg.narrative,
      'selectedFacetRotationsEulerDeg.craft': crystalConfig.selectedFacetRotationsEulerDeg.craft,
      'selectedFacetRotationsEulerDeg.system': crystalConfig.selectedFacetRotationsEulerDeg.system,
      'selectedFacetRotationsEulerDeg.leadership': crystalConfig.selectedFacetRotationsEulerDeg.leadership,
      'selectedFacetRotationsEulerDeg.exploration': crystalConfig.selectedFacetRotationsEulerDeg.exploration
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
    setShardValues({ ...DEFAULT_SHARD_TUNING });
    
    // Notify parent component
    onUpdate({
      ...crystalConfig,
      shardTuning: { ...DEFAULT_SHARD_TUNING }
    });
  };

  const getLayoutPayload = () => {
    const base = config ?? crystalConfig;
    const payload = buildLayoutPayload(base, editDeviceKey);
    if (import.meta.env.DEV) {
      console.log('[layout-export] payload fields', {
        editDeviceKey,
        'camera.positions.hero': payload?.camera?.positions?.hero ?? null,
        'camera.projects.leadership.selected.position':
          payload?.camera?.projects?.leadership?.selected?.position ?? null,
        'camera.projects.leadership.caseStudy.target':
          payload?.camera?.projects?.leadership?.caseStudy?.target ?? null
      });
    }
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
    const payload = getLayoutPayload();

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

  const handleRestartSceneClick = () => {
    onRestartScene?.();
    setExportMessage('Scene restarted ✅');
  };

  const handleDownloadJson = () => {
    const payload = getLayoutPayload();
    const blob = new Blob([payload], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${editDeviceKey}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
    setExportMessage(`Downloaded ${editDeviceKey}.json ✅`);
  };

  const handleLoadJson = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const rawPayload = JSON.parse(text);
      const normalized = normalizeCrystalConfig(rawPayload);
      console.log('[LOAD JSON] normalized colors:', {
        color: normalized.materials?.crystal?.color?.isColor,
        emissive: normalized.materials?.crystal?.emissive?.isColor,
        attenuationColor: normalized.materials?.crystal?.attenuationColor?.isColor,
        specularColor: normalized.materials?.crystal?.specularColor?.isColor
      });
      const isLayoutPayload =
        rawPayload?.schemaVersion === 2 &&
        rawPayload?.camera &&
        rawPayload?.projects &&
        rawPayload?.anchors;

      if (!isLayoutPayload) {
        throw new Error('Missing tuning data');
      }

      const updatedConfig = applyLayoutToConfig(config ?? crystalConfig, rawPayload);
      const normalizedConfig = normalizeCrystalConfig(updatedConfig);
      if (import.meta.env.DEV) {
        console.log('[layout-import] applied config fields', {
          editDeviceKey,
          'camera.positions.hero': normalizedConfig?.cameraPositions?.hero ?? null,
          'camera.projects.leadership.selected.position':
            normalizedConfig?.projectCameraSettings?.project01?.[editDeviceKey]?.selected?.position ?? null,
          'camera.projects.leadership.caseStudy.target':
            normalizedConfig?.projectCameraSettings?.project01?.[editDeviceKey]?.caseStudy?.target ?? null
        });
      }
      syncStateFromConfig(normalizedConfig);
      onUpdate(normalizedConfig);
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
        const selectedRotationKey = `selectedFacetRotationsEulerDeg.${facet}`;
        const selectedRotation = selectedFacetRotationValues[selectedRotationKey];
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
              <span>{getProjectDisplayLabel(facet)}</span>
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

                <div style={accordionSectionStyle}>
                  <div style={accordionSubheadingStyle}>Selected Rotation</div>
                  <div style={accordionNoteStyle}>Applies while this project facet is focused during the camera move.</div>
                  {['X', 'Y', 'Z'].map((axis, index) => (
                    <div key={axis} style={{ marginBottom: '5px' }}>
                      <div style={sliderLabelStyle}>
                        <span><span style={coordLabelStyle}>{axis}</span> Selected Rotation</span>
                        <span>{selectedRotation[index].toFixed(0)}°</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={selectedRotation[index]}
                        onChange={(e) => handleSelectedFacetRotationChange(selectedRotationKey, index, e.target.value)}
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
              projectCameraKeys.reduce((acc, key) => {
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
              projectCameraKeys.reduce((acc, key) => {
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
                Project camera sliders below write directly to projectCameraSettings for the active device.
              </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <button type="button" style={exportButtonStyle} onClick={() => setProjectCameraMode('selected')}>
                Selected View
              </button>
              <button type="button" style={exportButtonStyle} onClick={() => setProjectCameraMode('caseStudy')}>
                Case Study View
              </button>
            </div>
            <div style={accordionNoteStyle}>Editing {editDeviceKey} branch: {projectCameraMode}</div>
            {projectCameraKeys.map((project) => {
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
                    <span>{project}</span>
                    <span>{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div style={accordionContentStyle}>
                      <div style={accordionSectionStyle}>
                        {(() => {
                          const labelPrefix = projectCameraMode === 'caseStudy' ? 'Case Study' : 'Selected';
                          const positionVec = config?.projectCameraSettings?.[project]?.[editDeviceKey]?.[projectCameraMode]?.position || [0, 0, 0];
                          const targetVec = config?.projectCameraSettings?.[project]?.[editDeviceKey]?.[projectCameraMode]?.target || [0, 0, 0];
                          return (
                            <>
                              <div style={accordionSubheadingStyle}>{labelPrefix} Camera Position</div>
                              {['X', 'Y', 'Z'].map((axis, axisIndex) => (
                                <div key={`live-position-${axis}`} style={{ marginBottom: '5px' }}>
                                  <div style={sliderLabelStyle}>
                                    <span><span style={coordLabelStyle}>{axis}</span> Position</span>
                                    <span>{positionVec[axisIndex].toFixed(2)}</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="-5"
                                    max="5"
                                    step="0.1"
                                    value={positionVec[axisIndex]}
                                    onChange={(e) => updateProjectCameraSettingVec3(project, projectCameraMode, 'position', axisIndex, e.target.value)}
                                    style={sliderStyle}
                                  />
                                </div>
                              ))}

                              <div style={{ fontSize: '12px', marginTop: '10px', marginBottom: '6px', color: '#9fe8d8' }}>
                                {labelPrefix} Camera Target
                              </div>
                              {['X', 'Y', 'Z'].map((axis, axisIndex) => (
                                <div key={`live-target-${axis}`} style={{ marginBottom: '5px' }}>
                                  <div style={sliderLabelStyle}>
                                    <span><span style={coordLabelStyle}>{axis}</span> Target</span>
                                    <span>{targetVec[axisIndex].toFixed(2)}</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="-5"
                                    max="5"
                                    step="0.1"
                                    value={targetVec[axisIndex]}
                                    onChange={(e) => {
                                      if (import.meta.env.DEV) {
                                        const visibleSceneKey = getSceneFacetKeyByProjectId(project) || project;
                                        const resolvedProjectId = getProjectIdBySceneFacetKey(project) || project;
                                        console.log('🎯 [Visible Project Target Slider]', {
                                          visibleSceneKey,
                                          resolvedProjectId,
                                          finalWriteKey: resolvedProjectId,
                                          editDeviceKey,
                                          mode: projectCameraMode,
                                          axis,
                                          value: e.target.value
                                        });
                                      }
                                      updateProjectCameraSettingVec3(project, projectCameraMode, 'target', axisIndex, e.target.value);
                                    }}
                                    style={sliderStyle}
                                  />
                                </div>
                              ))}

                              {projectCameraMode === 'caseStudy' && (
                                <>
                                  <div style={{ fontSize: '12px', marginTop: '10px', marginBottom: '6px', color: '#9fe8d8' }}>
                                    Case Study Facet Rotation
                                  </div>
                                  {['X', 'Y', 'Z'].map((axis, axisIndex) => {
                                    const vec = config?.projectCameraSettings?.[project]?.[editDeviceKey]?.caseStudy?.facetRotation || [0, 0, 0];
                                    return (
                                      <div key={`live-facetRotation-${axis}`} style={{ marginBottom: '5px' }}>
                                        <div style={sliderLabelStyle}>
                                          <span><span style={coordLabelStyle}>{axis}</span> Rotation</span>
                                          <span>{vec[axisIndex].toFixed(1)}°</span>
                                        </div>
                                        <input
                                          type="range"
                                          min="-180"
                                          max="180"
                                          step="1"
                                          value={vec[axisIndex]}
                                          onChange={(e) => updateProjectCameraSettingVec3(project, 'caseStudy', 'facetRotation', axisIndex, e.target.value)}
                                          style={sliderStyle}
                                        />
                                      </div>
                                    );
                                  })}
                                </>
                              )}
                            </>
                          );
                        })()}
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

  const renderShardControls = () => (
    <div>
      <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Shard Controls</h3>
      {[
        ['spreadMultiplier', 'Spread', 0.2, 4, 0.05],
        ['largeDistanceCenter', 'Large Distance', 0.5, 1, 0.01],
        ['mediumDistanceCenter', 'Medium Distance', 0.2, 0.9, 0.01],
        ['smallDistanceCenter', 'Small Distance', 0.05, 0.7, 0.01],
        ['distanceJitter', 'Distance Jitter', 0, 0.3, 0.01],
        ['smallScaleBase', 'Small Scale Base', 0.005, 0.08, 0.001],
        ['smallScaleJitter', 'Small Scale Jitter', 0, 0.15, 0.001],
        ['mediumScaleBase', 'Medium Scale Base', 0.02, 0.2, 0.001],
        ['mediumScaleJitter', 'Medium Scale Jitter', 0, 0.2, 0.001],
        ['largeScaleBase', 'Large Scale Base', 0.05, 0.5, 0.001],
        ['largeScaleJitter', 'Large Scale Jitter', 0, 0.35, 0.001],
        ['rotationBaseDeg', 'Rotation Base°', 0, 90, 1],
        ['rotationJitterDeg', 'Rotation Jitter°', 0, 180, 1],
        ['opacityMultiplier', 'Shard Opacity', 0.1, 1, 0.01]
      ].map(([key, label, min, max, step]) => (
        <div style={sliderGroupStyle} key={key}>
          <div style={sliderLabelStyle}>
            <span>{label}</span>
            <span>{Number(shardValues[key]).toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={shardValues[key]}
            onChange={(e) => handleShardChange(key, e.target.value)}
            style={sliderStyle}
          />
        </div>
      ))}
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
          style={tabButtonStyle(activeTab === 'shards')}
          onClick={() => setActiveTab('shards')}
        >
          Shards
        </button>
      </div>

      {activeTab === 'timing' && renderTimingControls()}
      {activeTab === 'positions' && renderPositionsControls()}
      {activeTab === 'camera' && renderCameraControls()}
      {activeTab === 'effects' && renderEffectsControls()}
      {activeTab === 'material' && renderMaterialControls()}
      {activeTab === 'shards' && renderShardControls()}

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
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          style={{ ...resetButtonStyle, flex: 1, marginTop: 0 }}
          onClick={handleRestartSceneClick}
        >
          Restart Scene
        </button>
        <button 
          type="button"
          style={{ ...resetButtonStyle, flex: 1, marginTop: 0 }}
          onClick={handleReset}
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default CrystalControls;
