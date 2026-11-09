// src/devlog/components/GameplayVideo.jsx
//
// A gameplay clip in an entry.
//
//   <GameplayVideo
//     src="/media/devlog/<entry>/remnant-chain.mp4"
//     poster="/media/devlog/<entry>/remnant-chain.webp"
//     title="Three Remnants detonating in sequence"   // its accessible name
//     caption="Optional caption."
//     loop                                             // optional
//     autoPlay                                         // optional: plays muted while on screen
//     size="wide"                                      // "text" | "wide" (default) | "full"
//   />
//
// Always muted to start, always with controls, so sound is the reader's choice.
// Nothing downloads until it is played (or, with autoPlay, scrolled to), and
// autoPlay is ignored for a reader who prefers reduced motion: they get the
// poster and the play button. Its shape comes from the poster, measured at
// build time; `aspectRatio` sets it by hand. Leave `src` out to hold the space
// for a clip still to come.

import React, { useEffect, useRef, useState } from 'react';
import CaseStudyMedia from '../../caseStudies/system/CaseStudyMedia';
import { MEDIA_SIZES } from './MediaFigure';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.(REDUCED_MOTION_QUERY).matches
  );
  useEffect(() => {
    const query = window.matchMedia?.(REDUCED_MOTION_QUERY);
    if (!query) return undefined;
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
};

const GameplayVideo = ({
  src = null,
  poster = null,
  title = 'Gameplay video',
  caption = null,
  loop = false,
  autoPlay = false,
  aspectRatio = '16 / 9',
  size = 'wide',
  placeholder = null,
  className = '',
}) => {
  const videoRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const playsWhenVisible = Boolean(src) && autoPlay && !reducedMotion;

  // Plays while at least half of it is on screen, pauses when it leaves, so a
  // clip never runs where nobody can see it.
  useEffect(() => {
    const video = videoRef.current;
    if (!playsWhenVisible || !video || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [playsWhenVisible]);

  return (
    <CaseStudyMedia
      className={`dl-media dl-media--${MEDIA_SIZES.includes(size) ? size : 'wide'} ${className}`.trim()}
      caption={caption}
      aspectRatio={aspectRatio}
      placeholder={src ? null : placeholder || title}
    >
      {src ? (
        <video
          ref={videoRef}
          className="dl-video"
          src={src}
          poster={poster || undefined}
          aria-label={title}
          muted
          playsInline
          controls
          loop={loop}
          preload={playsWhenVisible ? 'metadata' : 'none'}
        />
      ) : null}
    </CaseStudyMedia>
  );
};

export default GameplayVideo;
