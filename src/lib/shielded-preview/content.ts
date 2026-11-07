export const REVIEWED = '2026-10-25';
export const sources = {
  roadmap: 'https://shieldedlabs.net/roadmap/',
  security: 'https://shieldedlabs.net/the-orchard-counterfeiting-vulnerability/',
  epoch: 'https://shieldedlabs.net/epoch-future-proof-cryptography-for-zcash/',
  governance: 'https://shieldedlabs.net/governance/',
  team: 'https://shieldedlabs.net/team/',
  projects: 'https://shieldedlabs.net/projects/',
  github: 'https://github.com/ShieldedLabs',
};

export const projects = [
  { id: 'crosslink', name: 'Crosslink', category: 'Consensus', status: 'In development', symbol: 'cross', description: 'Proof of Work + Proof of Stake with BFT finality.', purpose: 'A proposed consensus upgrade combining mining with staking and BFT finality.', scope: 'Consensus, staking semantics, feature-net testing and production readiness.', boundary: 'Feature-net progress is not a mainnet activation. The published productionization window is a target.', source: sources.roadmap, repos: ['crosslink_monolith', 'crosslink_book'], tags: ['PoW + PoS', 'Finality', 'Feature net'] },
  { id: 'epoch', name: 'Epoch', category: 'Cryptography', status: 'Research & design', symbol: 'orbit', description: 'Post-quantum cryptography for a future Zcash upgrade.', purpose: 'Develop high-assurance post-quantum cryptography for a future Zcash upgrade.', scope: 'Candidate designs, security assumptions, performance and formal verification.', boundary: 'Research targets are not shipped capabilities. Zcash is not described here as post-quantum today.', source: sources.epoch, repos: [], tags: ['Post-quantum', 'Formal verification', 'Research'] },
  { id: 'nsm', name: 'NSM', category: 'Sustainability', status: 'NU7 reference', symbol: 'cycle', description: 'Issuance changes for long-term network security.', purpose: 'Issuance changes designed to support network sustainability within the supply cap.', scope: 'NU7 deploys ZIP 235, which removes 60% of transaction fees from circulation, and ZIP 237, which keeps the halving schedule and reissues the NSM balance from 2031. ZIP 259 states that it does not deploy ZIP 233 or ZIP 234.', boundary: 'NU7 deployment follows ZIP 259. Status labels on individual ZIPs follow the ZIP repository.', source: 'https://shieldedlabs.net/nsm/', repos: ['nsm'], tags: ['ZIP 235', 'ZIP 237', 'Supply economics'] },
  { id: 'ironwood', name: 'Ironwood', category: 'Security', status: 'NU6.3 reference', symbol: 'shield', description: 'Making circulating-supply integrity independently verifiable.', purpose: 'Replace the vulnerable Orchard pool with a corrected pool and enforce its exit boundary.', scope: 'A coordinated ecosystem upgrade following the Orchard vulnerability.', boundary: 'Shared work across Project Tachyon, Valar Group, ZODL, the Zcash Foundation and Shielded Labs.', source: 'https://shieldedlabs.net/ironwood/', repos: ['sl-orchard'], tags: ['Supply integrity', 'Ecosystem collaboration'] },
  { id: 'zero', name: 'Zero', category: 'Infrastructure', status: 'Maintained software', symbol: 'cube', description: 'Software and support for Zcash infrastructure.', purpose: 'An open-source software suite with engineering support for ecosystem infrastructure.', scope: 'Exchanges, mining pools, wallet providers and node operators.', boundary: 'Repository activity alone is not a deployment or support-level guarantee.', source: 'https://shieldedlabs.net/zero/', repos: ['zero'], tags: ['Node infrastructure', 'Operator support'] },
  { id: 'fees', name: 'Dynamic Fees', category: 'Network economics', status: 'Engineering initiative', symbol: 'wave', description: 'Transaction fees that adapt to network conditions.', purpose: 'Explore market-driven, comparable-based transaction fees.', scope: 'Fee mechanics, modelling and implementation work.', boundary: 'Fork ancestry is excluded from Shielded Labs activity totals.', source: 'https://shieldedlabs.net/fees/', repos: ['zebra-dynamic-fees', 'fees-monolith'], tags: ['Fee market', 'Protocol design'] },
] as const;
export type Project = typeof projects[number];

export type Milestone = {
  date: string; name: string; detail: string; type: 'Engineering' | 'Security' | 'Research' | 'Governance';
  project: string; source: string; recordType: string; step?: string; governanceRecord?: string; context?: string;
};
export const MILESTONES_REVIEWED = '2026-11-06';
/** Last comparison of names, roles and photos with the official team page. */
export const TEAM_REVIEWED = '2026-11-05';
export const milestones: Milestone[] = [
  { date: '2024-12-08', name: 'Coinholders polled on the NSM', detail: 'A non-binding coinholder poll asks whether to include the NSM in NU7.', type: 'Governance', project: 'nsm', source: 'https://forum.zcashcommunity.com/t/coinholder-poll-nsm/49310/28', recordType: 'Coinholder poll', governanceRecord: 'poll:2024-12-nsm-coinholder-poll' },
  { date: '2025-03-21', name: 'Foundation in place', detail: 'Code structure and minimal functionality are in place, with no consensus changes.', type: 'Engineering', project: 'crosslink', source: sources.roadmap, recordType: 'Prototype milestone', step: 'Milestone 1' },
  { date: '2025-05-16', name: 'BFT prototype', detail: 'BFT functionality is added while Zcash’s existing consensus stays unaltered.', type: 'Engineering', project: 'crosslink', source: sources.roadmap, recordType: 'Prototype milestone', step: 'Milestone 2' },
  { date: '2025-08-28', name: 'Consensus integration', detail: 'Proof of work is first modified to respect the finality the BFT protocol provides.', type: 'Engineering', project: 'crosslink', source: sources.roadmap, recordType: 'Prototype milestone', step: 'Milestone 3' },
  { date: '2026-01-28', name: 'Staking semantics', detail: 'New transactions enable staking operations: delegations, PoS roster selection and rewards issuance.', type: 'Engineering', project: 'crosslink', source: sources.roadmap, recordType: 'Prototype milestone', step: 'Milestone 4' },
  { date: '2026-04-15', name: 'Pre-productionization', detail: 'Prototype design choices are revisited to plan the Mainnet readiness roadmap; the Productionization Phase follows.', type: 'Engineering', project: 'crosslink', source: sources.roadmap, recordType: 'Prototype milestone', step: 'Milestone 5' },
  { date: '2026-05-29', name: 'Preventive research finds a critical flaw', detail: 'Taylor Hornby discovers the Orchard vulnerability after Shielded Labs engaged him for ongoing security research.', type: 'Security', project: 'ironwood', source: sources.security, recordType: 'Vulnerability discovery' },
  { date: '2026-06-02', name: 'Coordinated response', detail: 'The disclosure reports completion of the emergency response coordinated by ZODL with the ecosystem.', type: 'Security', project: 'ironwood', source: sources.security, recordType: 'Emergency response' },
  { date: '2026-07-28', name: 'NU6.3 activates Ironwood', detail: 'The network upgrade activates at block 3,428,143, following a joint proposal by Shielded Labs, the Zcash Foundation, Tachyon Group, Valar Group and ZODL.', type: 'Security', project: 'ironwood', source: 'https://zips.z.cash/zip-0258', recordType: 'Network upgrade', governanceRecord: 'upgrade:NU6.3 (Ironwood)', context: 'https://shieldedlabs.net/ironwood-verifying-the-soundness-of-zcashs-circulating-supply/' },
  { date: '2026-10-01', name: 'Epoch introduced', detail: 'A dedicated cryptography team begins research into post-quantum designs and formal verification.', type: 'Research', project: 'epoch', source: sources.epoch, recordType: 'Research announcement' },
  { date: '2026-11-06', name: 'NU7 activates the NSM', detail: 'The network upgrade activates at block 3,543,405. It deploys ZIP 235, which removes 60% of transaction fees from circulation, and ZIP 237, which keeps the halving schedule and reissues the NSM balance from 2031.', type: 'Governance', project: 'nsm', source: 'https://zips.z.cash/zip-0259', recordType: 'Network upgrade', governanceRecord: 'upgrade:NU7', context: 'https://x.com/aquietinvestor/status/2118460712096080208' },
];

export const team = [
  { name: 'Jason McGee Stramaglia', role: 'Executive Director', group: 'Leadership' },
  { name: 'Zooko Wilcox', role: 'Chief Product Officer', group: 'Leadership' },
  { name: 'Nate Wilcox', role: 'Chief Technology Officer', group: 'Leadership' },
  { name: 'Mark Henderson', role: 'Engineering Manager', group: 'Engineering' },
  { name: 'Sam Smith', role: 'Engineer', group: 'Engineering' },
  { name: 'Andrew Reece', role: 'Engineer', group: 'Engineering' },
  { name: 'Phillip Trudeau-Tavara', role: 'Engineer', group: 'Engineering' },
  { name: 'Shoaib Ahmed', role: 'Engineer', group: 'Engineering' },
  { name: 'Ulrich Haböck', role: 'Chief Cryptographer', group: 'Cryptography' },
  { name: 'Luke Edwards', role: 'Cryptography Engineer', group: 'Cryptography' },
  { name: 'Suyash Bagad', role: 'Cryptography Engineer', group: 'Cryptography' },
  { name: 'Robert Fegler', role: 'Operations', group: 'Operations' },
];

export const improvements = [
  { number: '01', title: 'Consistent project pages', finding: 'Project descriptions, roadmap milestones and implementation activity currently live on separate pages.', action: 'Give every project a shared template: purpose, scope, status, people, evidence, next milestone and how to participate.', phase: 'Foundation' },
  { number: '02', title: 'Automatic event archiving', finding: 'The governance page still lists the September Q3 poll under “Upcoming Polls” in the October 25 review.', action: 'Move expired events into an archive automatically. Publish results only when verified, with dates and participation instructions.', phase: 'Foundation' },
  { number: '03', title: 'Add Epoch to the project index', finding: 'Epoch is announced in the blog and its team is listed, but it is absent from the reviewed project menu.', action: 'Add Epoch to the project index and connect its team, research updates and long-term milestones.', phase: 'Foundation' },
  { number: '04', title: 'Connect commits to releases', finding: 'Commits show code movement; readers still need the meaning and delivery status.', action: 'Refresh repository observations every five minutes. Add reviewed plain-language summaries, release evidence and clear stale-data states.', phase: 'Connected portal' },
  { number: '05', title: 'Participation guides', finding: 'The ecosystem has multiple routes for proposals, panels, grants and protocol feedback.', action: 'Create guided entry points, a shared calendar, accessible explainers and source-linked grant records using OpenZcash.', phase: 'Connected portal' },
  { number: '06', title: 'Impact reporting & recruitment', finding: 'The security response and new cryptography team are compelling evidence of organizational contribution.', action: 'Publish attributed impact stories, a monthly director brief and clear contributor pathways. Measure completed journeys and corrections, not just impressions.', phase: 'Expansion' },
  { number: '07', title: 'ZIPs and the governance process in one place', finding: 'Zcash Improvement Proposals live in a GitHub repository rendered elsewhere, and the governance process is explained only in forum posts and essays.', action: 'Publish the ZIPs inside the portal with status, owners and sources, and add a neutral “How it works” guide that explains who decides, how a proposal moves and where the Dev Fund debate stands.', phase: 'Connected portal' },
];
