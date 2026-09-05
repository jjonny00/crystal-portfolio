// src/caseStudies/system/index.js
//
// Public surface of the case-study system. A case study should only ever need
// these imports — adding the next one means writing content, supplying media,
// and composing what is exported here.

export { default as CaseStudyPage } from './CaseStudyPage';
export { default as CaseStudyHero } from './CaseStudyHero';
export { default as CaseStudyOverview } from './CaseStudyOverview';
export { default as SplitSection, SPLIT_DIRECTIONS } from './SplitSection';
export { default as SequenceSection } from './SequenceSection';
export { default as FeatureSection } from './FeatureSection';
export { default as ConclusionSection } from './ConclusionSection';

export { default as CaseStudySection } from './CaseStudySection';
export { default as CaseStudyMedia, renderMedia } from './CaseStudyMedia';
export { default as MediaGallery, GALLERY_LAYOUTS } from './MediaGallery';
export { default as FeaturedGallery } from './FeaturedGallery';
export { default as MediaRail } from './MediaRail';
export { default as PlaceholderMedia } from './PlaceholderMedia';
export { default as CaseStudyMetadata } from './CaseStudyMetadata';
export { default as CaseStudyBody, CaseStudyInline } from './CaseStudyText';

export { MediaViewerProvider, useMediaViewer } from './MediaViewer';
export {
  DEFAULT_CASE_STUDY_COLORS,
  TONES,
  normalizeTone,
  normalizeCaseStudyColors,
  buildCaseStudyThemeStyle,
  backgroundColorForTone,
  foregroundColorForTone,
} from './caseStudyTheme';
