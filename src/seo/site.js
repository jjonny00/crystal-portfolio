// src/seo/site.js
//
// Who the site is and where it lives. Read by seoMeta.js for canonical URLs,
// share cards and structured data, and by the prerender for the sitemap.

/** Production origin, no trailing slash. Every canonical URL is built on it. */
export const SITE_URL = 'https://jjonnyshaw.com';

export const SITE_NAME = 'Jon Shaw';

export const PERSON = {
  name: 'Jon Shaw',
  jobTitle: 'Principal Product Designer',
  description: 'Principal product designer working in systems and interaction, across products and games.',
  // Profile URLs (LinkedIn, GitHub, ...). They become schema.org `sameAs`, which
  // is how a search engine ties this site to the same person elsewhere.
  sameAs: [],
};

/**
 * Where CONTACT in the nav goes. Null keeps CONTACT as a plain inert button;
 * an address turns it into a mailto: link.
 */
export const CONTACT_EMAIL = null;

/** Share card for routes without one of their own. 1200×630. */
export const DEFAULT_SHARE_IMAGE = '/og/home.jpg';

export const THEME_COLOR = '#050505';

export const absoluteUrl = (path = '/') => `${SITE_URL}${path === '/' ? '/' : path}`;
