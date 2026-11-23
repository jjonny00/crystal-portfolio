// src/caseStudies/forest-giant/forestGiantContent.js
//
// Forest Giant's copy and media descriptors. Structured where structure helps
// (metadata, outcomes, media) and left as prose arrays everywhere else — the
// page itself is composed in ForestGiantCaseStudy.jsx, not described here.
//
// Copy is the finishing pass (November 2026). First-person reflections are
// Jon's to approve; nothing is credited to a participant.
//
// `**bold**` is supported inline. The critique method is set in body copy
// until the actual worksheet turns up; the studio gallery is studio credits,
// with individual project roles added only where confirmed.
import heroImage from './assets/hero.webp';
import quantified from './assets/quantified.webp';
import rothRiver from './assets/roth-river.webp';
import gross from './assets/gross.webp';
import studioFloor from './assets/studio-floor.webp';
import guidePage09 from './assets/guide/page-09.webp';
import guidePage09Full from './assets/guide/page-09-full.webp';
import guidePage11 from './assets/guide/page-11.webp';
import guidePage11Full from './assets/guide/page-11-full.webp';
import guidePage12 from './assets/guide/page-12.webp';
import guidePage12Full from './assets/guide/page-12-full.webp';
import guidePage23 from './assets/guide/page-23.webp';
import guidePage23Full from './assets/guide/page-23-full.webp';
import workshop from './assets/workshop.webp';

export const forestGiantContent = {
  projectName: 'FOREST GIANT',
  title: 'Helping Teams Lead Without Waiting on the Founders',

  hero: {
    intro: [
      'As Forest Giant grew, too many decisions still came back to the CTO or me. I co-founded the studio as Visual Scientists. Over fifteen years we grew to more than 30 people, building everything from mobile apps to interactive environments. As Chief Creative Officer, I wanted teams to have the same freedom to shape the work that we’d had when we started.',
    ],
    media: {
      src: heroImage,
      alt: 'A workshop in the Forest Giant studio: a dozen people stand on a rug between leather sofas and tall windows, watching one person point to a board covered in sticky notes.',
    },
    metadata: [
      { label: 'Role', values: ['Co-Founder', 'Chief Creative Officer'] },
      { label: 'Time', values: ['15 years across Visual Scientists and Forest Giant'] },
      {
        label: 'Contributions',
        values: [
          'Interactive Design',
          'Creative Direction',
          'Team Leadership',
          'Practice Development',
        ],
      },
      {
        label: 'Collaborators',
        values: ['CEO', 'CTO', 'Project Managers', 'Design, UX, and Technology Leads'],
      },
    ],
    // The studio's history, folded into the opening: three named examples of
    // its work as a compact 3-up under the hero. Studio credits, not claims
    // about Jon's part in each.
    gallery: [
      {
        key: 'quantified',
        src: quantified,
        alt: 'Quantified on an iPhone and an Apple Watch lying on a concrete ledge: the phone shows a grid of coloured counters — meditate, angry, call Mom, drink 8oz of water, try something new, used Facebook — and the watch shows the water counter at 6.',
        aspectRatio: '3 / 2',
        caption: 'Quantified · An iPhone and Apple Watch app for tracking habits.',
      },
      {
        key: 'roth-river',
        src: rothRiver,
        alt: 'A person gestures at a large screen showing a Woodford Reserve barrel’s environment data — internal temperature, volume and pressure, the angel’s share, and external humidity — laid over a photograph of the barrel.',
        aspectRatio: '3 / 2',
        caption: 'Roth River · A display showing conditions inside a Woodford Reserve barrel.',
      },
      {
        key: 'gross',
        src: gross,
        alt: 'Gross on an iPhone beside a pair of earbuds: one day’s step count, with walking, running, other, and gross time totalled beside a colour-coded timeline of the day.',
        aspectRatio: '3 / 2',
        caption: 'Gross · A mobile activity tracker that totals the day’s movement.',
      },
    ],
  },

  explicit: {
    title: 'What We Knew Instinctively Had to Be Explicit',
    body: [
      'Our CTO and I had been making things together since we were sixteen. We knew when to bring each other in. A new project lead had no way to know which technical question needed answering before a client meeting, or who was responsible for getting the answer.',
      'The leadership team mapped the work from the first client conversation through launch and support. I represented design. We agreed on what each role owed the others at each stage, leaving the creative and technical choices with the people doing the work.',
    ],
    // Context for the scale of the studio, not evidence of a troubled project:
    // several kinds of work at once. 16:9 rather than the usual 3:2, because a
    // 3:2 frame can't hold both the pair at the laptop and the whiteboard
    // session.
    media: {
      src: studioFloor,
      alt: 'The bright open studio: people at desks along the windows, two talking over a laptop at a round table, two more at a whiteboard of sticky notes under the mezzanine, and someone coming down the stairs from the upper floor.',
      aspectRatio: '1913 / 1076',
    },
  },

  // Directly after the tacit-knowledge problem. The method is in the copy; the
  // photo is a general working session and is labelled as one.
  critique: {
    title: 'Give Feedback Before Proposing Solutions',
    body: [
      'Everyone wrote down feedback before the discussion. We saved proposed solutions for a separate session so the designer could hear how people experienced the work before having to defend it or change it.',
    ],
    media: {
      src: workshop,
      alt: 'A working session in a glass-walled meeting room: one person points to notes stuck across the glass while others listen from stools and chairs around a long wooden table.',
      aspectRatio: '4 / 3',
      caption: 'A working session in the studio',
    },
  },

  practice: {
    title: 'Give Project Leads Something They Can Use',
    intro: [
      'During project prep, the product manager identified the client stakeholders, agreed on how they wanted to communicate, and clarified the internal team’s responsibilities. Technology leads shared constraints, and design brought developers into feasibility discussions. Those were concrete things a lead could do before a project got into trouble.',
    ],
    // Rendered by MediaRail: four whole pages of the process guide
    // (FG-Process-FlowChart-V0-0-1.pdf), uncropped, in the guide's order: the
    // Phase II overview, then named responsibilities for the Product Manager
    // (the project-prep page), the Technology Lead and, in Phase IV, the
    // Design Lead. Each opens at full resolution in the viewer.
    pages: [
      {
        key: 'guide-page-09',
        src: guidePage09,
        fullSrc: guidePage09Full,
        alt: 'Process guide, Phase II, Project Prep: an introduction to the phase beside its goals — define client stakeholders, define team roles and responsibilities, verify the client’s problem and goals, how success will be measured, the type of engagement and project, and establish communication channels.',
        aspectRatio: '1600 / 1237',
      },
      {
        key: 'guide-page-11',
        src: guidePage11,
        fullSrc: guidePage11Full,
        alt: 'Process guide, Phase II, Product Manager milestones: define client stakeholders’ roles and level of communication, internal roles and responsibilities, communication style and meetings, a recurring stand-up, a weekly client meeting, verify the buyer’s goals against what Sales heard, and what the buyer needs to see and when.',
        aspectRatio: '1600 / 1237',
      },
      {
        key: 'guide-page-12',
        src: guidePage12,
        fullSrc: guidePage12Full,
        alt: 'Process guide, Phase II, Technology Lead milestone: share knowledge of tools and technology with the entire team.',
        aspectRatio: '1600 / 1237',
      },
      {
        key: 'guide-page-23',
        src: guidePage23,
        fullSrc: guidePage23Full,
        alt: 'Process guide, Phase IV, Design Lead milestones: identify the right design artifacts and deliverables, a design critique of creative and visual style, a design critique of development concerns and feasibility, and a client design review.',
        aspectRatio: '1600 / 1237',
      },
    ],
    caption:
      'The guide connected each project stage to responsibilities for individual leads and the wider team.',
  },

  // The reflection, on its own: the outcome is its subject, so no outcome tile
  // restates it.
  conclusion: {
    lessonsTitle: 'More Decisions Stayed with the Team',
    lessons: [
      'Project managers became more confident explaining progress to clients. Teams could make more decisions without asking the CTO or me to step in, and I had time to contribute directly to design again. Looking back, I would have made leadership’s obligations just as explicit, including regular conversations about where the practice was helping and where it needed to change.',
    ],
  },
};

export default forestGiantContent;
