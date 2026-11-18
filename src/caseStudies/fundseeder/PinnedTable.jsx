// src/caseStudies/fundseeder/PinnedTable.jsx
//
// "Compare First. Investigate When It Matters.": an excerpt of the leaderboard
// as a real table — the top of the field, and the trader's own row pinned
// beneath it — in SplitSection's media column, beside the copy.
//
// The ranks, aliases and FS Scores are the source's. Drawn from
// fundseederContent.js (`compare.pinned`).

import React from 'react';
import './fundseeder.css';

const PinnedTable = ({ label, columns, rows = [], own = null }) => (
  <figure className="fs-pinned">
    <figcaption className="type-subhead-sm fs-pinned__label">{label}</figcaption>
    <table className="fs-pinned__table">
      <thead>
        <tr className="type-caption-caps">
          <th scope="col">{columns.rank}</th>
          <th scope="col">{columns.trader}</th>
          <th scope="col">{columns.score}</th>
        </tr>
      </thead>
      <tbody className="type-body-sm">
        {rows.map((row) => (
          <tr key={row.rank}>
            <td>{row.rank}</td>
            <td>{row.trader}</td>
            <td>{row.score}</td>
          </tr>
        ))}
      </tbody>
      {own && (
        <tfoot className="type-body-sm">
          <tr>
            <td>{own.rank}</td>
            <td>{own.trader}</td>
            <td>{own.score}</td>
          </tr>
        </tfoot>
      )}
    </table>
  </figure>
);

export default PinnedTable;
