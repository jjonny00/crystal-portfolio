// scripts/generate-share-images.mjs
//
// Writes the site's share cards (public/og/*.jpg, 1200×630, what LinkedIn, Slack,
// iMessage and X show for a link) and its icons (public/favicon.svg,
// favicon-48.png, apple-touch-icon.png).
//
// Run by hand when a project's art or title changes, and commit the output:
//   npm run build:share-images
// It is not part of `npm run build`, so the deploy does not depend on sharp
// being able to find fonts on the build machine.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = (...parts) => resolve(root, 'public', ...parts);

const WIDTH = 1200;
const HEIGHT = 630;
const INK = '#ffebe3';
const GROUND = '#050505';
const FONT = "'Acumin Pro', 'Acumin Variable Concept', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "'IvyPresto Display', Georgia, 'Times New Roman', serif";

// Art per card: the case study hero where there is one, else the project preview.
const CARDS = [
  { slug: 'slipstream', title: 'SLIPSTREAM', subtitle: 'VR Combat Prototype · Unreal Engine', art: 'public/assets/projects/experimental-interactions.jpg', accent: '#873cff' },
  { slug: 'mesa', title: 'MESA', subtitle: 'How Turns Create Tension', art: 'src/caseStudies/mesa/assets/hero.webp', accent: '#EAFF00' },
  { slug: 'fundseeder', title: 'FUNDSEEDER', subtitle: 'Designing the Ladder', art: 'public/assets/projects/fundseeder.webp', accent: '#58E0B2' },
  { slug: 'flying-axes', title: 'FLYING AXES', subtitle: 'Making Room for Play', art: 'src/caseStudies/flying-axes/assets/hero.webp', accent: '#ce2632' },
  { slug: 'forest-giant', title: 'FOREST GIANT', subtitle: 'Building the Practice', art: 'public/assets/projects/preview-fg.webp', accent: '#eb5321' },
  { slug: 'ge-experience-centers', title: 'GE EXPERIENCE CENTERS', subtitle: 'A Space That Follows the Conversation', art: 'src/caseStudies/ge-experience-centers/assets/hero.webp', accent: '#008cff' },
];

const escapeXml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The wordmark the nav sets, as type.
const wordmark = (x, y, size) =>
  `<text x="${x}" y="${y}" font-family="${SERIF}" font-size="${size}" letter-spacing="-0.5" fill="${INK}">J.JONSHAW</text>`;

const projectOverlay = ({ title, subtitle, accent }) => {
  const titleSize = title.length > 14 ? 64 : 84;
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.25" stop-color="${GROUND}" stop-opacity="0"/>
      <stop offset="1" stop-color="${GROUND}" stop-opacity="0.92"/>
    </linearGradient>
    <!-- Behind the wordmark, which otherwise vanishes on a bright frame. -->
    <linearGradient id="cap" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GROUND}" stop-opacity="0.7"/>
      <stop offset="1" stop-color="${GROUND}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#shade)"/>
  <rect width="${WIDTH}" height="170" fill="url(#cap)"/>
  <rect x="64" y="${HEIGHT - 196}" width="56" height="6" fill="${accent}"/>
  <text x="64" y="${HEIGHT - 110}" font-family="${FONT}" font-weight="600" font-size="${titleSize}" fill="${INK}">${escapeXml(title)}</text>
  <text x="64" y="${HEIGHT - 60}" font-family="${FONT}" font-size="34" fill="${INK}" fill-opacity="0.85">${escapeXml(subtitle)}</text>
  ${wordmark(WIDTH - 64 - 250, 76, 40)}
</svg>`);
};

const projectCard = async (card) => {
  const art = await sharp(resolve(root, card.art))
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'attention' })
    .toBuffer();
  return sharp(art)
    .composite([{ input: projectOverlay(card) }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
};

// Home: the name and role on the ground, with three projects alongside.
const homeCard = async () => {
  const tile = { width: 360, height: 630 };
  const tiles = await Promise.all(
    ['mesa', 'flying-axes', 'ge-experience-centers'].map(async (slug, index) => ({
      input: await sharp(resolve(root, CARDS.find((card) => card.slug === slug).art))
        .resize(tile.width, tile.height, { fit: 'cover', position: 'attention' })
        .modulate({ brightness: 0.8 })
        .toBuffer(),
      left: WIDTH - tile.width * (3 - index),
      top: 0,
    }))
  );
  // Tiles overlap the text column a little; fade them into the ground.
  const overlay = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0.1" stop-color="${GROUND}" stop-opacity="1"/>
      <stop offset="0.62" stop-color="${GROUND}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${GROUND}" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#fade)"/>
  ${wordmark(64, 112, 64)}
  <text x="64" y="300" font-family="${FONT}" font-weight="600" font-size="62" fill="${INK}">THE SYSTEMS</text>
  <text x="64" y="370" font-family="${FONT}" font-weight="600" font-size="62" fill="${INK}">BENEATH THE SURFACE</text>
  <text x="64" y="520" font-family="${FONT}" font-size="30" fill="${INK}" fill-opacity="0.85">Principal Product Designer</text>
  <text x="64" y="562" font-family="${FONT}" font-size="30" fill="${INK}" fill-opacity="0.85">Systems and Interaction</text>
</svg>`);
  return sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: GROUND } })
    .composite([...tiles, { input: overlay }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
};

// A faceted crystal in the site's ink, on its ground: legible in a light or dark
// tab strip, and the same shape the scene is built around.
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${GROUND}"/>
  <path d="M32 8 L50 26 L32 56 L14 26 Z" fill="${INK}" fill-opacity="0.18"/>
  <path d="M32 8 L50 26 L32 56 L14 26 Z" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M14 26 H50 M32 8 L24 26 L32 56 L40 26 Z" fill="none" stroke="${INK}" stroke-width="2.25" stroke-linejoin="round"/>
</svg>
`;

await mkdir(out('og'), { recursive: true });

for (const card of CARDS) {
  await writeFile(out('og', `${card.slug}.jpg`), await projectCard(card));
}
await writeFile(out('og', 'home.jpg'), await homeCard());

await writeFile(out('favicon.svg'), FAVICON_SVG);
const faviconSource = Buffer.from(FAVICON_SVG);
await writeFile(out('favicon-48.png'), await sharp(faviconSource, { density: 300 }).resize(48, 48).png().toBuffer());
// iOS masks its own corners, so the touch icon is the full square.
await writeFile(
  out('apple-touch-icon.png'),
  await sharp(Buffer.from(FAVICON_SVG.replace('rx="14"', 'rx="0"')), { density: 600 })
    .resize(180, 180)
    .png()
    .toBuffer()
);

// Vite's starter icon, no longer referenced anywhere.
const legacyIcon = out('vite.svg');
try {
  await readFile(legacyIcon);
  console.log('[share-images] public/vite.svg is unused now and can be deleted.');
} catch {
  // Already gone.
}

console.log(`[share-images] wrote ${CARDS.length + 1} share cards and 3 icons to public/.`);
