// src/caseStudies/ge-experience-centers/geExperienceCentersContent.js
//
// GE Experience Centers' copy and media descriptors. Structured where structure
// helps (metadata, outcomes, media, callouts) and left as prose arrays
// everywhere else — the page itself is composed in
// GeExperienceCentersCaseStudy.jsx, not described here.
//
// Copy is the finishing pass (November 2026): the hero, then straight to
// proximity, the selector, and the regional platform story as the ending. No
// floor plan, walk path, third trigger state or simulated partner welcome:
// they would add specificity the evidence can't establish.
//
// `**bold**` is supported inline. Media entries without a `src` render the
// system placeholder at the correct size; supplying `src`/`fullSrc` later is the
// only change needed to drop the real asset in.
import heroImage from './assets/hero.webp';
import proximityWall from './assets/proximity-wall.webp';
import selectorFull from './assets/selector-full.webp';
import selectorWide from './assets/selector-wide.webp';
import selectorNarrow from './assets/selector-narrow.webp';
import displayContentWall from './assets/display-content-wall.webp';
import displayAmbient from './assets/display-ambient.webp';

export const geExperienceCentersContent = {
  projectName: 'GE EXPERIENCE CENTERS',
  title: 'Let the Space Follow the Visit',

  hero: {
    intro: [
      'Visitors could read a display from across the room, walk toward a subject to reveal more, then follow their host into a working session. I led Forest Giant’s contribution across Dubai, Shanghai, and Austin, guiding one of our largest teams as the first installation became a platform all three centers could improve.',
    ],
    media: {
      src: heroImage,
      alt: 'Two people in the Shanghai center’s immersion area, one pointing at a curved wall-sized display showing the city skyline beside panels of content, with a large GE monogram lit on the wall to the left.',
    },
    metadata: [
      { label: 'Role', values: ['Project Lead', 'Creative Direction'] },
      {
        label: 'Collaboration',
        values: ['Design and Development Leads', 'GE Stakeholders', 'Regional Leads'],
      },
      { label: 'Platform', values: ['Ascend Global Platform'] },
      { label: 'Locations', values: ['Dubai', 'Shanghai', 'Austin'] },
    ],
  },

  approach: {
    title: 'Walking Closer Reveals the Detail',
    intro: [
      'The wall needed to work for a group at a distance and for one person curious about a particular topic. We designed the typography to read across the room. As someone approached a content block, it expanded while the neighboring topics stayed visible.',
      'We considered laser sensing, but its narrow detection area would have required visitors to stand in a particular spot. Sonar gave us broader coverage. Someone could walk naturally toward what interested them.',
    ],
    // Rendered by MediaRail: the Dubai wall with its expanded block marked,
    // then the interaction as two diagram states, each readable on its own.
    // The diagram is retrospective — drawn for this case study, not a project
    // artifact — and deliberately abstract: no sensor count, spacing, angle, or
    // distance is implied. One caption for the group.
    wall: {
      key: 'proximity-wall',
      src: proximityWall,
      alt: 'A visitor standing before the Dubai interactive wall, a curved bank of displays with a row of content blocks across its middle. One block, nearest the visitor, is marked: “Expanded block. Approaching one topic reveals more detail. The surrounding topics stay in view.”',
      aspectRatio: '1310 / 652',
    },
    states: [
      {
        key: 'readable',
        state: 'readable',
        number: '1',
        title: 'Read from a distance',
        description:
          'Diagram, state one of two: a visitor stands back from the wall, outside the sensors’ detection zone, and every content block is the same size, readable from where they are.',
        callouts: [],
        zoneLabel: 'Detection zone',
      },
      {
        key: 'approach',
        state: 'approach',
        number: '2',
        title: 'Approach a block',
        description:
          'Diagram, state two of two: the visitor has walked into the detection zone in front of one block, and more content has appeared in that block.',
        callouts: [{ key: 'expanded', label: 'More content appears' }],
      },
    ],
    caption:
      'Approaching a topic expands its content on the wall. Diagrams: retrospective, not to scale.',
  },

  hosts: {
    title: 'Give Hosts Control of the Space',
    intro: [
      'I proposed making experiences switchable between stations. From a tablet, a host could choose what a display showed and move from ambient content into education or collaboration as the conversation changed.',
      'For a partner welcome, staff prepared the material ahead of time. One button then changed the lobby’s branding, content, interface colors, and lighting.',
    ],
    // Rendered by ExperienceSelectorStage: the selector, then one display in
    // two of its experiences.
    selector: {
      // What the enlarged view opens: the whole screen, as shipped.
      full: {
        src: selectorFull,
        alt: 'The AscendGP Experience Selector on a tablet: seven areas of the center, each paired with the experience it is showing — Immersion Wall with Interactive Visualization, Lobby with Education, Small Room A with Collaboration, Breakout with Education, Reception with Welcome, Large Room A with Collaboration, and Large Room B with Concept Visualization. The header carries the visiting partner’s logo.',
      },
      // Two crops of the same screen, one per breakpoint: both columns of
      // areas at desktop, the left column alone on phones, where the full
      // width would shrink the labels past reading. Callout x/y are the point
      // being labelled, as a share of that crop — the bottom edge of the
      // Breakout row, under its area name and under its experience. The chip
      // hangs below, in the empty screen under the last row.
      crops: [
        {
          key: 'wide',
          src: selectorWide,
          aspectRatio: '2332 / 1250',
          callouts: [
            { key: 'area', label: 'Area', x: '16.7%', y: '82.2%' },
            { key: 'experience', label: 'Selected experience', x: '38.2%', y: '82.2%' },
          ],
        },
        {
          key: 'narrow',
          src: selectorNarrow,
          aspectRatio: '1140 / 1250',
          callouts: [
            { key: 'area', label: 'Area', x: '30.7%', y: '82.2%' },
            { key: 'experience', label: 'Selected experience', x: '74.6%', y: '82.2%' },
          ],
        },
      ],
    },
    // Two views of one area — the Shanghai immersion area — showing what it
    // could offer, not a recorded transition from a live visit.
    states: [
      {
        key: 'content-wall',
        label: 'Content wall',
        src: displayContentWall,
        alt: 'Content wall: the Shanghai immersion area’s curved display showing the city skyline beside panels of content, as two visitors stand in front of it.',
        aspectRatio: '3 / 2',
      },
      {
        key: 'ambient',
        label: 'Ambient display',
        src: displayAmbient,
        alt: 'Ambient display: the same curved display filled with an animated brand treatment of bright diagonal bands and a network of light, with the GE monogram on the wall beside it.',
        aspectRatio: '3 / 2',
      },
    ],
    caption:
      'The Experience Selector, and two experiences the Shanghai immersion area could offer.',
  },

  // The ending: the regional platform story and the observed host behavior,
  // with no outcome rail or separate leadership summary.
  conclusion: {
    lessonsTitle: 'Let Each Location Improve the Others',
    lessons: [
      'After Dubai proved the concept, GE approved two more centers. I worked with the lead for each region to accommodate different layouts, display sizes, and ideas. A request in one center could become a capability the other two could use.',
      'We saw guides and engineers grow more comfortable changing a space mid-conversation. That’s the outcome I’d point to: the person leading the visit could decide what the room did next.',
    ],
  },
};

export default geExperienceCentersContent;
