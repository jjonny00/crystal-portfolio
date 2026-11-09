// scripts/devlog/entries.mjs
//
// Build-time discovery and validation of the devlog's entries: every .mdx file
// in src/devlog/content/entries/, its frontmatter parsed and checked, its cover
// measured. Read by the Vite plugin (vitePlugin.mjs), which turns the result
// into the `virtual:devlog` module the app imports. Node only.
//
// What is published is decided here, once, for the whole build:
//   draft: true              never in a production build
//   date after today (UTC)   not until a build on or after that date
// A dev server shows both, marked, so they can be previewed. DEVLOG_DRAFTS=1
// does the same for a build (a deploy preview, say). See docs/devlog.md.

import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join, relative, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import sharp from 'sharp';

export const ENTRIES_DIR = 'src/devlog/content/entries';
export const PUBLIC_DIR = 'public';

// Where articles live, for checking links between entries. Mirrors
// src/devlog/devlogPaths.js, which the app uses.
export const DEVLOG_BASE_PATH = '/work/secondsentence/devlog';

const REQUIRED_FIELDS = ['title', 'slug', 'date', 'category', 'summary', 'draft'];
const OPTIONAL_FIELDS = ['cover', 'coverAlt', 'video', 'updated'];
const KNOWN_FIELDS = new Set([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/** Today as YYYY-MM-DD in UTC: the cut-off for scheduled entries. */
export const todayUtc = () => new Date().toISOString().slice(0, 10);

const isValidDate = (value) => {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

const isRemote = (src) => /^https?:\/\//i.test(src);

/** The file a site path like /media/devlog/x/cover.webp is served from. */
export const publicFileFor = (root, src) => resolve(root, PUBLIC_DIR, `.${src}`);

/** `{ width, height }` of an image in public/, or null if it cannot be read. */
export const measureImage = async (root, src) => {
  try {
    const { width, height } = await sharp(publicFileFor(root, src)).metadata();
    return width && height ? { width, height } : null;
  } catch {
    return null;
  }
};

/**
 * Checks one entry's frontmatter. Returns the problems found, each a sentence
 * that names the field, so the build error says what to fix.
 */
const validateFrontmatter = (data, root) => {
  const problems = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return ['frontmatter is missing. An entry starts with a --- block; see src/devlog/content/_template.mdx.'];
  }

  REQUIRED_FIELDS.forEach((field) => {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      problems.push(`"${field}" is required.`);
    }
  });

  Object.keys(data).forEach((field) => {
    if (!KNOWN_FIELDS.has(field)) {
      problems.push(
        `"${field}" is not a supported field. Supported: ${[...KNOWN_FIELDS].join(', ')}.`
      );
    }
  });

  ['title', 'category', 'summary', 'coverAlt'].forEach((field) => {
    if (data[field] !== undefined && typeof data[field] !== 'string') {
      problems.push(`"${field}" must be text.`);
    }
  });

  if (data.slug !== undefined && (typeof data.slug !== 'string' || !SLUG_PATTERN.test(data.slug))) {
    problems.push(`"slug" must be lowercase words joined by hyphens (got ${JSON.stringify(data.slug)}).`);
  }

  ['date', 'updated'].forEach((field) => {
    if (data[field] === undefined) return;
    if (typeof data[field] !== 'string' || !isValidDate(data[field])) {
      problems.push(`"${field}" must be a real date written as "YYYY-MM-DD", in quotes (got ${JSON.stringify(data[field])}).`);
    }
  });

  if (data.draft !== undefined && typeof data.draft !== 'boolean') {
    problems.push(`"draft" must be true or false (got ${JSON.stringify(data.draft)}).`);
  }

  // A published entry is on the preview, the archive and a share card, all of
  // which show its cover. A draft may go without while its media is made.
  if (data.draft === false && !data.cover) {
    problems.push('"cover" is required once an entry is published (draft: false).');
  }

  ['cover', 'video'].forEach((field) => {
    const src = data[field];
    if (src === undefined) return;
    if (typeof src !== 'string' || (!src.startsWith('/') && !isRemote(src))) {
      problems.push(`"${field}" must be a path under public/, starting with "/" (got ${JSON.stringify(src)}).`);
    } else if (!isRemote(src) && !existsSync(publicFileFor(root, src))) {
      problems.push(`"${field}" points at ${src}, but there is no file at public${src}.`);
    }
  });

  if (data.cover && !data.coverAlt) {
    problems.push('"coverAlt" is required with a cover: describe the image for screen readers and share cards.');
  }

  return problems;
};

// Links from one entry to another, written as site paths in the body.
const ENTRY_LINK_PATTERN = new RegExp(
  `${DEVLOG_BASE_PATH.replace(/\//g, '\\/')}\\/([a-z0-9-]+)`,
  'g'
);

const parseEntryFile = async (root, file) => {
  const source = await readFile(file, 'utf8');
  const match = FRONTMATTER_PATTERN.exec(source);
  let data = null;
  const problems = [];

  if (match) {
    try {
      data = parseYaml(match[1]);
    } catch (error) {
      problems.push(`frontmatter is not valid YAML: ${error.message.split('\n')[0]}`);
    }
  }
  if (!problems.length) problems.push(...validateFrontmatter(data, root));

  const body = match ? source.slice(match[0].length) : source;
  const linkedSlugs = [...body.matchAll(ENTRY_LINK_PATTERN)].map((link) => link[1]);

  return { file, data, problems, linkedSlugs };
};

/**
 * Every entry, validated, newest first.
 *
 * @param {object} options
 * @param {string} options.root           project root
 * @param {boolean} options.includeUnpublished  drafts and scheduled entries too
 * @param {string} [options.today]        YYYY-MM-DD, for tests
 * @returns {Promise<{ entries: object[], errors: string[] }>}
 */
export const readDevlogEntries = async ({ root, includeUnpublished, today = todayUtc() }) => {
  const dir = resolve(root, ENTRIES_DIR);
  const files = existsSync(dir)
    ? (await readdir(dir))
        // `_template.mdx` and anything else prefixed with _ is not an entry.
        .filter((name) => name.endsWith('.mdx') && !name.startsWith('_'))
        .sort()
        .map((name) => join(dir, name))
    : [];

  const parsed = await Promise.all(files.map((file) => parseEntryFile(root, file)));
  const errors = [];
  const label = (file) => relative(root, file).replace(/\\/g, '/');

  parsed.forEach(({ file, problems }) => {
    problems.forEach((problem) => errors.push(`${label(file)}: ${problem}`));
  });

  const seen = new Map();
  parsed.forEach(({ file, data }) => {
    const slug = data?.slug;
    if (!slug) return;
    if (seen.has(slug)) {
      errors.push(`${label(file)}: slug "${slug}" is already used by ${label(seen.get(slug))}.`);
    } else {
      seen.set(slug, file);
    }
  });

  const valid = parsed.filter(({ problems }) => !problems.length);

  const entries = await Promise.all(
    valid.map(async ({ file, data }) => {
      const scheduled = data.date > today;
      const cover = data.cover
        ? {
            src: data.cover,
            alt: data.coverAlt,
            ...(isRemote(data.cover) ? null : await measureImage(root, data.cover)),
          }
        : null;
      return {
        slug: data.slug,
        title: data.title.trim(),
        date: data.date,
        updated: data.updated || null,
        category: data.category.trim(),
        summary: data.summary.trim(),
        cover,
        video: data.video || null,
        draft: data.draft,
        scheduled,
        // Root-relative, which Vite resolves the same way in dev and build.
        module: `/${relative(root, file).replace(/\\/g, '/')}`,
        fileName: basename(file),
      };
    })
  );

  const published = entries.filter(
    (entry) => includeUnpublished || (!entry.draft && !entry.scheduled)
  );
  const publishedSlugs = new Set(published.map((entry) => entry.slug));

  // A link from a published entry to one that is not (a draft, a typo) would
  // ship as a 404, so it fails the build.
  valid.forEach(({ file, data, linkedSlugs }) => {
    if (!publishedSlugs.has(data.slug)) return;
    linkedSlugs.forEach((slug) => {
      if (!publishedSlugs.has(slug)) {
        const reason = seen.has(slug) ? 'is not published in this build' : 'does not exist';
        errors.push(`${label(file)}: links to ${DEVLOG_BASE_PATH}/${slug}, which ${reason}.`);
      }
    });
  });

  // Newest first. Same-day entries fall back to their slug so the order is
  // stable from build to build.
  published.sort((a, b) => (a.date === b.date ? b.slug.localeCompare(a.slug) : b.date.localeCompare(a.date)));

  return { entries: published, errors };
};
