// src/data/projects.js
// UPDATED: Added headlineColor property for 1970s glow effect
// Project data structure that maps to crystal facets

/**
 * Projects collection
 * Each project maps to a facet in the crystal
 */
export const projects = [
  {
    id: "project1",
    facetKey: "empathy", // Maps to existing facet
    title: "User-Centered Dashboard",
    label: "GEC (Ascend Platform)",
    tagline: "Adaptive platform powering GE's global hubs",
    shortDescription: "User-focused dashboard simplifying complex data",
    logo: "/assets/logos/empathy.svg",
    description: "A dashboard designed with user needs at the forefront, featuring intuitive navigation and data visualization. Uses research-driven design to simplify complex data for quick decision making.",
    technologies: ["React", "D3.js", "Figma", "User Research"],
    color: "#64ffda", // Match the facet color
    headlineColor: "#64ffda", // NEW: Color for 1970s glow headlines
    overlayImage: "/assets/textures/checker01.jpg",
    imageUrl: "/assets/projects/user-dashboard.jpg",
    demoUrl: "https://demo-url.com/dashboard",
    githubUrl: "https://github.com/yourusername/user-dashboard",
    role: "Lead UX Designer",
    timeline: "4 months",
    teamSize: "5 people",
    platform: "Web Dashboard"
  },
  {
    id: "project2",
    facetKey: "narrative",
    title: "Interactive Storytelling Platform",
    label: "FundSeeder",
    tagline: "Fintech platform linking traders to capital",
    shortDescription: "Interactive platform weaving narratives with rich visuals",
    logo: "/assets/logos/narrative.svg",
    description: "A platform that guides users through narratives with compelling visuals and interaction. Creates immersive experiences that communicate complex ideas through story-driven interfaces.",
    technologies: ["Three.js", "GSAP", "React", "Storyboarding"],
    color: "#bb86fc", // Match the facet color
    headlineColor: "#bb86fc", // NEW: Color for 1970s glow headlines
    overlayImage: "/assets/textures/checker01.jpg",
    imageUrl: "/assets/projects/storytelling-platform.jpg",
    demoUrl: "https://demo-url.com/storytelling",
    githubUrl: "https://github.com/yourusername/storytelling-platform",
    role: "Lead UX Designer",
    timeline: "4 months",
    teamSize: "5 people",
    platform: "Web Dashboard"
  },
  {
    id: "project3",
    facetKey: "craft",
    title: "Design System Implementation",
    label: "Mesa",
    tagline: "Asynchronous PvP built on Game Center",
    shortDescription: "Design system enabling scalable, polished UI patterns",
    logo: "/assets/logos/craft.svg",
    description: "A meticulously crafted design system with attention to detail and consistency. Provides a foundation for scalable product development with precision-engineered components.",
    technologies: ["Styled Components", "Storybook", "Figma", "Design Tokens"],
    color: "#03dac6", // Match the facet color
    headlineColor: "#03dac6", // NEW: Color for 1970s glow headlines
    overlayImage: "/assets/textures/checker01.jpg",
    imageUrl: "/assets/projects/design-system.jpg",
    demoUrl: "https://demo-url.com/design-system",
    githubUrl: "https://github.com/yourusername/design-system",
    role: "Lead UX Designer",
    timeline: "4 months",
    teamSize: "5 people",
    platform: "Web Dashboard"
  },
  {
    id: "project4",
    facetKey: "system",
    title: "Component Architecture",
    label: "Quantified",
    tagline: "Track what matters, beautifully on Apple",
    shortDescription: "Reusable component architecture backed by thorough docs",
    logo: "/assets/logos/system.svg",
    description: "A comprehensive component library with scalable architecture and documentation. Built for maximum reusability and maintainability across multiple applications and teams.",
    technologies: ["React", "TypeScript", "Monorepo", "CI/CD"],
    color: "#cf6679", // Match the facet color
    headlineColor: "#cf6679", // NEW: Color for 1970s glow headlines
    overlayImage: "/assets/textures/checker01.jpg",
    imageUrl: "/assets/projects/component-architecture.jpg",
    demoUrl: "https://demo-url.com/components",
    githubUrl: "https://github.com/yourusername/component-architecture",
    role: "Lead UX Designer",
    timeline: "4 months",
    teamSize: "5 people",
    platform: "Web Dashboard"
  },
  {
    id: "project5",
    facetKey: "leadership",
    title: "Team Collaboration Platform",
    label: "Forest Giant",
    tagline: "Process, product, and team‑building at scale",
    shortDescription: "Collaboration platform aligning cross-discipline teams",
    logo: "/assets/logos/leadership.svg",
    description: "A tool designed to empower teams and facilitate collaboration across disciplines. Streamlines communication and workflow between design, development, and product teams.",
    technologies: ["Next.js", "Firebase", "Tailwind CSS", "User Testing"],
    color: "#ffd600", // Match the facet color
    headlineColor: "#ffd600", // NEW: Color for 1970s glow headlines
    overlayImage: "/assets/textures/checker01.jpg",
    imageUrl: "/assets/projects/collaboration-platform.jpg",
    demoUrl: "https://demo-url.com/collaboration",
    githubUrl: "https://github.com/yourusername/collaboration-platform",
    role: "Lead UX Designer",
    timeline: "4 months",
    teamSize: "5 people",
    platform: "Web Dashboard"
  },
  {
    id: "project6",
    facetKey: "exploration",
    title: "Experimental Interactions",
    label: "Experiments (XR/VR)",
    tagline: "Exploring VR interaction systems in Unreal",
    shortDescription: "Experimental prototypes exploring novel interface ideas",
    logo: "/assets/logos/exploration.svg",
    description: "A collection of experimental interaction prototypes exploring new paradigms. Pushes boundaries with cutting-edge techniques and technologies to discover novel ways of engaging users.",
    technologies: ["WebGL", "React Three Fiber", "Shaders", "Motion Design"],
    color: "#ff7043", // Match the facet color
    headlineColor: "#ff7043", // NEW: Color for 1970s glow headlines
    overlayImage: "/assets/projects/fundseeder.png",
    imageUrl: "/assets/projects/experimental-interactions.jpg",
    demoUrl: "https://demo-url.com/experiments",
    githubUrl: "https://github.com/yourusername/experimental-interactions",
    role: "Lead UX Designer",
    timeline: "4 months",
    teamSize: "5 people",
    platform: "Web Dashboard"
  }
];

/**
 * Helper function to get project by facet key
 * @param {string} facetKey - The facet key to lookup
 * @returns {Object|null} Project object or null if not found
 */
const getProjectByFacetKey = (facetKey) => {
  return projects.find(project => project.facetKey === facetKey) || null;
};

/**
 * Get project color by facet key
 * Useful for maintaining consistent colors
 */
export const getProjectColorByFacetKey = (facetKey) => {
  const project = getProjectByFacetKey(facetKey);
  return project ? project.color : '#028700'; // Default color
};

/**
 * Get overlay image path by facet key
 * @param {string} facetKey - The facet key to lookup
 * @returns {string|null} Overlay image path or null if not found
*/
export const getOverlayImageByFacetKey = (facetKey) => {
  const project = getProjectByFacetKey(facetKey);
  return project?.overlayImage || null;
};

export default projects;
