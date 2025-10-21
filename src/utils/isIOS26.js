export function isIOS26() {
  if (typeof navigator === 'undefined' || !navigator.userAgent) {
    return false;
  }

  const ua = navigator.userAgent;
  return /OS 26_/.test(ua) || /iPhone17,/.test(ua) || /\bA18\b/.test(ua);
}
