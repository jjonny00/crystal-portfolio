export const getHDRIPath = (quality = 'low') => {
  const q = ['high', 'medium', 'low'].includes(quality) ? quality : 'low';
  return `/assets/environment/prismatic09-${q}.hdr`;
};

export const getCanvasDPR = (profile = {}) => {
  const maxDpr = Math.min(window.devicePixelRatio || 1, 2);
  if (profile.pbrQuality === 'low' || profile.renderScale <= 0.5) {
    return [1, 1];
  }
  if (profile.pbrQuality === 'medium' || profile.renderScale < 1) {
    return [1, Math.min(maxDpr, 1.25)];
  }
  return [1, maxDpr];
};
