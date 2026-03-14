/**
 * iOS 26 Safari viewport height fix
 * Sets CSS custom property --vh based on window.innerHeight
 * which remains consistent in iOS 26 even when Safari UI changes
 */

function setViewportHeight() {
  // Get actual viewport height
  const vh = window.innerHeight * 0.01;

  // Set CSS custom property
  document.documentElement.style.setProperty('--vh', `${vh}px`);

  if (import.meta.env.DEV) {
    console.log('📐 Viewport height updated:', window.innerHeight, 'px');
  }
}

// Initialize on load
setViewportHeight();

// Update on resize (orientation change, keyboard, etc.)
window.addEventListener('resize', setViewportHeight);

// Also update on orientationchange for iOS
window.addEventListener('orientationchange', () => {
  // Small delay to let iOS settle after rotation
  setTimeout(setViewportHeight, 100);
});

export default setViewportHeight;
