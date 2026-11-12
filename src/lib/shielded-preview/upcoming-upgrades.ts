// Network upgrades that are being discussed and have no deployment ZIP or activation height yet.
// Everything here is somebody's proposal or statement: record who said it, when and where, and nothing more.
// When one activates, add it to `upgrades` in governance-data/record.json and remove it here; a test fails until then.
import { devFundLane, devFundTimeline } from './governance-dev-fund';

const post = (topic: number, number?: number) => `https://forum.zcashcommunity.com/t/${topic}${number ? `/${number}` : ''}`;
const pull = (number: number) => `https://github.com/zcash/zips/pull/${number}`;

export type UpgradeDocument = {
  label: string;
  /** Id of the entry in the bundled ZIP library, when the specification is there. */
  record?: string;
  /** A page of this portal that already covers it. */
  portal?: typeof devFundLane;
  /** A specification or thread kept outside the ZIP library. */
  url?: string;
};
export type UpgradeCandidate = {
  id: string;
  title: string;
  /** What the change would do, in the terms of its source. */
  summary: string;
  /** Who put it forward for this upgrade, and when. */
  proposedBy: string;
  source: string;
  /** Where its specification stands. */
  documents: UpgradeDocument[];
  /** `listed`: in the proposal or draft poll for this upgrade. `raised`: named for it by someone else. */
  standing: 'listed' | 'raised';
  note?: string;
};
export type UpgradeView = { who: string; date: string; text: string; url: string };
export type UpcomingUpgrade = {
  id: string;
  name: string;
  stage: 'Under discussion';
  /** One line for the list of upgrades. */
  brief: string;
  /** The date that matters next, as its source states it. */
  fact: { name: string; value: string };
  summary: string;
  decided: string;
  /** Where Shielded Labs is itself a party to what is discussed. */
  disclosure?: string;
  listedHeading: string;
  candidates: UpgradeCandidate[];
  views: UpgradeView[];
  sources: { label: string; url: string }[];
  checkedAt: string;
};

// "Vision for January 2027", posted by ValarDragon on 9 Nov 2026. The seven items and their order are the post's own.
const nu8List = post(59124);
const nu8Author = 'ValarDragon, 9 Nov 2026';
// "Activate ZIP 68 and clarify ZIP 203", posted by strahncryptography on 4 Nov 2026.
const lockTime = {
  title: 'Relative lock-time (ZIP 68) and a clarification of ZIP 203',
  summary: 'Asks to ratify ZIP 68, allowing relative time locks, and to clarify and enforce nLockTime for all transactions.',
  documents: [{ label: 'ZIP 68 · Draft', record: 'zip-0068' }, { label: 'ZIP 203 · Final', record: 'zip-0203' }, { label: 'Proposal thread', url: post(58841) }],
};

export const upcomingUpgrades: UpcomingUpgrade[] = [
  {
    id: 'nu8', name: 'NU8', stage: 'Under discussion',
    brief: 'Seven changes proposed on 9 Nov 2026',
    fact: { name: 'Target proposed', value: 'Late Jan 2027' },
    summary: 'On 9 Nov 2026 ValarDragon posted a list of seven changes proposed for NU8, with a target of late January. It is one proposal: no scope has been agreed.',
    decided: 'Nothing. No deployment ZIP, activation height or poll for NU8 appears in the sources reviewed.',
    disclosure: 'Shielded Labs staff are among the authors of the NSM ZIPs, which one item on this list would change.',
    listedHeading: 'The list posted on 9 Nov',
    candidates: [
      { id: 'tachyon', title: 'Tachyon shielded pool', summary: 'Release of the Tachyon shielded pool, a new pool from Project Tachyon.', proposedBy: nu8Author, source: nu8List, standing: 'listed',
        documents: [{ label: 'ZIP drafts in Project Tachyon’s fork', url: 'https://github.com/tachyon-zcash/zips/pull/5' }],
        note: 'On 9 Nov str4d wrote in the thread that these drafts had not yet been opened in zcash/zips.' },
      { id: 'tx-format', title: 'Extensible transaction format', summary: 'An encoding for V7 transactions intended to reduce the impact of future changes to the transaction format.', proposedBy: nu8Author, source: nu8List, standing: 'listed',
        documents: [{ label: 'ZIP 248 · Draft', record: 'zip-0248' }] },
      { id: 'block-size', title: 'Maximum block size from 2 MB to 8 MB', summary: 'Raises the block size limit. A draft for 3 MB is open; the proposer says a proposal for 8 MB or higher would follow, depending on implementation status at polling time.', proposedBy: nu8Author, source: nu8List, standing: 'listed',
        documents: [{ label: 'Draft ZIP for 3 MB · PR #1448', record: 'pr-1448-draft-valargroup-3-mb-block-size' }] },
      { id: 'pq-opcodes', title: 'Post-quantum transparent opcodes', summary: 'Adds transparent opcodes for SPHINCS signature variants at 128-bit and 192-bit security.', proposedBy: nu8Author, source: nu8List, standing: 'listed',
        documents: [{ label: 'No ZIP identified; the proposer says one is planned' }] },
      { id: 'nsm-date', title: 'NSM redistribution date', summary: 'Moves the NSM redistribution date, in the protocol, to around Zcash’s seventh halving.', proposedBy: nu8Author, source: nu8List, standing: 'listed',
        documents: [{ label: 'No ZIP identified for this change' }] },
      { id: 'sapling-deposits', title: 'A date to end Sapling deposits', summary: 'Fixes in the protocol a date after which no new value can be added to the Sapling pool; transfers within it and withdrawals stay enabled.', proposedBy: nu8Author, source: nu8List, standing: 'listed',
        documents: [{ label: 'Draft ZIP · PR #1415', record: 'pr-1415-draft-valargroup-sapling-disable-deposits' }] },
      { id: 'branch-id', title: 'Consensus branch ID updates', summary: 'Removes the consensus branch ID update at each network upgrade; the proposer says it breaks wallets at every upgrade.', proposedBy: nu8Author, source: nu8List, standing: 'listed',
        documents: [{ label: 'No ZIP identified' }] },
      { id: 'block-10s', title: '10-second block target spacing', summary: 'Changes the block target spacing from 25 seconds to 10 seconds in NU8, scaling the block subsidy, the block size limit and the shielded action limits by the same factor.', proposedBy: 'Draft ZIP by Marek, which names NU8', source: pull(1430), standing: 'raised',
        documents: [{ label: 'Draft ZIP · PR #1430', record: 'pr-1430-draft-marek-10s-block-target-spacing' }] },
      { id: 'zip-68-203', ...lockTime, proposedBy: 'strahncryptography, who asked on 10 Nov 2026 that the list consider it', source: post(59124, 7), standing: 'raised' },
    ],
    views: [
      { who: 'maxdesalle', date: '2026-11-09', url: post(59124, 2), text: 'Posted full support for the list. seernet and Avery_Taylor did the same later in the thread.' },
      { who: 'str4d', date: '2026-11-09', url: post(59124, 3), text: 'Says 2.5 months is not much time for Tachyon and supports deploying ZIP 248 as soon as possible. Says a block size increase needs an analysis of its impact on wallets that use the light client protocol, and that removing the consensus branch ID needs a replacement that prevents transaction replays across forks.' },
      { who: 'nuttycom', date: '2026-11-10', url: post(59124, 8), text: 'Prefers ZIP 248 signing variants that let users opt out of signing over the consensus branch ID and the expiry height, with the current signing algorithm kept as the default.' },
      { who: 'strahncryptography', date: '2026-11-10', url: post(59124, 9), text: 'Supports removing the branch ID updates, saying NU7 required every wallet to update although it changed nothing in how transactions are built, signed and broadcast.' },
      { who: 'dismad', date: '2026-11-10', url: post(59124, 16), text: 'Says upgrades are coming too often and suggests at least three months between them, so that wallets and the rest of the ecosystem can keep up.' },
      { who: 'seernet', date: '2026-11-11', url: post(59124, 17), text: 'Replies that there is no need to slow down: asks for better beta testing so that what ships works, and says upgrades should go as fast as is safe, a pace left to the developers.' },
    ],
    sources: [{ label: '“Vision for January 2027”, forum thread', url: nu8List }],
    checkedAt: '2026-11-12',
  },
  {
    id: 'nu7-1', name: 'NU7.1', stage: 'Under discussion',
    brief: 'Draft poll planned for 16 – 30 Nov 2026',
    fact: { name: 'Planned polling', value: '16 – 30 Nov 2026' },
    summary: `The draft poll that the coordinating organizations posted on 10 Nov 2026 is titled “Draft NU7.1 Poll”. It asks about four options for Zcash Community Grants and its funding stream, and about one protocol change. The organizations are ${devFundTimeline.organizations}.`,
    decided: 'Nothing yet. Polling is planned for 16 – 30 Nov 2026 and the draft questions can still change. A poll informs the decision and does not activate an upgrade. No deployment ZIP or activation height for NU7.1 appears in the sources reviewed.',
    disclosure: 'Shielded Labs is one of the organizations coordinating this poll.',
    listedHeading: 'In the draft poll',
    candidates: [
      { id: 'dev-fund', title: 'ZCG / Dev Fund outcome', summary: 'Questions 1 to 4 ask whether voters support each of four options: winding down Zcash Community Grants, the Future Dev and Legal Defense Fund, the Zcash Adoption Pool, or maintaining ZCG’s existing funding and operations.', proposedBy: 'Draft poll by the coordinating organizations, 10 Nov 2026', source: post(58906, 47), standing: 'listed',
        documents: [{ label: 'Calendar, draft questions and proposals', portal: devFundLane }] },
      { id: 'block-20s', title: 'Block target spacing from 25 to 20 seconds', summary: 'Reduces the block target spacing from 25 to 20 seconds and lowers the per-block shielded action limits by 20%, keeping the 2 MB block size limit.', proposedBy: 'ValarDragon, 8 Nov 2026; question 5 of the draft poll', source: post(59035), standing: 'listed',
        documents: [{ label: 'Draft ZIP · PR #1437', record: 'pr-1437-draft-valargroup-20-second-block-target-spacing' }] },
      { id: 'zip-68-203', ...lockTime, proposedBy: 'strahncryptography, who asked on 5 Nov 2026 to include it in a potential NU7.1', source: post(58906, 7), standing: 'raised', note: 'Not in the draft poll.' },
      { id: 'block-size-3mb', title: 'Block size limit from 2 MB to 3 MB', summary: 'Increases the block size limit from 2,000,000 to 3,000,000 bytes in a network upgrade after NU7.', proposedBy: 'Draft ZIP by Dev Ojha and Evan Forbes; on 9 Nov 2026 ValarDragon wrote that it was written with an expedited NU7.1 in mind', source: nu8List, standing: 'raised', note: 'Not in the draft poll.',
        documents: [{ label: 'Draft ZIP · PR #1448', record: 'pr-1448-draft-valargroup-3-mb-block-size' }] },
    ],
    views: [],
    sources: [{ label: 'Draft NU7.1 poll', url: post(58906, 47) }, { label: 'Timeline for proposals and polling', url: post(58906) }, { label: '20-second block spacing proposal', url: post(59035) }],
    checkedAt: '2026-11-12',
  },
];

export const upcomingUpgradeId = (upgrade: Pick<UpcomingUpgrade, 'name'>) => `upgrade:${upgrade.name}`;
export const findUpcomingUpgrade = (id: string | null | undefined) => upcomingUpgrades.find(upgrade => upcomingUpgradeId(upgrade) === id) ?? null;
