// src/caseStudies/flying-axes/flyingAxesContent.js
//
// Flying Axes' copy and media descriptors. Structured where structure helps
// (metadata, outcomes, media) and left as prose arrays everywhere else — the
// page itself is composed in FlyingAxesCaseStudy.jsx, not described here.
//
// Copy is the finishing pass (November 2026). "About a year in" is Jon's
// approximate timeline, not a dated record.
//
// `**bold**` is supported inline. Two diagrams are drawn live from the data
// here: `freeform.formats` by GameModesComparison.jsx and `venues.system` by
// VenueSystem.jsx.
import venueLanes from './assets/venue-lanes.webp';
import scoreboard from './assets/scoreboard.webp';
import coachTablet from './assets/coach-tablet.webp';
import scorecard from './assets/scorecard.webp';
import bookletTwentyOne from './assets/booklet-twenty-one.webp';
import buildDisplayTest from './assets/build-display-test.webp';
import scoreboardHardware from './assets/scoreboard-hardware.webp';
import buildInstall from './assets/build-install.webp';

export const flyingAxesContent = {
  projectName: 'FLYING AXES',
  title: 'Let Coaches Shape the Game',

  hero: {
    intro: [
      'A Flying Axes coach taught people to throw, helped beginners find their footing, and kept a whole group involved between turns. I led the design of the venue experience, the scoreboard, and the controls coaches used to run a game. About a year in, coaches were inventing their own games, so we added a freeform mode to support them.',
    ],
    // The cage, uncropped: a group at the table behind the throwing line, a
    // coach among them, the scoreboard above the lanes.
    media: {
      src: venueLanes,
      alt: 'A group at the table behind a throwing cage, a coach in a red Coach hoodie among them, as a player celebrates a throw beneath the lit scoreboard between the two lanes.',
      aspectRatio: '3 / 2',
      caption: 'Players and spectators can follow the same scoreboard from behind the throwing line.',
    },
    metadata: [
      {
        label: 'Role',
        values: [
          'Chief Creative Officer',
          'Customer Experience',
          'Product Design',
          'Creative Direction',
        ],
      },
      {
        label: 'Collaborators',
        values: [
          'CEO',
          'CTO',
          'CMO',
          'UX Researcher',
          'UI/UX Designer',
          'Developers',
          'Scoreboard carpenter',
        ],
      },
      { label: 'Foundation', values: ['Decentralized edge platform developed at Forest Giant'] },
      { label: 'Locations', values: ['Louisville', 'Covington', 'Nashville'] },
    ],
  },

  // One section for what the journey, the scoreboard and quick entry each
  // showed before: the annotated scoreboard straight after the copy about
  // sightlines, then score entry and the scorecard.
  coach: {
    title: 'Keep the Coach’s Attention on the Group',
    intro: [
      'We built a prototype cage before opening the first venue. The scoreboard had to be readable from behind the throwing line, stay clear of the axes, and leave the target visible. We narrowed it to the active player, lane, throw count, and score. The coach could enter a score on the tablet and get their eyes back on the thrower. At the end of the session, the group took home a printed scorecard.',
    ],
    // Rendered by ScoreboardCallouts. The image is cropped to 3:2 around the
    // board so it sits level with the photos beside it. Callout x/y are the
    // point being labelled, as a share of that crop (943×629) — `side` is
    // which edge the label runs out to. Ordered top to bottom, because narrow
    // layouts number them. The pictured state shows P1/P2 rather than player
    // names, hence "Player identifier".
    scoreboard: {
      media: {
        src: scoreboard,
        alt: 'The shipped Flying Axes scoreboard: a narrow dark housing with an LED panel showing P1 with a lane arrow and a score of 5, a row of throw indicators, and P2 with a score of 3. Callouts mark the player identifier, the lane, the score, and the throw count.',
        aspectRatio: '943 / 629',
      },
      callouts: [
        { key: 'player', label: 'Player identifier', side: 'left', x: '47.9%', y: '11.9%' },
        { key: 'lane', label: 'Lane', side: 'right', x: '57.6%', y: '12.1%' },
        { key: 'score', label: 'Score', side: 'left', x: '46.7%', y: '23.8%' },
        { key: 'throws', label: 'Throw count', side: 'right', x: '58%', y: '39%' },
      ],
    },
    gallery: [
      {
        key: 'coach-tablet',
        src: coachTablet,
        alt: 'A coach in a Flying Axes hoodie tapping a score into the coach app on a small tablet, with a thrower waiting in the lane behind.',
        aspectRatio: '3 / 2',
        caption: 'A score entered on the coach’s tablet',
      },
      {
        key: 'scorecard',
        src: scorecard,
        alt: 'A printed Flying Axes scorecard beside an axe, listing six players with their total score, bullseye hits, scoring streak, accuracy average, and win–loss record.',
        aspectRatio: '3 / 2',
        caption: 'The scorecard the group took home',
      },
    ],
    caption: 'What the group saw, what the coach entered, and what the group took home.',
  },

  freeform: {
    title: 'Coaches Invented Games. We Changed the App.',
    intro: [
      'Our original app expected the official five-throw format. Coaches were finding ways to keep groups playing when that format didn’t suit them. In Twenty-One, for example, the first player or team to reach 21 points wins the round, however many throws it takes.',
      'We interviewed the coaches and gave them three controls in freeform: enter custom scores, keep playing beyond five throws, and declare a winner. League nights kept the official game. A booklet at each cage let another coach pick up a variation and try it with their next group.',
    ],
    // Drawn by GameModesComparison: the two formats as steps, side by side,
    // stacked on narrow screens. Then the original Twenty-One rules card.
    formats: {
      label: 'Who decides when play ends?',
      modes: [
        {
          key: 'official',
          title: 'Official game',
          steps: [
            'Enter a throw score.',
            'Repeat through five throws.',
            'Official scoring determines the winner.',
          ],
        },
        {
          key: 'freeform',
          title: 'Freeform',
          steps: [
            'Enter a custom score.',
            'Keep playing while the group wants another throw.',
            'The coach declares the winner.',
          ],
        },
      ],
    },
    // Index_Prep_Cards.pdf page 13, rendered flat.
    booklet: {
      src: bookletTwentyOne,
      alt: 'Booklet page, Twenty-One: three rounds per match, the first player or team to reach 21 points wins the round, and players change lanes each round.',
      aspectRatio: '5 / 3',
      caption: 'Twenty-One, from the coaches’ booklet.',
    },
  },

  venues: {
    title: 'Each Venue Could Run Independently',
    intro: [
      'Forest Giant was already developing a decentralized edge platform. We chose it as the venue’s backbone from the beginning, connecting the coach controls, scoreboards, and venue displays.',
      'Louisville, Covington, and Nashville each ran a local system. We could carry a change to the coach app across venues, and staff could swap a failed scoreboard for a backup within minutes. That let us keep improving the game after the cages were built.',
    ],
    // Drawn by VenueSystem: the local functions of one venue, and the shared
    // app update. How each device is wired or talks to the platform isn't
    // documented, so none is drawn.
    system: {
      label: 'How one venue runs a game',
      hub: {
        title: 'Coach tablet → local edge platform',
        body: 'The coach enters scores and controls the game.',
      },
      devices: [
        {
          key: 'scoreboard',
          name: 'Scoreboard',
          text: 'Shows the active thrower, lane, throw count, and score.',
        },
        { key: 'displays', name: 'Venue displays', text: 'Carry information through the venue.' },
        {
          key: 'printer',
          name: 'Scorecard printer',
          text: 'Gives the group a record at the end of the session.',
        },
      ],
      bridge: 'The same coach-app improvement can be deployed to each local system.',
      locations: ['Louisville', 'Covington', 'Nashville'],
    },
    // Rendered by MediaRail under the diagram, in the order the scoreboard
    // was made: tested, wired, installed. Each ratio is the photo's own — the
    // hardware shot is two photographs side by side, and the rail keeps the
    // row level at any mix of shapes. It supports reproducibility and
    // replacement; it does not explain the network.
    steps: [
      {
        key: 'display-test',
        src: buildDisplayTest,
        alt: 'The LED panel propped against a wall during development, cables trailing, showing both players’ scores, the throw indicators, and the round indicator.',
        aspectRatio: '3 / 4',
      },
      {
        key: 'hardware',
        src: scoreboardHardware,
        alt: 'The back of a finished scoreboard with its panel open: wiring and ribbon cables running across the plywood housing, and a close-up of the small controller that drives the display.',
        aspectRatio: '2400 / 1254',
      },
      {
        key: 'install',
        src: buildInstall,
        alt: 'Two of the team installing a scoreboard in a venue: one on a ladder at the top of the cage, the other lifting the open housing up to him.',
        aspectRatio: '3 / 2',
      },
    ],
    caption:
      'The scoreboard was designed to be reproduced across venues and replaced within minutes when a unit failed.',
  },

  conclusion: {
    outcomes: [
      { value: '3 venues', detail: 'Louisville · Covington · Nashville' },
      { value: 'Coaches enjoyed the role more', detail: 'Reported in follow-up interviews' },
      {
        value: 'Recurring league nights',
        detail: 'American Axe Throwing League across multiple seasons',
      },
    ],
    lessonsTitle: 'Design for the Person Running the Game',
    lessons: [
      'My job was to give coaches controls that supported their judgment. They could tell when a beginner needed another throw or a group wanted a different challenge. In follow-up interviews, coaches told us they enjoyed the role more.',
    ],
  },
};

export default flyingAxesContent;
