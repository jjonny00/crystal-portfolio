// src/components/sections/HeroSection.jsx

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { animated, easings, useSprings } from '@react-spring/web';

import useProjectHeadlineColor from '../../hooks/useProjectHeadlineColor';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MQ_REDUCED_MOTION } from '../../config/breakpoints';
import { getIntroTimeline, subscribeIntroTimeline } from '../../lib/introTimeline';
import { getHeroReformStart } from '../../lib/heroReformClock';
import { HERO_RETURN_CINEMATIC } from '../../config/heroOverviewCinematicConfig';
import Headline from '../ui/Headline';
import '../../styles/hero-section.css';
// The intro, long and short. Same shape as a project's `mobile` block in
// data/projects.js: the phone gets its own tighter cut rather than the desktop
// paragraph reflowed down a narrow column. Shared with the prerendered page.
import {
  HERO_BODY_COPY as BODY_COPY,
  HERO_BODY_COPY_MOBILE as BODY_COPY_MOBILE,
} from '../../data/siteCopy';

const ARROW_DOWN_SRC = '/assets/ui/SVG/arrow-down.svg';

// The copy comes in a piece at a time: the headline's three lines, then the
// paragraph, then the CTA. Each entry is [starts at (ms), rise length (ms), fade
// length (ms)]: the headline lines rise into place on the rise length but keep
// fading in for longer; the paragraph and CTA only fade, slowly (rise 0).
//
// On the first load the schedule is timed against the camera intro
// (lib/introTimeline, from the moment the camera starts moving): the first line a
// second in, the last one in place as the camera settles on the hero (the intro
// is 4.4s and its last stretch is imperceptibly slow), the paragraph and CTA after.
const INTRO_SCHEDULE = [[1000, 800, 1600], [2200, 800, 1600], [3400, 800, 1600], [4300, 0, 1600], [4900, 0, 1600]];
// Coming back to the hero, or arriving with no intro: the same order, close together.
// While the crystal is reforming (back from the index), it starts once the reform
// is HERO_RETURN_CINEMATIC.headlineAt of the way through its time, not as the
// scroll settles, so the headline comes in as the fragments close up.
const QUICK_SCHEDULE = [[150, 600, 1000], [270, 600, 1000], [390, 600, 1000], [600, 0, 1000], [900, 0, 1000]];
const quickScheduleStart = () => {
  const now = performance.now();
  const reformStart = getHeroReformStart();
  if (reformStart == null) return now;
  return Math.max(now, reformStart + HERO_RETURN_CINEMATIC.reformSeconds * 1000 * HERO_RETURN_CINEMATIC.headlineAt);
};
// Shown without waiting if the intro was expected but never starts.
const INTRO_START_FALLBACK_MS = 2000;
const HIDE_MS = 300;
const RISE_PX = 24;

/**
 * Hero Section Component
 * Full viewport introduction with crystal metaphor.
 *
 * The CTA's arrow is the anchor the vertical energy line is measured from
 * (`data-hero-rail-anchor`) — see VerticalEnergyLine.jsx. Keeping the CTA in
 * normal flow rather than absolutely positioned is what lets the rail derive its
 * x and starting y from layout instead of viewport coordinates.
 */
const HeroSection = ({
  visible = true,
  isMobile = false,
  onScrollHint = null
}) => {
  useProjectHeadlineColor();
  const reducedMotion = useMediaQuery(MQ_REDUCED_MOTION);
  const introTimeline = useSyncExternalStore(subscribeIntroTimeline, getIntroTimeline, getIntroTimeline);

  // How many pieces are in (0-5), and the schedule bringing them in. A schedule is
  // fixed when the hero becomes visible and runs to the end, so the intro landing
  // part-way through never reshuffles it; hiding the hero resets it.
  const [shownCount, setShownCount] = useState(0);
  const [schedule, setSchedule] = useState(QUICK_SCHEDULE);
  const sessionRef = useRef({ scheduled: false, timers: [] });

  useEffect(() => {
    const session = sessionRef.current;
    const clearTimers = () => {
      session.timers.forEach(clearTimeout);
      session.timers = [];
    };
    if (!visible) {
      clearTimers();
      session.scheduled = false;
      setShownCount(0);
      return;
    }
    if (session.scheduled) return;

    const run = (steps, startedAt) => {
      clearTimers();
      session.scheduled = true;
      setSchedule(steps);
      steps.forEach(([at], index) => {
        session.timers.push(setTimeout(
          () => setShownCount((count) => Math.max(count, index + 1)),
          Math.max(0, startedAt + at - performance.now()),
        ));
      });
    };

    if (introTimeline.phase === 'running') {
      run(INTRO_SCHEDULE, introTimeline.startedAt);
    } else if (introTimeline.phase === 'pending') {
      // Behind the loader the camera has not started yet: wait for it (this effect
      // runs again when it does), but not forever.
      if (!session.timers.length) {
        session.timers.push(setTimeout(() => run(QUICK_SCHEDULE, performance.now()), INTRO_START_FALLBACK_MS));
      }
    } else {
      run(QUICK_SCHEDULE, quickScheduleStart());
    }
  }, [visible, introTimeline]);

  useEffect(() => () => sessionRef.current.timers.forEach(clearTimeout), []);

  const [springs] = useSprings(5, (index) => {
    const shown = index < shownCount;
    const [, riseMs, fadeMs] = schedule[index];
    return {
      opacity: shown ? 1 : 0,
      y: shown || reducedMotion || !riseMs ? 0 : RISE_PX,
      // The fade on a gentler curve than the rise, so the longer fade reads as a
      // fade rather than a quick pop with a long, invisible tail.
      config: (key) => ({
        duration: shown ? (key === 'opacity' ? fadeMs : riseMs) : HIDE_MS,
        easing: key === 'opacity' ? easings.easeOutSine : easings.easeOutCubic,
      }),
    };
  }, [shownCount, schedule, reducedMotion]);
  const pieceStyle = (index) => ({
    opacity: springs[index].opacity,
    transform: springs[index].y.to((y) => `translateY(${y}px)`),
  });

  const handleScrollHint = () => {
    if (onScrollHint) {
      onScrollHint();
      return;
    }

    // `.scroll-container` is the real scroller (see scroll-snap.css), not the
    // document — scrolling the window here would do nothing.
    const container = document.querySelector('.scroll-container');
    const overview = document.getElementById('overview');

    if (container && overview) {
      container.scrollTo({ top: overview.offsetTop, behavior: 'smooth' });
      return;
    }

    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <div className="hero-section">
      <div className="hero-section__content">
        <div className="hero-section__headline-block">
          <Headline as="h1" className="type-headline-lg hero-section__title">
            <span className="visually-hidden">Jon Shaw: </span>
            <animated.span style={pieceStyle(0)} className="hero-section__title-line">SYSTEMS</animated.span>
            <animated.span style={pieceStyle(1)} className="hero-section__title-line">BENEATH</animated.span>
            <animated.span style={pieceStyle(2)} className="hero-section__title-line">THE SURFACE</animated.span>
          </Headline>
        </div>

        <animated.div style={pieceStyle(3)} className="hero-section__body-block">
          <p className="type-body-lg hero-section__body-copy">
            {isMobile ? BODY_COPY_MOBILE : BODY_COPY}
          </p>
        </animated.div>

        <animated.div style={pieceStyle(4)} className="hero-section__cta-block">
          <button
            type="button"
            className="hero-section__cta"
            onClick={handleScrollHint}
          >
            <img
              className="hero-section__cta-arrow"
              data-hero-rail-anchor
              src={ARROW_DOWN_SRC}
              alt=""
              aria-hidden="true"
              width={19}
              height={21}
            />
            <span className="hero-section__cta-label">LOOK BENEATH THE SURFACE</span>
          </button>
        </animated.div>
      </div>
    </div>
  );
};

export default HeroSection;
