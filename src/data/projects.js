// src/data/projects.js

import {
  buildProjectFacetAssignment,
  getFacetSlotByProjectId as getFacetSlotByProjectIdFromAssignment,
  getProjectIdByFacetSlot as getProjectIdByFacetSlotFromAssignment,
  getSceneKeyByProjectId as getSceneKeyByProjectIdFromAssignment,
  getProjectIdBySceneKey as getProjectIdBySceneKeyFromAssignment,
  getFacetSlotBySceneKey as getFacetSlotBySceneKeyFromFacetSystem,
  facetSlotOrder,
  getSceneKeyByFacetSlot,
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
      'A VR action prototype built around one shared system: Essence powers everything. The same energy drives movement, weapons, and the dormant facility itself, turning traversal, combat, and progression into one continuous economy. SlipStream lets the player float, surge, and chain momentum through a vertical world built around powered cores, hostile drones, and high-speed decision making.',
    secondaryCopy: 'Game Design · Systems Design · Unreal Engine',
    roles: 'Prototype R&D · Movement, combat, and resource systems',
    cta: 'Designing Around Essence',
    // Only the keys that differ: ProjectFocusSection spreads mobile over the
    // project, so anything left out here keeps its desktop value.
    mobile: {
      description:
        'In this VR combat prototype, Essence powers movement, weapons, and the world itself, unifying traversal, combat, and progression in one high-speed economy.',
      secondaryCopy: null,
      metrics: null,
      roles: null
    },
    // Mobile scrim + copy ink. Authored, not measured — see legibility/scrimTone.js.
    // Cream copy over the project sky. Holds 4.6:1 on a bright frame.
    scrim: {
      opacity: 0.4,
      darkText: false,
      color: '#3c4375'
    },
    technologies: ['TBD', 'TBD', 'TBD'],
    color: '#a51dff',
    headlineColor: '#873cff',
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
    // Case-study level only: where to find the case study and how to theme it.
    // The case study's own content lives in src/caseStudies/mesa/.
    caseStudySlug: 'mesa',
    caseStudyColors: {
      a: '#EAFF00',
      b: '#000d1d'
    },
    mobile: {
      title: 'MESA',
      subtitle: 'Asynchronous Multiplayer · iOS',
      description:
        'An asynchronous strategy game where stronger powers hit softer, turning every move into a choice between damage and control.',
      secondaryCopy: null,
      metrics: null,
      roles: null,
      cta: 'How Turns Create Tension'
    },
    // Mobile scrim + copy ink. Authored, not measured — see legibility/scrimTone.js.
    scrim: {
      opacity: 0.55,
      darkText: false,
      color: '#334a71'
    },
    technologies: ['Gameplay Systems', 'UX Design', 'Balancing'],
    color: '#c2cd23',
    headlineColor: '#EAFF00',
    imageUrl: '/assets/projects/preview-mesa.webp',
    overlayImage: '/assets/projects/preview-mesa.webp'
  },
  {
    id: 'project03',
    facetKey: 'project03',
    modelKey: 'project03',
    crystalKey: 'craft',
    placementKey: 'narrative',
    runtimeModelKey: 'project02',
    title: 'FUNDSEEDER',
    label: 'FundSeeder',
    subtitle: 'Competitive Platform · Web',
    tagline: 'Competitive Platform · Web',
    description:
      'I redesigned FundSeeder around a competitive system that gives more than 1,000 ranked participants meaningful goals, relevant rivals, and a reason to keep progressing.',
    metrics: '1,027 strategies ranked · 17 traders seeded since relaunch',
    roles: 'Principal Product Designer · Strategy, Systems + Brand',
    cta: 'Designing the Ladder',
    // Case-study level only: where to find the case study and how to theme it.
    // The case study's own content lives in src/caseStudies/fundseeder/.
    caseStudySlug: 'fundseeder',
    caseStudyColors: {
      a: '#58E0B2',
      b: '#151f32'
    },
    mobile: {
      title: 'FundSeeder',
      subtitle: 'Competitive Platform · Web',
      description:
        'I redesigned FundSeeder as a competitive progression system with clear goals, relevant rivals, and reasons to advance.',
      secondaryCopy: null,
      metrics: null,
      roles: null,
      cta: 'Designing the Ladder'
    },
    // Mobile scrim + copy ink. Authored, not measured — see legibility/scrimTone.js.
    // The section that forced the dark-text option. Its teal sky is light enough
    // that washing it over the scene lifts the backdrop into the mid greys — the
    // exact band cream copy disappears into. So it goes the other way: a near-white
    // wash and near-black copy, reading as a light panel. 6.1:1 at its worst, over a
    // BLACK frame, which is the opposite worst case to every other project here.
    scrim: {
      opacity: 0.4,
      darkText: true,
      color: '#d6edec',
    },
    technologies: ['Product Strategy', 'UX Systems', 'Platform Design'],
    color: '#00bd8b',
    headlineColor: '#23c790',
    imageUrl: '/assets/projects/fundseeder.webp',
    overlayImage: '/assets/projects/fundseeder.webp'
  },
  {
    id: 'project04',
    facetKey: 'project04',
    modelKey: 'project04',
    crystalKey: 'system',
    placementKey: 'system',
    runtimeModelKey: 'project04',
    title: 'FLYING AXES',
    label: 'Flying Axes',
    subtitle: 'Connected Venue System · Multi-Location',
    tagline: 'Connected Venue System · Multi-Location',
    description:
      'A connected venue system built to make axe throwing feel tactile, social, and instantly legible. Scoreboards, coach tablets, and venue displays ran on an edge network that made the system easy to swap, reassign, and deploy across locations without losing the atmosphere of the game. The result was a more resilient platform behind the scenes and a more established game experience on the floor.',
    secondaryCopy: 'Deployed across 3 venues.',
    roles: 'Co-Founder · Experience Design · Systems + Game Design',
    cta: 'Making Room for Play',
    // Case-study level only: where to find the case study and how to theme it.
    // The case study's own content lives in src/caseStudies/flying-axes/.
    caseStudySlug: 'flying-axes',
    caseStudyColors: {
      a: '#ce2632',
      b: '#e2e0d8'
    },
    mobile: {
      description:
        'A connected venue system that made axe throwing tactile, social, and instantly legible. A resilient edge network unified scoreboards, coaching tablets, and displays across three venues.',
      secondaryCopy: null,
      metrics: null,
      roles: null
    },
    // Mobile scrim + copy ink. Authored, not measured — see legibility/scrimTone.js.
    scrim: {
      opacity: 0.2,
      darkText: false,
      color: '#303f69'
    },
    technologies: ['TBD', 'TBD', 'TBD'],
    color: '#ce2632',
    headlineColor: '#ff0000',
    imageUrl: '/assets/projects/preview-flying-axes.webp',
    overlayImage: '/assets/projects/preview-flying-axes.webp'
  },
  {
    id: 'project05',
    facetKey: 'project05',
    modelKey: 'project05',
    crystalKey: 'narrative',
    placementKey: 'leadership',
    runtimeModelKey: 'project05',
    title: 'FOREST GIANT',
    label: 'Forest Giant',
    subtitle: 'Creative Practice · Leadership + Delivery',
    tagline: 'Creative Practice · Leadership + Delivery',
    description:
      'Forest Giant earned its name on bold, technically ambitious interactive work. As the team grew past 30, holding the quality bar got harder than setting it. I helped shape the process, structure, and design culture that gave every team the same foundation and freed them to do their best work.',
    metrics: 'Selected by GE over ~500 global agencies · 30+ team at pea',
    roles: 'Co-Founder · Creative Direction · Process + Systems',
    cta: 'Building the Practice',
    mobile: {
      description:
        'As Forest Giant grew beyond 30 people, I helped shape the process, structure, and culture that kept ambitious work consistently strong.',
      secondaryCopy: null,
      metrics: null,
      roles: null
    },
    // Mobile scrim + copy ink. Authored, not measured — see legibility/scrimTone.js.
    scrim: {
      opacity: 0.4,
      darkText: false,
      color: '#4f3c6b'
    },
    technologies: ['TBD', 'TBD', 'TBD'],
    color: '#ff4d00',
    headlineColor: '#eb5321',
    imageUrl: '/assets/projects/preview-fg.webp',
    overlayImage: '/assets/projects/preview-fg.webp'
  },
  {
    id: 'project06',
    facetKey: 'project06',
    modelKey: 'project06',
    crystalKey: 'empathy',
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
        'A spatial platform that transformed with its audience, from tailored presentations to secure collaboration with real data and specialized tools.',
      // Kept where the other five null it out: this is the second paragraph of
      // the mobile copy, not one of the proof/credit lines.
      secondaryCopy:
        'I led the platform team, scaling the experience to Austin, Dubai, and Shanghai.',
      metrics: null,
      roles: null,
      cta: 'Built to Transform'
    },
    // Mobile scrim + copy ink. Authored, not measured — see legibility/scrimTone.js.
    // Its sky (#2c53a1) is the lightest of the cream-copy set, and washing it at any
    // opacity leaves the composite too high for cream — so the wash is that colour
    // deepened rather than the colour itself. `darkText: true` is the other answer
    // and needs no `color`, at the cost of GE reading as a light panel like
    // FundSeeder.
    scrim: {
      opacity: 0.4,
      darkText: false,
      color: '#314e86',
    },
    technologies: ['Spatial UX', 'Modular Platform Architecture', 'Production'],
    color: '#0095ff',
    headlineColor: '#265cff',
    imageUrl: '/assets/projects/preview-gec.webp',
    overlayImage: '/assets/projects/preview-gec.webp'
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

export const getFacetSlotBySceneFacetKey = (sceneFacetKey) =>
  getFacetSlotBySceneKeyFromFacetSystem(sceneFacetKey);


export const getProjectIdByAnyKey = (key) => {
  const project = getProjectByFacetKey(key) || projects.find((item) => item.id === key);
  return project?.facetKey || project?.id || key;
};

export const projectKeys = projects.map((project) => project.facetKey || project.id);
export const orderedProjectKeys = [...projectKeys];

export const facetKeys = facetSlotOrder
  .map((slot) => getSceneKeyByFacetSlot(slot))
  .filter(Boolean);
export const orderedFacetKeys = [...facetKeys];

const projectById = new Map(
  projects.map((project) => [project.facetKey || project.id, project])
);

const crystalKeyToProject = new Map(
  projects.map((project) => [project.crystalKey, project])
);

const placementKeyToProject = new Map(
  projects.map((project) => [project.placementKey || project.crystalKey, project])
);

const getProjectByFacetKey = (facetKey) => {
  if (!facetKey) return null;

  const byId = projectById.get(facetKey);
  if (byId) return byId;

  const bySceneProjectId = getProjectIdBySceneFacetKey(facetKey);
  if (bySceneProjectId) {
    const project = projectById.get(bySceneProjectId);
    if (project) return project;
  }

  return crystalKeyToProject.get(facetKey) || null;
};

export const getProjectModelKeyByFacetKey = (facetKey) => {
  const isSceneFacetKey = Boolean(getFacetSlotBySceneKeyFromFacetSystem(facetKey));
  const project = isSceneFacetKey
    ? placementKeyToProject.get(facetKey)
    : getProjectByFacetKey(facetKey);

  return project ? (project.runtimeModelKey || project.modelKey) : null;
};



export const getProjectPlacementKeyByFacetKey = (facetKey) => {
  if (getFacetSlotBySceneKeyFromFacetSystem(facetKey)) {
    return facetKey;
  }

  const project = getProjectByFacetKey(facetKey);
  return project?.placementKey || project?.crystalKey || facetKey;
};

export const getProjectColorByFacetKey = (facetKey) => {
  const project = getProjectByFacetKey(facetKey);
  return project ? project.color : '#028700';
};

/**
 * Full project record for a facet key, scene key, or project id. The case-study
 * overlay uses this to reach `caseStudySlug` / `caseStudyColors`.
 */
export const getProjectByAnyKey = (key) => getProjectByFacetKey(key);

export const getOverlayImageByFacetKey = (facetKey) => {
  const project = getProjectByFacetKey(facetKey);
  return project?.overlayImage || null;
};

export default projects;
