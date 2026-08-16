// src/caseStudies/system/CaseStudyText.jsx
//
// Shared text primitives. Content files stay plain data: a body is a string, an
// array of strings, or arbitrary React nodes when a paragraph needs something
// the data shape cannot express. `**bold**` is the only inline markup — enough
// for the emphasis the designs use, without pulling in a markdown dependency.

import React, { Fragment, isValidElement } from 'react';

const BOLD_PATTERN = /\*\*([^*]+)\*\*/g;

const renderInline = (text, keyPrefix) => {
  const nodes = [];
  let lastIndex = 0;
  let match;

  BOLD_PATTERN.lastIndex = 0;
  while ((match = BOLD_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(<strong key={`${keyPrefix}-b${match.index}`}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : text;
};

/** Renders a single string with inline `**bold**` support. */
export const CaseStudyInline = ({ text, keyPrefix = 'inline' }) => {
  if (typeof text !== 'string') return <Fragment>{text}</Fragment>;
  return <Fragment>{renderInline(text, keyPrefix)}</Fragment>;
};

const toParagraphs = (content) => {
  if (content === null || content === undefined || content === false) return [];
  return Array.isArray(content) ? content : [content];
};

/**
 * Body copy block.
 *
 * `content` accepts a string, an array of strings, or React nodes. Strings are
 * wrapped in <p>; nodes are rendered untouched so a case study can drop in a
 * list, a pull quote, or a custom element without a new component.
 */
const CaseStudyBody = ({ content, children, className = '', ...rest }) => {
  const paragraphs = toParagraphs(content);

  if (!paragraphs.length && !children) return null;

  return (
    <div className={`cs-body ${className}`.trim()} {...rest}>
      {paragraphs.map((paragraph, index) => {
        if (isValidElement(paragraph)) {
          return <Fragment key={paragraph.key ?? `node-${index}`}>{paragraph}</Fragment>;
        }
        return (
          <p key={`p-${index}`}>
            <CaseStudyInline text={paragraph} keyPrefix={`p-${index}`} />
          </p>
        );
      })}
      {children}
    </div>
  );
};

export default CaseStudyBody;
