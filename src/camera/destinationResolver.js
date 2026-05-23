const toVec3 = (value, fallback = [0, 0, 0]) => {
  if (Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)) return [...value];
  return [...fallback];
};
const addVec3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const getProjectBranch = ({ config, projectId, isMobile, mode }) => {
  if (!projectId) return null;
  const deviceKey = isMobile ? 'mobile' : 'desktop';
  return config?.projectCameraSettings?.[projectId]?.[deviceKey]?.[mode] || null;
};

export const resolveCameraDestination = ({ destination, projectId = null, mode = 'selected', config, animationData = null, isMobile = false }) => {
  const globalOffsetPos = toVec3(config?.cameraOffsets?.global?.position);
  const globalOffsetTarget = toVec3(config?.cameraOffsets?.global?.target);
  const base = { position: [0, 0, 0], lookAt: [0, 0, 0], fov: 45, filmOffset: 0, meta: { destination, projectId, mode, unresolved: false, source: 'resolver' } };

  if (destination === 'project' || destination === 'caseStudy') {
    const projectMode = destination === 'caseStudy' ? 'caseStudy' : mode;
    const branch = getProjectBranch({ config, projectId, isMobile, mode: projectMode });
    if (!branch) return { ...base, meta: { ...base.meta, unresolved: true, reason: 'missing-project-branch' } };
    return {
      ...base,
      position: addVec3(toVec3(branch.position), globalOffsetPos),
      lookAt: addVec3(toVec3(branch.target), globalOffsetTarget),
      fov: animationData?.cameraConfig?.fov ?? base.fov,
      filmOffset: config?.cameraComposition?.hero?.filmOffsetX ?? 0,
      meta: { ...base.meta, source: `projectCameraSettings.${projectMode}+animationData.cameraConfig.fov` },
    };
  }

  const zoneKey = destination;
  const rawPos = config?.cameraPositions?.[zoneKey];
  const rawTarget = config?.cameraTargets?.[zoneKey];
  if (!rawPos || !rawTarget) return { ...base, meta: { ...base.meta, unresolved: true, reason: 'missing-zone-pose' } };

  const zoneOffsetPos = toVec3(config?.cameraOffsets?.zones?.[zoneKey]?.position);
  const zoneOffsetTarget = toVec3(config?.cameraOffsets?.zones?.[zoneKey]?.target);
  return {
    ...base,
    position: addVec3(addVec3(toVec3(rawPos), globalOffsetPos), zoneOffsetPos),
    lookAt: addVec3(addVec3(toVec3(rawTarget), globalOffsetTarget), zoneOffsetTarget),
    fov: animationData?.cameraConfig?.fov ?? 45,
    filmOffset: config?.cameraComposition?.hero?.filmOffsetX ?? 0,
    meta: { ...base.meta, source: `zone.${zoneKey}` },
  };
};
