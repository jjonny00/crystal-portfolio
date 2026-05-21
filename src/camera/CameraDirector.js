import * as THREE from 'three';

const smoothstep = (t) => {
  const p = THREE.MathUtils.clamp(t, 0, 1);
  return p * p * (3 - 2 * p);
};

export const createCameraDirectorPilotTransition = ({
  id,
  fromPose,
  toPose,
  startedAt,
  durationSeconds = 0.9,
}) => ({
  id,
  fromPose,
  toPose,
  startedAt,
  durationSeconds,
});

export const updateCameraDirectorPilotTransition = ({ transition, now }) => {
  const duration = Math.max(0.0001, Number(transition?.durationSeconds) || 0.9);
  const startedAt = Number(transition?.startedAt) || 0;
  const rawProgress = (now - startedAt) / duration;
  const progress = THREE.MathUtils.clamp(rawProgress, 0, 1);
  const eased = smoothstep(progress);

  const pose = {
    position: new THREE.Vector3().lerpVectors(transition.fromPose.position, transition.toPose.position, eased),
    lookAt: new THREE.Vector3().lerpVectors(transition.fromPose.lookAt, transition.toPose.lookAt, eased),
    fov: THREE.MathUtils.lerp(transition.fromPose.fov, transition.toPose.fov, eased),
    filmOffset: THREE.MathUtils.lerp(transition.fromPose.filmOffset, transition.toPose.filmOffset, eased),
  };

  return { progress, pose, complete: progress >= 1 };
};
