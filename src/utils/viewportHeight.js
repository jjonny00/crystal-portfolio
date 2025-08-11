export function installLegacyVhPolyfill() {
  if (typeof window === 'undefined') return;
  const supportsDvh = CSS && CSS.supports && CSS.supports('height: 100dvh');
  if (supportsDvh) return;

  const setVh = () => {
    const h = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty('--app-vh', `${h * 0.01}px`);
  };

  setVh();
  window.addEventListener('resize', setVh);
  window.addEventListener('orientationchange', setVh);
}
