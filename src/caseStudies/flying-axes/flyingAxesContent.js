// src/caseStudies/flying-axes/flyingAxesContent.js
//
// Flying Axes' copy and media descriptors. Structured where structure helps
// (metadata, outcomes, media) and left as prose arrays everywhere else — the
// page itself is composed in FlyingAxesCaseStudy.jsx, not described here.
//
// `**bold**` is supported inline. Media entries without a `src` render the
// system placeholder at the correct size; supplying `src`/`fullSrc` later is the
// only change needed to drop the real asset in.
import heroImage from './assets/hero.webp';
import venueLanes from './assets/venue-lanes.webp';
import scoreboard from './assets/scoreboard.webp';
import scoreboardInVenue from './assets/scoreboard-in-venue.webp';
import coachTablet from './assets/coach-tablet.webp';
import scorecard from './assets/scorecard.webp';
import sessionMapping from './assets/session-mapping.webp';
import bookletHandicaps from './assets/booklet-handicaps.webp';
import bookletGames from './assets/booklet-games.webp';
import bookletTwentyOne from './assets/booklet-twenty-one.webp';
import buildDisplayTest from './assets/build-display-test.webp';
import scoreboardHardware from './assets/scoreboard-hardware.webp';
import buildInstall from './assets/build-install.webp';

export const flyingAxesContent = {
  projectName: 'FLYING AXES',
  title: 'Making Room for Play',

  hero: {
    intro: [
      'I led the design of an axe-throwing experience that connected custom scoreboards, coach controls, and the physical venue. As coaches discovered new ways to play, we evolved the system to give them more room to create.',
    ],
    media: {
      src: heroImage,
      alt: 'A large group of Flying Axes players and coaches posing in front of the throwing cages, with lit scoreboards mounted above the lanes.',
    },
  },

  overview: {
    title: 'A Venue Designed as One Experience',
    body: [
      'Flying Axes began after my business partner visited an axe-throwing venue in Canada. We saw an opportunity to combine the sport and a bar with the connected-hardware experience we had built at Forest Giant.',
      'The technology needed to feel at home in the venue. Players would follow the competition on custom scoreboards, while coaches managed games from small tablets. The physical space, brand, and digital tools needed to work together.',
      'As Chief Creative Officer, I led the visual direction, product design, and customer experience, alongside responsibility for the brand, website, and marketing. I worked with the CEO, CTO, and CMO on direction, then collaborated with a researcher, UI/UX designer, and developers to develop the experience.',
      'We spent roughly four months building the brand and testing a prototype cage, followed by another three months building the first venue. Flying Axes eventually expanded from Louisville to Covington and Nashville.',
    ],
    // The photo's own 3:2, where the overview's portrait slot would crop away
    // the scoreboard above the lanes and the table behind them.
    media: {
      src: venueLanes,
      alt: 'A group at the table behind a throwing cage, a coach in a red Coach hoodie among them, as a player celebrates a throw beneath the lit scoreboard between the two lanes.',
      aspectRatio: '3 / 2',
      caption:
        'Each cage brought two throwing lanes, a coach, and a group of players into one shared experience.',
    },
    metadata: [
      {
        label: 'Role',
        values: [
          'Chief Creative Officer',
          'Creative Direction',
          'Product Design',
          'Customer Experience',
        ],
      },
      {
        label: 'Team',
        values: [
          'CEO',
          'CTO',
          'CMO',
          'UX Researcher',
          'UI/UX Designer',
          '1–2 Developers',
          'Contract carpenter for scoreboard fabrication',
        ],
      },
      {
        label: 'Experience',
        values: ['Physical venues', 'Connected scoreboards', 'Coach application'],
      },
      {
        label: 'Initial Development',
        values: [
          'Approximately four months of brand development and prototyping, followed by three months of venue buildout',
        ],
      },
      { label: 'Locations', values: ['Louisville', 'Covington', 'Nashville'] },
    ],
  },

  match: {
    title: 'Make the Match Easy to Follow',
    intro: [
      'The prototype cage helped us strip the scoreboard down to what players needed in the moment: their name, which side to throw from, which of five throws they were on, and their current score.',
      "Its physical form mattered just as much. Mounted between the two lanes, it had to sit high enough to stay clear of thrown axes, low enough to read easily, and narrow enough to preserve the thrower's view of the target.",
      'I directed an aesthetic drawn from older gym and sporting-event scoreboards. The bright, simple display was readable nearby and across the venue, while its housing felt like an established part of the sport.',
      'I worked with our UI/UX designer, a developer, and a contracted carpenter to bring the display and housing together. Materials and components also had to be readily sourced so we could reproduce the same design as the business grew.',
    ],
    // Rendered by ScoreboardCallouts. The image is cropped to 3:2 around the
    // board so it pairs level with the venue photo beside it. Callout x/y are
    // the point being labelled, as a share of that crop (943×629) — `side` is
    // which edge the label runs out to. Ordered top to bottom, because narrow
    // layouts number them. The supplied image shows P1/P2 rather than player
    // names, hence "Player identifier".
    scoreboard: {
      media: {
        src: scoreboard,
        alt: 'The shipped Flying Axes scoreboard: a narrow dark housing with an LED panel showing P1 with a lane arrow and a score of 5, a row of throw indicators, a row of round indicators, and P2 with a score of 3. Callouts mark the player identifier, lane arrow, current score, throw indicators, and round indicator.',
        aspectRatio: '943 / 629',
      },
      callouts: [
        { key: 'player', label: 'Player identifier', side: 'left', x: '47.9%', y: '11.9%' },
        { key: 'lane', label: 'Lane arrow', side: 'right', x: '57.6%', y: '12.1%' },
        { key: 'score', label: 'Current score', side: 'left', x: '46.7%', y: '23.8%' },
        { key: 'throws', label: 'Throw indicators', side: 'right', x: '58%', y: '39%' },
        { key: 'rounds', label: 'Round indicator', side: 'left', x: '43%', y: '50.6%' },
      ],
    },
    // Cropped to 3:2 from the top, so the scoreboard mounted above the cages
    // stays in frame. Context only — no dimensions or trajectories drawn on.
    venue: {
      key: 'venue',
      src: scoreboardInVenue,
      alt: 'A session in progress: coaches holding tablets direct players at the throwing line, with a lit scoreboard mounted high between the lanes.',
      aspectRatio: '3 / 2',
    },
    caption:
      'The display made the match readable at a glance. Its narrow form and placement kept the target area open.',
  },

  coach: {
    title: 'Keep the Coach with the Group',
    body: [
      "The coach's attention was central to the experience. They needed to watch technique, maintain safety, and keep the group having fun.",
      'We designed the original app around entering scores and progressing the official game as quickly as possible. Coaches could add players, start games, and control the scoreboard without asking throwers to operate an interface themselves.',
      'At the end of a session, coaches printed a scorecard for players to take home. It gave the visit a tangible conclusion and players a record they could return to beat.',
      'The app supported the official rules efficiently. Over time, however, coaches began creating experiences that those rules did not accommodate.',
    ],
    // Each image keeps its own caption: they make two different points.
    // Full 3:2 frames, so the round history and the printed results stay legible.
    gallery: [
      {
        key: 'coach-tablet',
        src: coachTablet,
        alt: 'A coach in a Flying Axes hoodie tapping a score into the coach app on a small tablet, with a thrower waiting in the lane behind.',
        aspectRatio: '3 / 2',
        caption:
          "Quick score entry and visible game history supported the coach's role in running the session.",
      },
      {
        key: 'scorecard',
        src: scorecard,
        alt: 'A printed Flying Axes scorecard beside an axe, listing six players with their total score, bullseye hits, scoring streak, accuracy average, and win–loss record.',
        aspectRatio: '3 / 2',
        caption:
          'The printed scorecard gave players a record of the session and a personal benchmark for their next visit.',
      },
    ],
  },

  changeTheGame: {
    title: 'Give Coaches Room to Change the Game',
    intro: [
      'Some groups struggled with the standard game. Others wanted a less serious experience. Coaches responded by inventing variations, but the app still held them to one format.',
      'We interviewed coaches to understand how they were adapting play and where the software got in their way. Their ideas became the basis for a more flexible system.',
      'We retained the official game and added a freeform mode. Coaches could enter custom scoring values, continue beyond five throws, and declare a winner manually. The scoreboard could now support the game they were running without dictating its rules.',
      "We also collected the coaches' games into a printed booklet at every cage. Players could browse while waiting for their turn and choose what to try next. Ideas developed by individual coaches became available throughout the venues.",
    ],
    // Rendered by MediaRail in the FeatureSection stage: the mapping session,
    // then three pages of the booklet in the order it runs — a handicap, the
    // page inviting coaches to devise their own games, and one of the games.
    // Each at its own ratio; the rail holds them at one height.
    steps: [
      {
        key: 'session-mapping',
        src: sessionMapping,
        alt: 'Two of the team at a wall of sticky notes mapping a session step by step, from meeting the coach and the safety talk to learning to throw and game play.',
        aspectRatio: '3 / 2',
      },
      {
        key: 'handicaps',
        src: bookletHandicaps,
        alt: 'Booklet page, Handicaps: a coach may tier the scoring up or down to even out a lopsided match, revaluing each ring of the target.',
        aspectRatio: '5 / 3',
      },
      {
        key: 'games',
        src: bookletGames,
        alt: 'Booklet page, Games: coaches are encouraged to devise their own game formats, limited only by their imagination and the tools available to them.',
        aspectRatio: '5 / 3',
      },
      {
        key: 'twenty-one',
        src: bookletTwentyOne,
        alt: 'Booklet page, Twenty-One: three rounds per match, the first player or team to reach 21 points wins the round, and players change lanes each round.',
        aspectRatio: '5 / 3',
      },
    ],
    caption:
      'Mapping a session step by step showed where coaches were reshaping play. The printed booklet carried their games to every coach and player.',
    closing: [
      'We observed coaches and throwers using the updated experience and interviewed coaches again after it had been live for a few months. Coaches described enjoying the role more, and we saw throwers respond to the freedom to play different games.',
      'The official format still had a clear purpose. Our American Axe Throwing League used it for weekly league nights across many seasons. Casual sessions gained flexibility while league play retained a shared competitive structure.',
    ],
  },

  venues: {
    title: 'Carry the Experience Across Venues',
    body: [
      'The scoreboards and coach controls ran on our edge network, alongside displays at the entrance and bar. Each venue could operate autonomously while benefiting from updates developed across the business.',
      'That infrastructure supported expansion to Covington and then Nashville. Repeatable hardware and deployment made it possible to bring the same system into each new location. If a scoreboard failed, staff could swap in a backup within minutes.',
      'The work extended beyond making one cage function. We had to make the experience practical to reproduce, maintain, and improve across three venues.',
    ],
    // Rendered by MediaRail in the SequenceSection stage, in the order the
    // scoreboard was made: tested, wired, installed. Each ratio is the photo's
    // own — the hardware shot is two photographs side by side, and the rail
    // keeps the row level at any mix of shapes.
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
      {
        value: '3 Venues',
        detail: 'Connected system deployed in Louisville, Covington, and Nashville',
      },
      {
        value: '~7 Months',
        detail: 'From initial brand development and prototyping to the first venue opening',
      },
      {
        value: 'Weekly League Nights',
        detail: 'American Axe Throwing League competition sustained across multiple seasons',
      },
    ],
    lessonsTitle: 'What the Venue Taught Us',
    lessons: [
      'Flying Axes grew from a prototype cage into three operating venues, with a connected scoring system, coach-led game variety, and recurring league play.',
      'The most useful change came from listening to the people running sessions. We had designed the original app to help coaches deliver a particular game efficiently. Their experience showed us that supporting their judgment mattered just as much as supporting the rules.',
      'If I were approaching the project today, I would prioritize the membership and loyalty program we planned but never implemented. Printed scorecards gave players a record of one visit. Persistent performance history, achievements, and leaderboards could have connected those visits into a longer relationship with the sport.',
      'We never tested the effect that program might have had on repeat visits. It remains the clearest opportunity I would pursue: giving players a way to see their progress over time, alongside the variety and personal attention that made each session enjoyable.',
    ],
    takeaway:
      'The system worked better when it gave coaches the freedom to shape play around the people in front of them.',
  },
};

export default flyingAxesContent;
