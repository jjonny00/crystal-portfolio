export const isMobileDevice = () => {
  const ua = navigator.userAgent;
  const touchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 1;
  const isIpadOS = ua.includes('Mac') && touchCapable;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobi/i.test(ua) || isIpadOS;
};

export default isMobileDevice;
