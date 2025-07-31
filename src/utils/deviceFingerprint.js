export async function generateFingerprint() {
  let renderer = 'unknown';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      renderer = gl.getParameter(debugInfo ? debugInfo.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
    }
  } catch (err) {
    renderer = 'unavailable';
  }

  const screenInfo = `${window.screen.width}x${window.screen.height}@${window.devicePixelRatio}`;
  const cpu = navigator.hardwareConcurrency || '0';
  const memory = navigator.deviceMemory || '0';

  let webgl2 = false;
  try {
    const canvas = document.createElement('canvas');
    webgl2 = !!canvas.getContext('webgl2');
  } catch (err) {}

  const ua = navigator.userAgent;

  const data = `${renderer}|${screenInfo}|${cpu}|${memory}|${webgl2}|${ua}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
