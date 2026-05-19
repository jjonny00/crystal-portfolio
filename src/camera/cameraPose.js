/**
 * Normalized camera pose contract for the CameraDirector migration.
 */
export const CAMERA_POSE_FIELDS = ['position', 'lookAt', 'fov', 'filmOffset'];

const cloneVec3Like = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return [...value];
  if (typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number') return [value.x, value.y, value.z];
  return null;
};

export const createCameraPose = ({ position, lookAt, fov = null, filmOffset = null } = {}) => ({
  position: cloneVec3Like(position),
  lookAt: cloneVec3Like(lookAt),
  fov: typeof fov === 'number' ? fov : null,
  filmOffset: typeof filmOffset === 'number' ? filmOffset : null
});

export const isCameraPose = (value) => {
  if (!value || typeof value !== 'object') return false;
  return CAMERA_POSE_FIELDS.every((field) => Object.hasOwn(value, field));
};
