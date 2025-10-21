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

function dispatchSceneOverrides(overrides) {
  if (typeof window === 'undefined') {
    return;
  }

  const detail = overrides ?? null;
  const event = new CustomEvent('renderer-diagnostics-scene-config', { detail });
  window.dispatchEvent(event);
}

function applySceneOverrides(overrides) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  dispatchSceneOverrides(overrides);

  return () => {
    dispatchSceneOverrides(null);
  };
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
  try {
    dispatchSceneOverrides(null);
  } catch (error) {
    console.warn('Renderer diagnostics: unable to reset scene overrides before diagnostics', error);
  }

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
  const baseCanvas = baseRenderer.domElement;
  const baseParent = baseCanvas?.parentElement;
  const baseCanvasStyle = baseCanvas?.getAttribute('style') ?? '';
  const baseCanvasClass = baseCanvas?.className ?? '';
  const originalCanvasVisibility = baseCanvas?.style?.visibility ?? '';
  const baseContext = baseRenderer.getContext?.();
  const baseContextAttributes = baseContext?.getContextAttributes?.() ?? {};
  const fiberRoot = scene?.__r3f?.root ?? null;
  const fiberStore = fiberRoot
    ? typeof fiberRoot === 'function'
      ? fiberRoot
      : typeof fiberRoot?.getState === 'function'
      ? fiberRoot
      : typeof fiberRoot?.store === 'function'
      ? fiberRoot.store
      : null
    : null;

  const applyRendererConfig = (targetRenderer, config) => {
    const cleanups = [];

    if (config.toneMapping !== undefined) {
      const prev = targetRenderer.toneMapping;
      targetRenderer.toneMapping = config.toneMapping;
      cleanups.push(() => {
        targetRenderer.toneMapping = prev;
      });
    }

    if (config.toneMappingExposure !== undefined) {
      const prev = targetRenderer.toneMappingExposure;
      targetRenderer.toneMappingExposure = config.toneMappingExposure;
      cleanups.push(() => {
        targetRenderer.toneMappingExposure = prev;
      });
    }

    if (config.outputColorSpace !== undefined) {
      const prev = targetRenderer.outputColorSpace;
      targetRenderer.outputColorSpace = config.outputColorSpace;
      cleanups.push(() => {
        targetRenderer.outputColorSpace = prev;
      });
    }

    if (config.physicallyCorrectLights !== undefined) {
      const prev = targetRenderer.physicallyCorrectLights;
      targetRenderer.physicallyCorrectLights = config.physicallyCorrectLights;
      cleanups.push(() => {
        targetRenderer.physicallyCorrectLights = prev;
      });
    }

    if (config.shadowMap !== undefined) {
      const prevEnabled = targetRenderer.shadowMap.enabled;
      const prevAutoUpdate = targetRenderer.shadowMap.autoUpdate;
      targetRenderer.shadowMap.enabled = !!config.shadowMap.enabled;
      targetRenderer.shadowMap.autoUpdate = config.shadowMap.autoUpdate ?? targetRenderer.shadowMap.autoUpdate;
      cleanups.push(() => {
        targetRenderer.shadowMap.enabled = prevEnabled;
        targetRenderer.shadowMap.autoUpdate = prevAutoUpdate;
      });
    }

    if (config.clearColor !== undefined) {
      const prevColor = targetRenderer.getClearColor(new THREE.Color()).clone();
      const prevAlpha = targetRenderer.getClearAlpha();
      const color = config.clearColor instanceof THREE.Color ? config.clearColor : new THREE.Color(config.clearColor);
      targetRenderer.setClearColor(color, config.clearAlpha ?? prevAlpha);
      cleanups.push(() => {
        targetRenderer.setClearColor(prevColor, prevAlpha);
      });
    } else if (config.clearAlpha !== undefined) {
      const prevAlpha = targetRenderer.getClearAlpha();
      const currentColor = targetRenderer.getClearColor(new THREE.Color()).clone();
      targetRenderer.setClearColor(currentColor, config.clearAlpha);
      cleanups.push(() => {
        targetRenderer.setClearColor(currentColor, prevAlpha);
      });
    }

    if (config.autoClear !== undefined) {
      const prev = targetRenderer.autoClear;
      targetRenderer.autoClear = config.autoClear;
      cleanups.push(() => {
        targetRenderer.autoClear = prev;
      });
    }

    if (config.autoClearColor !== undefined) {
      const prev = targetRenderer.autoClearColor;
      targetRenderer.autoClearColor = config.autoClearColor;
      cleanups.push(() => {
        targetRenderer.autoClearColor = prev;
      });
    }

    if (config.pixelRatio !== undefined) {
      const prev = targetRenderer.getPixelRatio();
      const size = targetRenderer.getSize(new THREE.Vector2());
      targetRenderer.setPixelRatio(config.pixelRatio);
      targetRenderer.setSize(size.x, size.y, false);
      cleanups.push(() => {
        targetRenderer.setPixelRatio(prev);
        targetRenderer.setSize(size.x, size.y, false);
      });
    }

    if (config.xrEnabled !== undefined && targetRenderer.xr) {
      const prev = targetRenderer.xr.enabled;
      targetRenderer.xr.enabled = config.xrEnabled;
      cleanups.push(() => {
        targetRenderer.xr.enabled = prev;
      });
    }

    if (config.useLegacyLights !== undefined) {
      const prev = targetRenderer.useLegacyLights;
      targetRenderer.useLegacyLights = config.useLegacyLights;
      cleanups.push(() => {
        targetRenderer.useLegacyLights = prev;
      });
    }

    if (config.domBackgroundColor !== undefined) {
      const canvas = targetRenderer.domElement;
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
      label: 'Baseline Production Renderer (1/6)',
      mode: 'reuse',
      applySceneOverrides: () => applySceneOverrides(null),
      makeConfig: () => ({
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
      })
    },
    {
      label: 'Post-Processing Disabled · Transparent Canvas (2/6)',
      mode: 'reuse',
      applySceneOverrides: () =>
        applySceneOverrides({
          composerEnabled: false,
          effects: {
            defaultBloom: false,
            bloom: false,
            chromaticAberration: false,
            noise: false,
            vignette: false
          }
        }),
      makeConfig: () => ({
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
      })
    },
    {
      label: 'Post-Processing · Unsigned Byte FBO (3/6)',
      mode: 'reuse',
      applySceneOverrides: () =>
        applySceneOverrides({
          composerEnabled: true,
          composerFrameBufferType: THREE.UnsignedByteType,
          composerMultisampling: 0
        }),
      makeConfig: () => ({
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
      })
    },
    {
      label: 'Post-Processing · Unsigned Byte FBO · Tone Mapping Off (4/6)',
      mode: 'reuse',
      applySceneOverrides: () =>
        applySceneOverrides({
          composerEnabled: true,
          composerFrameBufferType: THREE.UnsignedByteType,
          composerMultisampling: 0
        }),
      makeConfig: () => ({
        toneMapping: THREE.NoToneMapping,
        toneMappingExposure: 1,
        outputColorSpace: THREE.SRGBColorSpace,
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
      })
    },
    {
      label: 'Post-Processing · Unsigned Byte FBO · DPR ≤ 2 (5/6)',
      mode: 'reuse',
      applySceneOverrides: () =>
        applySceneOverrides({
          composerEnabled: true,
          composerFrameBufferType: THREE.UnsignedByteType,
          composerMultisampling: 0
        }),
      makeConfig: () => ({
        toneMapping: originalState.toneMapping,
        toneMappingExposure: originalState.toneMappingExposure,
        outputColorSpace: THREE.SRGBColorSpace,
        clearColor: originalState.clearColor.clone(),
        clearAlpha: originalState.clearAlpha,
        pixelRatio: safePixelRatio,
        autoClear: originalState.autoClear,
        autoClearColor: originalState.autoClearColor,
        shadowMap: { enabled: originalState.shadowMapEnabled, autoUpdate: originalState.shadowMapAutoUpdate },
        xrEnabled: originalState.xrEnabled,
        domBackgroundColor: originalState.domBackgroundColor,
        useLegacyLights: originalState.useLegacyLights,
        physicallyCorrectLights: originalState.physicallyCorrectLights
      })
    },
    {
      label: 'Post-Processing · Half-Float FBO Control (6/6)',
      mode: 'reuse',
      applySceneOverrides: () =>
        applySceneOverrides({
          composerEnabled: true,
          composerFrameBufferType: THREE.HalfFloatType,
          composerMultisampling: 0
        }),
      makeConfig: () => ({
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
      })
    }
  ];

  const showBaseCanvas = (visible) => {
    if (!baseCanvas) {
      return;
    }
    baseCanvas.style.visibility = visible ? originalCanvasVisibility : 'hidden';
  };

  const createReplacementRenderer = (options = {}, config = {}) => {
    if (!baseCanvas) {
      throw new Error('Base renderer canvas is unavailable for diagnostics.');
    }

    const {
      alpha = baseContextAttributes.alpha ?? true,
      forceWebGL1 = false,
      antialias = baseContextAttributes.antialias ?? true,
      preserveDrawingBuffer = baseContextAttributes.preserveDrawingBuffer ?? false,
      premultipliedAlpha = baseContextAttributes.premultipliedAlpha ?? true,
      powerPreference = baseContextAttributes.powerPreference ?? 'high-performance'
    } = options;

    const diagnosticCanvas = document.createElement('canvas');
    diagnosticCanvas.className = baseCanvasClass;
    diagnosticCanvas.dataset.rendererDiagnostics = 'replacement';
    diagnosticCanvas.style.cssText = baseCanvasStyle;
    diagnosticCanvas.style.visibility = 'visible';
    diagnosticCanvas.style.pointerEvents = baseCanvas?.style?.pointerEvents ?? 'none';
    diagnosticCanvas.style.position = baseCanvas.style.position || diagnosticCanvas.style.position;
    diagnosticCanvas.width = baseCanvas.width;
    diagnosticCanvas.height = baseCanvas.height;

    if (baseParent) {
      baseParent.appendChild(diagnosticCanvas);
    } else {
      document.body.appendChild(diagnosticCanvas);
    }

    const contextAttributes = {
      alpha,
      antialias,
      depth: baseContextAttributes.depth ?? true,
      stencil: baseContextAttributes.stencil ?? false,
      desynchronized: baseContextAttributes.desynchronized ?? false,
      premultipliedAlpha,
      preserveDrawingBuffer,
      powerPreference
    };

    let gl = null;
    if (forceWebGL1) {
      gl = diagnosticCanvas.getContext('webgl', contextAttributes);
    } else {
      gl = diagnosticCanvas.getContext('webgl2', contextAttributes) || diagnosticCanvas.getContext('webgl', contextAttributes);
    }

    if (!gl) {
      diagnosticCanvas.remove();
      throw new Error('Unable to create diagnostic renderer context.');
    }

    const diagnosticRenderer = new THREE.WebGLRenderer({
      canvas: diagnosticCanvas,
      context: gl,
      alpha,
      antialias,
      preserveDrawingBuffer,
      powerPreference
    });

    diagnosticRenderer.__skipRendererDiagnosticsAutoRun = true;

    if (diagnosticRenderer.shadowMap) {
      diagnosticRenderer.shadowMap.enabled = baseRenderer.shadowMap?.enabled ?? false;
      diagnosticRenderer.shadowMap.autoUpdate = baseRenderer.shadowMap?.autoUpdate ?? true;
    }
    if (diagnosticRenderer.xr) {
      diagnosticRenderer.xr.enabled = false;
    }

    const size = baseRenderer.getSize(new THREE.Vector2());
    const targetPixelRatio = config.pixelRatio ?? baseRenderer.getPixelRatio();
    diagnosticRenderer.setPixelRatio(targetPixelRatio);
    diagnosticRenderer.setSize(size.x, size.y, false);

    if (!diagnosticCanvas.style.width) {
      diagnosticCanvas.style.width = baseCanvas.style.width || `${size.x}px`;
    }
    if (!diagnosticCanvas.style.height) {
      diagnosticCanvas.style.height = baseCanvas.style.height || `${size.y}px`;
    }

    let frameHandle = null;
    let disposed = false;
    let renderCallback = null;

    const renderFrame = (time) => {
      if (disposed) {
        return;
      }
      try {
        if (typeof renderCallback === 'function') {
          renderCallback(time);
        } else {
          diagnosticRenderer.render(scene, camera);
        }
      } catch (error) {
        console.error('Renderer diagnostics manual render failed:', error);
      }
      frameHandle = window.requestAnimationFrame(renderFrame);
    };

    const start = (callback) => {
      if (disposed || frameHandle !== null) {
        return;
      }
      renderCallback = typeof callback === 'function' ? callback : null;
      frameHandle = window.requestAnimationFrame(renderFrame);
    };

    const stop = () => {
      renderCallback = null;
      if (frameHandle !== null) {
        window.cancelAnimationFrame(frameHandle);
        frameHandle = null;
      }
    };

    const teardown = () => {
      if (disposed) {
        return;
      }
      disposed = true;
      stop();
      diagnosticRenderer.dispose();
      if (diagnosticCanvas.parentElement) {
        diagnosticCanvas.parentElement.removeChild(diagnosticCanvas);
      }
    };

    return { renderer: diagnosticRenderer, teardown, canvas: diagnosticCanvas, start, stop };
  };

  console.groupCollapsed('🔍 Phase 4 – Post-Processing Buffer Diagnostics');
  console.log('Cycling composer configurations (frame-buffer type, tone mapping, DPR, and bypass) to isolate the iOS checkerboard regression.');
  console.log('Each configuration displays for 8 seconds; note which setups still show artifacts once post-processing changes take effect.');
  console.groupEnd();

  const runTest = async (test) => {
    const { label, mode, makeConfig, rendererOptions, applySceneOverrides: applyOverrides } = test;
    updateOverlay(overlay, `Testing Renderer Config: ${label}`);
    console.log(`▶️  ${label}`);

    const config = typeof makeConfig === 'function' ? makeConfig() : {};

    let restoreSceneOverrides = () => {};
    if (typeof applyOverrides === 'function') {
      try {
        restoreSceneOverrides = applyOverrides() || (() => {});
      } catch (error) {
        console.error(`❌  Failed to apply scene override for diagnostic configuration: ${label}`, error);
        restoreSceneOverrides = () => {
          try {
            dispatchSceneOverrides(null);
          } catch (cleanupError) {
            console.error('❌  Failed to reset scene overrides after error', cleanupError);
          }
        };
      }
    }

    try {
      if (mode === 'reuse') {
        showBaseCanvas(true);

        let cleanup = () => {};
        try {
          cleanup = applyRendererConfig(baseRenderer, config);
        } catch (error) {
          console.error(`❌  Failed to apply renderer diagnostic configuration: ${label}`, error);
        }

        await wait(8000);

        try {
          cleanup();
        } catch (error) {
          console.error(`❌  Failed to restore renderer diagnostic configuration: ${label}`, error);
        }
      } else if (mode === 'context') {
        showBaseCanvas(false);

        let replacement = null;
        let cleanup = () => {};
        let storeCleanup = () => {};
        let manualLoopStarted = false;

        try {
          replacement = createReplacementRenderer(rendererOptions, config);
          cleanup = applyRendererConfig(replacement.renderer, config);
          const storeApi = fiberStore && typeof fiberStore.getState === 'function' ? fiberStore : null;

          if (storeApi && baseCanvas) {
            const state = storeApi.getState();
            const previousGl = state.gl;
            const previousDpr = state.viewport?.dpr ?? baseRenderer.getPixelRatio();
            const previousSize = state.size ? { ...state.size } : null;
            const previousEventsTarget = state.events?.connected ?? null;
            const connect = state.events?.connect;
            const disconnect = state.events?.disconnect;
            const previousFrameloop = state.frameloop ?? 'always';

            try {
              disconnect?.();
            } catch (error) {
              console.warn('Renderer diagnostics: failed to disconnect events before swap', error);
            }

            try {
              storeApi.setState({ gl: replacement.renderer }, false, 'rendererDiagnostics:setRenderer');
            } catch (error) {
              console.warn('Renderer diagnostics: failed to assign replacement renderer to store', error);
            }

            const targetPixelRatio = config.pixelRatio ?? replacement.renderer.getPixelRatio();

            try {
              state.setDpr?.(targetPixelRatio);
            } catch (error) {
              console.warn('Renderer diagnostics: failed to update DPR for replacement renderer', error);
            }

            const replacementSize = replacement.renderer.getSize(new THREE.Vector2());

            try {
              state.setSize?.(
                replacementSize.x,
                replacementSize.y,
                false,
                previousSize?.top,
                previousSize?.left
              );
            } catch (error) {
              console.warn('Renderer diagnostics: failed to sync size for replacement renderer', error);
            }

            try {
              state.setFrameloop?.('never');
            } catch (error) {
              console.warn('Renderer diagnostics: failed to pause frameloop for replacement renderer', error);
            }

            try {
              if (connect && replacement.canvas) {
                connect(replacement.canvas);
              }
            } catch (error) {
              console.warn('Renderer diagnostics: failed to connect events for replacement renderer', error);
            }

            state.invalidate?.();

            const manualRender = (time) => {
              const currentState = storeApi.getState();
              if (typeof currentState.advance === 'function') {
                try {
                  currentState.advance(time, true);
                } catch (error) {
                  console.error('Renderer diagnostics: failed to advance store during replacement render', error);
                }
              } else {
                replacement.renderer.render(scene, camera);
              }
            };

            replacement.start(manualRender);
            manualLoopStarted = true;

            storeCleanup = () => {
              try {
                const currentState = storeApi.getState();
                currentState.events?.disconnect?.();
              } catch (error) {
                console.warn('Renderer diagnostics: failed to disconnect events during restore', error);
              }

              try {
                storeApi.setState({ gl: previousGl }, false, 'rendererDiagnostics:restoreRenderer');
              } catch (error) {
                console.warn('Renderer diagnostics: failed to restore original renderer', error);
              }

              try {
                const stateAfterRestore = storeApi.getState();
                stateAfterRestore.setDpr?.(previousDpr);
                if (previousSize) {
                  stateAfterRestore.setSize?.(
                    previousSize.width,
                    previousSize.height,
                    false,
                    previousSize.top,
                    previousSize.left
                  );
                }
                try {
                  stateAfterRestore.setFrameloop?.(previousFrameloop);
                } catch (error) {
                  console.warn('Renderer diagnostics: failed to restore frameloop state', error);
                }
                if (connect) {
                  if (previousEventsTarget && typeof previousEventsTarget.addEventListener === 'function') {
                    connect(previousEventsTarget);
                  } else if (baseCanvas) {
                    connect(baseCanvas);
                  }
                }
                stateAfterRestore.invalidate?.();
              } catch (error) {
                console.warn('Renderer diagnostics: failed to restore store state', error);
              }
            };
          } else if (replacement) {
            replacement.start();
            manualLoopStarted = true;
          }
        } catch (error) {
          console.error(`❌  Failed to initialize replacement renderer for diagnostic configuration: ${label}`, error);
        }

        await wait(8000);

        try {
          cleanup();
        } catch (error) {
          console.error(`❌  Failed to restore diagnostic configuration for replacement renderer: ${label}`, error);
        }

        if (manualLoopStarted && replacement) {
          try {
            replacement.stop();
          } catch (error) {
            console.warn('Renderer diagnostics: failed to stop manual render loop', error);
          }
          manualLoopStarted = false;
        }

        try {
          storeCleanup();
        } catch (error) {
          console.error(`❌  Failed to restore renderer store state for diagnostic configuration: ${label}`, error);
        }

        if (replacement) {
          replacement.teardown();
        }

        showBaseCanvas(true);
      } else {
        console.warn(`Skipping unknown diagnostic mode for test: ${label}`);
        await wait(8000);
      }
    } finally {
      try {
        restoreSceneOverrides();
      } catch (error) {
        console.error(`❌  Failed to restore scene overrides for diagnostic configuration: ${label}`, error);
      }
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
    showBaseCanvas(true);
    updateOverlay(overlay, 'Diagnostics complete');
    console.log('Renderer precision diagnostics complete.');
    console.log('Note which configuration allowed the checkerboard artifact to return.');
    try {
      dispatchSceneOverrides(null);
    } catch (error) {
      console.warn('Renderer diagnostics: failed to reset scene overrides after diagnostics', error);
    }
    applyRendererConfig(baseRenderer, {
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
