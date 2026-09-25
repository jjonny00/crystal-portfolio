// src/caseStudies/ge-experience-centers/geExperienceCentersContent.js
//
// GE Experience Centers' copy and media descriptors. Structured where structure
// helps (metadata, outcomes, media, callouts) and left as prose arrays
// everywhere else — the page itself is composed in
// GeExperienceCentersCaseStudy.jsx, not described here.
//
// `**bold**` is supported inline. Media entries without a `src` render the
// system placeholder at the correct size; supplying `src`/`fullSrc` later is the
// only change needed to drop the real asset in.
import heroImage from './assets/hero.webp';
import dubaiLobby from './assets/dubai-lobby.webp';
import shanghaiDataLab from './assets/shanghai-data-lab.webp';
import selectorFull from './assets/selector-full.webp';
import selectorWide from './assets/selector-wide.webp';
import selectorNarrow from './assets/selector-narrow.webp';
import displayContentWall from './assets/display-content-wall.webp';
import displayAmbient from './assets/display-ambient.webp';
import dubaiInteractiveWall from './assets/dubai-interactive-wall.webp';
import austinInstallation from './assets/austin-installation.webp';

export const geExperienceCentersContent = {
  projectName: 'GE EXPERIENCE CENTERS',
  title: 'A Space That Follows the Conversation',

  hero: {
    intro: [
      'I led the creative direction of GE’s collaboration centers, helping turn the first installation into a shared platform. Guides could change what a space offered as a visit moved from welcoming partners to exploring ideas and solving problems together.',
    ],
    media: {
      src: heroImage,
      alt: 'Two people in the Shanghai center’s immersion area, one pointing at a curved wall-sized display showing the city skyline beside panels of content, with a large GE monogram lit on the wall to the left.',
    },
  },

  overview: {
    title: 'A Place to Welcome Partners and Work Together',
    body: [
      'GE wanted to demonstrate its commitment to regional partners through dedicated spaces where they could celebrate achievements, explore technology, and work directly with GE engineers.',
      'The centers needed to support both hospitality and serious analysis. In Dubai, for example, heat and sand created particular challenges for engine wear. Large shared displays brought engine imagery and operating data into the discussion, giving groups a way to examine problems together instead of gathering around a laptop.',
      'As Forest Giant’s Project Lead, I shaped the creative vision through workshops with GE stakeholders and our team. I coordinated with the regional leads and worked alongside our design and development leads, providing creative direction throughout the project.',
    ],
    // Rendered as a 2-up in the overview's media slot. Both at 3:2 so the pair
    // sits level: the data lab is 3:2 as shot, the lobby is cropped to it from
    // 4:3 (see assets/README.md).
    gallery: [
      {
        key: 'dubai-lobby',
        src: dubaiLobby,
        alt: 'The Dubai center’s lobby: a white reception desk under bands of blue light, and a large display beside it showing a welcome message in Arabic and English over a jet engine.',
        aspectRatio: '3 / 2',
      },
      {
        key: 'shanghai-data-lab',
        src: shanghaiDataLab,
        alt: 'The Shanghai data lab: a wide display of flight routes, operating-data charts, and engine imagery above a table-sized touchscreen, with a person working at a laptop beside it.',
        aspectRatio: '3 / 2',
      },
    ],
    caption:
      'The centers brought personalized welcomes and shared analysis into the same visit. Dubai lobby and Shanghai data lab.',
    metadata: [
      { label: 'Role', values: ['Project Lead', 'Creative Direction'] },
      {
        label: 'Collaborators',
        values: ['Design Lead', 'Development Lead', 'GE stakeholders and regional leads'],
      },
      {
        label: 'Experience',
        values: ['Physical centers', 'Tablet controls', 'Interactive displays'],
      },
      { label: 'Platform', values: ['Ascend Global Platform'] },
      { label: 'Locations', values: ['Dubai', 'Shanghai', 'Austin'] },
    ],
  },

  conversation: {
    title: 'Let the Conversation Shape the Space',
    intro: [
      'A guide could welcome a visiting partner with a single button. The lobby’s logos, interface colors, content, and lighting transitioned from GE’s identity to the partner’s. A content management system let staff add partner branding and accomplishments for future visits.',
      'After Dubai proved the concept, GE approved two more centers. I proposed making experiences switchable between stations, so an area’s purpose could change during a visit.',
      'That idea became the AscendGP Experience Selector. From a dedicated tablet, guides could choose an experience for a display, moving between ambient animation, educational content, and collaboration as the conversation required.',
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
    // Two views of one area — the Shanghai immersion area — not a documented
    // before-and-after from a live visit. State names are provisional.
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
      'The Experience Selector let guides choose what an area offered as the needs of a visit changed.',
    closing: [
      'Sensitive experiences remained inside areas with keycard access. The platform gave hosts more freedom to use the space while preserving the boundaries around real partner data.',
    ],
  },

  approach: {
    title: 'Let People Approach Naturally',
    intro: [
      'The large displays were bright, with content meant to be seen from a distance. Requiring visitors to walk up and touch them would work against that viewing experience.',
      'Our team explored sensors that could respond as people approached. We initially considered a laser, but its pinpoint detection area was too narrow. Sonar sensors provided a controlled cone of coverage. Arranged horizontally, they let us detect distance while covering the gaps between sensors.',
      'We developed the interaction and typography together. Content blocks sat across the vertical center of the display, with text sized to be readable as a visitor entered the detection area. Approaching a block expanded it to reveal more content.',
    ],
    // Rendered by MediaRail: the Dubai wall, then the interaction as two
    // diagram states, each readable on its own. The diagram is retrospective —
    // drawn for this case study, not a project artifact — and deliberately
    // abstract: no sensor count, spacing, angle, or distance is implied.
    wall: {
      key: 'dubai-wall',
      src: dubaiInteractiveWall,
      alt: 'A visitor standing before the Dubai interactive wall, a curved bank of displays showing a row of content blocks — Taking People Further, Heart of Aviation, Welcome — across its middle.',
      aspectRatio: '4 / 3',
    },
    states: [
      {
        key: 'readable',
        state: 'readable',
        number: '1',
        title: 'Readable content',
        description:
          'Diagram, state one of two: a visitor stands back from the wall, outside the sensors’ detection zone, and every content block is the same size, readable from where they are.',
        callouts: [{ key: 'readable', label: 'Readable before approach' }],
        zoneLabel: 'Detection zone',
      },
      {
        key: 'approach',
        state: 'approach',
        number: '2',
        title: 'Approach to reveal more',
        description:
          'Diagram, state two of two: the visitor has walked into the detection zone in front of one block, and that block has expanded to show more content.',
        callouts: [
          { key: 'expanded', label: 'Expanded content' },
          { key: 'distance', label: 'Distance triggers expansion' },
        ],
      },
    ],
    note: 'Approach interaction, retrospective diagram; not to scale.',
    caption:
      'Content was sized to read at the interaction distance. Moving closer expanded a block to reveal more.',
    closing: [
      'The same sensing approach supported ambient animations that responded as people passed. Visitors could affect the display while moving through the space, then approach to explore a partner’s accomplishments in more detail.',
    ],
  },

  expansion: {
    title: 'Build Each Center into the Next',
    body: [
      'Expansion gave us the opportunity to evolve the first installation into Ascend Global Platform. Experiences adapted to different display sizes, and the selector made them available across stations within the space’s access boundaries.',
      'Dubai, Shanghai, and Austin each had their own regional needs, physical layouts, and character. I worked with the lead responsible for each center to guide our contribution through those differences.',
      'As each center came online, refinements became part of the shared platform. Improvements developed for a new location could benefit the centers already operating.',
    ],
    media: {
      src: austinInstallation,
      alt: 'The Austin center during installation: a wide display mounted on a bare wall shows “Welcome to the GE Austin Collaboration Center,” while someone kneels beneath its far end and the floor is still covered in protective plastic.',
      aspectRatio: '4 / 3',
      caption:
        'Austin brought another physical layout into the shared platform, while refinements continued to benefit the existing centers.',
    },
  },

  conclusion: {
    outcomes: [
      { value: 'Three centers', detail: 'Deployed in Dubai, Shanghai, and Austin' },
      { value: 'Shared platform', detail: 'Improvements carried across locations' },
      { value: 'Adaptable spaces', detail: 'Guides could select experiences to suit the session' },
    ],
    lessonsTitle: 'Give Hosts Room to Respond',
    lessons: [
      'We delivered a shared platform across three centers, with tools for personalized welcomes, interactive exploration, and working sessions around partner data.',
      'As the platform evolved, we saw guides and engineers become more comfortable changing the purpose of a space around conversations that developed naturally. The Experience Selector gave them a practical way to respond in the moment.',
      'The work reinforced the value of deciding what should remain fixed and what people should be able to change. Sensitive data needed a clear boundary. The experience offered within an area needed room to adapt.',
    ],
    takeaway:
      'My most consequential contribution was proposing that flexibility, then guiding the team as it became part of the product.',
  },
};

export default geExperienceCentersContent;
