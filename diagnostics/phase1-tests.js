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

  const tests = [];

  tests.push({
    label: 'Environment Disabled (1/4)',
    apply: () => {
      const originalState = {
        background: scene.background,
        environment: scene.environment,
        backgroundIntensity: 'backgroundIntensity' in scene ? scene.backgroundIntensity : undefined,
        backgroundBlurriness: 'backgroundBlurriness' in scene ? scene.backgroundBlurriness : undefined,
        environmentIntensity: 'environmentIntensity' in scene ? scene.environmentIntensity : undefined,
        fog: scene.fog
      };

      scene.background = new THREE.Color('#050505');
      scene.environment = null;
      if (typeof originalState.backgroundIntensity === 'number') {
        scene.backgroundIntensity = 1;
      }
      if (typeof originalState.backgroundBlurriness === 'number') {
        scene.backgroundBlurriness = 0;
      }
      if (typeof originalState.environmentIntensity === 'number') {
        scene.environmentIntensity = 0;
      }
      scene.fog = null;

      return () => {
        scene.background = originalState.background;
        scene.environment = originalState.environment;
        if (typeof originalState.backgroundIntensity === 'number') {
          scene.backgroundIntensity = originalState.backgroundIntensity;
        }
        if (typeof originalState.backgroundBlurriness === 'number') {
          scene.backgroundBlurriness = originalState.backgroundBlurriness;
        }
        if (typeof originalState.environmentIntensity === 'number') {
          scene.environmentIntensity = originalState.environmentIntensity;
        }
        scene.fog = originalState.fog;
      };
    }
  });

  tests.push({
    label: 'Force Materials Opaque (2/4)',
    apply: () => {
      const snapshots = [];

      scene.traverse((object) => {
        if (!object.isMesh && !object.isPoints && !object.isLine) {
          return;
        }

        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (!material || typeof material !== 'object') {
            return;
          }

          const snapshot = {
            material,
            transparent: material.transparent,
            opacity: material.opacity,
            alphaTest: material.alphaTest,
            depthWrite: material.depthWrite,
            depthTest: material.depthTest,
            blending: material.blending,
            toneMapped: material.toneMapped,
            side: material.side,
            color: material.color?.clone?.() ?? material.color,
            emissive: material.emissive?.clone?.() ?? material.emissive,
            emissiveIntensity: material.emissiveIntensity,
            transmission: material.transmission,
            thickness: material.thickness,
            ior: material.ior,
            attenuationDistance: material.attenuationDistance,
            attenuationColor: material.attenuationColor?.clone?.() ?? material.attenuationColor
          };

          material.transparent = false;
          if (typeof material.opacity === 'number') {
            material.opacity = 1;
          }
          if ('transmission' in material && typeof material.transmission === 'number') {
            material.transmission = 0;
          }
          if ('thickness' in material && typeof material.thickness === 'number') {
            material.thickness = 0;
          }
          if ('ior' in material && typeof material.ior === 'number') {
            material.ior = 1;
          }
          if ('attenuationDistance' in material && material.attenuationDistance !== undefined) {
            material.attenuationDistance = Infinity;
          }
          if (material.attenuationColor?.isColor) {
            material.attenuationColor.set(0xffffff);
          }
          if (material.emissive?.isColor) {
            material.emissive.set(0x000000);
          }
          if (typeof material.emissiveIntensity === 'number') {
            material.emissiveIntensity = 0;
          }
          material.depthWrite = true;
          material.depthTest = true;
          material.alphaTest = 0;
          material.blending = THREE.NormalBlending;
          material.toneMapped = true;
          material.side = THREE.FrontSide;
          material.needsUpdate = true;

          snapshots.push(snapshot);
        });
      });

      return () => {
        snapshots.forEach((snapshot) => {
          const { material } = snapshot;
          if (!material) {
            return;
          }
          material.transparent = snapshot.transparent;
          if (typeof snapshot.opacity === 'number') {
            material.opacity = snapshot.opacity;
          }
          if ('transmission' in material && snapshot.transmission !== undefined) {
            material.transmission = snapshot.transmission;
          }
          if ('thickness' in material && snapshot.thickness !== undefined) {
            material.thickness = snapshot.thickness;
          }
          if ('ior' in material && snapshot.ior !== undefined) {
            material.ior = snapshot.ior;
          }
          if ('attenuationDistance' in material && snapshot.attenuationDistance !== undefined) {
            material.attenuationDistance = snapshot.attenuationDistance;
          }
          if (material.attenuationColor?.isColor && snapshot.attenuationColor?.isColor) {
            material.attenuationColor.copy(snapshot.attenuationColor);
          }
          if (material.color?.isColor && snapshot.color?.isColor) {
            material.color.copy(snapshot.color);
          }
          if (material.emissive?.isColor && snapshot.emissive?.isColor) {
            material.emissive.copy(snapshot.emissive);
          }
          if (typeof snapshot.emissiveIntensity === 'number') {
            material.emissiveIntensity = snapshot.emissiveIntensity;
          }
          material.depthWrite = snapshot.depthWrite;
          material.depthTest = snapshot.depthTest;
          material.alphaTest = snapshot.alphaTest;
          material.blending = snapshot.blending;
          material.toneMapped = snapshot.toneMapped;
          material.side = snapshot.side;
          material.needsUpdate = true;
        });
      };
    }
  });

  tests.push({
    label: 'Disable Material Reflections (3/4)',
    apply: () => {
      const snapshots = [];

      scene.traverse((object) => {
        if (!object.isMesh && !object.isPoints && !object.isLine) {
          return;
        }

        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (!material || typeof material !== 'object') {
            return;
          }

          const hasReflectionProps =
            'envMap' in material ||
            'envMapIntensity' in material ||
            'metalness' in material ||
            'roughness' in material ||
            'reflectivity' in material ||
            'clearcoat' in material;

          if (!hasReflectionProps) {
            return;
          }

          const snapshot = {
            material,
            envMap: material.envMap,
            envMapIntensity: material.envMapIntensity,
            metalness: material.metalness,
            roughness: material.roughness,
            reflectivity: material.reflectivity,
            clearcoat: material.clearcoat,
            clearcoatRoughness: material.clearcoatRoughness
          };

          material.envMap = null;
          if (typeof material.envMapIntensity === 'number') {
            material.envMapIntensity = 0;
          }
          if (typeof material.metalness === 'number') {
            material.metalness = Math.min(material.metalness, 0.05);
          }
          if (typeof material.roughness === 'number') {
            material.roughness = Math.max(material.roughness, 0.6);
          }
          if (typeof material.reflectivity === 'number') {
            material.reflectivity = 0;
          }
          if (typeof material.clearcoat === 'number') {
            material.clearcoat = 0;
          }
          if (typeof material.clearcoatRoughness === 'number') {
            material.clearcoatRoughness = 0;
          }
          material.needsUpdate = true;

          snapshots.push(snapshot);
        });
      });

      return () => {
        snapshots.forEach((snapshot) => {
          const { material } = snapshot;
          if (!material) {
            return;
          }
          material.envMap = snapshot.envMap;
          if (snapshot.envMapIntensity !== undefined) {
            material.envMapIntensity = snapshot.envMapIntensity;
          }
          if (snapshot.metalness !== undefined) {
            material.metalness = snapshot.metalness;
          }
          if (snapshot.roughness !== undefined) {
            material.roughness = snapshot.roughness;
          }
          if (snapshot.reflectivity !== undefined) {
            material.reflectivity = snapshot.reflectivity;
          }
          if (snapshot.clearcoat !== undefined) {
            material.clearcoat = snapshot.clearcoat;
          }
          if (snapshot.clearcoatRoughness !== undefined) {
            material.clearcoatRoughness = snapshot.clearcoatRoughness;
          }
          material.needsUpdate = true;
        });
      };
    }
  });

  tests.push({
    label: 'Override Materials with Basic Shading (4/4)',
    apply: () => {
      const previousOverrideMaterial = scene.overrideMaterial;
      const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xd8dcff });

      scene.overrideMaterial = fallbackMaterial;

      return () => {
        scene.overrideMaterial = previousOverrideMaterial;
        fallbackMaterial.dispose();
      };
    }
  });

  console.groupCollapsed('🔍 Phase 2 – Scene Composition Diagnostics');
  console.log('Running follow-up diagnostics to isolate scene-level contributors to the iOS 26 transparency artifact.');
  console.log('Each test will display on-screen for 8 seconds before advancing automatically.');
  console.groupEnd();

  const runTest = async ({ label, apply }) => {
    updateOverlay(overlay, `Testing Scene Config: ${label}`);
    console.log(`▶️  ${label}`);

    let cleanup = () => {};
    try {
      const result = await apply();
      if (typeof result === 'function') {
        cleanup = result;
      }
    } catch (error) {
      console.error(`❌  Failed to apply diagnostic step: ${label}`, error);
    }

    await wait(8000);

    try {
      cleanup();
    } catch (error) {
      console.error(`❌  Failed to restore diagnostic step: ${label}`, error);
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
    console.log('Scene-level diagnostics complete.');
    console.log('Note which configuration eliminated or reduced the artifact.');
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
