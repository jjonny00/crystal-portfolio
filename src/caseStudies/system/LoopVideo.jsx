// src/caseStudies/system/LoopVideo.jsx
//
// A short, silent product loop: what goes inside a CaseStudyMedia frame when
// its descriptor names a `video` rather than a `src`. CaseStudyMedia owns the
// figure, the aspect-ratio reservation and the caption; this fills the frame.
//
//   { video: '/media/fundseeder/fs-rivals', aspectRatio: '1464 / 708', alt, caption }
//
// Files come from public/, by naming: <base>.webm, <base>.mp4 and
// <base>-poster.webp. One size: the footage as captured, only cropped.
//
// What it guarantees:
//   - The poster is always rendered, as an ordinary <img>, so layout and first
//     paint never wait on video (and the poster is what a page's LCP measures).
//   - preload="none", and it plays only while at least 25% of it is on screen;
//     it pauses as soon as it leaves. Nothing plays off-screen.
//   - Muted, looping, inline (muted also set on the element, which is what iOS
//     needs to autoplay). WebM (VP9) first, MP4 (H.264) after.
//   - A small pause/play toggle on every loop (WCAG 2.2.2: they run longer
//     than five seconds). With reduced motion it starts paused, on the poster,
//     and the toggle plays it.
//   - The low performance tier gets the poster only: no <video>, no request.
//     Until the tier is known, the poster stands in.

import React, { useEffect, useRef, useState } from 'react';
import { whenPerformanceTierKnown } from '../../hooks/usePerformanceV2';

const VISIBLE_RATIO = 0.25;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

const PauseIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <rect x="4" y="3" width="2.75" height="10" rx="0.6" fill="currentColor" />
    <rect x="9.25" y="3" width="2.75" height="10" rx="0.6" fill="currentColor" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M5 3.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L5.9 2.7a.6.6 0 0 0-.9.5Z" fill="currentColor" />
  </svg>
);

/**
 * @param {string} base      the files' common path, without suffix
 * @param {string} label     what the loop shows (the video's aria-label, or the
 *                           poster's alt when no video is rendered)
 * @param {boolean} priority above the fold (a hero): the poster loads eagerly
 */
const LoopVideo = ({ base, label = '', priority = false }) => {
  // null until the tier is known; then whether this device plays video.
  const [canPlay, setCanPlay] = useState(null);
  // What the reader asked for: 'auto' follows visibility; 'pause' holds.
  const [intent, setIntent] = useState(() => (prefersReducedMotion() ? 'pause' : 'auto'));
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const rootRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    whenPerformanceTierKnown().then((tier) => {
      if (!cancelled) setCanPlay(tier !== 'low');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // At least a quarter on screen counts as visible.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !canPlay || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.intersectionRatio >= VISIBLE_RATIO),
      { threshold: [0, VISIBLE_RATIO, 0.5, 1] }
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [canPlay]);

  const shouldPlay = Boolean(canPlay) && visible && intent !== 'pause';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    if (shouldPlay) {
      video.play?.().catch(() => setPlaying(false));
    } else if (!video.paused) {
      video.pause();
    }
  }, [shouldPlay]);

  const poster = `${base}-poster.webp`;
  const hasVideo = Boolean(canPlay);
  const showingPause = hasVideo && intent !== 'pause';

  return (
    <div ref={rootRef} className="cs-loop">
      <img
        className="cs-loop__poster"
        src={poster}
        // With the video up, the video carries the description.
        alt={hasVideo ? '' : label}
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : undefined}
        decoding="async"
        draggable={false}
      />
      {hasVideo && (
        <video
          ref={videoRef}
          className="cs-loop__video"
          data-playing={playing ? '' : undefined}
          aria-label={label}
          muted
          loop
          playsInline
          preload="none"
          disablePictureInPicture
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          <source src={`${base}.webm`} type="video/webm" />
          <source src={`${base}.mp4`} type="video/mp4" />
        </video>
      )}
      {hasVideo && (
        <button
          type="button"
          className="cs-loop__toggle"
          aria-label={showingPause ? 'Pause video' : 'Play video'}
          onClick={() => setIntent(showingPause ? 'pause' : 'play')}
        >
          {showingPause ? <PauseIcon /> : <PlayIcon />}
        </button>
      )}
    </div>
  );
};

export default LoopVideo;
