// src/components/three/HeroCrystalTap.jsx
//
// Clicking or tapping the hero's whole crystal goes on to Work, as the nav's WORK
// link would.
//
// The hero's other gesture is the drag orbit (UnifiedCameraController), and the
// two must never both fire. So this does not judge travel itself: the drag records
// each press it would have taken (heroOrbitPress), and a click only counts when
// that press never became a drag or a scroll. It also does not count when it:
//
//   • caught the crystal still turning from a fling (a "stop" tap),
//   • came while the camera's intro was running or held,
//   • lingered (a long-press), or landed on text or real chrome,
//   • missed the crystal: the crystal is raycast, the background is not a hit.
//
// Like SceneBackgroundClick this listens at the window, because on touch (and for
// the mouse wherever the scroll layer is on top) the click never reaches the
// canvas.

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { INTERACTIVE_SELECTOR, TAP_MAX_DURATION_MS } from './scenePicking';
import { heroOrbitPress } from './heroOrbitPress';

// Which inputs the tap answers. Set touch to false to keep it to the mouse.
const HERO_CRYSTAL_TAP_INPUTS = { mouse: true, touch: true };

// The drag leaves text to selection on the mouse; a tap leaves it alone too.
const TEXT_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, li';

const HeroCrystalTap = ({ enabled = false, crystalRef, onTap }) => {
  const camera = useThree((state) => state.camera);
  const glDomElement = useThree((state) => state.gl.domElement);

  useEffect(() => {
    if (!enabled || !onTap) return undefined;
    if (typeof window === 'undefined') return undefined;

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    const isSceneTarget = (target) => {
      if (!(target instanceof Element)) return false;
      if (target !== glDomElement && !target.closest('.scroll-container')) return false;
      return !target.closest(
        `${INTERACTIVE_SELECTOR}, [data-scene-click-ignore], [data-no-hero-orbit-drag], ${TEXT_SELECTOR}`,
      );
    };

    const hitsCrystal = (clientX, clientY) => {
      const root = crystalRef?.current;
      if (!root || root.visible === false) return false;
      const rect = glDomElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      ndc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      return raycaster.intersectObject(root, true).some((hit) => hit.object.visible !== false);
    };

    const handleClick = (event) => {
      const press = heroOrbitPress.current;
      heroOrbitPress.current = null;
      if (!press || event.defaultPrevented) return;
      if (!HERO_CRYSTAL_TAP_INPUTS[press.mouse ? 'mouse' : 'touch']) return;
      if (press.moved || press.coasting || press.intro) return;
      if (event.timeStamp - press.time > TAP_MAX_DURATION_MS) return;
      if (!isSceneTarget(event.target)) return;
      if (window.getSelection?.()?.toString()) return;
      if (!hitsCrystal(event.clientX, event.clientY)) return;

      onTap();
    };

    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, [camera, crystalRef, enabled, glDomElement, onTap]);

  return null;
};

export default HeroCrystalTap;
