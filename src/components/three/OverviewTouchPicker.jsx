// src/components/three/OverviewTouchPicker.jsx
//
// Touch selection for the overview.
//
// On a mouse the overview hands pointer input straight to the WebGL canvas:
// the DOM scroll layer goes pointer-events:none while the overview is settled,
// so r3f's own hover/click handlers on the facet meshes just work.
//
// Touch cannot use that hand-off. The canvas is fixed-position and is NOT an
// ancestor of `.scroll-container`, so any touch it swallows is a touch the
// scroll container never sees — hand the canvas the input and the page stops
// scrolling, with no gesture left to get out of the overview. The scroll
// container therefore stays live on touch (see ScrollablePortfolio) and the
// canvas stays pointer-events:none, which leaves nothing routing taps to the
// crystal. This component is that route: it watches taps at the window level
// (they bubble up from whatever DOM layer received them), decides tap-vs-swipe
// itself, and resolves the hit manually.
//
// Two hit tests, in priority order:
//   1. The facet labels, by bounding rect. They are pointer-events:none on
//      touch — otherwise a swipe that starts on a label is a swipe the scroll
//      container never sees — so they are hit-tested here and selected by
//      dispatching a real click on the label's link. That keeps FacetLabels'
//      own handler (which fades the label layer out on the way to the project)
//      as the single selection path rather than duplicating it.
//   2. The facet meshes, by raycast. Manual raycasting is unaffected by the
//      canvas being pointer-events:none.

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

const OverviewTouchPicker = ({
  enabled = false,
  facetRefs,
  facetKeys,
  onPickFacet,
}) => {
  const camera = useThree((state) => state.camera);
  const glDomElement = useThree((state) => state.gl.domElement);

  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof window === 'undefined') return undefined;

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let pressed = null;

    const handlePointerDown = (event) => {
      // Mouse keeps the r3f path; this is only the touch/pen fallback.
      if (event.pointerType === 'mouse') {
        pressed = null;
        return;
      }
      if (event.target?.closest?.(INTERACTIVE_SELECTOR)) {
        pressed = null;
        return;
      }
      pressed = { x: event.clientX, y: event.clientY, time: performance.now() };
    };

    const handlePointerUp = (event) => {
      const start = pressed;
      pressed = null;
      if (!start) return;
      if (event.pointerType === 'mouse') return;

      const travelled = Math.hypot(event.clientX - start.x, event.clientY - start.y);
      if (travelled > TAP_MAX_TRAVEL_PX) return;
      if (performance.now() - start.time > TAP_MAX_DURATION_MS) return;

      const label = pickRailLabelAt(event.clientX, event.clientY);
      if (label) {
        // Programmatic — pointer-events:none blocks hit-testing, not dispatch.
        // The click goes to the label's link, which is where FacetLabels'
        // handler lives (each label is an <a href> to its project). A click
        // dispatched on the <li> itself would never reach it: events bubble up
        // from their target, not down into its children.
        (label.querySelector('a[href]') || label).click();
        return;
      }

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
      if (facetKey) {
        onPickFacet?.(facetKey);
      }
    };

    const handlePointerCancel = () => {
      pressed = null;
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('pointerup', handlePointerUp, true);
    window.addEventListener('pointercancel', handlePointerCancel, true);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('pointerup', handlePointerUp, true);
      window.removeEventListener('pointercancel', handlePointerCancel, true);
    };
  }, [camera, enabled, facetKeys, facetRefs, glDomElement, onPickFacet]);

  return null;
};

export default OverviewTouchPicker;
