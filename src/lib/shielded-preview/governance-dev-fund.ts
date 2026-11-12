// Published 5 Nov 2026 as "ZCG and the Dev Fund: Timeline for Proposals and Polling".
// Dates and rules follow that text. Fill in `devFundPublished` only from what its authors publish.
export const devFundSources = {
  timeline: 'https://forum.zcashcommunity.com/t/zcg-and-the-dev-fund-timeline-for-proposals-and-polling/58906',
  post: 'https://x.com/aquietinvestor/status/2118369236636869070',
  zip0: 'https://zips.z.cash/zip-0000',
  // The announcement names the forum, not a category; this is where it and the proposals it refers to are posted.
  newThread: 'https://forum.zcashcommunity.com/new-topic?category=governance',
  governance: 'https://forum.zcashcommunity.com/c/governance/25',
} as const;

export const devFundLane = 'dev-fund';
export const devFundHref = (section: 'proposals' | 'voting') => `?view=governance&section=${section}&lane=${devFundLane}`;

export type DevFundPublication = {
  /** `draft`: published for feedback and still open to changes; `instructions`: the organizers' own wording. */
  questions: { publishedAt: string; url: string; draft?: boolean; instructions?: string; items: { question: string; answers: string[]; note?: { text: string; url: string } }[] } | null;
  results: { publishedAt: string; url: string } | null;
};
const draftAnswers = ['Support', 'Oppose', 'Abstain'];
// Draft NU7.1 poll, post 47 of the timeline thread (10 Nov 2026, 18:16 UTC), copied as posted.
// The organizers asked for feedback before 15 Nov and said they may adjust it: re-read the thread before polling opens.
export const devFundPublished: DevFundPublication = {
  questions: {
    publishedAt: '2026-11-10', draft: true,
    url: 'https://forum.zcashcommunity.com/t/zcg-and-the-dev-fund-timeline-for-proposals-and-polling/58906/47',
    instructions: 'Please consider each proposal independently. You may support more than one proposal, including proposals that conflict with each other, if you would find any of those outcomes acceptable. The results will help us assess which proposals have broad support.',
    items: [
      // The draft's own description of this proposal predates the author's revision of 10 Nov.
      { question: 'Do you support the Wind Down Zcash Community Grants proposal?', answers: draftAnswers, note: {
        text: 'The proposal was revised on 10 Nov, after this draft was posted: it now also redirects ZCG’s 8% stream, and residual funds would go to the Future Dev and Legal Defense Fund Lockbox rather than the NSM.',
        url: 'https://forum.zcashcommunity.com/t/end-zcg-and-send-its-funds-to-the-nsm/58515/145' } },
      { question: 'Do you support the Future Dev and Legal Defense Fund proposal?', answers: draftAnswers },
      // The draft's own description of this proposal predates the owners' revision of 11 Nov.
      { question: 'Do you support the Zcash Adoption Pool (ZAP) proposal?', answers: draftAnswers, note: {
        text: 'The proposal was revised on 11 Nov, after this draft was posted: it now says the funds may also go to development, in a broad sense, that directly increases adoption, and not only to further disbursement.',
        url: 'https://github.com/zcash/zips/compare/ad90f2e5b7318338ac9490702c3b0f653a5643a8...28d7618d21971c747c4db3680755d816110acaf1' } },
      { question: 'Do you support maintaining ZCG’s existing funding and operations?', answers: draftAnswers },
      { question: 'Do you support reducing Zcash’s target block time from 25 seconds to 20 seconds as part of NU7.1, as described in this proposal?', answers: draftAnswers },
    ],
  },
  results: null,
};

// Posted by the coordinating organizations after the timeline (post 39 of its thread, 9 Nov 2026).
// `checkedAt` is when the thread was last read for the proposed questions; update it with each review.
const organizersPost = 'https://forum.zcashcommunity.com/t/zcg-and-the-dev-fund-timeline-for-proposals-and-polling/58906/39';
export const devFundNotices = {
  lateProposals: { postedAt: '2026-11-09', url: organizersPost, text: 'Proposals submitted after the deadline are not part of this round of polling: the coordinating organizations decided to uphold it.' },
  questions: { postedAt: '2026-11-09', url: organizersPost, checkedAt: '2026-11-10T02:58:00Z', text: 'On 9 Nov the organizers said the proposed questions and answer choices would follow.' },
  // Post 54 of the same thread (11 Nov 2026, 21:09 UTC). Shown only while the questions are a draft: replace them when the revised draft is posted.
  revisedDraft: { postedAt: '2026-11-11', url: 'https://forum.zcashcommunity.com/t/zcg-and-the-dev-fund-timeline-for-proposals-and-polling/58906/54', text: 'On 11 Nov the organizers said a revised draft would follow the next day, after one more day of comments.' },
} as const;

export const devFundTimeline = {
  title: 'ZCG / Dev Fund: proposals and polling',
  publishedAt: '2026-11-05',
  organizations: 'Project Tachyon, Shielded Labs, Valar Group, the Zcash Foundation and ZODL',
  steps: [
    { id: 'proposals', label: 'Proposal deadline', short: 'Proposals close', dates: '8 Nov', time: '23:59 UTC', summary: 'Anyone can submit a proposal until Sunday, 8 Nov at 23:59 UTC.', endsAt: '2026-11-08T23:59:00Z' },
    { id: 'questions', label: 'Proposed poll questions', short: 'Poll questions', dates: '9 Nov', time: null, summary: 'The proposed poll questions and possible answers are to be published for public feedback.', endsAt: '2026-11-10T00:00:00Z' },
    { id: 'discussion', label: 'Discussion and changes', short: 'Discussion', dates: '9 – 15 Nov', time: null, summary: 'The community can discuss the proposals and suggest changes to the poll questions and answer choices before polling begins.', endsAt: '2026-11-16T00:00:00Z' },
    { id: 'polling', label: 'Planned polling', short: 'Polling', dates: '16 – 30 Nov', time: null, summary: 'Polls for coinholders and community panels are to open on 16 Nov and close on Monday, 30 Nov at 23:59 UTC.', endsAt: '2026-11-30T23:59:00Z' },
  ],
} as const;

export function devFundPhase(now: number | null) {
  const [proposals, , discussion, polling] = devFundTimeline.steps;
  if (now === null || !Number.isFinite(now)) return { id: null, label: 'Published timeline' };
  if (now < Date.parse(proposals.endsAt)) return { id: proposals.id, label: 'Accepting proposals' };
  if (now < Date.parse(discussion.endsAt)) return { id: discussion.id, label: 'Discussion period' };
  if (now < Date.parse(polling.endsAt)) return { id: polling.id, label: 'Planned polling period' };
  return { id: null, label: 'Polling period ended' };
}

/** Before the clock is known, the published deadline has to be read as still open. */
export const devFundAcceptsProposals = (now: number | null) => now === null || !Number.isFinite(now) || now < Date.parse(devFundTimeline.steps[0].endsAt);

/** Steps still ahead; before the clock is known, every published step. */
export const devFundNextSteps = (now: number | null) => devFundTimeline.steps.filter(step => now === null || !Number.isFinite(now) || now < Date.parse(step.endsAt));

export type DevFundStepState = 'done' | 'current' | 'awaited' | 'next';
/** Where a step stands. A passed date is done, except the poll questions: they are only done once published. */
export function devFundStepState(step: { id: string; endsAt: string }, now: number | null, published: DevFundPublication = devFundPublished): DevFundStepState {
  if (now === null || !Number.isFinite(now)) return 'next';
  if (devFundPhase(now).id === step.id) return 'current';
  if (now < Date.parse(step.endsAt)) return 'next';
  return step.id === 'questions' && !published.questions ? 'awaited' : 'done';
}
