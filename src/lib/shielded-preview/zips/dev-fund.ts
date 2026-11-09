/** Reviewed public evidence, not a poll, endorsement by this portal, or an official ballot. */
import additional from './dev-fund-additional.json';
import communityStatements from './dev-fund-statements.json';
export const devFundReviewed = '2026-11-09';
export type FundProposal = {
  id: string; title: string; short: string; authors: string[];
  stage: 'Open draft' | 'Closed PR' | 'Withdrawn' | 'Baseline' | 'Earlier draft';
  group?: 'Funding' | 'Governance' | 'Voting';
  record?: string; pr?: number; revision: string; source: string; discussion: string;
  summary: string; stream: string; coinholder: string; treasury: string; implementation: string;
};
const forum = (topic: number, post = 1) => `https://forum.zcashcommunity.com/t/${topic}/${post}`;
const blob = (sha: string, file: string) => `https://github.com/zcash/zips/blob/${sha}/zips/${file}`;
const originalProposals: FundProposal[] = [
  { id: 'lockbox', short: 'Future Dev & Legal Defense', title: 'Future Dev and Legal Defense Fund Lockbox',
    authors: ['Sean Bowe', 'Zooko Wilcox', 'Jason McGee'], stage: 'Open draft', pr: 1428,
    record: 'pr-1428-draft-mcgee-future-dev-legal-defense-fund', revision: 'e2c7c3d5f83d60a468b5291759262cfa4c456df4',
    source: blob('e2c7c3d5f83d60a468b5291759262cfa4c456df4', 'draft-mcgee-future-dev-legal-defense-fund.md'), discussion: forum(58611),
    summary: 'Redirect ZCG’s stream to a new lockbox and contribute 50,000 ZEC from its treasury to the NSM.',
    stream: '8% to a new lockbox for the remaining stream term.', coinholder: '12% stream unchanged.',
    treasury: '50,000 ZEC to the NSM; ZCG retains the remainder and its grants program.',
    implementation: 'Network upgrade required. Spending from the new lockbox needs a future ZIP.' },
  { id: 'zap', short: 'Zcash Adoption Pool', title: 'Zcash Adoption Pool (ZAP)', authors: ['Daira-Emma Hopwood'],
    stage: 'Open draft', pr: 1431, record: 'pr-1431-draft-dairaemma-governance-zap', revision: 'e0677267f46c4de9dec28146132cba4668161cb2',
    source: blob('e0677267f46c4de9dec28146132cba4668161cb2', 'draft-dairaemma-governance-zap.md'), discussion: forum(58656),
    summary: 'Keep ZCG’s funding stream and refocus the grants program on broader ownership and use of ZEC.',
    stream: 'Existing value and duration retained under ZIP 214 Revision 3.', coinholder: 'No change specified.',
    treasury: 'ZCG assets become ZAP assets; existing administration requirements remain.',
    implementation: 'Changes the grants mandate and assessment requirements.' },
  { id: 'wind-down', short: 'Wind down ZCG', title: 'Winding Down Zcash Community Grants', authors: ['Tom Howard'],
    stage: 'Open draft', pr: 1423, record: 'pr-1423-draft-howard-wind-down-zcg', revision: '425f849ff7008b55cfc7a4441215d51167535ab6',
    source: blob('425f849ff7008b55cfc7a4441215d51167535ab6', 'draft-howard-wind-down-zcg.md'), discussion: forum(58515,120),
    summary: 'Stop new grants, honor existing commitments, and contribute residual ZCG funds to the NSM.',
    stream: 'Separate decision; this draft addresses the existing program and treasury.', coinholder: 'Unchanged.',
    treasury: 'Reserve approved commitments and limited closure costs; residual funds go to the NSM.',
    implementation: 'Requires legal instruments and approvals; does not itself change consensus rules.' },
  { id: 'no-change', short: 'Keep existing arrangements', title: 'Keep existing arrangements', authors: ['vaspholdings'],
    stage: 'Baseline', record: 'zip-1016', revision: 'Forum post 10 · 7 Nov 2026', source: forum(58906, 10), discussion: forum(58906, 10),
    summary: 'A requested no-change answer choice, distinct from abstaining. Not a new ZIP or confirmed ballot option.',
    stream: 'Retain the 8% ZCG stream until its scheduled expiry.', coinholder: 'Retain the 12% stream until its scheduled expiry.',
    treasury: 'No reallocation requested.', implementation: 'No new change requested.' },
  { id: 'nsm-stream', short: 'Redirect stream to NSM', title: 'Ending the ZCG Funding Stream in Favor of the NSM', authors: ['Sean Bowe'],
    stage: 'Withdrawn', pr: 1414, revision: '683f4b694f2ea37e092dd6c96f46ec32a6a197ff',
    source: blob('683f4b694f2ea37e092dd6c96f46ec32a6a197ff', 'draft-bowe-end-zcg-stream.md'), discussion: 'https://x.com/ebfull/status/2116188168005582914',
    summary: 'An earlier draft redirecting ZCG’s future stream to the NSM. The pull request was closed without merging.',
    stream: 'Remaining 8% redirected to the NSM.', coinholder: '12% allocation and duration unchanged.',
    treasury: 'Existing ZCG assets and grant-making rules unchanged.', implementation: 'Consensus changes proposed; PR closed on 30 Oct 2026.' },
  { id: 'taper', short: 'Dev Fund taper', title: 'Dev Fund taper', authors: ['Zcash Community Grants Committee'],
    stage: 'Withdrawn', revision: 'Forum proposal · withdrawal 3 Nov 2026', source: forum(58566), discussion: forum(58566, 84),
    summary: 'An earlier proposal to reduce grant streams gradually. The committee explicitly withdrew it.',
    stream: 'Proposed monthly reductions until the 2032 halving.', coinholder: 'Also tapered in the original proposal.',
    treasury: 'A contribution to the NSM was proposed, conditional on community support.', implementation: 'Not proceeding, per the committee’s withdrawal.' },
];
export const fundProposals: FundProposal[] = [...originalProposals, ...additional as FundProposal[]];
export const proposalGroup = (proposal: FundProposal) => proposal.group ?? 'Funding';
export const proposalTopics = {
  Funding: { color: '#f4b728', description: 'Streams, grants & treasury' },
  Governance: { color: '#ededed', description: 'Mandates, committees & accountability' },
  Voting: { color: '#a7a7a7', description: 'Participation, thresholds & signalling' },
};
export const proposalColor = (id: string) => proposalTopics[proposalGroup(fundProposals.find(p => p.id === id) ?? fundProposals[0])].color;
export const proposalStructure = (p: FundProposal) => p.stage === 'Baseline' ? 'Current rules reference' : isHistorical(p) ? 'Historical proposal' : 'Proposed change';


export type FundStatement = {
  id: string; proposal: string; person: string; name: string;
  kind: 'Support' | 'Concern' | 'Opposition' | 'Discussion'; date: string; url: string;
  text: string; context: string; author?: boolean; versionSource?: string;
  platform?: 'Forum' | 'X';
};
/** Selected dated statements. No inference from likes, job titles, or silence. */
export const fundStatements: FundStatement[] = [
  ...communityStatements as FundStatement[],
  { id: 'josh-lockbox', proposal: 'lockbox', person: 'jswihart', name: 'Josh Swihart', kind: 'Support', date: '2026-11-02T02:27:15Z', url: 'https://x.com/jswihart/status/2117081069241675924', platform: 'X',
    text: 'Explicitly moves from not opposing to endorsing the compromise proposed by Sean Bowe and Zooko.', context: 'Follow-up to his 30 Oct post. Supports that compromise; does not attest to later ZIP revisions.' },
  { id: 'barry-lockbox', proposal: 'lockbox', person: 'BarrySilbert', name: 'Barry Silbert', kind: 'Support', date: '2026-10-30T17:01:13Z', url: 'https://x.com/BarrySilbert/status/2116213847032049797', platform: 'X',
    text: 'Replies “agree” to Naval’s explicit support for the compromise.', context: 'One-word agreement in the announcement thread, not a standalone assessment of the ZIP or later revisions.' },
  { id: 'brian-lockbox', proposal: 'lockbox', person: 'inthepixels', name: 'Brian Cohen', kind: 'Concern', date: '2026-11-03T01:39:08Z', url: 'https://x.com/inthepixels/status/2117431349371908337', platform: 'X',
    text: 'Questions the precedent of redirecting already-received ZCG treasury funds, distinguishing this from changes to future funding.', context: 'Public analysis of the lockbox proposal. A governance concern, not a formal vote or a legal determination.' },
  { id: 'zooko-lockbox', proposal: 'lockbox', person: 'zooko', name: 'Zooko Wilcox', kind: 'Support', date: '2026-10-30T15:20:12Z', url: 'https://x.com/zooko/status/2116188427364303161', platform: 'X', author: true,
    text: 'Asks the community to support the Future Dev and Legal Defense Fund ZIP.', context: 'Co-author’s announcement-day statement. Kept separate from independent responses.' },
  { id: 'naval-lockbox', proposal: 'lockbox', person: 'naval', name: 'Naval', kind: 'Support', date: '2026-10-30', url: 'https://x.com/naval/status/2116191471930102246', platform: 'X',
    text: 'Expresses support for the compromise in a reply to Sean Bowe’s announcement.', context: 'Reply to the 30 Oct announcement; not a vote or endorsement of subsequent revisions.' },
  { id: 'bowe-announcement', proposal: 'lockbox', person: 'ebfull', name: 'Sean Bowe', kind: 'Support', date: '2026-10-30', url: 'https://x.com/ebfull/status/2116188168005582914', platform: 'X', author: true,
    text: 'Announces the replacement lockbox proposal and explicitly withdraws his earlier NSM-stream proposal.', context: 'Author announcement. Withdrawal applies to PR #1414, not to other authors’ proposals.' },
  { id: 'gguy-lockbox', proposal: 'lockbox', person: 'GGuy', name: 'GGuy', kind: 'Support', date: '2026-11-02', url: forum(58611, 52),
    text: 'Supports the ZIP’s NSM contribution while retaining ZCG’s security work.', context: 'Explicitly speaking personally, not for the ZCG committee.' },
  { id: 'bowe-lockbox', proposal: 'lockbox', person: 'ebfull', name: 'Sean Bowe', kind: 'Support', date: '2026-11-05', url: forum(58611, 74), author: true,
    text: 'Supports the lockbox compromise while leaving ZCG operating from its treasury.', context: 'Statement by a co-author; kept separate from independent responses.' },
  { id: 'zerodartz-lockbox', proposal: 'lockbox', person: 'zerodartz', name: 'zerodartz', kind: 'Concern', date: '2026-11-04', url: forum(58611, 71),
    text: 'Requests clarity on the split between development and legal defense before a vote.', context: 'A qualified assessment, not an unconditional endorsement.' },
  { id: 'fabacab-lockbox', proposal: 'lockbox', person: 'fabacab', name: 'fabacab', kind: 'Opposition', date: '2026-11-05', url: forum(58611, 72),
    text: 'Objects to ending the stream and redirecting it to a fund with undetermined uses.', context: 'Also identifies ZAP as an alternative.' },
  { id: 'emersonian-zap', author: true, proposal: 'zap', person: 'emersonian', name: 'emersonian', kind: 'Support', date: '2026-10-31', url: forum(58656, 7),
    text: 'Supports ZAP and argues that eligibility does not guarantee a grant.', context: 'Credited contributor to the revised draft shared on 5 Nov; excluded from independent counts. This statement addresses the opening draft.' },
  { id: 'strahn-zap', proposal: 'zap', person: 'strahncryptography', name: 'strahncryptography', kind: 'Opposition', date: '2026-10-31', url: forum(58656, 3),
    text: 'Opposes several proposed uses of the funding.', context: 'Historical response to the opening draft; not confirmation of a position on later edits.' },
];
export const fundRelations = [
  { from: 'lockbox', to: 'nsm-stream', label: 'Alternative for the funding stream', source: fundProposals[0].source },
  { from: 'lockbox', to: 'wind-down', label: 'Alternative where the proposals overlap', source: fundProposals[0].source },
  { from: 'wind-down', to: 'nsm-stream', label: 'Complementary treasury and stream decisions', source: fundProposals[2].source },
  { from: 'miner-signals', to: 'miner-original', label: 'Reworks the earlier miner-polling draft', source: 'https://github.com/zcash/zips/pull/1447' },
  { from: 'human-minimum', to: 'coin-quorum', label: 'Companion proposals; separately adoptable', source: additional.find(p => p.id === 'human-minimum')!.source },
];
export const proposalStatements = (id: string) => fundStatements.filter(item => item.proposal === id);
export const isHistorical = (p: FundProposal) => p.stage === 'Closed PR' || p.stage === 'Withdrawn' || p.stage === 'Earlier draft';
export const explorerKeys = ['topic', 'layout', 'focus', 'compare', 'dq', 'past', 'status', 'group', 'channel', 'panel'] as const;
/** Preserve the explorer on record/back and library filter navigation, never across sections. */
export function copyExplorerParams(current: URLSearchParams, target: URLSearchParams) {
  if (current.get('section') !== 'zips' || target.get('section') !== 'zips') return;
  for (const key of explorerKeys) { const value = current.get(key); if (value !== null) target.set(key, value); }
  if (!target.has('topic') && current.has('record') && !current.has('layout')) target.set('topic', 'library');
}
export function explorerState(params: URLSearchParams) {
  const ids = new Set(fundProposals.map(p => p.id));
  const compared = [...new Set((params.get('compare') ?? 'lockbox,zap').split(',').filter(id => ids.has(id)))].slice(0, 3);
  const status = ['all', 'current', 'historical'].includes(params.get('status') ?? '') ? params.get('status')! : params.get('past') === '0' ? 'current' : 'all';
  return {
    topic: params.get('topic') === 'library' ? 'library' : 'dev-fund',
    layout: !params.has('layout') || params.get('layout') === 'map' ? 'map' : params.get('layout') === 'compare' ? 'compare' : 'list',
    focus: ids.has(params.get('focus') ?? '') ? params.get('focus')! : 'lockbox',
    compared, query: params.get('dq') ?? '', status, past: status !== 'current',
    group: ['Funding', 'Governance', 'Voting'].includes(params.get('group') ?? '') ? params.get('group')! : 'all',
    panel: ['signals', 'timeline'].includes(params.get('panel') ?? '') ? params.get('panel')! : 'network',
    channel: ['Forum', 'X'].includes(params.get('channel') ?? '') ? params.get('channel')! : 'all',
  };
}
export function matchingProposals(query: string, past: boolean, group = 'all', status = 'all') {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return fundProposals.filter(p => (past || !isHistorical(p)) && (status !== 'historical' || isHistorical(p)) && (group === 'all' || proposalGroup(p) === group) && words.every(word => `${p.title} ${p.authors.join(' ')} ${p.pr ?? ''}`.toLowerCase().includes(word)));
}

/** Bounded manual discovery, never proof that other positions do not exist. */
export const proposalCoverage: Record<string, {forum: string; x: string; reviewedOn: string}> = Object.fromEntries(
  fundProposals.map(p => [p.id, {
    reviewedOn: devFundReviewed,
    forum: ['miner-original', 'miner-signals'].includes(p.id)
      ? 'No dedicated forum discussion located; related process discussion checked.'
      : ['coin-quorum', 'seven-seats', 'treasury-committee'].includes(p.id)
        ? 'Linked topic checked; only the author announcement was accessible.'
        : p.id === 'coinholder-elections'
          ? 'Current draft announcement checked. Older election debate is not counted as endorsement of this draft.'
          : 'Linked discussion reviewed for explicit positions. This remains a partial sample.',
    x: 'Public X search checked on 9 Nov (25 Oct–9 Nov window); only directly verified, proposal-specific statements are included.',
  }])
);

export const xCoverage = { reviewedOn: devFundReviewed, authorPost: 'https://x.com/ebfull/status/2116188168005582914', replies: 74, reposts: 112, likes: 469, views: 157365 };
/** Broader discussion is not evidence of a position on a specific draft. */
export const relatedXDiscussion = {
  name: 'Tyler Winklevoss', date: '2026-10-30T16:00:55Z', url: 'https://x.com/tyler/status/2116198675433336931',
  text: 'Supports ending the Dev Fund, quoting Josh’s broader proposal. This post does not endorse the lockbox compromise and is not counted in its support bar.',
};

/** One latest reviewed position per public account, excluding proposal authors.
 * These are source-sample counts, never electorate shares or identity proofs. */
export function independentPositions(id: string, channel = 'all') {
  const latest = new Map<string, FundStatement>();
  for (const item of proposalStatements(id).filter(s => !s.author && s.kind !== 'Discussion' && (channel === 'all' || (s.platform ?? 'Forum') === channel)).sort((a, b) => a.date.localeCompare(b.date))) latest.set(item.person.toLowerCase(), item);
  return [...latest.values()];
}
/** Activity ordering uses the same reviewed accounts as the visible bars. */
export function proposalsBySignals(proposals: FundProposal[], channel = 'all') {
  const counts = new Map(proposals.map(p => [p.id, independentPositions(p.id, channel).length]));
  return [...proposals].sort((a, b) => counts.get(b.id)! - counts.get(a.id)! || a.short.localeCompare(b.short, 'en'));
}
export const profileImages: Record<string, string> = {
  'Josh Swihart': '/governance-profiles/josh-swihart.jpg',
  'Barry Silbert': '/governance-profiles/barry-silbert.jpg',
  'Brian Cohen': '/governance-profiles/brian-cohen.jpg',
  'Tyler Winklevoss': '/governance-profiles/tyler-winklevoss.jpg',
  'vaspholdings': '/governance-profiles/vaspholdings.png',
  'Sean Bowe': '/governance-profiles/1c8dd25c234e.jpg',
  'Naval': '/governance-profiles/e86ad8c989c1.jpg',
  'Zooko Wilcox': '/governance-profiles/b312836c5cf8.jpg',
  'Jason McGee': '/governance-profiles/6d372c59323f.jpg',
  'Daira-Emma Hopwood': '/governance-profiles/bb4ff210bbaa.jpg',
  'Tom Howard': '/governance-profiles/cef198b49236.jpg',
  'Blake Benthall (emersonian)': '/governance-profiles/0a7b30b1b2a1.jpg',
  'Giacomo Barbieri': '/governance-profiles/8009f1cd5469.png',
  'Arya': '/governance-profiles/4ab2475373a1.jpg',
  'Marek': '/governance-profiles/ec16cd73f88a.jpg',
  'Kris Nuttycombe': '/governance-profiles/6f16909f284f.jpg',
  'GGuy': '/governance-profiles/d8a8f8b94990.png',
  'zerodartz': '/governance-profiles/f068f884c4a1.jpg',
  'fabacab': '/governance-profiles/14324c20e864.jpg',
  'emersonian': '/governance-profiles/6d836afce8a6.png',
  'strahncryptography': '/governance-profiles/25e79d8eecc1.png',
  'Zcash Community Grants Committee': '/governance-profiles/d2e40e6a59f0.jpg',
};

/** Authors' stated aims, paraphrased from each proposal's linked source; not assessed outcomes. */
export const proposalAims: Record<string, string> = {
  'lockbox': 'Reserve funding for future development and legal defense while contributing treasury funds to the NSM.',
  'zap': 'Broaden ZEC ownership and use through an adoption-focused grants mandate.',
  'wind-down': 'Honor existing commitments while transitioning away from ZCG and contributing residual funds to the NSM.',
  'no-change': 'Preserve the existing funding arrangements as an explicit answer choice.',
  'nsm-stream': 'Redirect the remaining stream toward long-term network sustainability through the NSM.',
  'taper': 'Provide a gradual transition by reducing funding streams over time.',
  'miner-original': 'Provide a reproducible way to collect miner sentiment.',
  'lock-weighted': 'Recognize long-term commitment by linking voting weight to locked ZEC.',
  'ecosystem-grants': 'Let contributors seek approval before undertaking ecosystem work.',
  'miner-signals': 'Make miner signalling reproducible with publicly defined polling rules.',
  'coin-quorum': 'Require broader coin participation than the existing quorum threshold.',
  'human-minimum': 'Require a minimum number of human participants alongside the coin threshold.',
  'member-grants': 'Reduce conflicts of interest by barring grants to sitting committee members.',
  'seven-seats': 'Broaden committee capacity and reduce the impact of individual recusals.',
  'treasury-committee': 'Separate treasury management from grant selection with a published plan and limits.',
  'town-square': 'Keep a durable, searchable public record of funded organizations’ announcements.',
  'coinholder-elections': 'Allow coinholders to elect committee members without joining a membership panel.',
};
