import { HalfFloatType, UnsignedByteType, RGBAFormat } from 'three';
import { isIOS26 } from './isIOS26.js';

export function getSafeRenderTargetOptions(capabilities = {}, tier = 'medium') {
  const ios26 = typeof navigator !== 'undefined' && isIOS26();
  const supportsHalfFloat = Boolean(capabilities?.supportsColorBufferHalfFloat);
  const hasWebGL2 = Boolean(capabilities?.webgl2);

  const shouldUseMSAA = hasWebGL2 && !ios26;
  const samples = shouldUseMSAA ? 4 : 0;

  return {
    type: supportsHalfFloat ? HalfFloatType : UnsignedByteType,
    format: RGBAFormat,
    depthBuffer: true,
    stencilBuffer: false,
    samples,
    useClampPass: !supportsHalfFloat
  };
}
