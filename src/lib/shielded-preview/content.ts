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
  { id: 'crosslink', name: 'Crosslink', category: 'Consensus', status: 'In development', symbol: 'cross', description: 'Proof of Work + Proof of Stake. Faster finality.', purpose: 'A proposed consensus upgrade combining mining with staking and BFT finality.', scope: 'Consensus, staking semantics, feature-net testing and production readiness.', boundary: 'Feature-net progress is not a mainnet activation. The published productionization window is a target.', source: sources.roadmap, repos: ['crosslink_monolith', 'crosslink_book'], tags: ['PoW + PoS', 'Finality', 'Feature net'] },
  { id: 'epoch', name: 'Epoch', category: 'Cryptography', status: 'Research & design', symbol: 'orbit', description: 'Post-quantum cryptography for a future Zcash upgrade.', purpose: 'Develop high-assurance post-quantum cryptography for a future Zcash upgrade.', scope: 'Candidate designs, security assumptions, performance and formal verification.', boundary: 'Research targets are not shipped capabilities. Zcash is not described here as post-quantum today.', source: sources.epoch, repos: [], tags: ['Post-quantum', 'Formal verification', 'Research'] },
  { id: 'nsm', name: 'NSM', category: 'Sustainability', status: 'Proposal reference', symbol: 'cycle', description: 'Issuance changes for long-term network security.', purpose: 'Proposed issuance changes designed to support network sustainability within the supply cap.', scope: 'Voluntary contributions, issuance smoothing and fee burning through ZIPs 233–235.', boundary: 'This project summary does not certify the current activation status of individual ZIPs.', source: 'https://shieldedlabs.net/nsm/', repos: [], tags: ['ZIP 233–235', 'Supply economics'] },
  { id: 'ironwood', name: 'Ironwood', category: 'Security', status: 'NU6.3 reference', symbol: 'shield', description: 'Making circulating-supply integrity independently verifiable.', purpose: 'Replace the vulnerable Orchard pool with a corrected pool and enforce its exit boundary.', scope: 'A coordinated ecosystem upgrade following the Orchard vulnerability.', boundary: 'Shared work across Project Tachyon, Valar Group, ZODL, the Zcash Foundation and Shielded Labs.', source: 'https://shieldedlabs.net/ironwood/', repos: ['sl-orchard'], tags: ['Supply integrity', 'Ecosystem collaboration'] },
  { id: 'zero', name: 'Zero', category: 'Infrastructure', status: 'Maintained software', symbol: 'cube', description: 'Software and support for Zcash infrastructure.', purpose: 'An open-source software suite with engineering support for ecosystem infrastructure.', scope: 'Exchanges, mining pools, wallet providers and node operators.', boundary: 'Repository activity alone is not a deployment or support-level guarantee.', source: 'https://shieldedlabs.net/zero/', repos: ['zero'], tags: ['Node infrastructure', 'Operator support'] },
  { id: 'fees', name: 'Dynamic Fees', category: 'Network economics', status: 'Engineering initiative', symbol: 'wave', description: 'Transaction fees that adapt to network conditions.', purpose: 'Explore market-driven, comparable-based transaction fees.', scope: 'Fee mechanics, modelling and implementation work.', boundary: 'Fork ancestry is excluded from Shielded Labs activity totals.', source: 'https://shieldedlabs.net/fees/', repos: ['zebra-dynamic-fees'], tags: ['Fee market', 'Protocol design'] },
] as const;
export type Project = typeof projects[number];

export const milestones = [
  { date: '2025-03-21', name: 'Foundation in place', detail: 'Crosslink milestone 1: code structure and development processes.', type: 'Engineering', source: sources.roadmap },
  { date: '2025-05-16', name: 'BFT prototype', detail: 'Crosslink milestone 2: disconnected BFT functionality.', type: 'Engineering', source: sources.roadmap },
  { date: '2025-08-28', name: 'Consensus integration', detail: 'Crosslink milestone 3: PoW consensus respects BFT finality.', type: 'Engineering', source: sources.roadmap },
  { date: '2026-01-28', name: 'Staking semantics', detail: 'Crosslink milestone 4: staking operations in the prototype.', type: 'Engineering', source: sources.roadmap },
  { date: '2026-04-15', name: 'Toward production', detail: 'Crosslink milestone 5 completed; productionization phase follows.', type: 'Engineering', source: sources.roadmap },
  { date: '2026-05-29', name: 'Preventive research finds a critical flaw', detail: 'Taylor Hornby discovers the Orchard vulnerability after Shielded Labs engaged him for ongoing security research.', type: 'Security', source: sources.security },
  { date: '2026-06-02', name: 'Coordinated response', detail: 'The disclosure reports completion of the emergency response coordinated by ZODL with the ecosystem.', type: 'Security', source: sources.security },
  { date: '2026-10-01', name: 'Epoch introduced', detail: 'A dedicated cryptography team begins research into post-quantum designs and formal verification.', type: 'Research', source: sources.epoch },
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
