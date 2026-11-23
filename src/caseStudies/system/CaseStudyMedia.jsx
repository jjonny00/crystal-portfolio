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
// It also accepts children instead of a src, which is how custom diagrams and
// interactive visuals enter a section without the section needing to know
// anything about them.
//
// Video is a descriptor like an image: `video` (the files' base path, see
// LoopVideo.jsx) in place of `src`, with `alt` as its label. It gets the same
// aspect-ratio reservation, lazy poster and caption, so every section takes it
// in its ordinary media prop.
//
//   frame="screen"  a product capture's frame: small radius, hairline, shadow
//                   (the default for video)
//   frame="none"    nothing around it at all: hard edges, no radius, shadow or
//                   border, like any photo

import React from 'react';
import PlaceholderMedia from './PlaceholderMedia';
import LoopVideo from './LoopVideo';
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
  /** A looping video's base path (LoopVideo.jsx), in place of `src`. */
  video = null,
  /** 'screen' | 'none'. Omit for the slot's default (video: 'screen'). */
  frame = null,
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
  const hasVideo = Boolean(video) && !hasChildren;
  const hasImage = Boolean(src) && !hasChildren && !hasVideo;
  const canExpand = expandable && hasImage;
  const frameStyleName = frame || (hasVideo ? 'screen' : null);

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
  } else if (hasVideo) {
    body = <LoopVideo base={video} label={alt} priority={priority} />;
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

  const frameEl = (
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
    <figure
      className={`cs-media ${className}`.trim()}
      data-frame={frameStyleName || undefined}
      {...rest}
    >
      {canExpand ? (
        <button
          type="button"
          className="cs-media__button"
          onClick={handleExpand}
          aria-label={alt ? `Enlarge image: ${alt}` : 'Enlarge image'}
        >
          {frameEl}
        </button>
      ) : (
        frameEl
      )}

      {caption && (
        <figcaption className="type-caption cs-caption cs-media__caption">
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
