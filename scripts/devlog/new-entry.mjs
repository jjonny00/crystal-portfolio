// scripts/devlog/new-entry.mjs
//
//   npm run devlog:new -- "Turning Movement Into a Weapon"
//
// Starts a devlog entry from src/devlog/content/_template.mdx: a draft dated
// today, its slug made from the title, and a folder for its media in
// public/media/devlog/<slug>/. Refuses to overwrite an entry that exists.
// Then: write it, preview it on `npm run dev`, and set draft: false to publish
// (docs/devlog.md).

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENTRIES_DIR, todayUtc } from './entries.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const title = process.argv.slice(2).join(' ').trim();

if (!title) {
  console.error('Usage: npm run devlog:new -- "Entry title"');
  process.exit(1);
}

const slug = title
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[’']/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

if (!slug) {
  console.error(`Could not make a slug from "${title}". Use letters or numbers in the title.`);
  process.exit(1);
}

const entryFile = resolve(root, ENTRIES_DIR, `${slug}.mdx`);
if (existsSync(entryFile)) {
  console.error(`${relative(root, entryFile)} already exists. Pick another title, or edit that entry.`);
  process.exit(1);
}

const template = await readFile(resolve(root, 'src/devlog/content/_template.mdx'), 'utf8');
const yamlString = (value) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const source = template
  .replace(/__TITLE__/g, yamlString(title))
  .replace(/__SLUG__/g, slug)
  .replace(/__DATE__/g, todayUtc())
  .replace(/__CATEGORY__/g, 'Development')
  .replace(/__SUMMARY__/g, 'One or two sentences on what this entry is about.');

await mkdir(dirname(entryFile), { recursive: true });
await writeFile(entryFile, source);
const mediaDir = resolve(root, 'public/media/devlog', slug);
await mkdir(mediaDir, { recursive: true });

console.log(`Created ${relative(root, entryFile)} (draft).`);
console.log(`Put its images and clips in ${relative(root, mediaDir)}/`);
console.log(`Preview: npm run dev, then /work/secondsentence/devlog/${slug}`);
