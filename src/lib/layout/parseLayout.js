import { Vector3 } from 'three';

const FORMAT_HELP = 'Expected { schemaVersion: 1, anchors: { overviewWorld: { [facetKey]: [x, y, z] } }, camera?: { positions?, targets?, offsets? }, projects?: { explodedPositions?, facetRotationsEulerDeg? }, ... }';

export const assertObject = (value, path) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid layout at ${path}: expected object. ${FORMAT_HELP}`);
  }
};

export const parseVec3 = (value, path) => {
  if (
    !Array.isArray(value) ||
    value.length !== 3 ||
    value.some((v) => typeof v !== 'number' || Number.isNaN(v))
  ) {
    throw new Error(
      `Invalid layout at ${path}: expected [x, y, z] numeric array of length 3. ${FORMAT_HELP}`,
    );
  }

  return new Vector3(value[0], value[1], value[2]);
};

const parseVec3Array = (value, path) => {
  if (
    !Array.isArray(value) ||
    value.length !== 3 ||
    value.some((v) => typeof v !== 'number' || Number.isNaN(v))
  ) {
    throw new Error(
      `Invalid layout at ${path}: expected [x, y, z] numeric array of length 3. ${FORMAT_HELP}`,
    );
  }

  return value;
};

export const parseVec3Map = (obj, pathPrefix) => {
  assertObject(obj, pathPrefix);
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, parseVec3(value, `${pathPrefix}.${key}`)]),
  );
};

const parseVec3ArrayMap = (obj, pathPrefix) => {
  assertObject(obj, pathPrefix);
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, parseVec3Array(value, `${pathPrefix}.${key}`)]),
  );
};

export const parseOffsetsObject = (obj, pathPrefix) => {
  assertObject(obj, pathPrefix);

  const parsed = {};

  if (obj.global !== undefined) {
    assertObject(obj.global, `${pathPrefix}.global`);
    parsed.global = {};
    if (obj.global.position !== undefined) {
      parsed.global.position = parseVec3Array(obj.global.position, `${pathPrefix}.global.position`);
    }
    if (obj.global.target !== undefined) {
      parsed.global.target = parseVec3Array(obj.global.target, `${pathPrefix}.global.target`);
    }
  }

  if (obj.zones !== undefined) {
    assertObject(obj.zones, `${pathPrefix}.zones`);
    parsed.zones = Object.fromEntries(
      Object.entries(obj.zones).map(([zoneKey, zoneValue]) => {
        assertObject(zoneValue, `${pathPrefix}.zones.${zoneKey}`);
        const zoneParsed = {};

        if (zoneValue.position !== undefined) {
          zoneParsed.position = parseVec3Array(zoneValue.position, `${pathPrefix}.zones.${zoneKey}.position`);
        }
        if (zoneValue.target !== undefined) {
          zoneParsed.target = parseVec3Array(zoneValue.target, `${pathPrefix}.zones.${zoneKey}.target`);
        }

        return [zoneKey, zoneParsed];
      }),
    );
  }

  if (obj.projects !== undefined) {
    assertObject(obj.projects, `${pathPrefix}.projects`);
    parsed.projects = Object.fromEntries(
      Object.entries(obj.projects).map(([facetKey, facetValue]) => {
        assertObject(facetValue, `${pathPrefix}.projects.${facetKey}`);
        const facetParsed = {};

        if (facetValue.position !== undefined) {
          facetParsed.position = parseVec3Array(
            facetValue.position,
            `${pathPrefix}.projects.${facetKey}.position`,
          );
        }
        if (facetValue.target !== undefined) {
          facetParsed.target = parseVec3Array(
            facetValue.target,
            `${pathPrefix}.projects.${facetKey}.target`,
          );
        }

        return [facetKey, facetParsed];
      }),
    );
  }

  return parsed;
};

const parseRotationsMap = (obj, pathPrefix) => {
  assertObject(obj, pathPrefix);

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (
        !Array.isArray(value) ||
        value.length !== 3 ||
        value.some((v) => typeof v !== 'number' || Number.isNaN(v))
      ) {
        throw new Error(
          `Invalid layout at ${pathPrefix}.${key}: expected [x, y, z] numeric array of length 3. ${FORMAT_HELP}`,
        );
      }

      return [key, value];
    }),
  );
};

export const parseLayout = (rawLayout) => {
  assertObject(rawLayout, 'root');

  if (rawLayout.schemaVersion !== 1) {
    throw new Error(
      `Invalid layout schemaVersion: expected 1, received ${String(rawLayout.schemaVersion)}. ${FORMAT_HELP}`,
    );
  }

  assertObject(rawLayout.anchors, 'anchors');
  assertObject(rawLayout.anchors.overviewWorld, 'anchors.overviewWorld');

  const overviewWorld = parseVec3Map(rawLayout.anchors.overviewWorld, 'anchors.overviewWorld');

  let camera;
  let projects;

  if (rawLayout.camera !== undefined) {
    assertObject(rawLayout.camera, 'camera');
    camera = {};

    if (rawLayout.camera.positions !== undefined) {
      assertObject(rawLayout.camera.positions, 'camera.positions');
      const positions = {};

      if (rawLayout.camera.positions.hero !== undefined) {
        positions.hero = parseVec3Array(rawLayout.camera.positions.hero, 'camera.positions.hero');
      }
      if (rawLayout.camera.positions.overview !== undefined) {
        positions.overview = parseVec3Array(rawLayout.camera.positions.overview, 'camera.positions.overview');
      }
      if (rawLayout.camera.positions.about !== undefined) {
        positions.about = parseVec3Array(rawLayout.camera.positions.about, 'camera.positions.about');
      }
      if (rawLayout.camera.positions.projects !== undefined) {
        positions.projects = parseVec3ArrayMap(rawLayout.camera.positions.projects, 'camera.positions.projects');
      }

      camera.positions = positions;
    }

    if (rawLayout.camera.targets !== undefined) {
      assertObject(rawLayout.camera.targets, 'camera.targets');
      const targets = {};

      if (rawLayout.camera.targets.hero !== undefined) {
        targets.hero = parseVec3Array(rawLayout.camera.targets.hero, 'camera.targets.hero');
      }
      if (rawLayout.camera.targets.overview !== undefined) {
        targets.overview = parseVec3Array(rawLayout.camera.targets.overview, 'camera.targets.overview');
      }
      if (rawLayout.camera.targets.about !== undefined) {
        targets.about = parseVec3Array(rawLayout.camera.targets.about, 'camera.targets.about');
      }
      if (rawLayout.camera.targets.projects !== undefined) {
        targets.projects = parseVec3ArrayMap(rawLayout.camera.targets.projects, 'camera.targets.projects');
      }

      camera.targets = targets;
    }

    if (rawLayout.camera.offsets !== undefined) {
      camera.offsets = parseOffsetsObject(rawLayout.camera.offsets, 'camera.offsets');
    }

  }

  if (rawLayout.projects !== undefined) {
    assertObject(rawLayout.projects, 'projects');
    projects = {};

    if (rawLayout.projects.explodedPositions !== undefined) {
      projects.explodedPositions = parseVec3ArrayMap(
        rawLayout.projects.explodedPositions,
        'projects.explodedPositions',
      );
    }

    if (rawLayout.projects.facetRotationsEulerDeg !== undefined) {
      projects.facetRotationsEulerDeg = parseRotationsMap(
        rawLayout.projects.facetRotationsEulerDeg,
        'projects.facetRotationsEulerDeg',
      );
    }

  }

  return {
    ...(camera ? { camera } : {}),
    ...(projects ? { projects } : {}),
    anchors: {
      overviewWorld,
    },
  };
};

export default parseLayout;
