// src/data/projects.js
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
    description: "A dashboard designed with user needs at the forefront, featuring intuitive navigation and data visualization. Uses research-driven design to simplify complex data for quick decision making.",
    technologies: ["React", "D3.js", "Figma", "User Research"],
    color: "#64ffda", // Match the facet color
    imageUrl: "/assets/projects/user-dashboard.jpg",
    demoUrl: "https://demo-url.com/dashboard",
    githubUrl: "https://github.com/yourusername/user-dashboard"
  },
  {
    id: "project2",
    facetKey: "narrative",
    title: "Interactive Storytelling Platform",
    description: "A platform that guides users through narratives with compelling visuals and interaction. Creates immersive experiences that communicate complex ideas through story-driven interfaces.",
    technologies: ["Three.js", "GSAP", "React", "Storyboarding"],
    color: "#bb86fc", // Match the facet color
    imageUrl: "/assets/projects/storytelling-platform.jpg",
    demoUrl: "https://demo-url.com/storytelling",
    githubUrl: "https://github.com/yourusername/storytelling-platform"
  },
  {
    id: "project3",
    facetKey: "craft",
    title: "Design System Implementation",
    description: "A meticulously crafted design system with attention to detail and consistency. Provides a foundation for scalable product development with precision-engineered components.",
    technologies: ["Styled Components", "Storybook", "Figma", "Design Tokens"],
    color: "#03dac6", // Match the facet color
    imageUrl: "/assets/projects/design-system.jpg",
    demoUrl: "https://demo-url.com/design-system",
    githubUrl: "https://github.com/yourusername/design-system"
  },
  {
    id: "project4",
    facetKey: "system",
    title: "Component Architecture",
    description: "A comprehensive component library with scalable architecture and documentation. Built for maximum reusability and maintainability across multiple applications and teams.",
    technologies: ["React", "TypeScript", "Monorepo", "CI/CD"],
    color: "#cf6679", // Match the facet color
    imageUrl: "/assets/projects/component-architecture.jpg",
    demoUrl: "https://demo-url.com/components",
    githubUrl: "https://github.com/yourusername/component-architecture"
  },
  {
    id: "project5",
    facetKey: "leadership",
    title: "Team Collaboration Platform",
    description: "A tool designed to empower teams and facilitate collaboration across disciplines. Streamlines communication and workflow between design, development, and product teams.",
    technologies: ["Next.js", "Firebase", "Tailwind CSS", "User Testing"],
    color: "#ffd600", // Match the facet color
    imageUrl: "/assets/projects/collaboration-platform.jpg",
    demoUrl: "https://demo-url.com/collaboration",
    githubUrl: "https://github.com/yourusername/collaboration-platform"
  },
  {
    id: "project6",
    facetKey: "exploration",
    title: "Experimental Interactions",
    description: "A collection of experimental interaction prototypes exploring new paradigms. Pushes boundaries with cutting-edge techniques and technologies to discover novel ways of engaging users.",
    technologies: ["WebGL", "React Three Fiber", "Shaders", "Motion Design"],
    color: "#ff7043", // Match the facet color
    imageUrl: "/assets/projects/experimental-interactions.jpg",
    demoUrl: "https://demo-url.com/experiments",
    githubUrl: "https://github.com/yourusername/experimental-interactions"
  }
];

/**
 * Helper function to get project by facet key
 * @param {string} facetKey - The facet key to lookup
 * @returns {Object|null} Project object or null if not found
 */
export const getProjectByFacetKey = (facetKey) => {
  return projects.find(project => project.facetKey === facetKey) || null;
};

/**
 * Helper function to get project by ID
 * @param {string} id - The project ID to lookup
 * @returns {Object|null} Project object or null if not found
 */
export const getProjectById = (id) => {
  return projects.find(project => project.id === id) || null;
};

/**
 * Get project color by facet key
 * Useful for maintaining consistent colors
 */
export const getProjectColorByFacetKey = (facetKey) => {
  const project = getProjectByFacetKey(facetKey);
  return project ? project.color : '#64ffda'; // Default color
};

/**
 * Get project featured technologies
 * Returns top 2 technologies for summary displays
 */
export const getProjectFeaturedTech = (facetKey) => {
  const project = getProjectByFacetKey(facetKey);
  return project && project.technologies ? project.technologies.slice(0, 2) : [];
};

export default projects;