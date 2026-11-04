// Published Q4 calendar, checked against OpenZcash and the FPF call on 2026-11-01.
// This schedule is separate from the completed Q3 ballots and payment records.
export const participationSources = {
  shieldedLabs: 'https://shieldedlabs.net/governance/',
  calendar: 'https://forum.zcashcommunity.com/t/q4-2026-coinholder-directed-retroactive-grant-program-call-for-proposals/58598',
  application: 'https://github.com/Financial-Privacy-Foundation/ZcashCoinholderGrantsProgram/issues/new?template=grant_application.yaml',
  applicationGuide: 'https://github.com/Financial-Privacy-Foundation/ZcashCoinholderGrantsProgram/blob/main/.github/ISSUE_TEMPLATE/grant_application.yaml',
  funding: 'https://zips.z.cash/zip-1016',
  zodl: 'https://zodl.com',
  zkool: 'https://github.com/hhanh00/zkool2',
  vizor: 'https://vizor.cash',
  zcap: 'https://zfnd.org/zcash-community-advisory-panel/',
  zechub: 'https://zechub.wiki',
  forum: 'https://forum.zcashcommunity.com',
} as const;

export const participationHref = '?view=governance&section=overview#governance-participation';
export const participationGuideId = 'guide:coinholder';
export const participationGuideSections = [
  { id: 'program-apply', label: 'Apply' },
  { id: 'program-voting', label: 'Vote' },
  { id: 'program-community', label: 'Community' },
  { id: 'program-governance', label: 'How it works' },
] as const;
export function participationGuideHref(anchor?: typeof participationGuideSections[number]['id']) {
  return `?view=governance&section=voting&record=${encodeURIComponent(participationGuideId)}${anchor ? `#${anchor}` : ''}`;
}

export const participationRound = {
  label: 'Q4 2026',
  reviewedAt: '2026-11-01',
  phases: [
    { id: 'submissions', label: 'Proposals', startsAt: '2026-10-30T00:00:00Z', endsAt: '2026-11-13T20:00:00Z', dates: '30 Oct – 13 Nov' },
    { id: 'review', label: 'Community review', startsAt: '2026-11-16T00:00:00Z', endsAt: '2026-12-16T20:00:00Z', dates: '16 Nov – 16 Dec' },
    { id: 'voting', label: 'Voting', startsAt: '2026-12-17T00:00:00Z', endsAt: '2026-12-29T20:00:00Z', dates: '17 – 29 Dec' },
  ],
} as const;

export function participationPhase(now: number | null) {
  const [submissions, review, voting] = participationRound.phases;
  if (now === null || !Number.isFinite(now)) return { id: null, label: 'Published schedule' };
  if (now < Date.parse(submissions.startsAt)) return { id: null, label: 'Proposals open 30 Oct' };
  if (now < Date.parse(submissions.endsAt)) return { id: submissions.id, label: 'Accepting proposals' };
  if (now < Date.parse(review.startsAt)) return { id: null, label: 'Review begins 16 Nov' };
  if (now < Date.parse(review.endsAt)) return { id: review.id, label: 'Community review' };
  if (now < Date.parse(voting.startsAt)) return { id: null, label: 'Voting begins 17 Dec' };
  if (now < Date.parse(voting.endsAt)) return { id: voting.id, label: 'Scheduled voting period' };
  return { id: null, label: 'Voting period ended' };
}
