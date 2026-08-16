// src/caseStudies/system/CaseStudyMetadata.jsx
//
// "At a Glance" rail. Deliberately schema-light: an ordered list of
// { label, values } pairs, so Role/Team/Genre/Mode/Platform/Outcome are just
// the entries Mesa happens to use and a future case study can add its own
// without touching this component.
//
// A plain object is also accepted for brevity in content files; it is expanded
// in the canonical order below, with unknown keys appended in insertion order.

import React from 'react';
import { CaseStudyInline } from './CaseStudyText';

const CANONICAL_ORDER = ['role', 'team', 'genre', 'mode', 'platform', 'outcome'];

const titleCase = (key) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());

export const normalizeMetadata = (metadata) => {
  if (!metadata) return [];

  const entries = Array.isArray(metadata)
    ? metadata
    : [
        ...CANONICAL_ORDER.filter((key) => key in metadata),
        ...Object.keys(metadata).filter((key) => !CANONICAL_ORDER.includes(key)),
      ].map((key) => ({ label: titleCase(key), values: metadata[key] }));

  return entries
    .map((entry) => {
      const raw = entry.values ?? entry.value;
      const values = (Array.isArray(raw) ? raw : [raw]).filter(
        (value) => value !== null && value !== undefined && value !== ''
      );
      return { label: entry.label, values };
    })
    .filter((entry) => entry.label && entry.values.length);
};

const CaseStudyMetadata = ({ metadata, className = '', title = 'At a glance' }) => {
  const entries = normalizeMetadata(metadata);
  if (!entries.length) return null;

  return (
    <div className={className}>
      <h3 className="cs-visually-hidden">{title}</h3>
      <dl className="cs-meta">
        {entries.map((entry) => (
          <div className="cs-meta__group" key={entry.label}>
            <dt className="cs-meta__label">{entry.label}</dt>
            {entry.values.map((value, index) => (
              <dd className="cs-meta__value" key={`${entry.label}-${index}`}>
                {typeof value === 'string' ? <CaseStudyInline text={value} /> : value}
              </dd>
            ))}
          </div>
        ))}
      </dl>
    </div>
  );
};

export default CaseStudyMetadata;
