import { Vector3 } from 'three';


const DEFAULT_HERO_TUNING = {
  radius: 7,
  height: 0.8,
  orbitSpeed: 0.08,
  baseAngle: 0,
  lookAtYOffset: 0,
};

const FORMAT_HELP =
  'Expected { schemaVersion: 2, anchors: { overviewWorld: { [facetKey]: [x, y, z] } }, camera?: { positions?, targets?, offsets?, projects? }, projects?: { explodedPositions?, facetRotationsEulerDeg?, selectedFacetRotationsEulerDeg? }, ... }';

const assertObject = (value, path) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid layout at ${path}: expected object. ${FORMAT_HELP}`);
  }
};

const assertVec3Array = (value, path) => {
  if (
    !Array.isArray(value) ||
    value.length !== 3 ||
    value.some((v) => typeof v !== 'number' || Number.isNaN(v))
  ) {
    throw new Error(`Invalid layout at ${path}: expected [x, y, z] numeric array. ${FORMAT_HELP}`);
  }
};

const parseVec3Array = (value, path) => {
  assertVec3Array(value, path);
  return value;
};

const parseVec3ToVector3 = (value, path) => {
  assertVec3Array(value, path);
  return new Vector3(value[0], value[1], value[2]);
};

const parseVec3ArrayMap = (map, path) => {
  assertObject(map, path);
  return Object.fromEntries(
    Object.entries(map).map(([key, value]) => [key, parseVec3Array(value, `${path}.${key}`)]),
  );
};

const parseVec3VectorMap = (map, path) => {
  assertObject(map, path);
  return Object.fromEntries(
    Object.entries(map).map(([key, value]) => [key, parseVec3ToVector3(value, `${path}.${key}`)]),
  );
};

const parseCameraVectorSection = (section, path) => {
  assertObject(section, path);
  const parsed = {};

  if (section.intro !== undefined) parsed.intro = parseVec3Array(section.intro, `${path}.intro`);
  if (section.hero !== undefined) parsed.hero = parseVec3Array(section.hero, `${path}.hero`);
  if (section.overview !== undefined) {
    parsed.overview = parseVec3Array(section.overview, `${path}.overview`);
  }
  if (section.about !== undefined) parsed.about = parseVec3Array(section.about, `${path}.about`);
  if (section.projects !== undefined) {
    parsed.projects = parseVec3ArrayMap(section.projects, `${path}.projects`);
  }

  return parsed;
};

const parseOffsetsLeaf = (leaf, path) => {
  assertObject(leaf, path);
  const parsed = {};

  if (leaf.position !== undefined) {
    parsed.position = parseVec3Array(leaf.position, `${path}.position`);
  }
  if (leaf.target !== undefined) {
    parsed.target = parseVec3Array(leaf.target, `${path}.target`);
  }

  return parsed;
};

const parseOffsetsSectionMap = (map, path) => {
  assertObject(map, path);
  return Object.fromEntries(
    Object.entries(map).map(([key, leaf]) => [key, parseOffsetsLeaf(leaf, `${path}.${key}`)]),
  );
};

const parseComposition = (composition, path) => {
  assertObject(composition, path);
  const parsed = {};
  if (composition.hero !== undefined) {
    assertObject(composition.hero, `${path}.hero`);
    if (composition.hero.filmOffsetX !== undefined) {
      if (typeof composition.hero.filmOffsetX !== 'number' || Number.isNaN(composition.hero.filmOffsetX)) {
        throw new Error(`Invalid layout at ${path}.hero.filmOffsetX: expected number. ${FORMAT_HELP}`);
      }
      parsed.hero = { filmOffsetX: composition.hero.filmOffsetX };
    }
  }
  return parsed;
};

const parseHeroTuning = (heroTuning, path) => {
  assertObject(heroTuning, path);
  const parsed = {};

  Object.keys(DEFAULT_HERO_TUNING).forEach((key) => {
    if (heroTuning[key] !== undefined) {
      if (typeof heroTuning[key] !== 'number' || !Number.isFinite(heroTuning[key])) {
        throw new Error(`Invalid layout at ${path}.${key}: expected finite number. ${FORMAT_HELP}`);
      }
      parsed[key] = heroTuning[key];
    }
  });

  return parsed;
};

const parseHeroOverviewRuntimeTiming = (timing, path) => {
  assertObject(timing, path);
  const parsed = {};
  const numericKeys = [
    'totalDurationMs',
    'fractureChargeEnd',
    'explosionImpulseEnd',
    'bulletTimeSlowdownEnd',
    'overviewSettleEnd',
    'heroOverviewMotionDurationMs',
    'cameraPushbackDistance',
    'cameraPushbackStrength',
    'cameraPushbackDecayStart',
    'cameraPushbackDecayEnd',
    'cameraPushbackApplyScale',
    'fragmentImpulseDistance',
    'fragmentImpulseStrength',
    'fragmentRotationStrength',
    'fragmentImpulseApplyScale',
    'fragmentImpulseDecayStart',
    'fragmentImpulseDecayEnd',
    'fragmentBlastPortion',
    'fragmentBlastTravel',
    'fragmentMidPortionEnd',
    'fragmentMidTravel',
    'fragmentSlowPortionEnd',
    'fragmentSlowTravelEnd',
    'fragmentTravelEaseStrength',
    'fragmentTravelImpulseRate',
    'fragmentTravelTimeExponent',
    'fragmentTravelCurveStrength',
    'fragmentSettleCurveStrength',
  ];

  numericKeys.forEach((key) => {
    if (timing[key] === undefined) return;
    if (typeof timing[key] !== 'number' || !Number.isFinite(timing[key])) {
      throw new Error(`Invalid layout at ${path}.${key}: expected finite number.`);
    }
    parsed[key] = timing[key];
  });

  if (timing.fragmentTravelEaseType !== undefined) {
    const validEaseTypes = new Set(['powerOut', 'normalizedExpoOut']);
    if (!validEaseTypes.has(timing.fragmentTravelEaseType)) {
      throw new Error(`Invalid layout at ${path}.fragmentTravelEaseType: expected "powerOut" or "normalizedExpoOut".`);
    }
    parsed.fragmentTravelEaseType = timing.fragmentTravelEaseType;
  }
  if (timing.heroOverviewMotionEaseType !== undefined) {
    if (timing.heroOverviewMotionEaseType !== 'expoOut') {
      throw new Error(`Invalid layout at ${path}.heroOverviewMotionEaseType: expected "expoOut".`);
    }
    parsed.heroOverviewMotionEaseType = timing.heroOverviewMotionEaseType;
  }

  return parsed;
};

const parseOffsetsObject = (offsets, path) => {
  assertObject(offsets, path);

  const out = {};

  if (offsets.global !== undefined) {
    out.global = parseOffsetsLeaf(offsets.global, `${path}.global`);
  }

  if (offsets.zones !== undefined) {
    out.zones = parseOffsetsSectionMap(offsets.zones, `${path}.zones`);
  }

  if (offsets.projects !== undefined) {
    out.projects = parseOffsetsSectionMap(offsets.projects, `${path}.projects`);
  }

  return out;
};

const parseCameraProjects = (projects, path) => {
  assertObject(projects, path);
  return Object.fromEntries(
    Object.entries(projects).map(([projectKey, value]) => {
      assertObject(value, `${path}.${projectKey}`);
      const parsedProject = {};

      if (value.selected !== undefined) {
        assertObject(value.selected, `${path}.${projectKey}.selected`);
        parsedProject.selected = {};
        if (value.selected.position !== undefined) {
          parsedProject.selected.position = parseVec3Array(
            value.selected.position,
            `${path}.${projectKey}.selected.position`,
          );
        }
        if (value.selected.target !== undefined) {
          parsedProject.selected.target = parseVec3Array(
            value.selected.target,
            `${path}.${projectKey}.selected.target`,
          );
        }
      }

      if (value.caseStudy !== undefined) {
        assertObject(value.caseStudy, `${path}.${projectKey}.caseStudy`);
        parsedProject.caseStudy = {};
        if (value.caseStudy.position !== undefined) {
          parsedProject.caseStudy.position = parseVec3Array(
            value.caseStudy.position,
            `${path}.${projectKey}.caseStudy.position`,
          );
        }
        if (value.caseStudy.target !== undefined) {
          parsedProject.caseStudy.target = parseVec3Array(
            value.caseStudy.target,
            `${path}.${projectKey}.caseStudy.target`,
          );
        }
        if (value.caseStudy.facetRotation !== undefined) {
          parsedProject.caseStudy.facetRotation = parseVec3Array(
            value.caseStudy.facetRotation,
            `${path}.${projectKey}.caseStudy.facetRotation`,
          );
        }
      }

      return [projectKey, parsedProject];
    }),
  );
};

// The overview's project labels. `list` (the default, and what a layout without
// this block gets) is the column/card in FacetLabels; `placed` sets each label
// beside its fragment (overviewLabelPlacement.js documents the fields).
const OVERVIEW_LABEL_MODES = ['list', 'placed'];
const OVERVIEW_LABEL_NUMBERS = [
  'edgeMargin',
  'rightColumn',
  'connectorGap',
  'connectorRadius',
  'connectorWidth',
  'connectorLift',
];
const OVERVIEW_LABEL_SIDES = ['left', 'right'];

const assertOneOf = (value, allowed, path) => {
  if (!allowed.includes(value)) {
    throw new Error(`Invalid layout at ${path}: expected one of ${allowed.join(', ')}. ${FORMAT_HELP}`);
  }
};

const assertNumber = (value, path) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Invalid layout at ${path}: expected number. ${FORMAT_HELP}`);
  }
};

const assertNumberPair = (value, path) => {
  if (!Array.isArray(value) || value.length !== 2 || value.some((v) => typeof v !== 'number' || Number.isNaN(v))) {
    throw new Error(`Invalid layout at ${path}: expected [a, b] numeric array. ${FORMAT_HELP}`);
  }
};

const parseOverviewLabels = (raw, path) => {
  assertObject(raw, path);
  const parsed = {};

  if (raw.mode !== undefined) {
    assertOneOf(raw.mode, OVERVIEW_LABEL_MODES, `${path}.mode`);
    parsed.mode = raw.mode;
  }
  OVERVIEW_LABEL_NUMBERS.forEach((key) => {
    if (raw[key] === undefined) return;
    assertNumber(raw[key], `${path}.${key}`);
    parsed[key] = raw[key];
  });
  if (raw.rightAlign !== undefined) {
    if (typeof raw.rightAlign !== 'boolean') {
      throw new Error(`Invalid layout at ${path}.rightAlign: expected true or false. ${FORMAT_HELP}`);
    }
    parsed.rightAlign = raw.rightAlign;
  }

  if (raw.items !== undefined) {
    assertObject(raw.items, `${path}.items`);
    parsed.items = Object.fromEntries(
      Object.entries(raw.items).map(([key, item]) => {
        const itemPath = `${path}.items.${key}`;
        assertObject(item, itemPath);
        const parsedItem = {};
        if (item.side !== undefined) {
          assertOneOf(item.side, OVERVIEW_LABEL_SIDES, `${itemPath}.side`);
          parsedItem.side = item.side;
        }
        ['dx', 'dy'].forEach((axis) => {
          if (item[axis] === undefined) return;
          assertNumber(item[axis], `${itemPath}.${axis}`);
          parsedItem[axis] = item[axis];
        });
        if (item.exit !== undefined) {
          assertOneOf(item.exit, ['inner', 'below'], `${itemPath}.exit`);
          parsedItem.exit = item.exit;
        }
        if (item.dot !== undefined) {
          assertNumberPair(item.dot, `${itemPath}.dot`);
          parsedItem.dot = item.dot;
        }
        return [key, parsedItem];
      }),
    );
  }

  return parsed;
};

export const parseLayout = (rawLayout) => {
  assertObject(rawLayout, 'root');

  if (rawLayout.schemaVersion !== 2) {
    throw new Error(
      `Invalid layout schemaVersion: expected 2, received ${String(rawLayout.schemaVersion)}. ${FORMAT_HELP}`,
    );
  }

  assertObject(rawLayout.anchors, 'anchors');
  if (rawLayout.anchors.overviewWorld === undefined) {
    throw new Error(`Invalid layout at anchors.overviewWorld: required. ${FORMAT_HELP}`);
  }

  const overviewWorld = parseVec3VectorMap(rawLayout.anchors.overviewWorld, 'anchors.overviewWorld');

  const parsed = {
    anchors: { overviewWorld },
  };

  if (rawLayout.camera !== undefined) {
    assertObject(rawLayout.camera, 'camera');
    const camera = {};

    if (rawLayout.camera.positions !== undefined) {
      camera.positions = parseCameraVectorSection(rawLayout.camera.positions, 'camera.positions');
    }

    if (rawLayout.camera.targets !== undefined) {
      camera.targets = parseCameraVectorSection(rawLayout.camera.targets, 'camera.targets');
    }

    if (rawLayout.camera.offsets !== undefined) {
      camera.offsets = parseOffsetsObject(rawLayout.camera.offsets, 'camera.offsets');
    }

    if (rawLayout.camera.projects !== undefined) {
      camera.projects = parseCameraProjects(rawLayout.camera.projects, 'camera.projects');
    }

    if (rawLayout.camera.composition !== undefined) {
      camera.composition = parseComposition(rawLayout.camera.composition, 'camera.composition');
    }

    if (rawLayout.camera.heroTuning !== undefined) {
      camera.heroTuning = parseHeroTuning(rawLayout.camera.heroTuning, 'camera.heroTuning');
    }

    parsed.camera = camera;
  }

  if (rawLayout.projects !== undefined) {
    assertObject(rawLayout.projects, 'projects');
    const projects = {};

    if (rawLayout.projects.explodedPositions !== undefined) {
      projects.explodedPositions = parseVec3VectorMap(
        rawLayout.projects.explodedPositions,
        'projects.explodedPositions',
      );
    }

    if (rawLayout.projects.facetRotationsEulerDeg !== undefined) {
      projects.facetRotationsEulerDeg = parseVec3ArrayMap(
        rawLayout.projects.facetRotationsEulerDeg,
        'projects.facetRotationsEulerDeg',
      );
    }

    if (rawLayout.projects.selectedFacetRotationsEulerDeg !== undefined) {
      projects.selectedFacetRotationsEulerDeg = parseVec3ArrayMap(
        rawLayout.projects.selectedFacetRotationsEulerDeg,
        'projects.selectedFacetRotationsEulerDeg',
      );
    }

    parsed.projects = projects;
  }

  if (rawLayout.timing !== undefined) {
    assertObject(rawLayout.timing, 'timing');
    const timing = {};
    if (rawLayout.timing.heroOverviewRuntime !== undefined) {
      timing.heroOverviewRuntime = parseHeroOverviewRuntimeTiming(
        rawLayout.timing.heroOverviewRuntime,
        'timing.heroOverviewRuntime',
      );
    }
    if (Object.keys(timing).length > 0) {
      parsed.timing = timing;
    }
  }

  if (rawLayout.overviewLabels !== undefined) {
    parsed.overviewLabels = parseOverviewLabels(rawLayout.overviewLabels, 'overviewLabels');
  }

  return parsed;
};

export default parseLayout;
