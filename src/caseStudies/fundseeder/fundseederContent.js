// src/caseStudies/fundseeder/fundseederContent.js
//
// FundSeeder's copy and media descriptors. Structured where structure helps
// (metadata, outcomes, media) and left as prose arrays everywhere else — the
// page itself is composed in FundSeederCaseStudy.jsx, not described here.
//
// `**bold**` is supported inline. Media with a `src` is shipped (see
// assets/README.md for what each file was made from); the entries still
// carrying a `placeholder` describe an asset not yet made, and keep the box it
// will occupy reserved. Adding `src` (and `fullSrc` where the enlarged view
// wants more resolution) is the only change needed to drop one in.
//
// The two diagrams (`tiers.ladder`, `destination.flow`) are drawn by
// TierLadder.jsx and SelectionFlow.jsx from the data here.

import heroImage from './assets/hero.webp';
import dashboard from './assets/dashboard.webp';
import dashboardFull from './assets/dashboard-full.webp';
import leaderboard from './assets/leaderboard.webp';
import leaderboardFull from './assets/leaderboard-full.webp';
import leaderboardTable from './assets/leaderboard-table.webp';
import leaderboardTableFull from './assets/leaderboard-table-full.webp';
import leaderboardFilters from './assets/leaderboard-filters.webp';
import leaderboardFiltersFull from './assets/leaderboard-filters-full.webp';
import rankingNeighbourhood from './assets/ranking-neighbourhood.webp';
import pinnedEntry from './assets/pinned-entry.webp';
import namesAndFlags from './assets/names-and-flags.webp';
import tierS from './assets/tiers/tier-s.webp';
import tierA from './assets/tiers/tier-a.webp';
import tierB from './assets/tiers/tier-b.webp';
import tierC from './assets/tiers/tier-c.webp';
import tierD from './assets/tiers/tier-d.webp';

// The overview's three screens share the dashboard's own ratio, so the set reads
// as one row whether or not Signal's screen has arrived.
const OVERVIEW_RATIO = '1600 / 940';

export const fundseederContent = {
  projectName: 'FUNDSEEDER',
  title: 'Designing the Ladder',

  hero: {
    intro: [
      'More than 1,000 strategies compete for attention on FundSeeder. I designed the progression and comparison systems that make that competition understandable, motivating, and consequential.',
    ],
    // Transparent, so the cards sit directly on the crystal like the hero copy.
    // Made at the hero's 3:2, so cover never crops it.
    media: {
      src: heroImage,
      alt: 'A FundSeeder strategy card at A tier, ranked 102nd, with the leaderboard rows either side of it (101 above, 103 below) floating over it and the participant’s own row highlighted.',
      priority: true,
    },
  },

  overview: {
    title: 'Designing a Meaningful Competition',
    body: [
      'FundSeeder identifies independent trading talent and connects exceptional performers with investment capital. Participants build a verified performance record, compare themselves against others, and potentially move into consideration for funding.',
      'We inherited a fragmented product with disconnected leaderboards and no clear sense of progression. Despite years of operation, it had never resulted in a trader being seeded.',
      'We rebuilt FundSeeder from scratch around one competitive system. I led the product and systems design, including the progression model, leaderboard, comparison tools, identity system, and Signal, the internal application that moves promising participants through review.',
      'The rebuilt platform launched on July 31, 2025. More than 1,000 strategies are now officially ranked, and 17 traders have been seeded.',
    ],
    metadata: [
      { label: 'Role', values: ['Principal Product Designer'] },
      {
        label: 'Team',
        values: [
          'Product Owner',
          'CEO',
          'Lead Developer',
          'Senior Backend Developers ×2',
          'Customer Support',
        ],
      },
      { label: 'Platform', values: ['Responsive Web'] },
      { label: 'Ranked Strategies', values: ['1,027'] },
      { label: 'Traders Seeded', values: ['17'] },
    ],
    gallery: [
      {
        key: 'dashboard',
        src: dashboard,
        fullSrc: dashboardFull,
        aspectRatio: OVERVIEW_RATIO,
        alt: 'The FundSeeder dashboard: the strategy’s FS Score and performance chart, its track record, and a ranking panel with its tier, rank, and the competitors immediately around it.',
      },
      {
        key: 'leaderboard',
        src: leaderboard,
        fullSrc: leaderboardFull,
        aspectRatio: OVERVIEW_RATIO,
        alt: 'The FundSeeder leaderboard page: the participant’s strategy card beside the podium and the single shared ranking, with a global trader map below.',
      },
      {
        key: 'signal',
        aspectRatio: OVERVIEW_RATIO,
        placeholder:
          'Signal — the internal application the team reviews and advances participants in.',
        alt: 'Signal, FundSeeder’s internal review application, showing a participant moving through the selection process.',
      },
    ],
    caption:
      'The public competition and internal selection process operate as two sides of the same system.',
  },

  tiers: {
    title: 'A Rank Is a Position, Not a Goal',
    intro: [
      'A leaderboard tells participants where they stand, but a number alone provides little sense of progress.',
      'I introduced five tiers to divide the ranking into recognizable stages. D through A reflect measured performance and can change as new results are calculated. Each tier gives participants a boundary to enter, defend, and eventually break through.',
      'The final S tier works differently. It cannot be reached through performance alone. It is reserved for participants who complete FundSeeder’s review process and are selected for funding.',
      'This distinction gave the system both short-term and long-term goals. Participants could work toward the next tier while understanding that the highest status represented a real outcome beyond the leaderboard.',
    ],
    // Drawn by TierLadder.jsx; the badges are the product's own.
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
    caption:
      'Performance moves participants through D–A. S represents selection, not simply a higher score.',
    takeaway: 'Tiers transformed an abstract ranking into a ladder with recognizable milestones.',
  },

  leaderboard: {
    title: 'One Competition, Many Ways to Read It',
    intro: [
      'The previous experience divided participants into separate leaderboards. That made each category easier to manage, but it weakened the meaning of the overall competition.',
      'We replaced them with one shared ranking. Everyone could now understand their position across FundSeeder as a whole.',
      'Filters preserved the ability to find relevant comparisons without breaking the population apart. Participants could narrow the leaderboard around characteristics such as experience, approach, account size, or area of specialization while retaining their overall rank.',
      'The interface also reveals information progressively. Each row contains enough information to compare strategies quickly, then expands when someone wants to investigate further.',
    ],
    gallery: [
      // Both crops are cut to one ratio so the pair sits level.
      {
        key: 'expanded-row',
        src: leaderboardTable,
        fullSrc: leaderboardTableFull,
        aspectRatio: '1800 / 1556',
        alt: 'The full FundSeeder leaderboard: sixteen ranked strategies, each row with a performance sparkline, previous rank, returns, FS Score and a chevron to expand it, and the participant’s own entry pinned at the bottom.',
      },
      {
        key: 'filters',
        src: leaderboardFilters,
        fullSrc: leaderboardFiltersFull,
        aspectRatio: '1800 / 1556',
        alt: 'The leaderboard’s podium above the ranking, with the active filters (FS Score, account size, trading experience, and strategy type) summarised over the list.',
      },
    ],
    caption:
      'One ranking establishes shared standing. Filters let participants decide which comparisons are meaningful to them.',
  },

  nextRival: {
    title: 'The Next Rival Matters More Than First Place',
    body: [
      'Large leaderboards tend to focus attention on the top. For most participants, that can make progress feel distant rather than motivating.',
      'I anchored each participant’s entry to the bottom of the leaderboard. Their own standing remains visible while they browse, making every comparison immediate.',
      'On the dashboard, I reduced the competition to a smaller neighborhood. The participant sits at the center, with the three positions directly above and below. A percentile-based message provides broader context without making the top-ranked strategy the only measure of success.',
      'Together, these views answer three different questions:',
    ],
    // A list rather than three more paragraphs: they are one set, and the copy
    // above introduces them as one.
    questions: [
      'Where do I stand overall?',
      'Who is immediately ahead of me?',
      'What could I realistically achieve next?',
    ],
    gallery: [
      // Each at its own ratio: stacked, the two never have to match.
      {
        key: 'dashboard-comparison',
        src: rankingNeighbourhood,
        aspectRatio: '1216 / 1238',
        alt: 'The dashboard’s ranking panel: the participant at A tier and rank 102, centred between ranks 99–101 above and 103–105 below.',
      },
      {
        key: 'pinned-entry',
        src: pinnedEntry,
        aspectRatio: '2000 / 536',
        alt: 'A crop of the leaderboard’s last rows, with the participant’s own entry at rank 102 pinned beneath rank 16.',
      },
    ],
    caption:
      'Centering participants among nearby rivals turns a ranking of more than 1,000 into a sequence of attainable steps.',
    takeaway: 'The next position creates a more useful goal than first place.',
  },

  identity: {
    title: 'Identity Without Self-Promotion',
    body: [
      'Competition needs recognizable participants, but FundSeeder could not become a directory for people or firms advertising themselves to investors.',
      'Real names and institutional affiliations were restricted. Removing identity completely, however, would leave the leaderboard feeling anonymous and difficult to follow.',
      'I designed a constrained identity system using generated names, approved custom names, and country flags. Participants gain a distinct presence without exposing personal or professional affiliations. The flags also make the international scale of the competition visible at a glance.',
      'Custom names provide a greater sense of ownership, but each request passes through an internal approval process before appearing publicly.',
    ],
    gallery: [
      {
        key: 'names-and-flags',
        src: namesAndFlags,
        aspectRatio: '2000 / 806',
        alt: 'The leaderboard podium: DividendDragon, HedgehogHedger and YieldYak, each identified by a generated name and a country flag above their strategy.',
      },
      {
        key: 'name-approval',
        placeholder: 'The custom-name approval interface.',
        alt: 'The custom-name approval interface, with a requested name awaiting internal review.',
      },
    ],
    caption:
      'Names and country flags create recognizable competitors while protecting the boundaries of the platform.',
  },

  destination: {
    title: 'Competition Needs a Destination',
    intro: [
      'Progress matters more when it leads somewhere meaningful.',
      'Every strategy added to FundSeeder also enters Signal, the internal system I designed for reviewing participants and operating the platform. Public performance creates visibility, while Signal gives the FundSeeder team the structure and context required to act on it.',
      'Promising participants move through data validation, quantitative review, qualitative review, and finally selection. The public ranking can draw attention to strong performance, but it never makes the funding decision automatically.',
      'This human review process is what separates A from S. The competitive system creates aspiration. Signal turns exceptional performance into a real opportunity.',
    ],
    // Drawn by SelectionFlow.jsx. Stages are numbered from 1; a cell's `span`
    // runs it across the stages after it.
    flow: {
      stages: ['Join', 'Compete', 'Progress', 'Review', 'Selection'],
      lanes: { public: 'Public — FundSeeder', signal: 'Internal — Signal' },
      publicCells: [
        { stage: 1, text: 'Add a strategy and build a verified record' },
        { stage: 2, text: 'One shared ranking, read through filters' },
        { stage: 3, text: 'Climb the tiers, D to A' },
        { stage: 5, text: 'S tier' },
      ],
      signalCells: [
        { stage: 1, text: 'Every strategy enters Signal' },
        { stage: 2, span: 2, text: 'Performance tracked in context' },
        { stage: 4, text: 'Data validation, quantitative review, qualitative review' },
        { stage: 5, text: 'Selected for funding' },
      ],
    },
    caption:
      'The public system creates progression. The internal system determines when performance merits a real-world opportunity.',
    takeaway: 'Competition became the beginning of the selection process, not its endpoint.',
  },

  conclusion: {
    outcomes: [
      { value: '1,027', detail: 'Strategies officially ranked' },
      { value: '17', detail: 'Traders seeded since relaunch' },
      { value: '13', detail: 'Currently allocated' },
      { value: 'July 31, 2025', detail: 'Rebuilt platform launched' },
    ],
    lessonsTitle: 'Designing for Attainable Progress',
    lessons: [
      'Before the rebuild, FundSeeder had never seeded a trader. Since launch, 17 traders have progressed through the platform and into funding, with 13 still actively allocated.',
      'The work reinforced that ranking people does not automatically create meaningful competition. Participants need milestones they can recognize, rivals relevant to their current position, and confidence that progress leads somewhere real.',
      'The most important design decision was not putting more information on the leaderboard. It was changing the scale at which participants experienced the competition: from an unreachable first place to the next rank, the next tier, and the next opportunity.',
    ],
    takeaway:
      'I designed a competitive system that made progress visible, comparison relevant, and advancement consequential.',
  },
};

export default fundseederContent;
