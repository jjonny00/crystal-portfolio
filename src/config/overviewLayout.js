import { Vector3 } from 'three';

const sharedAnchors = {
  empathy: [0.2, -2.37, -0.11],
  narrative: [0.09, -1.16, -1.0],
  craft: [1.39, 0.19, 0.7],
  system: [-0.74, 0.19, -2.11],
  leadership: [0.48, 2.01, 1.19],
  exploration: [-0.83, 1.38, -0.07],
};

const toVectorMap = (anchorMap) => Object.fromEntries(
  Object.entries(anchorMap).map(([facetKey, value]) => [facetKey, new Vector3(...value)]),
);

export const OVERVIEW_LAYOUT = {
  desktop: {
    anchors: {
      overviewWorld: toVectorMap(sharedAnchors),
    },
    labels: {
      panelWidth: '33.3333%',
      right: '6%',
      top: '50%',
      transform: 'translateY(-50%)',
      rowGap: '1.5rem',
    },
  },
  mobile: {
    anchors: {
      overviewWorld: toVectorMap(sharedAnchors),
    },
    labels: {
      panelWidth: '33.3333%',
      right: '6%',
      top: '50%',
      transform: 'translateY(-50%)',
      rowGap: '1rem',
    },
  },
};
