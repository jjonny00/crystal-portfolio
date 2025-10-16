import * as THREE from 'three';

let autoRunHookInstalled = false;

function resolveActiveRenderer(scene, camera) {
  if (scene?.userData?.renderer instanceof THREE.WebGLRenderer) {
    return scene.userData.renderer;
  }
  if (camera?.userData?.renderer instanceof THREE.WebGLRenderer) {
    return camera.userData.renderer;
  }
  if (typeof window !== 'undefined') {
    const globalRenderer = window.__THREE_RENDERER__;
    if (globalRenderer instanceof THREE.WebGLRenderer) {
      return globalRenderer;
    }
    const r3fInternal = window.__THREE__?.renderer || window.__R3F_DIAGNOSTICS_RENDERER__;
    if (r3fInternal instanceof THREE.WebGLRenderer) {
      return r3fInternal;
    }
  }
  return null;
}

function startRenderLoop(renderer, scene, camera) {
  if (typeof renderer.setAnimationLoop === 'function') {
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  } else {
    let frameId;
    const renderFrame = () => {
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(renderFrame);
    };
    renderFrame();
    renderer.__diagnosticsFrameId = frameId;
  }
}

function stopRenderLoop(renderer) {
  if (!renderer) {
    return;
  }
  if (typeof renderer.setAnimationLoop === 'function') {
    renderer.setAnimationLoop(null);
  }
  if (renderer.__diagnosticsFrameId) {
    window.cancelAnimationFrame(renderer.__diagnosticsFrameId);
    delete renderer.__diagnosticsFrameId;
  }
}

function applyOverlayStyles(overlay) {
  overlay.id = 'renderer-diagnostics-overlay';
  overlay.setAttribute('role', 'status');
  overlay.style.position = 'fixed';
  overlay.style.top = 'calc(env(safe-area-inset-top, 0px) + 16px)';
  overlay.style.left = '50%';
  overlay.style.transform = 'translateX(-50%)';
  overlay.style.padding = '12px 20px';
  overlay.style.borderRadius = '999px';
  overlay.style.background = 'rgba(8, 10, 20, 0.92)';
  overlay.style.color = '#f6f8ff';
  overlay.style.fontFamily = "Inter, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";
  overlay.style.fontSize = 'clamp(14px, 1.8vw, 16px)';
  overlay.style.lineHeight = '1.4';
  overlay.style.fontWeight = '600';
  overlay.style.letterSpacing = '0.01em';
  overlay.style.boxShadow = '0 10px 34px rgba(0, 0, 0, 0.45)';
  overlay.style.zIndex = '2147483647';
  overlay.style.pointerEvents = 'none';
  overlay.style.textAlign = 'center';
  overlay.style.maxWidth = 'min(92vw, 520px)';
  overlay.style.margin = '0 auto';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.gap = '10px';
  overlay.style.opacity = '1';
  overlay.style.transition = 'opacity 0.3s ease';
  overlay.style.backdropFilter = 'blur(10px)';
  overlay.style.webkitBackdropFilter = 'blur(10px)';
}

function createOverlay() {
  const existing = document.getElementById('renderer-diagnostics-overlay');
  if (existing) {
    applyOverlayStyles(existing);
    return existing;
  }
  const overlay = document.createElement('div');
  applyOverlayStyles(overlay);
  const attachOverlay = () => {
    if (overlay.parentElement) {
      return;
    }
    const parent = document.body || document.documentElement;
    parent.appendChild(overlay);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachOverlay, { once: true });
  }

  attachOverlay();
  return overlay;
}

function updateOverlay(overlay, message) {
  if (overlay) {
    overlay.style.opacity = '1';
    overlay.textContent = message;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runRendererDiagnostics(scene, camera, rendererOverride) {
  if (typeof window === 'undefined') {
    console.warn('Renderer diagnostics can only run in a browser context.');
    return;
  }

  const baseRenderer = rendererOverride ?? resolveActiveRenderer(scene, camera);
  if (!baseRenderer) {
    throw new Error(
      'Unable to locate an active THREE.WebGLRenderer. Assign your renderer to scene.userData.renderer before calling runRendererDiagnostics.'
    );
  }

  baseRenderer.__skipRendererDiagnosticsAutoRun = true;
  baseRenderer.__rendererDiagnosticsScheduled = true;

  const originalCanvas = baseRenderer.domElement;
  const parentElement = originalCanvas.parentElement;
  if (!parentElement) {
    throw new Error('Renderer diagnostics requires renderer.domElement to be attached to the DOM.');
  }
  const anchor = document.createComment('renderer-diagnostics-anchor');
  parentElement.insertBefore(anchor, originalCanvas.nextSibling);

  const originalDisplay = originalCanvas.style.display;
  originalCanvas.style.display = 'none';

  const size = new THREE.Vector2();
  baseRenderer.getSize(size);
  const originalPixelRatio = baseRenderer.getPixelRatio?.() ?? window.devicePixelRatio ?? 1;
  const width = size.x;
  const height = size.y;

  let activeRenderer = null;
  let activeCanvas = null;

  const cleanupActiveRenderer = () => {
    if (activeRenderer) {
      stopRenderLoop(activeRenderer);
      activeRenderer.dispose?.();
      activeRenderer = null;
    }
    if (activeCanvas?.parentElement) {
      activeCanvas.parentElement.removeChild(activeCanvas);
      activeCanvas = null;
    }
  };

  const createRenderer = (params = {}, contextFactory) => {
    cleanupActiveRenderer();

    const canvas = document.createElement('canvas');
    canvas.className = originalCanvas.className;
    canvas.style.cssText = originalCanvas.style.cssText;
    canvas.style.display = 'block';
    canvas.style.width = originalCanvas.style.width || `${width}px`;
    canvas.style.height = originalCanvas.style.height || `${height}px`;
    canvas.style.maxWidth = originalCanvas.style.maxWidth;
    canvas.style.maxHeight = originalCanvas.style.maxHeight;
    canvas.style.minWidth = originalCanvas.style.minWidth;
    canvas.style.minHeight = originalCanvas.style.minHeight;
    parentElement.insertBefore(canvas, anchor);

    const options = { antialias: true, ...params, canvas };
    if (typeof contextFactory === 'function') {
      options.context = contextFactory(canvas);
    }

    const renderer = new THREE.WebGLRenderer(options);
    renderer.__skipRendererDiagnosticsAutoRun = true;
    renderer.__rendererDiagnosticsScheduled = true;
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(originalPixelRatio);
    renderer.shadowMap.enabled = baseRenderer.shadowMap?.enabled ?? false;
    renderer.shadowMap.type = baseRenderer.shadowMap?.type ?? THREE.PCFShadowMap;
    renderer.toneMapping = baseRenderer.toneMapping;
    renderer.outputColorSpace = baseRenderer.outputColorSpace ?? THREE.SRGBColorSpace;
    renderer.toneMappingExposure = baseRenderer.toneMappingExposure ?? 1.0;

    activeRenderer = renderer;
    activeCanvas = canvas;
    startRenderLoop(renderer, scene, camera);
    return renderer;
  };

  const restoreOriginal = () => {
    cleanupActiveRenderer();
    originalCanvas.style.display = originalDisplay;
    if (anchor.parentElement) {
      anchor.parentElement.insertBefore(originalCanvas, anchor);
      anchor.parentElement.removeChild(anchor);
    }
  };

  console.groupCollapsed('🔍 Phase 1 – Renderer Baseline Diagnostics');
  console.log('Running renderer diagnostic sequence to isolate iOS 26 transparency artifacts.');
  console.log('Each test will display on-screen for 8 seconds before advancing automatically.');
  console.groupEnd();

  const overlay = createOverlay();
  updateOverlay(overlay, 'Preparing renderer diagnostics…');

  const runTest = async (label, action) => {
    updateOverlay(overlay, `Testing Renderer Config: ${label}`);
    console.log(`▶️  ${label}`);
    await action();
    await wait(8000);
  };

  try {
    let renderer = null;

    await runTest('Alpha Disabled (1/4)', async () => {
      renderer = createRenderer({ alpha: false, antialias: true });
      renderer.setClearColor(0x0f0f1a);
      renderer.render(scene, camera);
      console.log('✅  Alpha disabled test running.');
    });

    await runTest('Tone Mapping Disabled (2/4)', async () => {
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMappingExposure = 1.0;
      renderer.render(scene, camera);
      console.log('✅  Tone mapping disabled test running.');
    });

    await runTest('Device Pixel Ratio ≤ 2 (3/4)', async () => {
      const clampedDpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(clampedDpr);
      renderer.render(scene, camera);
      console.log('✅  Pixel ratio clamp test running.');
    });

    await runTest('Forced WebGL 1 Context (4/4)', async () => {
      renderer = createRenderer(
        { alpha: false, antialias: true },
        (canvas) => canvas.getContext('webgl', { alpha: false })
      );
      renderer.setClearColor(0x0f0f1a);
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMappingExposure = 1.0;
      const forcedDpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(forcedDpr);
      renderer.render(scene, camera);
      console.log('Using WebGL 1:', !renderer.capabilities.isWebGL2);
      console.log('✅  WebGL 1 context test running.');
    });
  } finally {
    baseRenderer.__rendererDiagnosticsCompleted = true;
    baseRenderer.__skipRendererDiagnosticsAutoRun = true;
    restoreOriginal();
    updateOverlay(overlay, 'Diagnostics complete');
    console.log('All renderer-level tests completed.');
    console.log('Note which configuration eliminated or reduced the artifact.');
    console.log('Proceed to Phase 2 diagnostics next.');
  }
}

function installAutoRunHook() {
  if (autoRunHookInstalled || typeof window === 'undefined') {
    return;
  }

  const proto = THREE.WebGLRenderer.prototype;
  if (proto.__rendererDiagnosticsPatched) {
    autoRunHookInstalled = true;
    return;
  }

  const originalRender = proto.render;

  proto.render = function patchedRender(scene, camera) {
    if (
      !this.__skipRendererDiagnosticsAutoRun &&
      !this.__rendererDiagnosticsScheduled &&
      scene &&
      camera
    ) {
      if (typeof window !== 'undefined') {
        window.__R3F_DIAGNOSTICS_RENDERER__ = this;
      }
      this.__rendererDiagnosticsScheduled = true;
      const renderer = this;
      Promise.resolve().then(() => {
        runRendererDiagnostics(scene, camera, renderer).catch((error) => {
          console.error('Renderer diagnostics failed:', error);
          renderer.__rendererDiagnosticsErrored = true;
        });
      });
    }

    return originalRender.call(this, scene, camera);
  };

  proto.__rendererDiagnosticsPatched = true;
  autoRunHookInstalled = true;
}

installAutoRunHook();
