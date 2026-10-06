// scripts/prerender.mjs
//
// Runs after the client build (dist/) and the SSR build of
// src/seo/entry-server.jsx (dist-ssr/). Writes one HTML file per route, each
// with its own <head> (title, description, canonical, share card, structured
// data) and its readable body already in the markup, plus sitemap.xml,
// robots.txt and 404.html.
//
// Files are flat (work/mesa.html, not work/mesa/index.html): Netlify's Pretty
// URLs serve those at /work/mesa with no redirect, which keeps every URL
// slashless and matching its canonical.

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, 'dist');
const ssrDir = resolve(root, 'dist-ssr');

const fail = (message) => {
  console.error(`[prerender] ${message}`);
  process.exit(1);
};

// React warns once per component that uses useLayoutEffect, which every
// measuring component here does. Expected on a server render and harmless: the
// app does not hydrate this markup, it replaces it.
const consoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('useLayoutEffect does nothing on the server')) return;
  consoleError(...args);
};

const SEO_BLOCK = /<!--seo:start-->[\s\S]*?<!--seo:end-->/;
const BODY_SLOT = '<div id="prerender"><!--prerender-html--></div>';

const template = await readFile(resolve(distDir, 'index.html'), 'utf8');
if (!SEO_BLOCK.test(template)) fail('index.html is missing the <!--seo:start--> ... <!--seo:end--> block.');
if (!template.includes(BODY_SLOT)) fail(`index.html is missing ${BODY_SLOT}.`);

const manifest = JSON.parse(await readFile(resolve(distDir, '.vite/manifest.json'), 'utf8'));
const entry = await import(pathToFileURL(resolve(ssrDir, 'entry-server.js')).href);
const { SITE_URL } = entry;

// Every stylesheet and chunk a dynamically imported module pulls in, so a
// prerendered case study is styled on first paint and its code is already on
// the way when the app boots.
const collectChunkAssets = (key, seen = new Set(), assets = { css: new Set(), js: new Set() }) => {
  if (seen.has(key)) return assets;
  seen.add(key);
  const chunk = manifest[key];
  if (!chunk) return assets;
  if (chunk.file?.endsWith('.js')) assets.js.add(`/${chunk.file}`);
  (chunk.css || []).forEach((file) => assets.css.add(`/${file}`));
  (chunk.imports || []).forEach((importKey) => collectChunkAssets(importKey, seen, assets));
  return assets;
};

const findCaseStudyChunkKey = (caseStudySlug) =>
  Object.keys(manifest).find(
    (key) => key.startsWith(`src/caseStudies/${caseStudySlug}/`) && manifest[key].isDynamicEntry
  );

const entryAssets = collectChunkAssets('index.html');

// The app is split out of the entry (src/main.jsx) so the loader paints first.
// A case study is on screen before any of that, though, and its overlay and the
// app it mounts in are needed at once, so a case-study page links them directly.
// Found by chunk name: a chunk shared by more than one importer is keyed by its
// hashed file rather than its source path.
const findEntryDynamicChunkKey = (name) =>
  (manifest['index.html']?.dynamicImports || []).find((key) => manifest[key]?.name === name);
const caseStudyShellAssets = ['App', 'CaseStudyOverlay'].reduce((assets, name) => {
  const key = findEntryDynamicChunkKey(name);
  if (!key) fail(`no "${name}" chunk among src/main.jsx's dynamic imports.`);
  return collectChunkAssets(key, new Set(), assets);
}, { css: new Set(), js: new Set() });

const buildPage = async (route) => {
  const meta = entry.getRouteMeta(route);
  const { html, visible, caseStudySlug } = await entry.renderRoute(route);

  let head = entry.renderHeadTagsHtml(meta);
  if (caseStudySlug) {
    const chunkKey = findCaseStudyChunkKey(caseStudySlug);
    if (!chunkKey) fail(`no chunk in the manifest for case study "${caseStudySlug}".`);
    const { css, js } = collectChunkAssets(chunkKey, new Set(), {
      css: new Set(caseStudyShellAssets.css),
      js: new Set(caseStudyShellAssets.js),
    });
    const links = [
      ...[...css].filter((href) => !entryAssets.css.has(href)).map((href) => `<link rel="stylesheet" crossorigin href="${href}" />`),
      ...[...js].filter((href) => !entryAssets.js.has(href)).map((href) => `<link rel="modulepreload" crossorigin href="${href}" />`),
    ];
    head += `\n    ${links.join('\n    ')}`;
  }

  const bodyClass = route
    ? visible
      ? ''
      : ' class="prerender--hidden prerender--page"'
    : ' class="prerender--page"';

  let page = template
    .replace(SEO_BLOCK, head)
    .replace(BODY_SLOT, `<div id="prerender"${bodyClass}>${html}</div>`);

  // The 404 is a plain page: no app to boot on an address it has no route for.
  if (!route) {
    page = page
      .replace(/\s*<script type="module"[^>]*><\/script>/g, '')
      .replace(/\s*<link rel="modulepreload"[^>]*>/g, '')
      .replace('<body>', '<body style="overflow:auto">');
  }

  return page;
};

const routes = entry.getPrerenderRoutes();
const written = [];

for (const route of routes) {
  const outFile = resolve(distDir, route.file);
  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, await buildPage(route));
  written.push(route.file);
}

await writeFile(resolve(distDir, '404.html'), await buildPage(null));
written.push('404.html');

const today = new Date().toISOString().slice(0, 10);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes
    .filter((route) => route.indexable)
    .map((route) => `  <url><loc>${SITE_URL}${route.path}</loc><lastmod>${today}</lastmod></url>`),
  '</urlset>',
  '',
].join('\n');
await writeFile(resolve(distDir, 'sitemap.xml'), sitemap);
written.push('sitemap.xml');

const robots = [
  'User-agent: *',
  'Allow: /',
  '',
  `Sitemap: ${SITE_URL}/sitemap.xml`,
  '',
].join('\n');
await writeFile(resolve(distDir, 'robots.txt'), robots);
written.push('robots.txt');

// The SSR bundle is a build tool; nothing in it is served.
await rm(ssrDir, { recursive: true, force: true });

console.log(`[prerender] wrote ${written.length} files:\n  ${written.join('\n  ')}`);
