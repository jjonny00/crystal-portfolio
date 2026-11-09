// src/devlog/components/DesignNote.jsx
//
// A quiet aside in an entry for the reasoning behind the work: a constraint
// that shaped it, an experiment, a decision, a lesson.
//
//   <DesignNote kind="constraint" title="Full capacity never blocks movement">
//     Markdown, as anywhere else in an entry.
//   </DesignNote>
//
// `kind` names it ("Design Note" by default); `label` replaces that name.

import React from 'react';

const KIND_LABELS = {
  note: 'Design Note',
  constraint: 'Design Constraint',
  experiment: 'Experiment',
  decision: 'Design Decision',
  lesson: 'Lesson Learned',
};

const DesignNote = ({ kind = 'note', label = null, title = null, children }) => {
  const name = label || KIND_LABELS[kind] || KIND_LABELS.note;
  return (
    <aside className="dl-note" aria-label={title ? `${name}: ${title}` : name}>
      <p className="type-caption-caps dl-note__label">{name}</p>
      {title && <p className="type-subhead-sm dl-note__title">{title}</p>}
      <div className="type-body-sm dl-note__body">{children}</div>
    </aside>
  );
};

export default DesignNote;
