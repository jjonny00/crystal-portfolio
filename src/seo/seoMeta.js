// src/seo/seoMeta.js
//
// The <head> a route should have: title, description, canonical, robots, share
// card and structured data. Pure, so the build-time prerender and the client
// (useDocumentHead, on every route change) produce the same tags.

import { getProjectBySlug } from '../navigation/routes';
import { NAVIGATION_DESTINATIONS } from '../navigation/navigationIntent';
import {
  DEFAULT_SHARE_IMAGE,
  PERSON,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from './site';

const TITLE_SUFFIX = ` | ${SITE_NAME}`;

const HOME_TITLE = `${SITE_NAME} | Principal Product Designer, Systems and Interaction`;
const HOME_DESCRIPTION =
  'Jon Shaw, principal product designer. I design the systems beneath products and games: the rules, feedback, and tradeoffs that make interaction worth mastering.';

const ABOUT_TITLE = `About${TITLE_SUFFIX}`;
const ABOUT_DESCRIPTION =
  'Twenty years designing interactive systems, fifteen of them co-founding and growing Forest Giant into a 30+ person multidisciplinary studio.';

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const personNode = () => ({
  '@type': 'Person',
  '@id': PERSON_ID,
  name: PERSON.name,
  jobTitle: PERSON.jobTitle,
  description: PERSON.description,
  url: absoluteUrl('/'),
  ...(PERSON.sameAs.length ? { sameAs: PERSON.sameAs } : null),
});

const websiteNode = () => ({
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: SITE_NAME,
  url: absoluteUrl('/'),
  author: { '@id': PERSON_ID },
});

const graph = (...nodes) => ({ '@context': 'https://schema.org', '@graph': nodes });

/**
 * @param {object|null} route  parsePath() output. Null is the 404 page.
 */
export const getRouteMeta = (route) => {
  const destination = route?.destination ?? null;

  if (!route) {
    return {
      title: `Page not found${TITLE_SUFFIX}`,
      description: HOME_DESCRIPTION,
      canonical: null,
      robots: 'noindex',
      image: absoluteUrl(DEFAULT_SHARE_IMAGE),
      imageAlt: SITE_NAME,
      type: 'website',
      jsonLd: null,
    };
  }

  if (
    destination === NAVIGATION_DESTINATIONS.PROJECT ||
    destination === NAVIGATION_DESTINATIONS.CASE_STUDY
  ) {
    const project = getProjectBySlug(route.slug);
    const url = absoluteUrl(route.path);
    const name = project?.label || project?.title || SITE_NAME;
    const headline = project?.seo?.title || name;
    const description = project?.seo?.description || project?.description || HOME_DESCRIPTION;
    const image = absoluteUrl(project?.seo?.image || DEFAULT_SHARE_IMAGE);

    return {
      title: `${headline}${TITLE_SUFFIX}`,
      description,
      canonical: url,
      robots: 'index, follow',
      image,
      imageAlt: `${name}: ${project?.subtitle || 'project'}`,
      type: 'article',
      jsonLd: graph(
        personNode(),
        websiteNode(),
        {
          '@type': 'CreativeWork',
          '@id': `${url}#work`,
          name,
          headline,
          description,
          url,
          image,
          ...(project?.subtitle ? { genre: project.subtitle } : null),
          author: { '@id': PERSON_ID },
          creator: { '@id': PERSON_ID },
          isPartOf: { '@id': WEBSITE_ID },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: SITE_NAME, item: absoluteUrl('/') },
            { '@type': 'ListItem', position: 2, name, item: url },
          ],
        }
      ),
    };
  }

  // /about and /work are scroll positions on the home page, not pages of their
  // own: the same content, so they point their canonical at / rather than
  // competing with it as near-duplicates. (Canonical alone; pairing it with
  // noindex sends search engines two conflicting signals.) They keep their own title and
  // description for a tab or a shared link.
  if (destination === NAVIGATION_DESTINATIONS.ABOUT) {
    return {
      title: ABOUT_TITLE,
      description: ABOUT_DESCRIPTION,
      canonical: absoluteUrl('/'),
      robots: 'index, follow',
      image: absoluteUrl(DEFAULT_SHARE_IMAGE),
      imageAlt: SITE_NAME,
      type: 'profile',
      jsonLd: graph(personNode(), websiteNode()),
    };
  }

  return {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    canonical: absoluteUrl('/'),
    robots: 'index, follow',
    image: absoluteUrl(DEFAULT_SHARE_IMAGE),
    imageAlt: SITE_NAME,
    type: 'website',
    jsonLd: graph(personNode(), websiteNode()),
  };
};

const escapeAttr = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// `</script>` inside the JSON would close the tag early.
const safeJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

/**
 * The flat list of tags a route's head carries. Each entry is
 * `{ tag, attrs }` or `{ tag: 'title', text }` / `{ tag: 'script', json }`.
 * Both the prerender (as HTML) and the client (as DOM) consume this.
 */
export const getHeadTags = (meta) => {
  const tags = [
    { tag: 'title', text: meta.title },
    { tag: 'meta', attrs: { name: 'description', content: meta.description } },
    { tag: 'meta', attrs: { name: 'robots', content: meta.robots } },
  ];
  if (meta.canonical) {
    tags.push({ tag: 'link', attrs: { rel: 'canonical', href: meta.canonical } });
  }
  tags.push(
    { tag: 'meta', attrs: { property: 'og:site_name', content: SITE_NAME } },
    { tag: 'meta', attrs: { property: 'og:type', content: meta.type } },
    { tag: 'meta', attrs: { property: 'og:title', content: meta.title } },
    { tag: 'meta', attrs: { property: 'og:description', content: meta.description } },
    { tag: 'meta', attrs: { property: 'og:image', content: meta.image } },
    { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
    { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
    { tag: 'meta', attrs: { property: 'og:image:alt', content: meta.imageAlt } },
    { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
    { tag: 'meta', attrs: { name: 'twitter:title', content: meta.title } },
    { tag: 'meta', attrs: { name: 'twitter:description', content: meta.description } },
    { tag: 'meta', attrs: { name: 'twitter:image', content: meta.image } }
  );
  if (meta.canonical) {
    tags.push({ tag: 'meta', attrs: { property: 'og:url', content: meta.canonical } });
  }
  if (meta.jsonLd) {
    tags.push({ tag: 'script', json: meta.jsonLd });
  }
  return tags;
};

/** The head tags as HTML, for the prerender. Marked so the client can find them. */
export const renderHeadTagsHtml = (meta) =>
  getHeadTags(meta)
    .map(({ tag, attrs, text, json }) => {
      if (tag === 'title') return `<title>${escapeAttr(text)}</title>`;
      if (tag === 'script') {
        return `<script type="application/ld+json" data-seo>${safeJson(json)}</script>`;
      }
      const attrString = Object.entries(attrs)
        .map(([key, value]) => `${key}="${escapeAttr(value)}"`)
        .join(' ');
      return `<${tag} ${attrString} data-seo />`;
    })
    .join('\n    ');
