// scripts/devlog/vitePlugin.mjs
//
// The devlog's two build hooks, registered in vite.config.js:
//
//   devlogEntries()     serves `virtual:devlog`: the published entries' metadata
//                       (newest first) and a lazy loader per entry body, so
//                       adding an .mdx file is the whole of publishing one. Fails
//                       the build, or shows Vite's error overlay in dev, on an
//                       invalid entry (scripts/devlog/entries.mjs says why).
//   rehypeDevlogMedia   an MDX (rehype) plugin: gives images in an entry's body
//                       their measured size, so they reserve their space before
//                       they load, and fails on a path with no file behind it.

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ENTRIES_DIR, measureImage, publicFileFor, readDevlogEntries } from './entries.mjs';

const VIRTUAL_ID = 'virtual:devlog';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

const truthy = (value) => /^(1|true|yes)$/i.test(String(value || ''));

export const devlogEntries = () => {
  let root = process.cwd();
  let includeUnpublished = false;
  let server = null;
  let lastCode = null;

  const buildModule = async () => {
    const { entries, errors } = await readDevlogEntries({ root, includeUnpublished });
    if (errors.length) {
      throw new Error(`Devlog entries are invalid:\n  - ${errors.join('\n  - ')}`);
    }

    // Each body is its own chunk, fetched when its article opens.
    const loaders = entries
      .map((entry) => `  ${JSON.stringify(entry.slug)}: () => import(${JSON.stringify(entry.module)}),`)
      .join('\n');

    return [
      `export const entries = ${JSON.stringify(entries, null, 2)};`,
      `export const loaders = {\n${loaders}\n};`,
      `export const includesUnpublished = ${JSON.stringify(includeUnpublished)};`,
      '',
    ].join('\n');
  };

  return {
    name: 'devlog-entries',

    configResolved(config) {
      root = config.root;
      // Drafts and scheduled entries show on the dev server, marked; a build
      // leaves them out unless asked (a deploy preview, say).
      includeUnpublished = config.command === 'serve' || truthy(process.env.DEVLOG_DRAFTS);
    },

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },

    async load(id) {
      if (id !== RESOLVED_ID) return null;
      lastCode = await buildModule();
      return lastCode;
    },

    configureServer(devServer) {
      server = devServer;
      const dir = resolve(root, ENTRIES_DIR).replace(/\\/g, '/');
      const isEntryFile = (file) => file.replace(/\\/g, '/').startsWith(dir) && file.endsWith('.mdx');

      // An entry added, removed or with new frontmatter changes the list every
      // surface reads (the preview, the archive, the routes): reload the page
      // with the list rebuilt. A body edit alone leaves the list as it was and
      // hot-updates through MDX.
      const reload = () => {
        const module = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload' });
      };
      const onAddOrRemove = (file) => {
        if (isEntryFile(file)) reload();
      };
      const onChange = async (file) => {
        if (!isEntryFile(file)) return;
        let next;
        try {
          next = await buildModule();
        } catch {
          // Invalid now: reloading surfaces the error in the overlay.
          next = null;
        }
        if (next !== lastCode) reload();
      };
      server.watcher.add(dir);
      server.watcher.on('add', onAddOrRemove);
      server.watcher.on('unlink', onAddOrRemove);
      server.watcher.on('change', onChange);
    },
  };
};

// --- rehypeDevlogMedia ------------------------------------------------------

const walk = (node, visit) => {
  visit(node);
  (node.children || []).forEach((child) => walk(child, visit));
};

const literalAttribute = (node, name) => {
  const attribute = (node.attributes || []).find(
    (item) => item.type === 'mdxJsxAttribute' && item.name === name
  );
  return typeof attribute?.value === 'string' ? attribute.value : null;
};

const hasAttribute = (node, name) =>
  (node.attributes || []).some((item) => item.type === 'mdxJsxAttribute' && item.name === name);

const setAttribute = (node, name, value) => {
  node.attributes.push({ type: 'mdxJsxAttribute', name, value: String(value) });
};

const isLocal = (src) => typeof src === 'string' && src.startsWith('/');

/**
 * @param {{ root: string }} options  project root, for finding public/.
 */
export const rehypeDevlogMedia = ({ root }) => async (tree, file) => {
  const jobs = [];

  const requireFile = (src, node) => {
    if (isLocal(src) && !existsSync(publicFileFor(root, src))) {
      file.fail(`No file at public${src}. Add it there, or remove the reference.`, node);
    }
  };

  walk(tree, (node) => {
    // ![alt](/media/devlog/slug/image.webp "Caption")
    if (node.type === 'element' && node.tagName === 'img') {
      const src = node.properties?.src;
      requireFile(src, node);
      if (isLocal(src) && !node.properties.width) {
        jobs.push(
          measureImage(root, src).then((size) => {
            if (!size) return;
            node.properties.width = size.width;
            node.properties.height = size.height;
          })
        );
      }
      return;
    }

    if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return;

    if (node.name === 'MediaFigure') {
      const src = literalAttribute(node, 'src');
      requireFile(src, node);
      if (isLocal(src) && !hasAttribute(node, 'aspectRatio')) {
        jobs.push(
          measureImage(root, src).then((size) => {
            if (!size) return;
            setAttribute(node, 'aspectRatio', `${size.width} / ${size.height}`);
            setAttribute(node, 'width', size.width);
            setAttribute(node, 'height', size.height);
          })
        );
      }
    }

    if (node.name === 'GameplayVideo') {
      const src = literalAttribute(node, 'src');
      const poster = literalAttribute(node, 'poster');
      requireFile(src, node);
      requireFile(poster, node);
      // The poster is the frame the clip opens on, so it gives the clip's shape.
      if (isLocal(poster) && !hasAttribute(node, 'aspectRatio')) {
        jobs.push(
          measureImage(root, poster).then((size) => {
            if (size) setAttribute(node, 'aspectRatio', `${size.width} / ${size.height}`);
          })
        );
      }
    }
  });

  await Promise.all(jobs);
};
