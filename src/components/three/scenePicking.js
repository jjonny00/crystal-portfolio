// src/components/three/scenePicking.js
//
// Shared hit testing for the window-level scene pickers (OverviewTouchPicker,
// SceneBackgroundClick), which resolve taps and clicks themselves rather than
// through r3f's pointer events. See OverviewTouchPicker for why.

// A tap is a press that neither travelled nor lingered. Anything past these is
// a scroll gesture (or a long-press) and is left to the browser.
export const TAP_MAX_TRAVEL_PX = 12;
export const TAP_MAX_DURATION_MS = 600;

// Labels are thin lines of text; a fingertip lands near them more often than on
// them. Their rects are grown by this much before the hit test.
const LABEL_HIT_PADDING_PX = 12;

// Taps on real chrome (nav, buttons, links) belong to that chrome.
export const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="button"], [data-no-overview-tap]';

// The overview label under a point, if any. Hit-tested by rect because on touch
// the labels are pointer-events:none and never become the event target.
export const pickRailLabelAt = (clientX, clientY) => {
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

// The facet nearest the camera under a point, or null. Raycasts each facet
// separately rather than the whole group: the answer needed is "which facet",
// and intersectObjects would only hand back the leaf mesh, leaving the same walk
// back up to its facet root anyway. Manual raycasting works whether or not the
// canvas is taking pointer events.
export const pickFacetAt = ({ clientX, clientY, camera, domElement, facetRefs, facetKeys, raycaster, ndc }) => {
  const rect = domElement.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;

  ndc.set(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(ndc, camera);

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
