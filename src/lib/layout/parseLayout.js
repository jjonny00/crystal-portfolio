import { Vector3 } from 'three';

const FORMAT_HELP = 'Expected { schemaVersion: 1, anchors: { overviewWorld: { [facetKey]: [x, y, z] } } }';

const assertObject = (value, path) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid layout at ${path}: expected object. ${FORMAT_HELP}`);
  }
};

const parseVector3 = (value, facetKey) => {
  if (!Array.isArray(value) || value.length !== 3 || value.some((v) => typeof v !== 'number' || Number.isNaN(v))) {
    throw new Error(
      `Invalid layout anchors.overviewWorld.${facetKey}: expected [x, y, z] numeric array of length 3. ${FORMAT_HELP}`,
    );
  }

  return new Vector3(value[0], value[1], value[2]);
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

  const overviewWorld = Object.fromEntries(
    Object.entries(rawLayout.anchors.overviewWorld).map(([facetKey, value]) => [facetKey, parseVector3(value, facetKey)]),
  );

  return {
    anchors: {
      overviewWorld,
    },
  };
};

export default parseLayout;
