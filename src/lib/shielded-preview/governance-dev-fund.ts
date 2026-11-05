// Published 5 Nov 2026 as "ZCG and the Dev Fund: Timeline for Proposals and Polling".
// Dates and rules follow that text. Fill in `devFundPublished` only from what its authors publish.
export const devFundSources = {
  timeline: 'https://forum.zcashcommunity.com/t/zcg-and-the-dev-fund-timeline-for-proposals-and-polling/58906',
  post: 'https://x.com/aquietinvestor/status/2118369236636869070',
  zip0: 'https://zips.z.cash/zip-0000',
  forum: 'https://forum.zcashcommunity.com',
} as const;

export const devFundLane = 'dev-fund';
export const devFundHref = (section: 'proposals' | 'voting') => `?view=governance&section=${section}&lane=${devFundLane}`;

export type DevFundPublication = {
  questions: { publishedAt: string; url: string; items: { question: string; answers: string[] }[] } | null;
  results: { publishedAt: string; url: string } | null;
};
export const devFundPublished: DevFundPublication = { questions: null, results: null };

export const devFundTimeline = {
  title: 'ZCG / Dev Fund: proposals and polling',
  publishedAt: '2026-11-05',
  organizations: 'Project Tachyon, Shielded Labs, Valar Group, the Zcash Foundation and ZODL',
  steps: [
    { id: 'proposals', label: 'Proposal deadline', dates: '8 Nov', time: '23:59 UTC', summary: 'Anyone can submit a proposal until Sunday, 8 Nov at 23:59 UTC.', endsAt: '2026-11-08T23:59:00Z' },
    { id: 'questions', label: 'Proposed poll questions', dates: '9 Nov', time: null, summary: 'The proposed poll questions and possible answers are to be published for public feedback.', endsAt: '2026-11-10T00:00:00Z' },
    { id: 'discussion', label: 'Discussion and changes', dates: '9 – 15 Nov', time: null, summary: 'The community can discuss the proposals and suggest changes to the poll questions and answer choices before polling begins.', endsAt: '2026-11-16T00:00:00Z' },
    { id: 'polling', label: 'Planned polling', dates: '16 – 30 Nov', time: null, summary: 'Polls for coinholders and community panels are to open on 16 Nov and close on Monday, 30 Nov at 23:59 UTC.', endsAt: '2026-11-30T23:59:00Z' },
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

/** Steps still ahead; before the clock is known, every published step. */
export const devFundNextSteps = (now: number | null) => devFundTimeline.steps.filter(step => now === null || !Number.isFinite(now) || now < Date.parse(step.endsAt));
