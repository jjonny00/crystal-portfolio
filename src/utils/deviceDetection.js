// src/utils/deviceDetection.js
// Simplified helpers for basic device checks

export const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export const isTablet = () => /(iPad|Android(?!.*Mobile))/i.test(navigator.userAgent);

export const isDesktop = () => !isMobile() && !isTablet();

