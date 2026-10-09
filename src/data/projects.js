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
    // URL identity: /work/slipstream. Stable once published, since inbound links
    // and search results point at it.
    slug: 'slipstream',
    // Search result + share card. Title gets ' | Jon Shaw' appended; keep the
    // description under ~160 characters so it is not cut off.
    seo: {
      title: 'Slipstream: Designing Around Essence',
      description:
        'A VR combat prototype in Unreal Engine where one resource, Essence, powers movement, weapons, and the world itself, unifying traversal, combat, and progression.',
      image: '/og/slipstream.jpg'
    },
    facetKey: 'project01',
    modelKey: 'project01',
    crystalKey: 'leadership',
    placementKey: 'exploration',
    runtimeModelKey: 'project06',
    title: 'SLIPSTREAM',
    label: 'Slipstream',
    subtitle: 'VR Combat Prototype · Unreal Engine',
    tagline: 'VR Combat Prototype · Unreal Engine',
    shortTagline: 'VR Prototype · Unreal',
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
    // URL identity: /work/mesa. Stable once published, since inbound links
    // and search results point at it.
    slug: 'mesa',
    // Search result + share card. Title gets ' | Jon Shaw' appended; keep the
    // description under ~160 characters so it is not cut off.
    seo: {
      title: 'Mesa: How Turns Create Tension',
      description:
        'Case study: designing Mesa, an asynchronous iOS strategy game where stronger powers hit softer. Paper prototyped, then 150K downloads in its first week.',
      image: '/og/mesa.jpg'
    },
    facetKey: 'project02',
    modelKey: 'project02',
    crystalKey: 'exploration',
    placementKey: 'craft',
    runtimeModelKey: 'project03',
    title: 'MESA',
    label: 'Mesa',
    subtitle: 'Asynchronous Multiplayer · iOS',
    tagline: 'Asynchronous Multiplayer · iOS',
    shortTagline: 'Async Multiplayer · iOS',
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
    // URL identity: /work/fundseeder. Stable once published, since inbound links
    // and search results point at it.
    slug: 'fundseeder',
    // Search result + share card. Title gets ' | Jon Shaw' appended; keep the
    // description under ~160 characters so it is not cut off.
    seo: {
      title: 'FundSeeder: Designing the Ladder',
      description:
        'Case study: redesigning FundSeeder around a competitive ladder that gives 1,000+ ranked traders meaningful goals, relevant rivals, and reasons to progress.',
      image: '/og/fundseeder.jpg'
    },
    facetKey: 'project03',
    modelKey: 'project03',
    crystalKey: 'craft',
    placementKey: 'narrative',
    runtimeModelKey: 'project02',
    title: 'FUNDSEEDER',
    label: 'FundSeeder',
    subtitle: 'Competitive Platform · Web',
    tagline: 'Competitive Platform · Web',
    shortTagline: 'Competitive Platform',
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
    // URL identity: /work/flying-axes. Stable once published, since inbound links
    // and search results point at it.
    slug: 'flying-axes',
    // Search result + share card. Title gets ' | Jon Shaw' appended; keep the
    // description under ~160 characters so it is not cut off.
    seo: {
      title: 'Flying Axes: Making Room for Play',
      description:
        'Case study: a connected axe-throwing venue system. Scoreboards, coach tablets, and venue displays on one edge network, deployed across three venues.',
      image: '/og/flying-axes.jpg'
    },
    facetKey: 'project04',
    modelKey: 'project04',
    crystalKey: 'system',
    placementKey: 'system',
    runtimeModelKey: 'project04',
    title: 'FLYING AXES',
    label: 'Flying Axes',
    subtitle: 'Connected Venue System · Multi-Location',
    tagline: 'Connected Venue System · Multi-Location',
    shortTagline: 'Connected Venues',
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
    // URL identity: /work/forest-giant. Stable once published, since inbound links
    // and search results point at it.
    slug: 'forest-giant',
    // Search result + share card. Title gets ' | Jon Shaw' appended; keep the
    // description under ~160 characters so it is not cut off.
    seo: {
      title: 'Forest Giant: Building the Practice',
      description:
        'How I helped Forest Giant hold its quality bar past 30 people: the process, structure, and design culture behind ambitious interactive work.',
      image: '/og/forest-giant.jpg'
    },
    facetKey: 'project05',
    modelKey: 'project05',
    crystalKey: 'narrative',
    placementKey: 'leadership',
    runtimeModelKey: 'project05',
    title: 'FOREST GIANT',
    label: 'Forest Giant',
    subtitle: 'Creative Practice · Leadership + Delivery',
    tagline: 'Creative Practice · Leadership + Delivery',
    shortTagline: 'Leadership + Systems',
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
    // URL identity: /work/ge-experience-centers. Stable once published, since inbound links
    // and search results point at it.
    slug: 'ge-experience-centers',
    // Search result + share card. Title gets ' | Jon Shaw' appended; keep the
    // description under ~160 characters so it is not cut off.
    seo: {
      title: 'GE Experience Centers: A Space That Follows the Conversation',
      description:
        'Case study: evolving GE’s collaboration centers in Dubai, Shanghai, and Austin into a shared platform that guides reshape around each visit.',
      image: '/og/ge-experience-centers.jpg'
    },
    facetKey: 'project06',
    modelKey: 'project06',
    crystalKey: 'empathy',
    placementKey: 'empathy',
    runtimeModelKey: 'project01',
    title: 'GE EXPERIENCE CENTERS',
    label: 'GE Experience Centers',
    // The mobile overview's name for it: the labels there sit beside the
    // fragments, and the full name would run across the scene.
    shortLabel: 'GE Centers',
    subtitle: 'Creative Direction · Shared Experience Platform',
    tagline: 'Creative Direction · Shared Experience Platform',
    shortTagline: 'Creative Direction',
    description:
      'I led the evolution of GE’s collaboration centers into a shared platform, giving guides the freedom to reshape a space around the needs of a visit.',
    secondaryCopy: 'Deployed in Dubai, Shanghai, and Austin.',
    roles: 'Project Lead · Creative Direction',
    cta: 'Explore the Case Study',
    // Case-study level only: where to find the case study and how to theme it.
    // The case study's own content lives in src/caseStudies/ge-experience-centers/.
    // Colour A is a deeper step of the headline blue: it is the ink on every
    // cream section, and the facet blue itself is too light to read there.
    caseStudySlug: 'ge-experience-centers',
    caseStudyColors: {
      a: '#1f5bd8',
      b: '#f4f3ef'
    },
    mobile: {
      title: 'GE Experience Centers',
      subtitle: 'Creative Direction · Shared Experience Platform',
      description:
        'I led the evolution of GE’s collaboration centers into a shared platform, giving guides the freedom to reshape a space around the needs of a visit.',
      secondaryCopy: null,
      metrics: null,
      roles: null,
      cta: 'Explore the Case Study'
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
      color: '#031028',
    },
    technologies: ['Spatial UX', 'Modular Platform Architecture', 'Production'],
    color: '#0077ff',
    headlineColor: '#008cff',
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
