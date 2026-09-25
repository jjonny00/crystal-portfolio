// src/caseStudies/ge-experience-centers/ExperienceSelectorStage.jsx
//
// "Let the Conversation Shape the Space": the Experience Selector beside one
// display in two of its experiences, dropped into FeatureSection's stage as
// children. Every image still renders through CaseStudyMedia (lazy loading,
// ratio reservation, enlargement); this component owns only the arrangement and
// the annotations over it.
//
// Desktop — the selector leads, and the two display states stack beside it at
// exactly its height. The selector's own ratio sets the row; the states column
// is taken out of flow and stretched to meet it, so the pair never pushes the
// row taller (their frames crop a sliver rather than the selector letterboxing).
// Phones — the selector full width, then the two states side by side.
//
// The selector is art-directed, which CaseStudyMedia does not do: one crop per
// breakpoint, each with its own callout positions, the other hidden (and, being
// lazy, never fetched). Both open the whole screen in the viewer, with the
// display states after it, so a reader can page through the set.
//
// The annotations are visual only. Each image's alt text already names what
// they point at, so assistive tech hears it once rather than twice.

import React, { useMemo } from 'react';
import CaseStudyMedia from '../system/CaseStudyMedia';
import { useMediaViewer } from '../system/MediaViewer';
import './geExperienceCenters.css';

/** Width ÷ height from a 'w / h' ratio string. */
const ratioOf = (value) => {
  const [width, height] = String(value).split('/').map((part) => Number(part.trim()));
  return height ? width / height : width;
};

const ExperienceSelectorStage = ({ selector, states = [] }) => {
  const viewer = useMediaViewer();

  const slides = useMemo(
    () =>
      [selector.full, ...states].map((item) => ({
        src: item.fullSrc || item.src,
        alt: item.alt || '',
      })),
    [selector, states]
  );

  // States column width ÷ selector width, so the stacked pair and the wide
  // crop come out the same height (the gap between the pair is the only
  // residue, and the stretch absorbs it).
  const wide = selector.crops.find((crop) => crop.key === 'wide') || selector.crops[0];
  const split = states.length
    ? ratioOf(states[0].aspectRatio) / (states.length * ratioOf(wide.aspectRatio))
    : 0;

  return (
    <div className="gec-selector-stage" style={{ '--gec-states-split': `${split.toFixed(3)}fr` }}>
      <div className="gec-selector">
        {selector.crops.map((crop) => (
          <div className="gec-selector__crop" data-crop={crop.key} key={crop.key}>
            <CaseStudyMedia
              src={crop.src}
              alt={selector.full.alt}
              aspectRatio={crop.aspectRatio}
              expandable
              onExpand={() => viewer.open(slides, 0)}
            />

            <ol className="gec-callouts" aria-hidden="true">
              {crop.callouts.map((callout) => (
                <li
                  key={callout.key}
                  className="gec-callout"
                  style={{ '--gec-x': callout.x, '--gec-y': callout.y }}
                >
                  <span className="gec-callout__point" />
                  <span className="gec-callout__line" />
                  <span className="gec-callout__tag">{callout.label}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="gec-states">
        <div className="gec-states__list">
          {states.map((state, index) => (
            <div className="gec-state" key={state.key}>
              <CaseStudyMedia
                src={state.src}
                alt={state.alt}
                aspectRatio={state.aspectRatio}
                expandable
                onExpand={() => viewer.open(slides, index + 1)}
              />
              <span className="gec-state__label" aria-hidden="true">
                {state.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExperienceSelectorStage;
