// src/devlog/components/EntryMeta.jsx
//
// "Systems Design · Nov 8, 2026": an entry's category and publication date, on
// every card and at the top of every article. On a dev server a draft or a
// scheduled entry says so, so it is never mistaken for a published one.

import React from 'react';
import { entryStatusLabel, formatEntryDate } from '../entries';

const EntryMeta = ({ entry, className = '' }) => {
  const status = entryStatusLabel(entry);
  return (
    <p className={`type-caption-caps dl-meta ${className}`.trim()}>
      <span>{entry.category}</span>
      <span aria-hidden="true"> · </span>
      <time dateTime={entry.date}>{formatEntryDate(entry.date)}</time>
      {status && (
        <>
          <span aria-hidden="true"> · </span>
          <span className="dl-meta__status">{status}</span>
        </>
      )}
    </p>
  );
};

export default EntryMeta;
