// src/caseStudies/fundseeder/fundseederContent.js
//
// FundSeeder's copy and media descriptors. Structured where structure helps
// (metadata, outcomes, media) and left as prose arrays everywhere else — the
// page itself is composed in FundSeederCaseStudy.jsx, not described here.
//
// Copy is the finishing pass (November 2026). The figures are FundSeeder's
// own, as of October 7, 2026: 20 traders seeded since relaunch (from none
// before it) and $256M allocated to them. "Seeded", never "funded".
//
// The product images and loops show sample data, and the page says so once,
// under the hero. The outcomes are real, and carry their own date.
//
// Loops are ordinary media descriptors with `video` in place of `src`
// (CaseStudyMedia, system/LoopVideo.jsx), served from public/media/fundseeder/.
// Every globe capture is frameless: hard edges, no radius, shadow or border,
// like the photos on the other case studies, and the footage only cropped.
// Text marked [JON: …] is a
// placeholder for copy still to come; the text it replaces is in a comment
// beside it.
//
// The product media's demo data: trader ChartSlug, strategy InformationNominal,
// rank #19 (up 4 from #23), FS 62.14, next rival VolLynx at #18, 0.17 ahead.
//
// `**bold**` is supported inline. One diagram is drawn live from the data
// here: `overview.paths`, by StrategyPaths.jsx.

const MEDIA = '/media/fundseeder';
// A globe capture: no frame, hard edges.
const GLOBE = { frame: 'none' };

import pairwiseEvidence from './assets/signal/pairwise-evidence.webp';
import connectionDetail from './assets/signal/connection-detail.webp';
// The tier badges are the product's own, cut from the tier cards.
import tierS from './assets/tiers/tier-s.webp';
import tierA from './assets/tiers/tier-a.webp';
import tierB from './assets/tiers/tier-b.webp';
import tierC from './assets/tiers/tier-c.webp';
import tierD from './assets/tiers/tier-d.webp';

export const fundseederContent = {
  projectName: 'FUNDSEEDER',
  title: 'Making the Next Step Worth Competing For',

  hero: {
    intro: [
      'A leaderboard can tell a trader they’re ranked 19th. I wanted ours to give them someone worth chasing. I designed FundSeeder’s tiers and Rivals mode, along with Signal, where reviewers investigate the strategies behind the ranks.',
    ],
    // The "Since your last visit" recap on the globe, bleeding off the right
    // at desktop, presented like the other heroes' photos. (The previous hero, assets/v2/f01-hero-desktop.webp, stays in
    // the repo, unused.) The sample-data line is its caption: said once, here;
    // the outcomes are real data and keep their own date.
    media: {
      video: `${MEDIA}/fs-last-visit`,
      aspectRatio: '1272 / 708',
      alt: 'Since your last visit recap replaying rank changes on the globe.',
      caption: 'See how your rank changed since your last visit, who you passed, who passed you, and who’s next.',
      ...GLOBE,
    },
    metadata: [
      { label: 'Role', values: ['Principal Product Designer'] },
      {
        label: 'Team',
        values: [
          'Product Owner',
          'CEO',
          'Lead Developer',
          'Two Senior Backend Developers',
          'Customer Support',
        ],
      },
      { label: 'Platform', values: ['Responsive web', 'Internal operations'] },
      { label: 'Relaunched', values: ['July 31, 2025'] },
      {
        label: 'Additional responsibilities',
        values: [
          'Marketing site',
          'Activation reporting',
          'Strategy lifecycle emails',
          'Support setup and handoff',
        ],
      },
    ],
  },

  overview: {
    title: 'One Strategy Enters Two Systems',
    body: [
      'FundSeeder connects independent traders with investment capital. Working with stakeholders and developers, I replaced disconnected leaderboards with a single competition and designed the review tools that support funding decisions.',
      'We counted someone as activated when they added a strategy. That same action put a record in front of our reviewers.',
    ],
    // Drawn by StrategyPaths: what one added strategy sets off. Its words are
    // the previous flow's, shortened to labels.
    paths: {
      label: 'What happens when a trader adds a strategy',
      description:
        'Diagram: a trader adds a strategy, and the path splits. One branch is the competition: a weekly rank, in tiers D, C, B and A. The other is Signal’s review: validate, then quantitative, then qualitative. A rank can prompt a closer look, linking the competition to review. Both paths meet at S, where reviewers select traders for funding.',
      start: 'Adds a strategy',
      competition: { title: 'Competition', lines: ['Weekly rank', 'Tiers D, C, B, A'] },
      review: { title: 'Signal review', lines: ['Validate →', 'Quantitative →', 'Qualitative'] },
      link: ['A rank can prompt', 'a closer look'],
      merge: { mark: 'S', lines: ['Reviewers select', 'traders for funding'] },
    },
  },

  rivals: {
    title: 'The Next Rival Matters More Than First Place',
    body: [
      'With fixed neighbors, a rival could disappear from view as soon as either trader moved up or down. I let traders choose up to five rivals so they could follow the same people week to week. For each rival, they can see how far ahead or behind they are and when one passes them.',
    ],
    // Replaces assets/v2/f04-nearby-rivals.webp (kept, unused).
    media: {
      video: `${MEDIA}/fs-rivals`,
      aspectRatio: '1464 / 708',
      alt: 'Rivals mode showing tracked rivals and how far ahead or behind each one is.',
      caption: 'VolLynx is 0.17 ahead of you.',
      ...GLOBE,
    },
  },

  tiers: {
    title: 'Reviewers Choose Who Enters S Tier',
    intro: [
      'Eligible strategies are ranked weekly. D through A reflect performance. I reserved S for traders selected for funding because a score can establish where a strategy ranks, while deciding to commit capital takes a verified record and a reviewer’s judgment.',
    ],
    // Drawn by TierLadder.jsx around the product's badges, its phase and gate
    // labels live text.
    ladder: {
      alt: 'Tier progression diagram: D, C, B and A climb a staircase under “Performance”, then a review gate leads to S on the top step, under “Selection”.',
      phases: { performance: 'Performance', selection: 'Selection' },
      gate: 'Review',
      steps: [
        { key: 'd', phase: 'performance', src: tierD },
        { key: 'c', phase: 'performance', src: tierC },
        { key: 'b', phase: 'performance', src: tierB },
        { key: 'a', phase: 'performance', src: tierA },
        { key: 's', phase: 'selection', src: tierS },
      ],
    },
  },

  seeded: {
    title: 'See Where the Capital Went',
    intro: ['I gave the seeded view its own color so traders could see at a glance where the rankings ended and actual allocations began.'],
    media: {
      video: `${MEDIA}/fs-seeded`,
      aspectRatio: '1794 / 708',
      alt: 'Seeded Traders mode turning the globe red and spotlighting S-tier traders.',
      caption: 'The globe shows seeded traders by location, with one trader in the spotlight and the total capital allocated alongside.',
      ...GLOBE,
    },
    // [JON: takeaway] — optional; left out while empty.
    takeaway: null,
  },

  // The globe's Countries mode.
  countries: {
    title: 'Your Points Count Toward Your Country’s Score',
    body: ['I wanted traders farther down the leaderboard to have a stake in a close race. Even if first place is out of reach, the 32 points you add to your country’s total still count.'],
    media: {
      src: `${MEDIA}/fs-countries.webp`,
      aspectRatio: '2400 / 1183',
      ...GLOBE,
      alt: 'The leaderboard globe in Countries mode: North America highlighted, a Country Standings panel ranking the USA first on 247 points ahead of the UK and Canada, and pins with each country’s points.',
      caption: 'The country standings show your country’s rank and your contribution to its total.',
    },
  },

  compare: {
    title: 'Compare First. Investigate When It Matters.',
    body: [
      'I kept the first view compact enough to compare rows. Traders can filter the field, expand a strategy, and examine performance over a date range or stress event. Their own row stays pinned, so they can look further up the table without losing their point of comparison.',
    ],
    // The leaderboard table, from the FILTERS bar down to the pinned
    // "ChartSlug · YOU" row (fsGlobeYouRow.png, x 1052–3770, y 1094–2156), in
    // the wide stage so its text stays readable. Frameless.
    pinned: {
      src: `${MEDIA}/fs-pinned-row.webp`,
      aspectRatio: '2600 / 1016',
      frame: 'none',
      expandable: true,
      alt: 'The leaderboard table scrolled to ranks 39 to 47, each row with its trader, strategy, previous rank, annual return, adjusted Sortino, daily GPR, correlation to the S&P 500, account size and FS Score. Pinned beneath the scrolling rows, the trader’s own row: 19, ChartSlug, marked You.',
      caption: 'Your row stays pinned at the bottom as you scroll through the field.',
    },
  },

  signal: {
    title: 'Give Reviewers the Strategy Behind the Rank',
    intro: [
      'Every strategy enters Signal for review. The team validates the data, examines quantitative and qualitative evidence, and contacts traders under consideration for seeding. In the pairwise view, a reviewer can compare performance during drawdowns while keeping the strategy’s validation stage in sight.',
      'Both systems depend on incoming account data. When a connection stalls, Signal shows which stage it reached, how long it has spent there, and whether a support ticket already exists. The reviewer can contact the trader from that record.',
    ],
    // A MediaRail at one shared height (rail in FundSeederCaseStudy.jsx). Crops
    // of Signal's own screens, with no trader names or contact details in
    // frame. The connection detail keeps its counts row: cropped to "Time at
    // each stage" it is 1194×164, too small to read at the rail's height.
    media: [
      {
        key: 'evidence',
        src: pairwiseEvidence,
        aspectRatio: '345 / 275',
        alt: 'Signal’s pairwise comparison table: correlation of the two portfolios (daily 3.35%, weekly −0.21%, monthly −6.42%), then annual return, annual volatility, Sharpe ratio, return to max drawdown and max drawdown for P1, P2 and the combined pair.',
        caption:
          'Reviewers can compare annual return, volatility, and drawdown for each portfolio and the combined pair.',
      },
      {
        key: 'connection',
        src: connectionDetail,
        aspectRatio: '1194 / 340',
        alt: 'Signal’s strategy connections: 28 in progress, 7 awaiting linkage, 11 processing, 3 failed and 9 this week. Beneath, one connection’s time at each stage (verified link 1 hour, linked 2 days, historical data 8 hours, parsed and email sent still to come), a Has Front Ticket flag and a Contact Trader button.',
        caption: 'Stage timing and the support ticket sit beside the contact action.',
      },
    ],
  },

  conclusion: {
    // The headline is the before and after as one statement (0 → 20); the
    // capital allocated is secondary.
    outcomes: [
      { from: '0', value: '20', detail: 'traders seeded since relaunch' },
      { value: '$256M', detail: 'allocated to seeded traders', secondary: true },
    ],
    outcomeNote: 'As of October 7, 2026',
    lessonsTitle: 'What a Rank Can Tell You',
    lessons: [
      'The same rank serves two people. For a trader, it makes the next rival visible. For a reviewer, it’s a reason to look more closely. Performance determines tiers through A. Reviewers decide who receives funding and enters S.',
    ],
  },
};

export default fundseederContent;
