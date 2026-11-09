// src/devlog/components/mdxComponents.jsx
//
// What an entry's Markdown renders as, and the components an entry may use.
// Ordinary Markdown needs nothing from the author: headings take the site's type
// scale, images become enlargeable figures, links between entries stay in the
// layer. Paragraphs, lists, quotes and code take their styling from the reading
// column (devlog.css), so they need no mapping here.
//
// Available in every entry, without an import:
//   GameplayVideo, MediaFigure, MediaGallery, MediaRail, DesignNote
// MediaGallery and MediaRail are the case studies' own (src/caseStudies/system/).

import React, { Children, isValidElement, useContext } from 'react';
import MediaGallery from '../../caseStudies/system/MediaGallery';
import MediaRail from '../../caseStudies/system/MediaRail';
import { CaseStudyNavContext } from '../../caseStudies/system/caseStudyNav';
import { inPageLinkHandler } from '../../navigation/linkClick';
import { parsePath } from '../../navigation/routes';
import { SITE_URL } from '../../seo/site';
import DesignNote from './DesignNote';
import GameplayVideo from './GameplayVideo';
import MediaFigure from './MediaFigure';

// ![alt](/media/devlog/<entry>/image.webp "Caption") — the title is the caption.
// Width and height arrive measured (rehypeDevlogMedia).
const MarkdownImage = ({ src, alt = '', title = null, width = null, height = null }) => (
  <MediaFigure
    src={src}
    alt={alt}
    caption={title}
    width={width}
    height={height}
    aspectRatio={width && height ? `${width} / ${height}` : null}
  />
);

// Markdown wraps an image on a line of its own in a paragraph; a figure cannot
// sit inside one, so such a paragraph renders its images alone.
const Paragraph = ({ children }) => {
  const parts = Children.toArray(children).filter(
    (child) => !(typeof child === 'string' && !child.trim())
  );
  if (parts.length && parts.every((child) => isValidElement(child) && child.type === MarkdownImage)) {
    return <>{parts}</>;
  }
  return <p>{children}</p>;
};

const isExternal = (href) =>
  /^https?:\/\//i.test(href) && !href.startsWith(SITE_URL);

// A link to another entry moves the layer to it, as the archive's do. A link off
// the site opens beside it, so the reader keeps their place here.
const Link = ({ href = '', children, ...rest }) => {
  const nav = useContext(CaseStudyNavContext);
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  const route = href.startsWith('/') ? parsePath(href) : null;
  const sameDevlog = route?.projectId && route.projectId === nav?.projectId && nav?.onNavigateSubpath;
  return (
    <a
      href={href}
      onClick={sameDevlog ? inPageLinkHandler(() => nav.onNavigateSubpath(route.subpath)) : undefined}
      {...rest}
    >
      {children}
    </a>
  );
};

// The entry's title is the page's h1, so an entry's own headings start at h2.
const heading = (Tag, typeClass) => {
  const Heading = ({ children, ...rest }) => (
    <Tag className={`${typeClass} dl-prose__heading`} {...rest}>
      {children}
    </Tag>
  );
  Heading.displayName = `DevlogHeading(${Tag})`;
  return Heading;
};

export const mdxComponents = {
  h1: heading('h2', 'type-headline-sm'),
  h2: heading('h2', 'type-headline-sm'),
  h3: heading('h3', 'type-subhead-sm'),
  h4: heading('h4', 'type-subhead-sm'),
  h5: heading('h5', 'type-subhead-sm'),
  h6: heading('h6', 'type-subhead-sm'),
  p: Paragraph,
  img: MarkdownImage,
  a: Link,
  GameplayVideo,
  MediaFigure,
  MediaGallery,
  MediaRail,
  DesignNote,
};

export default mdxComponents;
