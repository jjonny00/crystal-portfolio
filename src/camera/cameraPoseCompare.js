import * as THREE from 'three';

const toVec3 = (value) => {
  if (!value) return null;
  if (Array.isArray(value) && value.length === 3) return new THREE.Vector3(value[0], value[1], value[2]);
  if (value.isVector3) return value.clone();
  if (typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number') return new THREE.Vector3(value.x, value.y, value.z);
  return null;
};

export const compareCameraPoses = (legacyPose, resolvedPose) => {
  const legacyPosition = toVec3(legacyPose?.position);
  const legacyLookAt = toVec3(legacyPose?.lookAt);
  const newPosition = toVec3(resolvedPose?.position);
  const newLookAt = toVec3(resolvedPose?.lookAt);

  const positionDelta = legacyPosition && newPosition ? legacyPosition.distanceTo(newPosition) : Number.POSITIVE_INFINITY;
  const lookAtDelta = legacyLookAt && newLookAt ? legacyLookAt.distanceTo(newLookAt) : Number.POSITIVE_INFINITY;
  const fovDelta = Math.abs((legacyPose?.fov ?? 0) - (resolvedPose?.fov ?? 0));
  const filmOffsetDelta = Math.abs((legacyPose?.filmOffset ?? 0) - (resolvedPose?.filmOffset ?? 0));

  return { positionDelta, lookAtDelta, fovDelta, filmOffsetDelta };
};

export const isCameraPoseMatch = (delta, thresholds = {}) => {
  const t = { ...CAMERA_COMPARE_THRESHOLDS, ...thresholds };
  return (
    delta.positionDelta <= t.position &&
    delta.lookAtDelta <= t.lookAt &&
    delta.fovDelta <= t.fov &&
    delta.filmOffsetDelta <= t.filmOffset
  );
};


export const CAMERA_COMPARE_THRESHOLDS = Object.freeze({
  position: 0.001,
  lookAt: 0.001,
  fov: 0.001,
  filmOffset: 0.001
});

export const getMismatchedFields = (delta, thresholds = CAMERA_COMPARE_THRESHOLDS) => {
  const mismatchedFields = [];
  if (delta.positionDelta > thresholds.position) mismatchedFields.push('position');
  if (delta.lookAtDelta > thresholds.lookAt) mismatchedFields.push('lookAt');
  if (delta.fovDelta > thresholds.fov) mismatchedFields.push('fov');
  if (delta.filmOffsetDelta > thresholds.filmOffset) mismatchedFields.push('filmOffset');
  return mismatchedFields;
};
