const ZONE_KEYS = ['intro', 'hero', 'overview', 'about'];
const PROJECT_KEYS = ['empathy', 'narrative', 'craft', 'system', 'leadership', 'exploration'];
const PROJECT_CAMERA_KEYS = ['project01', 'project02', 'project03', 'project04', 'project05', 'project06'];
const DEVICE_KEYS = ['desktop', 'mobile'];
const MODE_KEYS = ['selected', 'caseStudy'];

const ensureObject = (value, path) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }
};

const ensureExactKeys = (value, expectedKeys, path) => {
  ensureObject(value, path);
  const actualKeys = Object.keys(value);
  const extras = actualKeys.filter((key) => !expectedKeys.includes(key));
  if (extras.length > 0) {
    throw new Error(`${path} has unsupported keys: ${extras.join(', ')}`);
  }

  const missing = expectedKeys.filter((key) => !actualKeys.includes(key));
  if (missing.length > 0) {
    throw new Error(`${path} is missing required keys: ${missing.join(', ')}`);
  }
};

const ensureVec3 = (value, path) => {
  if (
    !Array.isArray(value)
    || value.length !== 3
    || value.some((entry) => typeof entry !== 'number' || Number.isNaN(entry))
  ) {
    throw new Error(`${path} must be a numeric [x, y, z] array`);
  }
};

const cloneVec3 = (value) => [...value];

const cloneOffsetsMap = (source) => Object.fromEntries(
  Object.entries(source).map(([key, value]) => [key, {
    position: cloneVec3(value.position),
    target: cloneVec3(value.target)
  }])
);

const cloneProjectCameraSettings = (source) => Object.fromEntries(
  PROJECT_CAMERA_KEYS.map((projectKey) => [projectKey, {
    desktop: {
      selected: {
        position: cloneVec3(source[projectKey].desktop.selected.position),
        target: cloneVec3(source[projectKey].desktop.selected.target)
      },
      caseStudy: {
        position: cloneVec3(source[projectKey].desktop.caseStudy.position),
        target: cloneVec3(source[projectKey].desktop.caseStudy.target),
        facetRotation: cloneVec3(source[projectKey].desktop.caseStudy.facetRotation)
      }
    },
    mobile: {
      selected: {
        position: cloneVec3(source[projectKey].mobile.selected.position),
        target: cloneVec3(source[projectKey].mobile.selected.target)
      },
      caseStudy: {
        position: cloneVec3(source[projectKey].mobile.caseStudy.position),
        target: cloneVec3(source[projectKey].mobile.caseStudy.target),
        facetRotation: cloneVec3(source[projectKey].mobile.caseStudy.facetRotation)
      }
    }
  }])
);

const validateProjectCameraMode = (modeValue, path, requireFacetRotation) => {
  const keys = requireFacetRotation ? ['position', 'target', 'facetRotation'] : ['position', 'target'];
  ensureExactKeys(modeValue, keys, path);
  ensureVec3(modeValue.position, `${path}.position`);
  ensureVec3(modeValue.target, `${path}.target`);
  if (requireFacetRotation) {
    ensureVec3(modeValue.facetRotation, `${path}.facetRotation`);
  }
};

export const validateCameraTuningPayload = (payload) => {
  ensureExactKeys(payload, ['version', 'tuning'], 'root');
  if (payload.version !== 1) {
    throw new Error(`root.version must be 1, received ${payload.version}`);
  }

  const { tuning } = payload;
  ensureExactKeys(
    tuning,
    [
      'cameraPositions',
      'cameraTargets',
      'cameraOffsets',
      'explodedPositions',
      'facetRotationsEulerDeg',
      'selectedFacetRotationsEulerDeg',
      'projectCameraSettings',
      'timing'
    ],
    'root.tuning'
  );

  ensureExactKeys(tuning.cameraPositions, [...ZONE_KEYS, 'projects'], 'root.tuning.cameraPositions');
  ZONE_KEYS.forEach((zone) => ensureVec3(tuning.cameraPositions[zone], `root.tuning.cameraPositions.${zone}`));
  ensureExactKeys(tuning.cameraPositions.projects, PROJECT_KEYS, 'root.tuning.cameraPositions.projects');
  PROJECT_KEYS.forEach((project) => ensureVec3(tuning.cameraPositions.projects[project], `root.tuning.cameraPositions.projects.${project}`));

  ensureExactKeys(tuning.cameraTargets, [...ZONE_KEYS, 'projects'], 'root.tuning.cameraTargets');
  ZONE_KEYS.forEach((zone) => ensureVec3(tuning.cameraTargets[zone], `root.tuning.cameraTargets.${zone}`));
  ensureExactKeys(tuning.cameraTargets.projects, PROJECT_KEYS, 'root.tuning.cameraTargets.projects');
  PROJECT_KEYS.forEach((project) => ensureVec3(tuning.cameraTargets.projects[project], `root.tuning.cameraTargets.projects.${project}`));

  ensureExactKeys(tuning.cameraOffsets, ['global', 'zones', 'projects'], 'root.tuning.cameraOffsets');
  ensureExactKeys(tuning.cameraOffsets.global, ['position', 'target'], 'root.tuning.cameraOffsets.global');
  ensureVec3(tuning.cameraOffsets.global.position, 'root.tuning.cameraOffsets.global.position');
  ensureVec3(tuning.cameraOffsets.global.target, 'root.tuning.cameraOffsets.global.target');

  ensureExactKeys(tuning.cameraOffsets.zones, ZONE_KEYS, 'root.tuning.cameraOffsets.zones');
  ZONE_KEYS.forEach((zone) => {
    ensureExactKeys(tuning.cameraOffsets.zones[zone], ['position', 'target'], `root.tuning.cameraOffsets.zones.${zone}`);
    ensureVec3(tuning.cameraOffsets.zones[zone].position, `root.tuning.cameraOffsets.zones.${zone}.position`);
    ensureVec3(tuning.cameraOffsets.zones[zone].target, `root.tuning.cameraOffsets.zones.${zone}.target`);
  });

  ensureExactKeys(tuning.cameraOffsets.projects, PROJECT_KEYS, 'root.tuning.cameraOffsets.projects');
  PROJECT_KEYS.forEach((project) => {
    ensureExactKeys(tuning.cameraOffsets.projects[project], ['position', 'target'], `root.tuning.cameraOffsets.projects.${project}`);
    ensureVec3(tuning.cameraOffsets.projects[project].position, `root.tuning.cameraOffsets.projects.${project}.position`);
    ensureVec3(tuning.cameraOffsets.projects[project].target, `root.tuning.cameraOffsets.projects.${project}.target`);
  });

  ensureExactKeys(tuning.explodedPositions, PROJECT_KEYS, 'root.tuning.explodedPositions');
  PROJECT_KEYS.forEach((project) => ensureVec3(tuning.explodedPositions[project], `root.tuning.explodedPositions.${project}`));

  ensureExactKeys(tuning.facetRotationsEulerDeg, PROJECT_KEYS, 'root.tuning.facetRotationsEulerDeg');
  PROJECT_KEYS.forEach((project) => ensureVec3(tuning.facetRotationsEulerDeg[project], `root.tuning.facetRotationsEulerDeg.${project}`));

  ensureExactKeys(tuning.selectedFacetRotationsEulerDeg, PROJECT_KEYS, 'root.tuning.selectedFacetRotationsEulerDeg');
  PROJECT_KEYS.forEach((project) => ensureVec3(tuning.selectedFacetRotationsEulerDeg[project], `root.tuning.selectedFacetRotationsEulerDeg.${project}`));

  ensureExactKeys(tuning.projectCameraSettings, PROJECT_CAMERA_KEYS, 'root.tuning.projectCameraSettings');
  PROJECT_CAMERA_KEYS.forEach((projectCameraKey) => {
    ensureExactKeys(tuning.projectCameraSettings[projectCameraKey], DEVICE_KEYS, `root.tuning.projectCameraSettings.${projectCameraKey}`);
    DEVICE_KEYS.forEach((deviceKey) => {
      ensureExactKeys(tuning.projectCameraSettings[projectCameraKey][deviceKey], MODE_KEYS, `root.tuning.projectCameraSettings.${projectCameraKey}.${deviceKey}`);
      validateProjectCameraMode(tuning.projectCameraSettings[projectCameraKey][deviceKey].selected, `root.tuning.projectCameraSettings.${projectCameraKey}.${deviceKey}.selected`, false);
      validateProjectCameraMode(tuning.projectCameraSettings[projectCameraKey][deviceKey].caseStudy, `root.tuning.projectCameraSettings.${projectCameraKey}.${deviceKey}.caseStudy`, true);
    });
  });

  ensureExactKeys(tuning.timing, ['camera'], 'root.tuning.timing');
  ensureExactKeys(tuning.timing.camera, ['explodeDuration', 'reformDuration'], 'root.tuning.timing.camera');
  if (typeof tuning.timing.camera.explodeDuration !== 'number' || Number.isNaN(tuning.timing.camera.explodeDuration)) {
    throw new Error('root.tuning.timing.camera.explodeDuration must be numeric');
  }
  if (typeof tuning.timing.camera.reformDuration !== 'number' || Number.isNaN(tuning.timing.camera.reformDuration)) {
    throw new Error('root.tuning.timing.camera.reformDuration must be numeric');
  }
};

export const cloneCameraTuningPayload = (payload) => {
  validateCameraTuningPayload(payload);

  return {
    version: 1,
    tuning: {
      cameraPositions: {
        intro: cloneVec3(payload.tuning.cameraPositions.intro),
        hero: cloneVec3(payload.tuning.cameraPositions.hero),
        overview: cloneVec3(payload.tuning.cameraPositions.overview),
        about: cloneVec3(payload.tuning.cameraPositions.about),
        projects: Object.fromEntries(
          PROJECT_KEYS.map((project) => [project, cloneVec3(payload.tuning.cameraPositions.projects[project])])
        )
      },
      cameraTargets: {
        intro: cloneVec3(payload.tuning.cameraTargets.intro),
        hero: cloneVec3(payload.tuning.cameraTargets.hero),
        overview: cloneVec3(payload.tuning.cameraTargets.overview),
        about: cloneVec3(payload.tuning.cameraTargets.about),
        projects: Object.fromEntries(
          PROJECT_KEYS.map((project) => [project, cloneVec3(payload.tuning.cameraTargets.projects[project])])
        )
      },
      cameraOffsets: {
        global: {
          position: cloneVec3(payload.tuning.cameraOffsets.global.position),
          target: cloneVec3(payload.tuning.cameraOffsets.global.target)
        },
        zones: cloneOffsetsMap(payload.tuning.cameraOffsets.zones),
        projects: cloneOffsetsMap(payload.tuning.cameraOffsets.projects)
      },
      explodedPositions: Object.fromEntries(
        PROJECT_KEYS.map((project) => [project, cloneVec3(payload.tuning.explodedPositions[project])])
      ),
      facetRotationsEulerDeg: Object.fromEntries(
        PROJECT_KEYS.map((project) => [project, cloneVec3(payload.tuning.facetRotationsEulerDeg[project])])
      ),
      selectedFacetRotationsEulerDeg: Object.fromEntries(
        PROJECT_KEYS.map((project) => [project, cloneVec3(payload.tuning.selectedFacetRotationsEulerDeg[project])])
      ),
      projectCameraSettings: cloneProjectCameraSettings(payload.tuning.projectCameraSettings),
      timing: {
        camera: {
          explodeDuration: payload.tuning.timing.camera.explodeDuration,
          reformDuration: payload.tuning.timing.camera.reformDuration
        }
      }
    }
  };
};

export const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach((entry) => deepFreeze(entry));
  return value;
};

export const applyCameraTuningToConfig = (baseConfig, payload) => {
  const nextPayload = cloneCameraTuningPayload(payload);

  const nextConfig = {
    ...baseConfig,
    cameraPositions: nextPayload.tuning.cameraPositions,
    cameraTargets: nextPayload.tuning.cameraTargets,
    cameraOffsets: nextPayload.tuning.cameraOffsets,
    explodedPositions: nextPayload.tuning.explodedPositions,
    facetRotationsEulerDeg: nextPayload.tuning.facetRotationsEulerDeg,
    selectedFacetRotationsEulerDeg: nextPayload.tuning.selectedFacetRotationsEulerDeg,
    projectCameraSettings: nextPayload.tuning.projectCameraSettings,
    timing: {
      ...baseConfig.timing,
      camera: {
        ...baseConfig.timing?.camera,
        explodeDuration: nextPayload.tuning.timing.camera.explodeDuration,
        reformDuration: nextPayload.tuning.timing.camera.reformDuration
      }
    }
  };

  deepFreeze(nextPayload);
  deepFreeze(nextConfig.cameraPositions);
  deepFreeze(nextConfig.cameraTargets);
  deepFreeze(nextConfig.cameraOffsets);
  deepFreeze(nextConfig.explodedPositions);
  deepFreeze(nextConfig.facetRotationsEulerDeg);
  deepFreeze(nextConfig.selectedFacetRotationsEulerDeg);
  deepFreeze(nextConfig.projectCameraSettings);

  return {
    config: nextConfig,
    payload: nextPayload
  };
};

export const buildCameraTuningPayloadFromConfig = (config) => cloneCameraTuningPayload({
  version: 1,
  tuning: {
    cameraPositions: config.cameraPositions,
    cameraTargets: config.cameraTargets,
    cameraOffsets: config.cameraOffsets,
    explodedPositions: config.explodedPositions,
    facetRotationsEulerDeg: config.facetRotationsEulerDeg,
    selectedFacetRotationsEulerDeg: config.selectedFacetRotationsEulerDeg,
    projectCameraSettings: config.projectCameraSettings,
    timing: {
      camera: {
        explodeDuration: config.timing.camera.explodeDuration,
        reformDuration: config.timing.camera.reformDuration
      }
    }
  }
});

export const stringifyCameraTuningPayload = (payload) => `${JSON.stringify(cloneCameraTuningPayload(payload), null, 2)}\n`;

export const PROJECT_CAMERA_TUNING_KEYS = {
  ZONE_KEYS,
  PROJECT_KEYS,
  PROJECT_CAMERA_KEYS,
  DEVICE_KEYS,
  MODE_KEYS
};
