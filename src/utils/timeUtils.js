// src/utils/timeUtils.js
// Utilities for time-based calculations

/**
 * Calculate rotation in radians based on elapsed time and angular speed.
 * @param {number} elapsedTime - Time elapsed in seconds.
 * @param {number} speedRadiansPerSecond - Rotation speed in radians per second.
 * @returns {number} The rotation in radians.
 */
export function getTimeBasedRotation(elapsedTime, speedRadiansPerSecond){
  return elapsedTime * speedRadiansPerSecond;
}

/**
 * Generate a sine wave value from elapsed time.
 * @param {number} elapsedTime - Time elapsed in seconds.
 * @param {number} frequency - Oscillation frequency in hertz.
 * @param {number} amplitude - Peak value of the wave.
 * @param {number} [offset=0] - Phase offset in radians.
 * @returns {number} The sine wave value at the given time.
 */
export function getTimeBasedSine(elapsedTime, frequency, amplitude, offset = 0){
  return Math.sin(2 * Math.PI * frequency * elapsedTime + offset) * amplitude;
}
