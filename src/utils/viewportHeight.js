export function installLegacyVhPolyfill() {
  if (typeof window === 'undefined') return false;
  
  // Check for modern viewport unit support
  const supportsDvh = CSS?.supports?.('height: 100dvh');
  const supportsLvh = CSS?.supports?.('height: 100lvh');
  
  if (supportsDvh && supportsLvh) {
    // Modern browser - no polyfill needed
    return false;
  }
  
  const setVh = () => {
    // Use visualViewport if available (iOS Safari)
    const height = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty('--app-vh', `${height * 0.01}px`);
    
    // Also set a CSS custom property for the safe area
    if (window.visualViewport) {
      const top = window.visualViewport.offsetTop || 0;
      document.documentElement.style.setProperty('--visual-viewport-top', `${top}px`);
    }
  };
  
  setVh();
  
  // Listen for viewport changes
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setVh);
    window.visualViewport.addEventListener('scroll', setVh);
  }
  
  window.addEventListener('resize', setVh);
  window.addEventListener('orientationchange', setVh);
  
  return true;
}
