import { Vector3 } from 'three';

const FORMAT_HELP =
  'Expected { schemaVersion: 1, anchors: { overviewWorld: { [facetKey]: [x, y, z] } } }';

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

const parseOffsetsLeaf = (leaf, path) => {
  assertObject(leaf, path);
  if (leaf.position === undefined || leaf.target === undefined) {
    throw new Error(
      `Invalid layout at ${path}: expected { position:[x,y,z], target:[x,y,z] }. ${FORMAT_HELP}`,
    );
  }
  return {
    position: parseVec3Array(leaf.position, `${path}.position`),
    target: parseVec3Array(leaf.target, `${path}.target`),
  };
};

const parseOffsetsSectionMap = (map, path) => {
  assertObject(map, path);
  return Object.fromEntries(
    Object.entries(map).map(([key, leaf]) => [key, parseOffsetsLeaf(leaf, `${path}.${key}`)]),
  );
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

export const parseLayout = (rawLayout) => {
  assertObject(rawLayout, 'root');

  if (rawLayout.schemaVersion !== 1) {
    throw new Error(
      `Invalid layout schemaVersion: expected 1, received ${String(
        rawLayout.schemaVersion,
      )}. ${FORMAT_HELP}`,
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

  // Optional camera
  if (rawLayout.camera !== undefined) {
    assertObject(rawLayout.camera, 'camera');
    const camera = {};

    if (rawLayout.camera.positions !== undefined) {
      assertObject(rawLayout.camera.positions, 'camera.positions');
      const positions = { ...parseVec3ArrayMap(rawLayout.camera.positions, 'camera.positions') };

      // Nested projects positions are allowed
      if (rawLayout.camera.positions.projects !== undefined) {
        positions.projects = parseVec3ArrayMap(
          rawLayout.camera.positions.projects,
          'camera.positions.projects',
        );
      }

      camera.positions = positions;
    }

    if (rawLayout.camera.targets !== undefined) {
      assertObject(rawLayout.camera.targets, 'camera.targets');
      const targets = { ...parseVec3ArrayMap(rawLayout.camera.targets, 'camera.targets') };

      // Nested projects targets are allowed
      if (rawLayout.camera.targets.projects !== undefined) {
        targets.projects = parseVec3ArrayMap(
          rawLayout.camera.targets.projects,
          'camera.targets.projects',
        );
      }

      camera.targets = targets;
    }

    if (rawLayout.camera.offsets !== undefined) {
      camera.offsets = parseOffsetsObject(rawLayout.camera.offsets, 'camera.offsets');
    }

    parsed.camera = camera;
  }

  // Optional projects
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

    parsed.projects = projects;
  }

  return parsed;
};

export default parseLayout;
