// src/data/facetSystem.js
// Canonical facet-slot system (foundation step).
//
// Project identity (project01...project06) is intentionally decoupled from
// scene facet placement identity (facetA...facetF).

export const facetSlotOrder = ['facetA', 'facetB', 'facetC', 'facetD', 'facetE', 'facetF'];

// Scene keys still map to the existing semantic facet identifiers used by models,
// anchors, exploded positions, and camera targets.
export const facetSlotToSceneKey = {
  facetA: 'exploration',
  facetB: 'craft',
  facetC: 'narrative',
  facetD: 'system',
  facetE: 'leadership',
  facetF: 'empathy',
};

export const sceneKeyToFacetSlot = Object.fromEntries(
  Object.entries(facetSlotToSceneKey).map(([slot, sceneKey]) => [sceneKey, slot])
);

export const getFacetSlotBySceneKey = (sceneKey) => sceneKeyToFacetSlot[sceneKey] || null;

export const getSceneKeyByFacetSlot = (slot) => facetSlotToSceneKey[slot] || null;

export const buildProjectFacetAssignment = (projects = []) =>
  Object.fromEntries(
    projects.map((project) => {
      const projectId = project.facetKey || project.id;
      const slot = getFacetSlotBySceneKey(project.crystalKey);
      return [projectId, slot];
    })
  );

export const getFacetSlotByProjectId = (projectId, assignment) => assignment?.[projectId] || null;

export const getProjectIdByFacetSlot = (slot, assignment) =>
  Object.entries(assignment || {}).find(([, assignedSlot]) => assignedSlot === slot)?.[0] || null;

export const getSceneKeyByProjectId = (projectId, assignment) => {
  const slot = getFacetSlotByProjectId(projectId, assignment);
  return getSceneKeyByFacetSlot(slot);
};

export const getProjectIdBySceneKey = (sceneKey, assignment) => {
  const slot = getFacetSlotBySceneKey(sceneKey);
  return getProjectIdByFacetSlot(slot, assignment);
};
