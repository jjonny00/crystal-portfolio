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

function ensureOverlayContainer() {
  const existing = document.getElementById('renderer-diagnostics-overlay-container');
  if (existing) {
    return existing;
  }

  const container = document.createElement('div');
  container.id = 'renderer-diagnostics-overlay-container';
  container.style.position = 'fixed';
  container.style.top = '50%';
  container.style.left = '50%';
  container.style.transform = 'translate(-50%, -50%)';
  container.style.zIndex = '10000';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.minWidth = '100px';
  container.style.minHeight = '100px';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  container.style.borderRadius = '24px';
  container.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
  container.style.backdropFilter = 'blur(5px)';
  container.style.webkitBackdropFilter = 'blur(5px)';
  container.style.pointerEvents = 'none';
  container.style.padding = '20px 28px';
  container.style.boxSizing = 'border-box';
  container.style.color = '#f5f7ff';
  container.style.fontFamily = '"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  container.style.fontSize = '16px';
  container.style.lineHeight = '1.4';
  container.style.textAlign = 'center';

  const attachContainer = () => {
    if (container.parentElement) {
      return;
    }
    const parent = document.body || document.documentElement;
    parent.appendChild(container);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachContainer, { once: true });
  }

  attachContainer();
  return container;
}

function createOverlay() {
  const container = ensureOverlayContainer();

  if (!container.__rendererDiagnosticsMessage) {
    const message = document.createElement('div');
    message.className = 'renderer-diagnostics-message';
    message.style.width = '100%';
    message.style.display = 'flex';
    message.style.flexDirection = 'column';
    message.style.alignItems = 'center';
    message.style.justifyContent = 'center';
    message.style.gap = '8px';
    message.style.pointerEvents = 'none';

    const label = document.createElement('div');
    label.className = 'renderer-diagnostics-message__label';
    label.style.fontWeight = '600';
    label.style.letterSpacing = '0.01em';
    label.style.textTransform = 'uppercase';
    label.style.fontSize = '12px';
    label.style.opacity = '0.8';
    label.textContent = 'Renderer Diagnostics';

    const content = document.createElement('div');
    content.className = 'renderer-diagnostics-message__content';
    content.style.fontWeight = '500';
    content.style.fontSize = '16px';
    content.style.opacity = '1';
    content.textContent = '';

    message.appendChild(label);
    message.appendChild(content);
    container.appendChild(message);

    container.__rendererDiagnosticsMessage = content;
    container.__rendererDiagnosticsLabel = label;
  }

  return {
    container,
    message: container.__rendererDiagnosticsMessage,
    label: container.__rendererDiagnosticsLabel
  };
}

function updateOverlay(overlay, message) {
  if (overlay?.message) {
    overlay.message.textContent = message;
    overlay.container.setAttribute('data-renderer-diagnostics-message', message);
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

  if (baseRenderer.__rendererDiagnosticsRunning) {
    return;
  }

  baseRenderer.__rendererDiagnosticsRunning = true;
  baseRenderer.__skipRendererDiagnosticsAutoRun = true;
  baseRenderer.__rendererDiagnosticsScheduled = true;

  const overlay = createOverlay();
  updateOverlay(overlay, 'Preparing scene diagnostics…');

  const getOriginalRendererState = () => {
    const clearColor = baseRenderer.getClearColor(new THREE.Color()).clone();
    return {
      toneMapping: baseRenderer.toneMapping,
      toneMappingExposure: baseRenderer.toneMappingExposure,
      outputColorSpace: baseRenderer.outputColorSpace,
      clearColor,
      clearAlpha: baseRenderer.getClearAlpha(),
      pixelRatio: baseRenderer.getPixelRatio(),
      shadowMapEnabled: baseRenderer.shadowMap?.enabled,
      shadowMapAutoUpdate: baseRenderer.shadowMap?.autoUpdate,
      xrEnabled: baseRenderer.xr?.enabled,
      useLegacyLights: baseRenderer.useLegacyLights,
      domBackgroundColor: baseRenderer.domElement.style.backgroundColor,
      autoClear: baseRenderer.autoClear,
      autoClearColor: baseRenderer.autoClearColor,
      physicallyCorrectLights: baseRenderer.physicallyCorrectLights
    };
  };

  const originalState = getOriginalRendererState();

  const applyRendererConfig = (config) => {
    const cleanups = [];

    if (config.toneMapping !== undefined) {
      const prev = baseRenderer.toneMapping;
      baseRenderer.toneMapping = config.toneMapping;
      cleanups.push(() => {
        baseRenderer.toneMapping = prev;
      });
    }

    if (config.toneMappingExposure !== undefined) {
      const prev = baseRenderer.toneMappingExposure;
      baseRenderer.toneMappingExposure = config.toneMappingExposure;
      cleanups.push(() => {
        baseRenderer.toneMappingExposure = prev;
      });
    }

    if (config.outputColorSpace !== undefined) {
      const prev = baseRenderer.outputColorSpace;
      baseRenderer.outputColorSpace = config.outputColorSpace;
      cleanups.push(() => {
        baseRenderer.outputColorSpace = prev;
      });
    }

    if (config.physicallyCorrectLights !== undefined) {
      const prev = baseRenderer.physicallyCorrectLights;
      baseRenderer.physicallyCorrectLights = config.physicallyCorrectLights;
      cleanups.push(() => {
        baseRenderer.physicallyCorrectLights = prev;
      });
    }

    if (config.shadowMap !== undefined) {
      const prevEnabled = baseRenderer.shadowMap.enabled;
      const prevAutoUpdate = baseRenderer.shadowMap.autoUpdate;
      baseRenderer.shadowMap.enabled = !!config.shadowMap.enabled;
      baseRenderer.shadowMap.autoUpdate = config.shadowMap.autoUpdate ?? baseRenderer.shadowMap.autoUpdate;
      cleanups.push(() => {
        baseRenderer.shadowMap.enabled = prevEnabled;
        baseRenderer.shadowMap.autoUpdate = prevAutoUpdate;
      });
    }

    if (config.clearColor !== undefined) {
      const prevColor = baseRenderer.getClearColor(new THREE.Color()).clone();
      const prevAlpha = baseRenderer.getClearAlpha();
      const color = config.clearColor instanceof THREE.Color ? config.clearColor : new THREE.Color(config.clearColor);
      baseRenderer.setClearColor(color, config.clearAlpha ?? prevAlpha);
      cleanups.push(() => {
        baseRenderer.setClearColor(prevColor, prevAlpha);
      });
    } else if (config.clearAlpha !== undefined) {
      const prevAlpha = baseRenderer.getClearAlpha();
      const currentColor = baseRenderer.getClearColor(new THREE.Color()).clone();
      baseRenderer.setClearColor(currentColor, config.clearAlpha);
      cleanups.push(() => {
        baseRenderer.setClearColor(currentColor, prevAlpha);
      });
    }

    if (config.autoClear !== undefined) {
      const prev = baseRenderer.autoClear;
      baseRenderer.autoClear = config.autoClear;
      cleanups.push(() => {
        baseRenderer.autoClear = prev;
      });
    }

    if (config.autoClearColor !== undefined) {
      const prev = baseRenderer.autoClearColor;
      baseRenderer.autoClearColor = config.autoClearColor;
      cleanups.push(() => {
        baseRenderer.autoClearColor = prev;
      });
    }

    if (config.pixelRatio !== undefined) {
      const prev = baseRenderer.getPixelRatio();
      const size = baseRenderer.getSize(new THREE.Vector2());
      baseRenderer.setPixelRatio(config.pixelRatio);
      baseRenderer.setSize(size.x, size.y, false);
      cleanups.push(() => {
        baseRenderer.setPixelRatio(prev);
        baseRenderer.setSize(size.x, size.y, false);
      });
    }

    if (config.xrEnabled !== undefined && baseRenderer.xr) {
      const prev = baseRenderer.xr.enabled;
      baseRenderer.xr.enabled = config.xrEnabled;
      cleanups.push(() => {
        baseRenderer.xr.enabled = prev;
      });
    }

    if (config.useLegacyLights !== undefined) {
      const prev = baseRenderer.useLegacyLights;
      baseRenderer.useLegacyLights = config.useLegacyLights;
      cleanups.push(() => {
        baseRenderer.useLegacyLights = prev;
      });
    }

    if (config.domBackgroundColor !== undefined) {
      const canvas = baseRenderer.domElement;
      const prev = canvas.style.backgroundColor;
      canvas.style.backgroundColor = config.domBackgroundColor;
      cleanups.push(() => {
        canvas.style.backgroundColor = prev;
      });
    }

    return () => {
      for (let i = cleanups.length - 1; i >= 0; i -= 1) {
        try {
          cleanups[i]();
        } catch (error) {
          console.error('Failed to restore renderer configuration', error);
        }
      }
    };
  };

  const safePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  const tests = [
    {
      label: 'Safe Renderer Baseline (1/5)',
      config: {
        toneMapping: THREE.NoToneMapping,
        toneMappingExposure: 1,
        outputColorSpace: THREE.SRGBColorSpace,
        clearColor: '#050505',
        clearAlpha: 1,
        pixelRatio: safePixelRatio,
        autoClear: true,
        autoClearColor: true,
        shadowMap: { enabled: originalState.shadowMapEnabled, autoUpdate: originalState.shadowMapAutoUpdate },
        xrEnabled: false,
        domBackgroundColor: '#050505'
      }
    },
    {
      label: 'Re-enable Tone Mapping (2/5)',
      config: {
        toneMapping: originalState.toneMapping,
        toneMappingExposure: originalState.toneMappingExposure,
        outputColorSpace: THREE.SRGBColorSpace,
        clearColor: '#050505',
        clearAlpha: 1,
        pixelRatio: safePixelRatio,
        autoClear: true,
        autoClearColor: true,
        shadowMap: { enabled: originalState.shadowMapEnabled, autoUpdate: originalState.shadowMapAutoUpdate },
        xrEnabled: false,
        domBackgroundColor: '#050505'
      }
    },
    {
      label: 'Restore HDR Output Color Space (3/5)',
      config: {
        toneMapping: originalState.toneMapping,
        toneMappingExposure: originalState.toneMappingExposure,
        outputColorSpace: originalState.outputColorSpace,
        clearColor: originalState.clearColor.clone(),
        clearAlpha: originalState.clearAlpha,
        pixelRatio: safePixelRatio,
        autoClear: originalState.autoClear,
        autoClearColor: originalState.autoClearColor,
        shadowMap: { enabled: originalState.shadowMapEnabled, autoUpdate: originalState.shadowMapAutoUpdate },
        xrEnabled: originalState.xrEnabled,
        domBackgroundColor: originalState.domBackgroundColor
      }
    },
    {
      label: 'Restore Device Pixel Ratio (4/5)',
      config: {
        toneMapping: originalState.toneMapping,
        toneMappingExposure: originalState.toneMappingExposure,
        outputColorSpace: originalState.outputColorSpace,
        clearColor: originalState.clearColor.clone(),
        clearAlpha: originalState.clearAlpha,
        pixelRatio: originalState.pixelRatio,
        autoClear: originalState.autoClear,
        autoClearColor: originalState.autoClearColor,
        shadowMap: { enabled: originalState.shadowMapEnabled, autoUpdate: originalState.shadowMapAutoUpdate },
        xrEnabled: originalState.xrEnabled,
        domBackgroundColor: originalState.domBackgroundColor
      }
    },
    {
      label: 'Original Renderer Configuration (5/5)',
      config: {
        toneMapping: originalState.toneMapping,
        toneMappingExposure: originalState.toneMappingExposure,
        outputColorSpace: originalState.outputColorSpace,
        clearColor: originalState.clearColor.clone(),
        clearAlpha: originalState.clearAlpha,
        pixelRatio: originalState.pixelRatio,
        autoClear: originalState.autoClear,
        autoClearColor: originalState.autoClearColor,
        shadowMap: { enabled: originalState.shadowMapEnabled, autoUpdate: originalState.shadowMapAutoUpdate },
        xrEnabled: originalState.xrEnabled,
        domBackgroundColor: originalState.domBackgroundColor,
        useLegacyLights: originalState.useLegacyLights,
        physicallyCorrectLights: originalState.physicallyCorrectLights
      }
    }
  ];

  console.groupCollapsed('🔍 Phase 3 – Renderer Precision Diagnostics');
  console.log('Cycling renderer-level configurations to isolate tone mapping, HDR, and DPR regressions.');
  console.log('Each configuration displays for 8 seconds; watch for the checkerboard artifact to return.');
  console.groupEnd();

  const runTest = async ({ label, config }) => {
    updateOverlay(overlay, `Testing Renderer Config: ${label}`);
    console.log(`▶️  ${label}`);

    let cleanup = () => {};
    try {
      cleanup = applyRendererConfig(config);
    } catch (error) {
      console.error(`❌  Failed to apply renderer diagnostic configuration: ${label}`, error);
    }

    await wait(8000);

    try {
      cleanup();
    } catch (error) {
      console.error(`❌  Failed to restore renderer diagnostic configuration: ${label}`, error);
    }
  };

  try {
    for (const test of tests) {
      await runTest(test);
    }
  } finally {
    baseRenderer.__rendererDiagnosticsCompleted = true;
    baseRenderer.__skipRendererDiagnosticsAutoRun = true;
    baseRenderer.__rendererDiagnosticsRunning = false;
    updateOverlay(overlay, 'Diagnostics complete');
    console.log('Renderer precision diagnostics complete.');
    console.log('Note which configuration allowed the checkerboard artifact to return.');
    applyRendererConfig({
      toneMapping: originalState.toneMapping,
      toneMappingExposure: originalState.toneMappingExposure,
      outputColorSpace: originalState.outputColorSpace,
      clearColor: originalState.clearColor.clone(),
      clearAlpha: originalState.clearAlpha,
      pixelRatio: originalState.pixelRatio,
      autoClear: originalState.autoClear,
      autoClearColor: originalState.autoClearColor,
      shadowMap: { enabled: originalState.shadowMapEnabled, autoUpdate: originalState.shadowMapAutoUpdate },
      xrEnabled: originalState.xrEnabled,
      domBackgroundColor: originalState.domBackgroundColor,
      useLegacyLights: originalState.useLegacyLights,
      physicallyCorrectLights: originalState.physicallyCorrectLights
    })();
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
          renderer.__rendererDiagnosticsScheduled = false;
        });
      });
    }

    return originalRender.call(this, scene, camera);
  };

  proto.__rendererDiagnosticsPatched = true;
  autoRunHookInstalled = true;
}

if (typeof window !== 'undefined') {
  ensureOverlayContainer();
}

installAutoRunHook();
