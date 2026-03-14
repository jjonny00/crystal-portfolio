// src/data/projects.js

export const projects = [
  {
    id: 'project01',
    facetKey: 'project01',
    modelKey: 'project01',
    crystalKey: 'exploration',
    runtimeModelKey: 'project06',
    title: 'PROJECT 01',
    subtitle: 'Placeholder Category · Platform',
    description:
      'Dummy project content while details are being finalized. This section is intentionally neutral and ready to be replaced.',
    secondaryCopy: 'Add final narrative, outcomes, and role details here.',
    cta: 'View Case Study →',
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
    crystalKey: 'leadership',
    runtimeModelKey: 'project05',
    title: 'PROJECT 02',
    subtitle: 'Placeholder Category · Platform',
    description:
      'Dummy project content while details are being finalized. This section is intentionally neutral and ready to be replaced.',
    secondaryCopy: 'Add final narrative, outcomes, and role details here.',
    cta: 'View Case Study →',
    technologies: ['TBD', 'TBD', 'TBD'],
    color: '#ffd600',
    headlineColor: '#ffd600',
    imageUrl: '/assets/projects/collaboration-platform.jpg',
    overlayImage: '/assets/projects/collaboration-platform.jpg'
  },
  {
    id: 'project03',
    facetKey: 'project03',
    modelKey: 'project03',
    crystalKey: 'system',
    runtimeModelKey: 'project04',
    title: 'PROJECT 03',
    subtitle: 'Placeholder Category · Platform',
    description:
      'Dummy project content while details are being finalized. This section is intentionally neutral and ready to be replaced.',
    secondaryCopy: 'Add final narrative, outcomes, and role details here.',
    cta: 'View Case Study →',
    technologies: ['TBD', 'TBD', 'TBD'],
    color: '#cf6679',
    headlineColor: '#cf6679',
    imageUrl: '/assets/projects/component-architecture.jpg',
    overlayImage: '/assets/projects/component-architecture.jpg'
  },
  {
    id: 'project04',
    facetKey: 'project04',
    modelKey: 'project04',
    crystalKey: 'craft',
    runtimeModelKey: 'project03',
    title: 'MESA',
    subtitle: 'Asynchronous Multiplayer · iOS',
    description:
      'An asynchronous competitive strategy game built around one idea: turns should create tension. Stronger powers hit softer, so each move forces a choice between pressing the advantage now or playing for control. The match opens up mid-game, then tightens until every tile matters.',
    secondaryCopy: 'Paper prototyped. Full matches tested before production.',
    metrics: '150K downloads in week one · Top 5 iOS App Store Free Games in 3 days',
    roles: 'Creator · Game Design · Systems + UI/UX',
    cta: 'How Turns Create Tension →',
    technologies: ['Gameplay Systems', 'UX Design', 'Balancing'],
    color: '#ece93e',
    headlineColor: '#ece93e',
    imageUrl: '/assets/projects/design-system.jpg',
    overlayImage: '/assets/projects/design-system.jpg'
  },
  {
    id: 'project05',
    facetKey: 'project05',
    modelKey: 'project05',
    crystalKey: 'narrative',
    runtimeModelKey: 'project02',
    title: 'FUNDSEEDER',
    subtitle: 'Competitive Platform · Web',
    description:
      'A competitive platform for traders, built around trust, progression, and real opportunity. Traders connect their strategies, track performance, and compete for a shot at real allocation. I helped define the system that makes that climb feel credible, from early business validation and MVP scope to the ladder, tiers, and internal tools that surface high-potential traders.',
    metrics: '9 traders seeded in year one · 1,800 traders on platform',
    roles: 'Principal Product Designer · Strategy, Systems + Brand',
    cta: 'Designing the Ladder →',
    technologies: ['Product Strategy', 'UX Systems', 'Platform Design'],
    color: '#bb86fc',
    headlineColor: '#bb86fc',
    imageUrl: '/assets/projects/storytelling-platform.jpg',
    overlayImage: '/assets/projects/storytelling-platform.jpg'
  },
  {
    id: 'project06',
    facetKey: 'project06',
    modelKey: 'project06',
    crystalKey: 'empathy',
    runtimeModelKey: 'project01',
    title: 'GE EXPERIENCE CENTERS',
    subtitle: 'Spatial Platform · Global Installations',
    description:
      'A spatial platform that transformed with the audience and the work at hand. Each center could welcome visitors with tailored partner content or shift into a secure environment for teams using live data and specialized tools. Built as a modular system, the same framework launched across Austin, Dubai, and Shanghai.',
    secondaryCopy: 'Led the platform team, aligning stakeholders across three continents.',
    roles: 'Creative Direction · Systems Design · Production Leadership',
    cta: 'Built to Transform →',
    technologies: ['Spatial UX', 'Modular Platform Architecture', 'Production'],
    color: '#64ffda',
    headlineColor: '#64ffda',
    imageUrl: '/assets/projects/user-dashboard.jpg',
    overlayImage: '/assets/projects/user-dashboard.jpg'
  }
];

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

export const getProjectColorByFacetKey = (facetKey) => {
  const project = getProjectByFacetKey(facetKey);
  return project ? project.color : '#028700';
};

export const getOverlayImageByFacetKey = (facetKey) => {
  const project = getProjectByFacetKey(facetKey);
  return project?.overlayImage || null;
};

export default projects;
