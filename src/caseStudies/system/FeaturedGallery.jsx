// src/caseStudies/system/FeaturedGallery.jsx
//
// One lead item at full size beside a grid of supporting items:
//
//   <FeaturedGallery
//     featured={{ src: powerKey, alt: '…', aspectRatio: '1280 / 2675' }}
//     items={powers}
//     columns={3}
//   />
//
// The shape MediaGallery cannot make: a set too large for 2-up/3-up, with one
// member that is the point and the rest supporting it. Like MediaGallery, every
// item routes through CaseStudyMedia — lazy loading, alt text, aspect-ratio
// reservation, placeholders — and opening any one of them hands the whole set,
// lead first, to the viewer.
//
// The two columns come out level on their own. Each item is sized by its own
// aspect ratio, so the component derives the column split that resolves the lead
// and the grid to the same height. That calculation cannot see the gaps, so it
// sets the lead's width only: at desktop the stylesheet stretches the lead to the
// grid's exact height, and the few pixels of residue land as letterboxing rather
// than as a difference in height. Supply `split` to override the derived ratio.
//
// Height follows width: a portrait lead beside a two-row grid is a tall block,
// and run to the full width of a bleeding stage it dwarfs the section. So the
// exhibit takes the copy's measure by default, centred in its stage. `maxWidth`
// is the single dial for how tall the whole thing is.

import React, { useMemo } from 'react';
import CaseStudyMedia from './CaseStudyMedia';
import { useMediaViewer } from './MediaViewer';
import { CaseStudyInline } from './CaseStudyText';

/** Used when the media does not declare ratios to derive a split from. */
const DEFAULT_SPLIT = 2;

/**
 * Accepts the same values as CaseStudyMedia's `aspectRatio` — a number, '16/9',
 * or a bare '1.26' — and returns width ÷ height.
 */
const parseAspectRatio = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== 'string') return null;

  const [rawWidth, rawHeight] = value.split('/').map((part) => Number(part.trim()));
  if (!Number.isFinite(rawWidth) || rawWidth <= 0) return null;
  if (rawHeight === undefined) return rawWidth;
  return Number.isFinite(rawHeight) && rawHeight > 0 ? rawWidth / rawHeight : null;
};

const FeaturedGallery = ({
  /** The one item the section is about. A media descriptor, like any other. */
  featured = null,
  items = [],
  /** Columns in the supporting grid at desktop; always 2 on phones. */
  columns = 3,
  /** Grid width ÷ lead width. Omit to derive it from the supplied ratios. */
  split = null,
  /** Measure of the whole exhibit, and with it its height. Omit for the copy's. */
  maxWidth = null,
  /** One caption for the whole set; items may still caption themselves. */
  caption = null,
  expandable = true,
  fit = 'contain',
  className = '',
  ...rest
}) => {
  const viewer = useMediaViewer();
  const usableColumns = Math.max(1, Math.round(columns) || 1);

  const slides = useMemo(
    () =>
      [featured, ...items]
        .filter((item) => item && item.src)
        .map((item) => ({
          src: item.fullSrc || item.src,
          alt: item.alt || '',
          caption: typeof item.caption === 'string' ? item.caption : undefined,
        })),
    [featured, items]
  );

  // Lead height is width ÷ leadRatio; grid height is rows × (width ÷ columns) ÷
  // itemRatio. Setting those equal leaves this, independent of the stage width.
  const columnSplit = useMemo(() => {
    if (Number.isFinite(split) && split > 0) return split;

    const leadRatio = parseAspectRatio(featured?.aspectRatio);
    const itemRatio = items.map((item) => parseAspectRatio(item?.aspectRatio)).find(Boolean);
    if (!leadRatio || !itemRatio || !items.length) return DEFAULT_SPLIT;

    const rows = Math.ceil(items.length / usableColumns);
    return (usableColumns * itemRatio) / (rows * leadRatio);
  }, [split, featured, items, usableColumns]);

  if (!featured && !items.length) return null;

  const openAt = (index) => (slides.length ? () => viewer.open(slides, index) : null);

  return (
    <figure className={`cs-media ${className}`.trim()} {...rest}>
      <div
        className="cs-featured"
        style={{
          '--cs-featured-split': `${columnSplit.toFixed(3)}fr`,
          '--cs-featured-columns': usableColumns,
          ...(maxWidth ? { '--cs-featured-max': maxWidth } : null),
        }}
      >
        {featured && (
          <div className="cs-featured__lead">
            <CaseStudyMedia
              fit={fit}
              expandable={expandable}
              onExpand={openAt(0)}
              {...featured}
            />
          </div>
        )}

        {items.length > 0 && (
          <div className="cs-featured__grid">
            {items.map((item, index) => {
              // The viewer index only counts items that actually have a source,
              // and the lead takes the first slot whenever it has one.
              const slideIndex =
                (featured && featured.src ? 1 : 0) +
                items.slice(0, index).filter((candidate) => candidate && candidate.src).length;

              // An item's `key` identifies it in content ('bomb', 'freeze', …);
              // it is React's key here, not a prop to spread onto the media.
              const { key: itemKey, ...media } = item || {};

              return (
                <CaseStudyMedia
                  key={itemKey || media.src || `item-${index}`}
                  fit={fit}
                  expandable={expandable}
                  onExpand={openAt(slideIndex)}
                  {...media}
                />
              );
            })}
          </div>
        )}
      </div>

      {caption && (
        <figcaption className="cs-caption cs-media__caption">
          {typeof caption === 'string' ? <CaseStudyInline text={caption} /> : caption}
        </figcaption>
      )}
    </figure>
  );
};

export default FeaturedGallery;
