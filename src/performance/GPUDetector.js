export default class GPUDetector {
  static detect() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      return { tier: 'minimal', reason: 'No WebGL support' };
    }
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ?
      gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    const isHardwareAccelerated = !renderer.toLowerCase().includes('swiftshader') &&
                                  !renderer.toLowerCase().includes('software');
    const isMobile = /iPhone|iPad|Android/.test(navigator.userAgent);
    const deviceMemory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const gpuLower = renderer.toLowerCase();
    if (gpuLower.includes('rtx 40') || gpuLower.includes('rtx 30') ||
        gpuLower.includes('rx 7') || gpuLower.includes('m2') ||
        gpuLower.includes('m1 pro') || gpuLower.includes('m1 max')) {
      return { tier: 'high', gpu: renderer, mobile: false };
    }
    if (isMobile) {
      if (gpuLower.includes('apple a15') || gpuLower.includes('apple a16') ||
          gpuLower.includes('apple a17')) {
        return { tier: 'medium', gpu: renderer, mobile: true };
      }
      return { tier: 'low', gpu: renderer, mobile: true };
    }
    if (gpuLower.includes('intel') && !gpuLower.includes('iris')) {
      return { tier: 'low', gpu: renderer, mobile: false };
    }
    return { tier: 'medium', gpu: renderer, mobile: false };
  }
}
