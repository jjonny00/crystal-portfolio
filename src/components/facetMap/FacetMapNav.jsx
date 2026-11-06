// src/components/facetMap/FacetMapNav.jsx
//
// The facet map, fixed in the left gutter on desktop beside a project preview or
// a case study. See docs/facet-map.md.
//
// Stage 2 of the build: the marker only. It names the current project for
// assistive tech and takes no input yet; the index panel it opens comes next,
// and the phone's button after that. Below the width where the gutter can hold
// it (facet-map.css), it is not shown at all for now.

import React from 'react';
import FacetMapGlyph from './FacetMapGlyph';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MQ_REDUCED_MOTION } from '../../config/breakpoints';
import { getProjectByAnyKey } from '../../data/projects';
import '../../styles/facet-map.css';

const FacetMapNav = ({
  /** From useFacetMapSelection. */
  selection,
  /**
   * The case study's ink under the map, or null over the scene. Set, the map
   * draws in that ink rather than in project colour.
   */
  ink = null,
}) => {
  const reducedMotion = useMediaQuery(MQ_REDUCED_MOTION);
  const project = selection.projectId ? getProjectByAnyKey(selection.projectId) : null;

  return (
    <div
      className="facet-map"
      data-shown={selection.visible || undefined}
      role="img"
      aria-label={project ? `Project map. Current project: ${project.label}` : undefined}
      aria-hidden={selection.visible ? undefined : true}
    >
      <FacetMapGlyph
        currentId={selection.projectId}
        variant={ink ? 'ink' : 'color'}
        ink={ink || undefined}
        height={54}
        animate={!reducedMotion}
      />
    </div>
  );
};

export default FacetMapNav;
