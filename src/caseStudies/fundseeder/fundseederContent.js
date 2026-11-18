// src/caseStudies/fundseeder/fundseederContent.js
//
// FundSeeder's copy and media descriptors. Structured where structure helps
// (metadata, outcomes, media) and left as prose arrays everywhere else — the
// page itself is composed in FundSeederCaseStudy.jsx, not described here.
//
// Copy is the finishing pass (November 2026). The figures (17 seeded, 1,027
// ranked) are as of August 2026: the hero's before/after sentence says so for
// skimmers, and the outcomes carry the date once for the pair.
//
// `**bold**` is supported inline. Two diagrams are drawn live from the data
// here: `overview.flow` by RankingFlow.jsx and `compare.pinned` by
// PinnedTable.jsx.

import heroImage from './assets/v2/f01-hero-desktop.webp';
import nearbyRivals from './assets/v2/f04-nearby-rivals.webp';
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
      'A leaderboard can tell a trader they’re ranked 102nd. I wanted ours to give them someone worth chasing. I designed FundSeeder’s tiers and nearby-rival view, along with Signal, where reviewers investigate the strategies behind the ranks.',
      'Before relaunch, FundSeeder had never seeded a trader. By August 2026, it had seeded 17.',
    ],
    // The dashboard's strategy card (A tier, rank 102, its performance line)
    // with the rows either side of the trader floating over it. Transparent,
    // so it sits directly on the crystal like the copy; contain at its own
    // ratio, so the hero's cover crop never trims the rows.
    media: {
      src: heroImage,
      alt: 'A FundSeeder strategy performance card at A tier: current rank 102, up from 112 last month, highest rank 94, over a rising performance line. In front of it, the leaderboard rows around the trader: 101 ArbitrageAardvark, 102 You (AroundTheWorld, highlighted), 103 GammaGorilla.',
      aspectRatio: '1600 / 1050',
      fit: 'contain',
      priority: true,
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
    // Drawn by RankingFlow: what one added strategy sets off. The connector
    // says how a rank prompts investigation; every strategy enters Signal,
    // ranked or not.
    flow: {
      label: 'What happens when a trader adds a strategy',
      competition: {
        title: 'Competition',
        body: 'Eligible strategies receive a weekly rank. Performance determines tiers D, C, B, and A.',
      },
      bridge: 'A rank can prompt a closer look during review.',
      signal: {
        title: 'Signal reviews every strategy',
        body: 'Validate the record → quantitative review → qualitative review.',
        selection: { term: 'S tier', text: 'Reviewers select traders for funding.' },
      },
    },
  },

  nextStep: {
    title: 'The Next Rival Matters More Than First Place',
    intro: [
      'The dashboard shows the three ranks above you and the three below. At 102nd, you can see how close you are to 101st before you ever open the full leaderboard.',
      'Eligible strategies are ranked weekly. D through A reflect performance. I reserved S for traders selected for funding because a score can establish where a strategy ranks, while deciding to commit capital takes a verified record and a reviewer’s judgment.',
    ],
    // Rendered by NextStepComposition: the tier ladder above the ranking
    // card. The ladder is drawn by TierLadder.jsx around the product's badges,
    // its phase and gate labels live text.
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
    // The actual dashboard card, including the step into the full leaderboard.
    rivals: {
      src: nearbyRivals,
      aspectRatio: '1280 / 1300',
      alt: 'The dashboard’s ranking card: the trader at A tier and rank 102 (112 last month, highest 94), centred between ranks 99–101 above and 103–105 below, with a View Full Leaderboard button beneath.',
      caption: 'Rank 102 sits between nearby competitors, with a direct route to the full leaderboard.',
    },
  },

  compare: {
    title: 'Compare First. Investigate When It Matters.',
    body: [
      'I kept the first view compact enough to compare rows. Traders can filter the field, expand a strategy, and examine performance over a date range or stress event. Their own row stays pinned, so they can look further up the table without losing their point of comparison.',
    ],
    // Drawn by PinnedTable, beside the copy. Ranks, aliases and FS Scores are
    // the source's, including 81.23 for the pinned trader; the source's flags
    // are left out (the country intent is unconfirmed).
    pinned: {
      label: 'Your score stays in view as you compare the field',
      columns: { rank: 'Rank', trader: 'Trader', score: 'FS Score' },
      rows: [
        { rank: '1', trader: 'DividendDragon', score: '89.72' },
        { rank: '2', trader: 'HedgehogHedger', score: '88.93' },
        { rank: '3', trader: 'YieldYak', score: '88.86' },
      ],
      own: { rank: '102', trader: 'You · pinned', score: '81.23' },
    },
  },

  signal: {
    title: 'Give Reviewers the Strategy Behind the Rank',
    intro: [
      'Every strategy enters Signal for review. The team validates the data, examines quantitative and qualitative evidence, and contacts traders under consideration for seeding. In the pairwise view, a reviewer can compare performance during drawdowns while keeping the strategy’s validation stage in sight.',
      'Both systems depend on incoming account data. When a connection stalls, Signal shows which stage it reached, how long it has spent there, and whether a support ticket already exists. The reviewer can contact the trader from that record.',
    ],
    // Rendered by StackedMedia, each detail expandable. Crops of Signal's own
    // screens, with no trader names or contact details in frame; each is its
    // own enlarged view (src and fullSrc are the same file, swapped together).
    media: [
      {
        key: 'evidence',
        src: pairwiseEvidence,
        fullSrc: pairwiseEvidence,
        aspectRatio: '345 / 275',
        maxWidth: '400px',
        alt: 'Signal’s pairwise comparison table: correlation of the two portfolios (daily 3.35%, weekly −0.21%, monthly −6.42%), then annual return, annual volatility, Sharpe ratio, return to max drawdown and max drawdown for P1, P2 and the combined pair.',
        caption:
          'Reviewers can compare annual return, volatility, and drawdown for each portfolio and the combined pair.',
      },
      {
        key: 'connection',
        src: connectionDetail,
        fullSrc: connectionDetail,
        aspectRatio: '1194 / 340',
        maxWidth: '1000px',
        alt: 'Signal’s strategy connections: 28 in progress, 7 awaiting linkage, 11 processing, 3 failed and 9 this week. Beneath, one connection’s time at each stage (verified link 1 hour, linked 2 days, historical data 8 hours, parsed and email sent still to come), a Has Front Ticket flag and a Contact Trader button.',
        caption: 'Stage timing and the support ticket sit beside the contact action.',
      },
    ],
  },

  conclusion: {
    outcomes: [
      { value: '17', detail: 'traders seeded since relaunch' },
      { value: '1,027', detail: 'ranked strategies' },
    ],
    outcomeNote: 'As of August 2026',
    lessonsTitle: 'What a Rank Can Tell You',
    lessons: [
      'The same rank serves two people. For a trader, it makes the next rival visible. For a reviewer, it’s a reason to look more closely. Performance determines tiers through A. Reviewers decide who receives funding and enters S.',
    ],
  },
};

export default fundseederContent;
