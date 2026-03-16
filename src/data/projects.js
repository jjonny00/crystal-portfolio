// src/data/projects.js

import {
  buildProjectFacetAssignment,
  getFacetSlotByProjectId as getFacetSlotByProjectIdFromAssignment,
  getProjectIdByFacetSlot as getProjectIdByFacetSlotFromAssignment,
  getSceneKeyByProjectId as getSceneKeyByProjectIdFromAssignment,
  getProjectIdBySceneKey as getProjectIdBySceneKeyFromAssignment,
} from './facetSystem';

export const projects = [
  {
    id: 'project01',
    facetKey: 'project01',
    modelKey: 'project01',
    crystalKey: 'leadership',
    placementKey: 'exploration',
    runtimeModelKey: 'project06',
    title: 'SLIPSTREAM',
    label: 'Slipstream',
    subtitle: 'VR Combat Prototype · Unreal Engine',
    tagline: 'VR Combat Prototype · Unreal Engine',
    description:
      'Dummy project content while details are being finalized. This section is intentionally neutral and ready to be replaced.',
    secondaryCopy: 'Add final narrative, outcomes, and role details here.',
    cta: 'Explore the Prototype',
    technologies: ['TBD', 'TBD', 'TBD'],
    color: '#ff7043',
    headlineColor: '#ff7043',
    imageUrl: '/assets/projects/experimental-interactions.jpg',
    overlayImage: '/assets/projects/experimental-interactions.jpg'
  },
  {
    id: 'project02',
    facetKey: 'project02',
    modelKey: 'project02',
    crystalKey: 'exploration',
    placementKey: 'craft',
    runtimeModelKey: 'project03',
    title: 'MESA',
    label: 'Mesa',
    subtitle: 'Asynchronous Multiplayer · iOS',
    tagline: 'Asynchronous Multiplayer · iOS',
    description:
      'An asynchronous competitive strategy game built around one idea: turns should create tension. Stronger powers hit softer, so each move forces a choice between pressing the advantage now or playing for control. The match opens up mid-game, then tightens until every tile matters.',
    secondaryCopy: 'Paper prototyped. Full matches tested before production.',
    metrics: '150K downloads in week one · Top 5 iOS App Store Free Games in 3 days',
    roles: 'Creator · Game Design · Systems + UI/UX',
    cta: 'How Turns Create Tension',
    mobile: {
      title: 'MESA',
      subtitle: 'Asynchronous Multiplayer · iOS',
      description:
        'An asynchronous competitive strategy game built around one idea: turns should create tension. Stronger powers hit softer, so every move becomes a choice between pressing now or playing for control.',
      secondaryCopy: 'Built on Game Center to cut multiplayer friction and scope. 150K downloads in week one.',
      metrics: null,
      roles: null,
      cta: 'How Turns Create Tension'
    },
    technologies: ['Gameplay Systems', 'UX Design', 'Balancing'],
    color: '#ece93e',
    headlineColor: '#ece93e',
    imageUrl: '/assets/projects/design-system.jpg',
    overlayImage: '/assets/projects/design-system.jpg'
  },
  {
    id: 'project03',
    facetKey: 'project03',
    modelKey: 'project03',
    crystalKey: 'system',
    placementKey: 'narrative',
    runtimeModelKey: 'project02',
    title: 'FUNDSEEDER',
    label: 'FundSeeder',
    subtitle: 'Competitive Platform · Web',
    tagline: 'Competitive Platform · Web',
    description:
      'A competitive platform for traders, built around trust, progression, and real opportunity. Traders connect their strategies, track performance, and compete for a shot at real allocation. I helped define the system that makes that climb feel credible, from early business validation and MVP scope to the ladder, tiers, and internal tools that surface high-potential traders.',
    metrics: '9 traders seeded in year one · 1,800 traders on platform',
    roles: 'Principal Product Designer · Strategy, Systems + Brand',
    cta: 'Designing the Ladder',
    mobile: {
      title: 'FundSeeder',
      subtitle: 'Competitive Platform · Web',
      description:
        'A competitive platform for traders, built around trust, progression, and real opportunity. Traders connect strategies, track performance, and compete for a shot at real allocation.',
      secondaryCopy:
        'I helped define the ladder, tiers, and systems that make that climb credible. 9 traders seeded in year one.',
      metrics: null,
      roles: null,
      cta: 'Designing the Ladder'
    },
    technologies: ['Product Strategy', 'UX Systems', 'Platform Design'],
    color: '#bb86fc',
    headlineColor: '#bb86fc',
    imageUrl: '/assets/projects/storytelling-platform.jpg',
    overlayImage: '/assets/projects/storytelling-platform.jpg'
  },
  {
    id: 'project04',
    facetKey: 'project04',
    modelKey: 'project04',
    crystalKey: 'narrative',
    placementKey: 'system',
    runtimeModelKey: 'project04',
    title: 'QUANTIFIED',
    label: 'Quantified',
    subtitle: 'Personal Analytics · iOS + Apple Watch',
    tagline: 'Personal Analytics · iOS + Apple Watch',
    description:
      'Dummy project content while details are being finalized. This section is intentionally neutral and ready to be replaced.',
    secondaryCopy: 'Add final narrative, outcomes, and role details here.',
    cta: 'View Case Study',
    technologies: ['TBD', 'TBD', 'TBD'],
    color: '#cf6679',
    headlineColor: '#cf6679',
    imageUrl: '/assets/projects/component-architecture.jpg',
    overlayImage: '/assets/projects/component-architecture.jpg'
  },
  {
    id: 'project05',
    facetKey: 'project05',
    modelKey: 'project05',
    crystalKey: 'empathy',
    placementKey: 'leadership',
    runtimeModelKey: 'project05',
    title: 'FOREST GIANT',
    label: 'Forest Giant',
    subtitle: 'Creative Practice · Leadership + Delivery',
    tagline: 'Creative Practice · Leadership + Delivery',
    description:
      'Dummy project content while details are being finalized. This section is intentionally neutral and ready to be replaced.',
    secondaryCopy: 'Add final narrative, outcomes, and role details here.',
    cta: 'View Case Study',
    technologies: ['TBD', 'TBD', 'TBD'],
    color: '#ffd600',
    headlineColor: '#ffd600',
    imageUrl: '/assets/projects/collaboration-platform.jpg',
    overlayImage: '/assets/projects/collaboration-platform.jpg'
  },
  {
    id: 'project06',
    facetKey: 'project06',
    modelKey: 'project06',
    crystalKey: 'craft',
    placementKey: 'empathy',
    runtimeModelKey: 'project01',
    title: 'GE EXPERIENCE CENTERS',
    label: 'GE Experience Centers',
    subtitle: 'Spatial Platform · Global Installations',
    tagline: 'Spatial Platform · Global Installations',
    description:
      'A spatial platform that transformed with the audience and the work at hand. Each center could welcome visitors with tailored partner content or shift into a secure environment for teams using live data and specialized tools. Built as a modular system, the same framework launched across Austin, Dubai, and Shanghai.',
    secondaryCopy: 'Led the platform team, aligning stakeholders across three continents.',
    roles: 'Creative Direction · Systems Design · Production Leadership',
    cta: 'Built to Transform',
    mobile: {
      title: 'GE Experience Centers',
      subtitle: 'Spatial Platform · Global Installations',
      description:
        'A spatial platform that transformed with the audience and the work at hand. The same space could welcome partners with tailored content or shift into secure collaboration using live data and specialized tools.',
      secondaryCopy:
        'Scaled across Austin, Dubai, and Shanghai. Led the platform team across three continents.',
      metrics: null,
      roles: null,
      cta: 'Built to Transform'
    },
    technologies: ['Spatial UX', 'Modular Platform Architecture', 'Production'],
    color: '#64ffda',
    headlineColor: '#64ffda',
    imageUrl: '/assets/projects/user-dashboard.jpg',
    overlayImage: '/assets/projects/user-dashboard.jpg'
  }
];


export const projectFacetAssignment = buildProjectFacetAssignment(projects);

export const getFacetSlotByProjectId = (projectId) =>
  getFacetSlotByProjectIdFromAssignment(projectId, projectFacetAssignment);

export const getProjectIdByFacetSlot = (facetSlot) =>
  getProjectIdByFacetSlotFromAssignment(facetSlot, projectFacetAssignment);

export const getSceneFacetKeyByProjectId = (projectId) =>
  getSceneKeyByProjectIdFromAssignment(projectId, projectFacetAssignment);

export const getProjectIdBySceneFacetKey = (sceneFacetKey) =>
  getProjectIdBySceneKeyFromAssignment(sceneFacetKey, projectFacetAssignment);


export const getProjectIdByAnyKey = (key) => {
  const project = getProjectByFacetKey(key) || projects.find((item) => item.id === key);
  return project?.facetKey || project?.id || key;
};

export const projectKeys = projects.map((project) => project.facetKey || project.id);
export const orderedProjectKeys = [...projectKeys];

export const facetKeys = projects.map((project) => project.crystalKey);
export const orderedFacetKeys = [...facetKeys];

const projectByAnyFacetKey = new Map(
  projects.flatMap((project) => [
    [project.facetKey, project],
    [project.crystalKey, project]
  ])
);

const getProjectByFacetKey = (facetKey) => projectByAnyFacetKey.get(facetKey) || null;

export const getProjectModelKeyByFacetKey = (facetKey) => {
  const project = getProjectByFacetKey(facetKey);
  return project ? (project.runtimeModelKey || project.modelKey) : null;
};



export const getProjectCrystalKeyByFacetKey = (facetKey) => {
  const project = getProjectByFacetKey(facetKey);
  return project?.crystalKey || facetKey;
};

export const getProjectPlacementKeyByFacetKey = (facetKey) => {
  const project = getProjectByFacetKey(facetKey);
  return project?.placementKey || project?.crystalKey || facetKey;
};

export const getProjectColorByFacetKey = (facetKey) => {
  const project = getProjectByFacetKey(facetKey);
  return project ? project.color : '#028700';
};

export const getOverlayImageByFacetKey = (facetKey) => {
  const project = getProjectByFacetKey(facetKey);
  return project?.overlayImage || null;
};

export default projects;
