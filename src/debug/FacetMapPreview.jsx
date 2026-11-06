// src/debug/FacetMapPreview.jsx
//
// Review tool: the facet map laid out for review, over whatever the page is showing.
// Open any page with ?facetMapPreview (e.g. /work?facetMapPreview to compare it
// with the overview it is traced from); it stays on for the tab until
// ?facetMapPreview=0. App mounts this lazily in DEV and in Netlify deploy previews
// (VITE_REVIEW_TOOLS), so none of it reaches a production build.
//
// Shows the map large with every fragment named, then the states at actual size:
// rest, hover-highlighted, the case-study ink variant, and the phone's button.
// Pick the current project from the row of names.
//
// TO REMOVE once the facet map has shipped: delete this file and its lazy import
// in App.jsx.

import React, { useState } from 'react';
import FacetMapGlyph from '../components/facetMap/FacetMapGlyph';
import { FACET_MAP_ORDER, facetMap } from '../components/facetMap/facetMapData';
import projects from '../data/projects';

const projectById = Object.fromEntries(projects.map((project) => [project.facetKey || project.id, project]));

// Set by App from ?facetMapPreview as it loads (the query is gone by the time
// this chunk arrives).
const enabled = () => {
  try {
    return sessionStorage.getItem('facetMapPreview') === '1';
  } catch {
    return false;
  }
};

const panel = {
  position: 'fixed',
  left: 12,
  bottom: 12,
  zIndex: 99990,
  maxWidth: 'calc(100vw - 24px)',
  maxHeight: 'calc(100svh - 24px)',
  overflow: 'auto',
  padding: 14,
  borderRadius: 12,
  background: 'rgba(13, 16, 32, 0.92)',
  color: '#fff',
  font: '12px/1.4 system-ui, sans-serif',
};

const tile = (background) => ({
  display: 'grid',
  placeItems: 'center',
  gap: 6,
  width: 92,
  height: 92,
  borderRadius: 8,
  background,
  fontSize: 10,
  textAlign: 'center',
});

const FacetMapPreview = () => {
  const [open] = useState(enabled);
  const [currentId, setCurrentId] = useState('project02');
  if (!open) return null;

  const current = projectById[currentId];
  const highlightId = FACET_MAP_ORDER[(FACET_MAP_ORDER.indexOf(currentId) + 1) % FACET_MAP_ORDER.length];
  const ink = current?.caseStudyColors?.b || '#111318';
  const page = current?.caseStudyColors?.a || '#EAFF00';

  return (
    <div style={panel}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Large, every fragment in its colour and named at its centre. */}
        <div style={{ position: 'relative' }}>
          <FacetMapGlyph currentId={null} height={220} />
          <svg
            viewBox={facetMap.viewBox.join(' ')}
            width={220 * (facetMap.viewBox[2] / facetMap.viewBox[3])}
            height={220}
            style={{ position: 'absolute', inset: 0 }}
          >
            {FACET_MAP_ORDER.map((projectId, index) => {
              const fragment = facetMap.fragments[projectId];
              const project = projectById[projectId];
              return (
                <g key={projectId}>
                  <path d={fragment.path} fill={project.headlineColor} fillOpacity={0.75} />
                  <text
                    x={fragment.center[0]}
                    y={fragment.center[1]}
                    fontSize={6}
                    fill="#fff"
                    stroke="#000"
                    strokeWidth={0.6}
                    paintOrder="stroke"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gap: 2 }}>
            {FACET_MAP_ORDER.map((projectId, index) => (
              <button
                key={projectId}
                type="button"
                onClick={() => setCurrentId(projectId)}
                style={{
                  textAlign: 'left',
                  background: projectId === currentId ? 'rgba(255,255,255,0.14)' : 'transparent',
                  border: 0,
                  color: '#fff',
                  padding: '3px 6px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  font: 'inherit',
                }}
              >
                <span style={{ color: projectById[projectId].headlineColor }}>&#9632;</span>{' '}
                {String(index + 1).padStart(2, '0')} {projectById[projectId].label}
                <span style={{ opacity: 0.5 }}> {facetMap.fragments[projectId].sceneKey}</span>
              </button>
            ))}
          </div>

          {/* Actual size. */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={tile('#1d3461')}>
              <FacetMapGlyph currentId={currentId} height={54} />
              Rest
            </div>
            <div style={tile('#1d3461')}>
              <FacetMapGlyph currentId={currentId} highlightId={highlightId} height={54} />
              Hover {projectById[highlightId].label}
            </div>
            <div style={{ ...tile(page), color: ink }}>
              <FacetMapGlyph currentId={currentId} variant="ink" ink={ink} height={54} />
              Ink
            </div>
            <div style={tile('#3a3d2c')}>
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(17, 19, 24, 0.88)',
                }}
              >
                <FacetMapGlyph currentId={currentId} variant="button" height={28} />
              </span>
              Phone 44px
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacetMapPreview;
