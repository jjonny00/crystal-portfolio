// src/components/three/SceneBackgroundClick.jsx
//
// Clicking the scene's background goes back up one level: from a project to the
// overview, and from the overview to the hero.
//
// The click can land in two places. In a settled overview on a mouse, the scroll
// layer is pointer-events:none and the click reaches the canvas. Everywhere else
// (a project, and every touch) the scroll layer is on top and takes it. Neither
// gets an r3f "missed" event to rely on, so like OverviewTouchPicker this watches
// at the window level and resolves the hit itself:
//
//   • Only the canvas and the scroll layer's own empty space count. Chrome outside
//     the scroll layer (the nav, the debug panels, a case study) never does, and
//     inside it anything interactive or marked [data-scene-click-ignore] (the
//     project copy) is skipped.
//   • A press that travelled or lingered is a scroll, a drag or a text selection,
//     not a click.
//   • The overview labels are hit-tested by rect, since on touch they are never
//     the event target (see OverviewTouchPicker).
//   • The facets are raycast. In the overview any fragment is a hit; in a project
//     only the focused one is, so the other fragments count as background.

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  INTERACTIVE_SELECTOR,
  TAP_MAX_DURATION_MS,
  TAP_MAX_TRAVEL_PX,
  pickFacetAt,
  pickRailLabelAt,
} from './scenePicking';

const SceneBackgroundClick = ({
  // 'overview' | 'project' | null — where a background click goes back from.
  level = null,
  focusedFacetKey = null,
  facetRefs,
  facetKeys,
  onBackgroundClick,
}) => {
  const camera = useThree((state) => state.camera);
  const glDomElement = useThree((state) => state.gl.domElement);

  useEffect(() => {
    if (!level || !onBackgroundClick) return undefined;
    if (typeof window === 'undefined') return undefined;

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let pressed = null;

    const isBackgroundTarget = (target) => {
      if (!(target instanceof Element)) return false;
      if (target !== glDomElement && !target.closest('.scroll-container')) return false;
      return !target.closest(`${INTERACTIVE_SELECTOR}, [data-scene-click-ignore]`);
    };

    const handlePointerDown = (event) => {
      const primary = event.pointerType !== 'mouse' || event.button === 0;
      pressed = primary && isBackgroundTarget(event.target)
        ? { x: event.clientX, y: event.clientY, time: performance.now() }
        : null;
    };

    const handleClick = (event) => {
      const start = pressed;
      pressed = null;
      if (!start || event.defaultPrevented) return;
      if (!isBackgroundTarget(event.target)) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_MAX_TRAVEL_PX) return;
      if (performance.now() - start.time > TAP_MAX_DURATION_MS) return;
      if (window.getSelection?.()?.toString()) return;

      if (level === 'overview' && pickRailLabelAt(event.clientX, event.clientY)) return;

      const facetKey = pickFacetAt({
        clientX: event.clientX,
        clientY: event.clientY,
        camera,
        domElement: glDomElement,
        facetRefs,
        facetKeys,
        raycaster,
        ndc,
      });
      if (facetKey && (level === 'overview' || facetKey === focusedFacetKey)) return;

      onBackgroundClick(level);
    };

    const handlePointerCancel = () => {
      pressed = null;
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('pointercancel', handlePointerCancel, true);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('pointercancel', handlePointerCancel, true);
      window.removeEventListener('click', handleClick);
    };
  }, [camera, facetKeys, facetRefs, focusedFacetKey, glDomElement, level, onBackgroundClick]);

  return null;
};

export default SceneBackgroundClick;
