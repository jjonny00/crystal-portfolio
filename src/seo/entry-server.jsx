// src/seo/entry-server.jsx
//
// Build-time renderer for scripts/prerender.mjs (built with `vite build --ssr`).
// Produces each route's readable body, the part a crawler or a link preview can
// read without running the 3D app:
//
//   a case study    the real case study, rendered through the same overlay and
//                   components the app uses, so it is the page itself on first
//                   paint and the app takes it over without a visible change
//   anything else   the page's copy as plain semantic HTML: name, role, intro,
//                   every project linking to its own URL, and About. Hidden
//                   from sighted readers (the loader and then the scene are what
//                   they see) but present for screen readers, crawlers, and
//                   anyone without JavaScript.

import React from 'react';
import { renderToString } from 'react-dom/server';
import projects from '../data/projects';
import {
  ABOUT_PARAGRAPHS,
  ABOUT_STATS,
  ABOUT_TITLE,
  HERO_BODY_COPY,
  HERO_HEADLINE_LINES,
  HERO_ROLE_LINES,
} from '../data/siteCopy';
import CaseStudyOverlay, { preloadCaseStudy } from '../caseStudies/CaseStudyOverlay';
import { foregroundColorForTone, normalizeCaseStudyColors } from '../caseStudies/system/caseStudyTheme';
import Navigation from '../components/ui/Navigation';
import SceneStandIn from '../components/ui/SceneStandIn';
import { NAVIGATION_DESTINATIONS } from '../navigation/navigationIntent';
import { getPrerenderRoutes, getProjectBySlug, projectPath } from '../navigation/routes';
import { getRouteMeta, renderHeadTagsHtml } from './seoMeta';
import { PERSON, SITE_URL } from './site';

export { SITE_URL, getPrerenderRoutes, getRouteMeta, renderHeadTagsHtml };

const noop = () => {};

const sentenceCase = (lines) => lines.join(' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const ProjectSummary = ({ project, headingLevel: Heading = 'h2' }) => (
  <article>
    <Heading>
      <a href={projectPath(project.facetKey || project.id)}>{project.label}</a>
    </Heading>
    <p>{project.subtitle}</p>
    <p>{project.description}</p>
    {project.metrics && <p>{project.metrics}</p>}
    {project.roles && <p>{project.roles}</p>}
  </article>
);

const AboutContent = ({ headingLevel: Heading = 'h2' }) => (
  // No id="about": the live page owns that one, and both are in the DOM for a
  // moment while the app takes over.
  <section aria-labelledby="prerender-about">
    <Heading id="prerender-about">{ABOUT_TITLE}</Heading>
    {ABOUT_PARAGRAPHS.map((paragraph) => (
      <p key={paragraph.slice(0, 24)}>{paragraph}</p>
    ))}
    <ul>
      {ABOUT_STATS.map((stat) => (
        <li key={stat.value}>
          {stat.value}: {stat.label}
        </li>
      ))}
    </ul>
  </section>
);

// Mirrors the live page's outline: the hero headline is the only h1, projects
// and About are h2.
const HomeContent = () => (
  <main>
    <h1>
      {PERSON.name}: {sentenceCase(HERO_HEADLINE_LINES)}
    </h1>
    <p>{HERO_ROLE_LINES.join(', ')}</p>
    <p>{HERO_BODY_COPY}</p>
    <section aria-label="Work">
      {projects.map((project) => (
        <ProjectSummary key={project.id} project={project} />
      ))}
    </section>
    <AboutContent />
  </main>
);

// A project without a case study: its own summary leads, then the rest of the
// work so the page is never a dead end.
const ProjectContent = ({ project }) => (
  <main>
    <article>
      <h1>{project.label}</h1>
      <p>{project.subtitle}</p>
      <p>{project.description}</p>
      {project.metrics && <p>{project.metrics}</p>}
      {project.roles && <p>{project.roles}</p>}
    </article>
    <section aria-label="More work">
      {projects
        .filter((other) => other.id !== project.id)
        .map((other) => (
          <ProjectSummary key={other.id} project={other} />
        ))}
    </section>
    <p>
      <a href="/">{PERSON.name}, {PERSON.jobTitle}</a>
    </p>
  </main>
);

/**
 * @param {object|null} route  a getPrerenderRoutes() entry, or null for the 404.
 * @returns {Promise<{ html: string, visible: boolean, caseStudySlug: string|null }>}
 *   `visible` says whether the body is shown on first paint (a case study) or
 *   kept for screen readers and crawlers only.
 */
export async function renderRoute(route) {
  if (route?.destination === NAVIGATION_DESTINATIONS.CASE_STUDY) {
    const project = getProjectBySlug(route.slug);
    const caseStudySlug = project.caseStudySlug;
    await preloadCaseStudy(caseStudySlug);
    const colors = normalizeCaseStudyColors(project.caseStudyColors);
    // The hero is tone "a", which is what the nav sits on at the top of the page.
    const navColor = foregroundColorForTone('a', colors);

    const html = renderToString(
      <>
        <Navigation color={navColor} onHomeClick={noop} onWorkClick={noop} onAboutClick={noop} onContactClick={noop} />
        <SceneStandIn projectId={project.facetKey || project.id} />
        <CaseStudyOverlay project={project} open initiallyOpen onClose={noop} />
      </>
    );
    return { html, visible: true, caseStudySlug };
  }

  if (route?.destination === NAVIGATION_DESTINATIONS.PROJECT) {
    const project = getProjectBySlug(route.slug);
    return {
      html: renderToString(<ProjectContent project={project} />),
      visible: false,
      caseStudySlug: null,
    };
  }

  if (!route) {
    return {
      html: renderToString(
        <main>
          <h1>Page not found</h1>
          <p>
            There is nothing at this address. <a href="/">Go to {PERSON.name}&rsquo;s portfolio</a>.
          </p>
        </main>
      ),
      visible: true,
      caseStudySlug: null,
    };
  }

  return { html: renderToString(<HomeContent />), visible: false, caseStudySlug: null };
}
