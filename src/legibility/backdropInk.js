// src/legibility/backdropInk.js
//
// Measures what the scene is actually doing behind each block of copy, and picks
// the ink that reads best on it. The alternative to darkening the scene: instead
// of forcing the backdrop into a range the ink can clear, look at the backdrop
// and choose an ink that clears it.
//
// This replaces `difference` as the default because of the hole in it. Difference
// renders a glyph as |backdrop - ink|, which equals the backdrop itself when the
// backdrop sits at half the ink's value — cream copy vanishes around 0.45. That
// is not a corner case on a crystal with specular highlights moving through the
// frame. Measuring has no such hole: mid-grey is the *worst* case for any single
// ink and a near-black one still clears it at better than 5:1.
//
// Cost
// ----
// The thing that makes this cheap is that the copy is only ever on screen when
// the content layer has settled on a section — and when it has settled, the
// camera is at rest too. So there is nothing to track frame by frame. The probe
// samples a few strips at SAMPLE_INTERVAL_MS while copy is up, and not at all
// while scrolling, while the tab is hidden, or in any other legibility mode.
//
// Readback is synchronous and can stall the pipeline, so what is read is kept
// small: three short strips per region rather than the region itself, which is
// a few KB per tick and gives the spread across the block that a single point
// would miss.

import { createLogger } from '../utils/logger';

const log = createLogger('backdropInk');

/** How often to re-measure while copy is on screen. */
const SAMPLE_INTERVAL_MS = 650;

/**
 * How long after a section settles before measuring resumes.
 *
 * Measuring is suspended for the whole of any move between sections — App drops
 * `data-ink-settled` the moment one starts. That alone is not enough for
 * hero → overview: the crystal detonates on the crossing and the frame is still
 * flaring white for a while after the scroll itself has stopped. Sampling into
 * that reads a scene that is about to stop existing, and the nav flips for a
 * beat and flips back. The wait outlasts the flare, and everywhere else it just
 * means the ink is chosen once the scene has arrived rather than on the way in.
 */
const SETTLE_GRACE_MS = 1400;

/** Strips read per region, as fractions of its height. */
const STRIP_OFFSETS = [0.25, 0.5, 0.75];
const STRIP_HEIGHT_PX = 3;

/** Percentiles the decision is made on — see pickInk. */
const DARK_PERCENTILE = 0.15;
const BRIGHT_PERCENTILE = 0.85;

/**
 * Contrast a region is expected to clear. Nothing happens when it does not —
 * there is no backstop to bring on, because the obvious one is a glow around the
 * glyphs and this site does not use them anywhere. The threshold is kept because
 * knowing a region is marginal is worth reporting (see __inkReport): a block
 * that looks wrong is either a bad ink choice or a correct choice against a
 * backdrop with no good answer, and only the second one shows up here.
 */
const MIN_ACCEPTABLE_CONTRAST = 3.5;

/**
 * The challenger has to beat the incumbent by this much before the ink flips.
 * Without it a backdrop hovering near the crossover would oscillate on the
 * crystal's idle drift alone.
 */
const FLIP_MARGIN = 1.25;

/**
 * Ink pairs per region. Light is the palette ink each block already used; dark is
 * a warm near-black rather than a neutral one, so a flipped block still belongs
 * to the same page.
 */
// About is not here on purpose. It is the one section that reads as a page
// rather than as a caption over the scene, so it sits on a scrim sized to the
// worst frame the scene can produce and its copy is a flat white — nothing to
// measure and nothing to decide. See the About scrim in App.jsx.
const INKS = {
  nav: { light: '#FEFFDE', dark: '#14120C' },
  copy: { light: '#E2DCC3', dark: '#14120C' },
};

// sRGB byte -> linear, built once. The read buffer is 8-bit sRGB (the renderer's
// outputColorSpace), and luminance is only meaningful in linear light.
const LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i += 1) {
  const c = i / 255;
  LINEAR[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

const hexToLuminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * LINEAR[(n >> 16) & 255] +
    0.7152 * LINEAR[(n >> 8) & 255] +
    0.0722 * LINEAR[n & 255]
  );
};

const INK_LUMINANCE = Object.fromEntries(
  Object.entries(INKS).map(([region, pair]) => [
    region,
    { light: hexToLuminance(pair.light), dark: hexToLuminance(pair.dark) },
  ])
);

const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

// Histogram over a perceptual ramp rather than linear luminance: linear is
// bunched so hard at the bottom that every dark scene lands in one bucket, and
// the dark percentile is half of the decision.
const BUCKETS = 64;
const GAMMA = 1 / 2.2;
const histogram = new Uint32Array(BUCKETS);

let pixels = new Uint8Array(0);
/** Last accepted choice per region, so a flip has to earn its way past FLIP_MARGIN. */
const current = new Map();

/**
 * Where to look, in CSS px, taken from the elements that will take the ink —
 * there is no second description of the layout to keep in step with this one.
 *
 * Rects are merged into horizontal clusters rather than one union per region.
 * The nav is the case that forces it: its wordmark is hard left and its items
 * hard right, and a single union of the two is the whole window, most of which
 * is bare scene no glyph ever sits on. Clustering keeps the two ends apart while
 * still collapsing a stack of paragraphs in one column down to a single read.
 */
const clusterRects = (rects) => {
  const sorted = rects.slice().sort((a, b) => a.left - b.left);
  const clusters = [];

  sorted.forEach((rect) => {
    const open = clusters[clusters.length - 1];
    if (open && rect.left <= open.right) {
      open.right = Math.max(open.right, rect.right);
      open.top = Math.min(open.top, rect.top);
      open.bottom = Math.max(open.bottom, rect.bottom);
      return;
    }
    clusters.push({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom });
  });

  return clusters;
};

const collectRegions = () => {
  const found = new Map();

  document.querySelectorAll('[data-ink-region]').forEach((node) => {
    const name = node.dataset.inkRegion;
    if (!INKS[name]) return;

    const rect = node.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;

    if (!found.has(name)) found.set(name, []);
    found.get(name).push(rect);
  });

  const regions = new Map();
  found.forEach((rects, name) => regions.set(name, clusterRects(rects)));
  return regions;
};

/**
 * Reads STRIP_OFFSETS strips across each cluster of a region and returns the
 * luminance at the dark and bright percentiles, or null if nothing was readable.
 * All clusters feed one histogram: the decision is a single ink for the region.
 */
const measureRegion = (ctx, clusters, buffer) => {
  const { width: bufW, height: bufH } = buffer;
  const scaleX = bufW / window.innerWidth;
  const scaleY = bufH / window.innerHeight;

  histogram.fill(0);
  let counted = 0;

  clusters.forEach((rect) => {
    const x = Math.max(0, Math.round(rect.left * scaleX));
    const right = Math.min(bufW, Math.round(rect.right * scaleX));
    const width = right - x;
    if (width < 1) return;

    const needed = width * STRIP_HEIGHT_PX * 4;
    if (pixels.length < needed) pixels = new Uint8Array(needed);

    STRIP_OFFSETS.forEach((offset) => {
      const cssY = rect.top + (rect.bottom - rect.top) * offset;
      // WebGL's origin is bottom-left; the DOM's is top-left.
      const y = Math.round(bufH - cssY * scaleY) - Math.floor(STRIP_HEIGHT_PX / 2);
      if (y < 0 || y + STRIP_HEIGHT_PX > bufH) return;

      ctx.readPixels(x, y, width, STRIP_HEIGHT_PX, ctx.RGBA, ctx.UNSIGNED_BYTE, pixels);

      for (let i = 0; i < needed; i += 4) {
        const lum =
          0.2126 * LINEAR[pixels[i]] +
          0.7152 * LINEAR[pixels[i + 1]] +
          0.0722 * LINEAR[pixels[i + 2]];
        let bucket = (Math.pow(lum, GAMMA) * BUCKETS) | 0;
        if (bucket >= BUCKETS) bucket = BUCKETS - 1;
        histogram[bucket] += 1;
        counted += 1;
      }
    });
  });

  if (!counted) return null;

  const at = (percentile) => {
    let seen = 0;
    const target = counted * percentile;
    for (let b = 0; b < BUCKETS; b += 1) {
      seen += histogram[b];
      if (seen >= target) return Math.pow((b + 0.5) / BUCKETS, 1 / GAMMA);
    }
    return 1;
  };

  return { dark: at(DARK_PERCENTILE), bright: at(BRIGHT_PERCENTILE) };
};

/**
 * Picks between the two inks on the worst contrast each would have to hold, not
 * the average. A region that is half black sky and half blown-out crystal has no
 * good single ink, and scoring on the mean would happily choose one that fails on
 * one half — scoring on the minimum picks the least bad, and says so when even
 * that is not enough rather than reporting a flattering average.
 */
const pickInk = (region, measured) => {
  const { light, dark } = INK_LUMINANCE[region];

  const lightScore = Math.min(contrast(light, measured.dark), contrast(light, measured.bright));
  const darkScore = Math.min(contrast(dark, measured.dark), contrast(dark, measured.bright));

  const held = current.get(region);
  let tone;
  if (!held) {
    tone = lightScore >= darkScore ? 'light' : 'dark';
  } else {
    // Only move if the other ink is clearly better than the one already up.
    const heldScore = held.tone === 'light' ? lightScore : darkScore;
    const otherScore = held.tone === 'light' ? darkScore : lightScore;
    tone = otherScore > heldScore * FLIP_MARGIN ? (held.tone === 'light' ? 'dark' : 'light') : held.tone;
  }

  const score = tone === 'light' ? lightScore : darkScore;
  return {
    tone,
    marginal: score < MIN_ACCEPTABLE_CONTRAST,
    // Carried for __inkReport() only — the decision above uses none of it.
    score,
    lightScore,
    darkScore,
    measured,
  };
};

const publish = (region, choice) => {
  const held = current.get(region);
  const unchanged = held && held.tone === choice.tone;
  current.set(region, choice);
  if (unchanged) return;

  document.documentElement.style.setProperty(`--ink-${region}`, INKS[region][choice.tone]);
  log.debug(`${region} -> ${choice.tone}${choice.marginal ? ' (marginal)' : ''}`);
};

/** Hands every region back to its authored ink. */
export const clearBackdropInk = () => {
  current.clear();
  const root = document.documentElement.style;
  Object.keys(INKS).forEach((region) => root.removeProperty(`--ink-${region}`));
};

// Why a region chose what it chose. Judging this by eye is hard — a block that
// looks wrong might be a bad ink choice, or a correct choice against a backdrop
// that genuinely has no good answer — and this separates the two.
if (import.meta.env.DEV) {
  globalThis.__inkReport = () => {
    const rows = {};
    current.forEach((choice, region) => {
      rows[region] = {
        ink: INKS[region][choice.tone],
        tone: choice.tone,
        // True when no ink clears MIN_ACCEPTABLE_CONTRAST on this backdrop —
        // nothing is done about it, but it is the answer to "why does that block
        // look weak", and it points at the scene rather than at the ink.
        marginal: choice.marginal,
        contrast: `${choice.score?.toFixed(2)}:1`,
        ifLight: `${choice.lightScore?.toFixed(2)}:1`,
        ifDark: `${choice.darkScore?.toFixed(2)}:1`,
        backdrop: choice.measured
          ? `${choice.measured.dark.toFixed(3)} – ${choice.measured.bright.toFixed(3)} (p15–p85 luminance)`
          : '—',
      };
    });
    console.table(rows);
    return rows;
  };
}

let lastSampleAt = 0;
let settledAt = 0;
let settled = false;

/**
 * Told by App whether the content layer is sitting on a section or moving
 * between them. Nothing is measured while it is moving: what is behind the copy
 * mid-transition is not what it will be sitting on, and acting on it produces a
 * flip that immediately wants to flip back.
 */
export const setBackdropInkSettled = (isSettled) => {
  if (isSettled === settled) return;
  settled = isSettled;
  if (isSettled) settledAt = performance.now();
};

/**
 * One measurement pass. Called from the probe inside the render loop, which is
 * the only place the drawing buffer still holds the frame that was just drawn.
 */
export const sampleBackdropInk = (renderer, now) => {
  if (now - lastSampleAt < SAMPLE_INTERVAL_MS) return;
  if (document.hidden) return;
  if (document.documentElement.dataset.legibility !== 'adaptive') return;
  if (!settled || now - settledAt < SETTLE_GRACE_MS) return;

  const regions = collectRegions();
  if (!regions.size) return;

  lastSampleAt = now;

  const canvas = renderer.domElement;
  if (!canvas.width || !canvas.height) return;

  const ctx = renderer.getContext();
  // The composer may have left one of its own targets bound; the frame as it
  // will actually be seen is on the default one.
  renderer.setRenderTarget(null);

  const buffer = { width: canvas.width, height: canvas.height };
  regions.forEach((clusters, name) => {
    const measured = measureRegion(ctx, clusters, buffer);
    if (measured) publish(name, pickInk(name, measured));
  });
};
