import { createCameraPose } from './cameraPose';

export const CAMERA_DESTINATIONS = Object.freeze({
  INTRO: 'intro', HERO: 'hero', OVERVIEW: 'overview', ABOUT: 'about', PROJECT: 'project', CASE_STUDY: 'caseStudy'
});

export const resolveCameraDestination = ({ destination, projectId = null, mode = 'selected', config, animationData, isMobile = false }) => {
  const source = { destination, mode, isMobile, usedProjectCameraSettings: false, usedGlobalOffsets: false, usedZoneOffsets: false };
  const zoneKey = destination === CAMERA_DESTINATIONS.CASE_STUDY ? 'project' : destination;
  let basePosition = config?.cameraPositions?.[zoneKey] ?? null;
  let baseTarget = config?.cameraTargets?.[zoneKey] ?? null;
  const fov = Number.isFinite(animationData?.cameraConfig?.fov)
    ? animationData.cameraConfig.fov
    : (Number.isFinite(config?.camera?.fov) ? config.camera.fov : null);
  const filmOffset = zoneKey === CAMERA_DESTINATIONS.HERO
    ? (Number.isFinite(config?.cameraComposition?.hero?.filmOffsetX) ? config.cameraComposition.hero.filmOffsetX : 0)
    : 0;

  if ((destination === CAMERA_DESTINATIONS.PROJECT || destination === CAMERA_DESTINATIONS.CASE_STUDY) && projectId) {
    const projectSettings = config?.projectCameraSettings?.[projectId];
    const modeKey = destination === CAMERA_DESTINATIONS.CASE_STUDY || mode === 'caseStudy' ? 'caseStudy' : 'selected';
    const authored = projectSettings?.[modeKey];
    if (authored?.position) basePosition = authored.position;
    if (authored?.target) baseTarget = authored.target;
    source.usedProjectCameraSettings = Boolean(authored);
  }

  const withOffset = (vec, offset) => (Array.isArray(vec) && Array.isArray(offset) ? [vec[0] + offset[0], vec[1] + offset[1], vec[2] + offset[2]] : vec);
  const globalOffset = config?.cameraOffsets?.global;
  const zoneOffset = config?.cameraOffsets?.zones?.[zoneKey];
  if (globalOffset?.position || globalOffset?.target) {
    basePosition = withOffset(basePosition, globalOffset.position);
    baseTarget = withOffset(baseTarget, globalOffset.target);
    source.usedGlobalOffsets = true;
  }
  if (zoneOffset?.position || zoneOffset?.target) {
    basePosition = withOffset(basePosition, zoneOffset.position);
    baseTarget = withOffset(baseTarget, zoneOffset.target);
    source.usedZoneOffsets = true;
  }

  return {
    pose: createCameraPose({ position: basePosition, lookAt: baseTarget, fov, filmOffset }),
    source,
    context: { focusedProject: animationData?.focusedProject ?? null, cameraState: animationData?.cameraState ?? null }
  };
};
