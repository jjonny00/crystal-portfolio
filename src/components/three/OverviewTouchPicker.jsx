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
//      dispatching a real click on the label element. That keeps FacetLabels'
//      own handler (which fades the label layer out on the way to the project)
//      as the single selection path rather than duplicating it.
//   2. The facet meshes, by raycast. Manual raycasting is unaffected by the
//      canvas being pointer-events:none.

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

// A tap is a press that neither travelled nor lingered. Anything past these is
// a scroll gesture (or a long-press) and is left to the browser.
const TAP_MAX_TRAVEL_PX = 12;
const TAP_MAX_DURATION_MS = 600;

// Labels are thin lines of text; a fingertip lands near them more often than on
// them. Their rects are grown by this much before the hit test.
const LABEL_HIT_PADDING_PX = 12;

// Taps on real chrome (nav, buttons, links) belong to that chrome.
const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="button"], [data-no-overview-tap]';

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

    const pickLabelAt = (clientX, clientY) => {
      const labels = document.querySelectorAll('[data-rail-project]');
      for (const label of labels) {
        const rect = label.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (
          clientX >= rect.left - LABEL_HIT_PADDING_PX &&
          clientX <= rect.right + LABEL_HIT_PADDING_PX &&
          clientY >= rect.top - LABEL_HIT_PADDING_PX &&
          clientY <= rect.bottom + LABEL_HIT_PADDING_PX
        ) {
          return label;
        }
      }
      return null;
    };

    const pickFacetAt = (clientX, clientY) => {
      const rect = glDomElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;

      ndc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);

      // Raycast each facet separately rather than the whole group: the answer
      // needed here is "which facet", and intersectObjects would only hand back
      // the leaf mesh, leaving the same walk back up to its facet root anyway.
      let nearest = null;
      (facetRefs?.current || []).forEach((facetRef, index) => {
        const root = facetRef?.current;
        if (!root || root.visible === false) return;
        const hit = raycaster.intersectObject(root, true)[0];
        if (!hit) return;
        if (!nearest || hit.distance < nearest.distance) {
          nearest = { distance: hit.distance, facetKey: facetKeys?.[index] || null };
        }
      });

      return nearest?.facetKey || null;
    };

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

      const label = pickLabelAt(event.clientX, event.clientY);
      if (label) {
        // Programmatic — pointer-events:none blocks hit-testing, not dispatch.
        label.click();
        return;
      }

      const facetKey = pickFacetAt(event.clientX, event.clientY);
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
