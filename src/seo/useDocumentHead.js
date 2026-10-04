// src/seo/useDocumentHead.js
//
// Keeps <head> in step with the route the reader is on, so a tab, a bookmark, a
// share sheet or a crawler that runs JavaScript sees the same title, description
// and canonical the prerendered file for that URL ships with.

import { useEffect } from 'react';
import { getHeadTags, getRouteMeta } from './seoMeta';

const applyHeadTags = (meta) => {
  const head = document.head;
  head.querySelectorAll('[data-seo]').forEach((node) => node.remove());

  getHeadTags(meta).forEach(({ tag, attrs, text, json }) => {
    if (tag === 'title') {
      document.title = text;
      return;
    }
    const node = document.createElement(tag);
    node.setAttribute('data-seo', '');
    if (tag === 'script') {
      node.type = 'application/ld+json';
      node.textContent = JSON.stringify(json);
    } else {
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    }
    head.appendChild(node);
  });
};

/** @param {object|null} route  parsePath() output; undefined skips the update. */
export const useDocumentHead = (route) => {
  const key = route === undefined ? undefined : route?.path ?? '404';
  useEffect(() => {
    if (key === undefined) return;
    applyHeadTags(getRouteMeta(route));
    // The route object is rebuilt on every parse; its path is its identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
};

export default useDocumentHead;
