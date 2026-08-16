// src/caseStudies/system/CaseStudyMedia.jsx
//
// The single media primitive every case-study section renders through.
//
//   <CaseStudyMedia
//     src="/assets/case-studies/mesa/turn-flow.webp"
//     fullSrc="/assets/case-studies/mesa/turn-flow-large.webp"
//     alt="…"
//     caption="…"
//     expandable
//     fit="contain"
//   />
//
// It also accepts children instead of a src, which is how custom diagrams,
// video, and interactive visuals enter a section without the section needing to
// know anything about them.

import React from 'react';
import PlaceholderMedia from './PlaceholderMedia';
import { useMediaViewer } from './MediaViewer';
import { CaseStudyInline } from './CaseStudyText';
import { createLogger } from '../../utils/logger';

const logger = createLogger('CaseStudyMedia');
const isDev = import.meta.env.DEV;

/**
 * Normalizes the media description a section receives. Sections accept either a
 * `<CaseStudyMedia />` element or a plain props object, so content files can
 * stay data-only where that reads better.
 */
export const isMediaDescriptor = (value) =>
  Boolean(value) && typeof value === 'object' && !React.isValidElement(value);

const CaseStudyMedia = ({
  src = null,
  /** Full-resolution source used only by the enlarged view. */
  fullSrc = null,
  srcSet = null,
  sizes = null,
  alt = '',
  caption = null,
  /** Description of the asset still to be supplied; renders a placeholder. */
  placeholder = null,
  expandable = false,
  fit = 'cover',
  /** Number or CSS ratio string. Omit to inherit the slot's design ratio. */
  aspectRatio = null,
  /** Let the child content decide the height (diagrams, video, interactions). */
  autoHeight = false,
  width = null,
  height = null,
  /** Hero media should not wait for the intersection observer. */
  priority = false,
  /** Lets a gallery hand the whole set to the viewer instead of one slide. */
  onExpand = null,
  className = '',
  children = null,
  ...rest
}) => {
  const viewer = useMediaViewer();

  const hasChildren = Boolean(children);
  const hasImage = Boolean(src) && !hasChildren;
  const canExpand = expandable && hasImage;

  if (isDev && hasImage && !alt) {
    logger.warn(`missing alt text for "${src}"`);
  }

  const frameStyle = aspectRatio ? { '--cs-frame-ratio': aspectRatio } : undefined;
  const frameClass = [
    'cs-media__frame',
    autoHeight && !aspectRatio ? 'cs-media__frame--auto' : '',
  ]
    .filter(Boolean)
    .join(' ');

  let body;
  if (hasChildren) {
    body = children;
  } else if (hasImage) {
    body = (
      <img
        className={`cs-media__img cs-media__img--${fit === 'contain' ? 'contain' : 'cover'}`}
        src={src}
        srcSet={srcSet || undefined}
        sizes={sizes || undefined}
        // Inside the expand button the description belongs to the control, so
        // the image itself is decorative and is not announced twice.
        alt={canExpand ? '' : alt}
        width={width || undefined}
        height={height || undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchpriority={priority ? 'high' : undefined}
        draggable={false}
      />
    );
  } else {
    body = <PlaceholderMedia label={placeholder || alt} />;
  }

  const frame = (
    <div className={frameClass} style={frameStyle}>
      {body}
    </div>
  );

  const handleExpand = () => {
    if (onExpand) {
      onExpand();
      return;
    }
    viewer.open(
      [
        {
          src: fullSrc || src,
          alt,
          caption: typeof caption === 'string' ? caption : undefined,
        },
      ],
      0
    );
  };

  return (
    <figure className={`cs-media ${className}`.trim()} {...rest}>
      {canExpand ? (
        <button
          type="button"
          className="cs-media__button"
          onClick={handleExpand}
          aria-label={alt ? `Enlarge image: ${alt}` : 'Enlarge image'}
        >
          {frame}
        </button>
      ) : (
        frame
      )}

      {caption && (
        <figcaption className="cs-caption cs-media__caption">
          {typeof caption === 'string' ? <CaseStudyInline text={caption} /> : caption}
        </figcaption>
      )}
    </figure>
  );
};

/**
 * Sections call this so a `media` prop can be either a ready-made element or a
 * descriptor object, without every section repeating the branch.
 */
export const renderMedia = (media, extraProps = {}) => {
  if (!media) return null;
  if (React.isValidElement(media)) {
    // Props the caller set on the element always win over the slot defaults.
    return React.cloneElement(media, {
      ...extraProps,
      ...media.props,
      className: [extraProps.className, media.props.className].filter(Boolean).join(' '),
    });
  }
  if (isMediaDescriptor(media)) {
    return <CaseStudyMedia {...extraProps} {...media} />;
  }
  return null;
};

export default CaseStudyMedia;
