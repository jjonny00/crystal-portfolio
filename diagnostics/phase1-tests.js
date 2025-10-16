import * as THREE from 'three';

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

function createOverlay() {
  const existing = document.getElementById('renderer-diagnostics-overlay');
  if (existing) {
    return existing;
  }
  const overlay = document.createElement('div');
  overlay.id = 'renderer-diagnostics-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '24px';
  overlay.style.left = '50%';
  overlay.style.transform = 'translateX(-50%)';
  overlay.style.padding = '12px 20px';
  overlay.style.borderRadius = '8px';
  overlay.style.background = 'rgba(10, 12, 24, 0.88)';
  overlay.style.color = '#f3f6ff';
  overlay.style.fontFamily = `'Inter', 'Helvetica Neue', Arial, sans-serif`;
  overlay.style.fontSize = '15px';
  overlay.style.letterSpacing = '0.01em';
  overlay.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.35)';
  overlay.style.zIndex = '9999';
  overlay.style.pointerEvents = 'none';
  overlay.style.textAlign = 'center';
  document.body.appendChild(overlay);
  return overlay;
}

function updateOverlay(overlay, message) {
  if (overlay) {
    overlay.textContent = message;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runRendererDiagnostics(scene, camera) {
  if (typeof window === 'undefined') {
    console.warn('Renderer diagnostics can only run in a browser context.');
    return;
  }

  const baseRenderer = resolveActiveRenderer(scene, camera);
  if (!baseRenderer) {
    throw new Error(
      'Unable to locate an active THREE.WebGLRenderer. Assign your renderer to scene.userData.renderer before calling runRendererDiagnostics.'
    );
  }

  const originalCanvas = baseRenderer.domElement;
  const parentElement = originalCanvas.parentElement || document.body;
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
    restoreOriginal();
    updateOverlay(overlay, 'Diagnostics complete');
    console.log('All renderer-level tests completed.');
    console.log('Note which configuration eliminated or reduced the artifact.');
    console.log('Proceed to Phase 2 diagnostics next.');
  }
}
