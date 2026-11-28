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
//   - The low performance tier never plays it inline: the poster stands in.
//     Until the tier is known, the poster stands in.
//   - An expand button hands the loop to the device's own full-screen player,
//     with its controls, so a phone can watch it large and turn to landscape.
//     The standard Fullscreen API where there is one (desktop, Android, iPad;
//     Android is also asked for landscape); on iPhone, which only has the
//     native player, webkitEnterFullscreen. Asking is an explicit choice, so
//     it plays there on every tier and with reduced motion; on leaving, the
//     loop goes back to what it was doing. The iPhone player needs the
//     video's metadata before it will open, so on iPhone a loop fetches its
//     metadata once it has been on screen.

import React, { useEffect, useRef, useState } from 'react';
import { whenPerformanceTierKnown } from '../../hooks/usePerformanceV2';

const VISIBLE_RATIO = 0.25;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

// 'element': the standard Fullscreen API. 'native': only the video's own
// player (iPhone). null: neither.
const detectExpandMode = () => {
  if (typeof document === 'undefined') return null;
  if (document.fullscreenEnabled || document.webkitFullscreenEnabled) return 'element';
  if (typeof HTMLVideoElement !== 'undefined' && 'webkitEnterFullscreen' in HTMLVideoElement.prototype) {
    return 'native';
  }
  return null;
};

const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;

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

const ExpandIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path
      d="M2.75 6.25v-3.5h3.5M9.75 2.75h3.5v3.5M13.25 9.75v3.5h-3.5M6.25 13.25h-3.5v-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * @param {string} base      the files' common path, without suffix
 * @param {string} label     what the loop shows (the video's aria-label, or the
 *                           poster's alt when no video is rendered)
 * @param {boolean} priority above the fold (a hero): the poster loads eagerly
 */
const LoopVideo = ({ base, label = '', priority = false }) => {
  // null until the tier is known; then whether this device plays video inline.
  const [canPlay, setCanPlay] = useState(null);
  // Set after mount (the server has no document).
  const [expandMode, setExpandMode] = useState(null);
  // What the reader asked for: 'auto' follows visibility; 'pause' holds.
  const [intent, setIntent] = useState(() => (prefersReducedMotion() ? 'pause' : 'auto'));
  const [visible, setVisible] = useState(false);
  // Has been on screen at least once.
  const [seen, setSeen] = useState(false);
  const [playing, setPlaying] = useState(false);
  // Open in the full-screen player.
  const [expanded, setExpanded] = useState(false);
  const expandedRef = useRef(false);
  const rootRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setExpandMode(detectExpandMode());
    whenPerformanceTierKnown().then((tier) => {
      if (!cancelled) setCanPlay(tier !== 'low');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // The low tier gets a <video> only to open full screen; it never plays inline.
  const hasVideo = canPlay === true || (canPlay === false && expandMode !== null);

  // At least a quarter on screen counts as visible.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !hasVideo || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.intersectionRatio >= VISIBLE_RATIO;
        setVisible(isVisible);
        if (isVisible) setSeen(true);
      },
      { threshold: [0, VISIBLE_RATIO, 0.5, 1] }
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [hasVideo]);

  const shouldPlay = expanded || (Boolean(canPlay) && visible && intent !== 'pause');

  // iPhone's player opens only once the metadata is in: fetch it the first
  // time the loop is on screen, unless it is about to play (which loads it).
  useEffect(() => {
    const video = videoRef.current;
    if (!video || expandMode !== 'native' || !seen || shouldPlay) return;
    if (video.readyState > 0 || video.preload !== 'none') return;
    video.preload = 'metadata';
    video.load();
  }, [expandMode, seen, shouldPlay]);

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

  // Leaving full screen, however it happens: back to the inline loop.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const leave = () => {
      if (!expandedRef.current) return;
      expandedRef.current = false;
      video.controls = false;
      setExpanded(false);
      try {
        window.screen?.orientation?.unlock?.();
      } catch {
        // Nothing was locked.
      }
    };
    const onChange = () => {
      if (fullscreenElement() !== video) leave();
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    video.addEventListener('webkitendfullscreen', leave);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
      video.removeEventListener('webkitendfullscreen', leave);
    };
  }, [hasVideo]);

  const expand = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;

    if (expandMode === 'element') {
      const request = video.requestFullscreen || video.webkitRequestFullscreen;
      expandedRef.current = true;
      setExpanded(true);
      video.controls = true;
      Promise.resolve(request.call(video))
        .then(() => window.screen?.orientation?.lock?.('landscape'))
        .catch(() => {
          // Refused full screen, or no orientation lock (only the second is
          // fine): undo only if full screen did not open.
          if (fullscreenElement() === video) return;
          expandedRef.current = false;
          video.controls = false;
          setExpanded(false);
        });
      return;
    }

    // iPhone: the native player. play() inside the tap, then open it.
    const enter = () => {
      try {
        video.webkitEnterFullscreen();
        expandedRef.current = true;
        setExpanded(true);
      } catch {
        // Not ready, or refused: the inline loop carries on as it was.
      }
    };
    video.play?.().catch(() => {});
    if (video.readyState >= 1) enter();
    else video.addEventListener('loadedmetadata', enter, { once: true });
  };

  const poster = `${base}-poster.webp`;
  const showingPause = Boolean(canPlay) && intent !== 'pause';

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
        <div className="cs-loop__controls">
          {expandMode && (
            <button type="button" className="cs-loop__button" aria-label="Play video full screen" onClick={expand}>
              <ExpandIcon />
            </button>
          )}
          {canPlay && (
            <button
              type="button"
              className="cs-loop__button"
              aria-label={showingPause ? 'Pause video' : 'Play video'}
              onClick={() => setIntent(showingPause ? 'pause' : 'play')}
            >
              {showingPause ? <PauseIcon /> : <PlayIcon />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LoopVideo;
