// src/ui/phoneGround.js
//
// On phones the page and the frame's corners share one ground colour,
// --phone-ground (index.css), and iOS Safari colours its status bar and toolbar
// from it. This moves that colour to each section's own as the page settles on
// it, and CSS eases between them.
//
// Every visit starts from the loader's colour (the sky's bottom, index.css): the
// ground is held there until the loader hands off, then eases into the section
// over the loader's own fade, so the corners and Safari's bars arrive as the
// loader leaves. Between sections it starts as soon as a scroll heads for the
// next one, rather than waiting for the page to settle there.
//
// Authored, not measured live — the same call as the mobile scrims
// (legibility/scrimTone.js): a colour you can see here and tune on the phone
// beats one that breathes with the crystal. The project skies' own colours
// (projectBackgrounds.js) were tried first and don't work: tone mapping, bloom
// and the crystal's glow move the rendered edge a long way from them — Slipstream's
// sky is green in that file and lavender on screen.
//
// The starting values were measured from the rendered frame's bottom edge on a
// phone-sized viewport (the median across the middle 70% of the bottom 10px),
// since the toolbar and the bottom corners sit against that edge. Headless Chrome
// renders the low tier, so expect to adjust them by eye.

import { useEffect, useRef } from 'react';

const PHONE_GROUNDS = {
  // Hand-picked: the loader's colour, the sky's bottom as it renders under the
  // hero (index.css). Not darkened.
  hero: null,
  overview: '#2c3051',
  'project-project01': '#817aba', // Slipstream
  'project-project02': '#76846e', // Mesa
  'project-project03': '#91dfd5', // FundSeeder
  'project-project04': '#6c4974', // Flying Axes
  'project-project05': '#7c4d65', // Forest Giant
  'project-project06': '#164c88', // GE Experience Centers
  about: '#363153',
};

// How far every section colour above is taken toward black, so the frame and the
// bars sit a step quieter than the scene's edge. One knob for the whole set;
// mixed in OKLab so each hue keeps its character as it darkens.
const DARKEN = 0.3;

const shade = (hex) => `color-mix(in oklab, ${hex} ${Math.round((1 - DARKEN) * 100)}%, #000)`;

const root = () => (typeof document === 'undefined' ? null : document.documentElement);

/** Back to the loader's colour. */
export function resetPhoneGround() {
  root()?.style.removeProperty('--phone-ground');
}

/** Move the phone ground to `sectionId`'s colour; unknown or null leaves it. */
export function setPhoneGround(sectionId) {
  const el = root();
  if (!el || !sectionId || !(sectionId in PHONE_GROUNDS)) return;
  const colour = PHONE_GROUNDS[sectionId];
  if (!colour) {
    resetPhoneGround();
    return;
  }
  el.style.setProperty('--phone-ground', shade(colour));
}

// How the ground eases (index.css and app-frame.css read this, so the page — and
// with it Safari's bars — and the corners always move together). Unset, they use
// their default (1.2s ease-out).
const setGroundTransition = (value) => {
  const el = root();
  if (!el) return;
  if (value) el.style.setProperty('--phone-ground-transition', value);
  else el.style.removeProperty('--phone-ground-transition');
};

// The section a scroll is heading for, from where it is and which way it's going:
// down from a section, the next one; up, the one above. The scroll container's
// sections are full-height and snap, so the one whose top is at or above the
// viewport's is the one being left (going down) or approached (going up). A
// section whose top is at the viewport's top has been arrived at — without that,
// the last scroll event of a move down would already point at the one after.
function headingFor(container, direction) {
  const sections = [...container.querySelectorAll(':scope > div > section.scroll-section[id]')];
  if (!sections.length) return null;
  const top = container.scrollTop;
  const arrived = sections.find((section) => Math.abs(section.offsetTop - top) <= 2);
  if (arrived) return arrived.id;
  let current = 0;
  sections.forEach((section, index) => {
    if (section.offsetTop <= top) current = index;
  });
  const target = direction > 0 ? Math.min(current + 1, sections.length - 1) : current;
  return sections[target].id;
}

/**
 * Drives the phone ground from App.
 *
 *   released        the loader has begun its hand-off (App's exitLoader)
 *   settledSection  the section the page has come to rest on, or null mid-scroll
 *   handoff         the loader's fade: { delayMs, durationMs }
 */
export function usePhoneGround({ released, settledSection, handoff }) {
  const handedOffRef = useRef(false);
  const handoffTimerRef = useRef(null);

  // Held at the loader's colour until the hand-off; then the section's. The first
  // move after a hand-off takes the loader fade's timing, so the corners and the
  // bars land on the section's colour as the loader finishes leaving.
  useEffect(() => {
    if (!released) {
      handedOffRef.current = false;
      resetPhoneGround();
      return;
    }
    if (!handedOffRef.current) {
      handedOffRef.current = true;
      setGroundTransition(`${handoff.durationMs}ms ease ${handoff.delayMs}ms`);
      clearTimeout(handoffTimerRef.current);
      handoffTimerRef.current = setTimeout(
        () => setGroundTransition(null),
        handoff.delayMs + handoff.durationMs,
      );
    }
    setPhoneGround(settledSection);
  }, [released, settledSection, handoff.delayMs, handoff.durationMs]);

  useEffect(() => () => clearTimeout(handoffTimerRef.current), []);

  // Between sections: start toward the next one as soon as a scroll heads there.
  // The settled section still has the last word, so a scroll that snaps back ends
  // on the right colour.
  useEffect(() => {
    if (!released) return undefined;
    const container = document.querySelector('.scroll-container');
    if (!container) return undefined;
    let lastTop = container.scrollTop;
    const onScroll = () => {
      const top = container.scrollTop;
      const direction = Math.sign(top - lastTop);
      lastTop = top;
      if (direction) setPhoneGround(headingFor(container, direction));
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [released]);
}
