import type { GovernanceSection } from './governance-sections';

/** Content of the "How it works" guide. Facts carry their source in the Sources list; dated statements name the date. */
export type ProcessLink = { label: string; href: string } | { label: string; section: GovernanceSection; record?: string; lane?: string };
export type ProcessCell = string | ProcessLink;
export type ProcessBlock =
  | { kind: 'p'; lead?: string; text: string }
  | { kind: 'list'; ordered?: boolean; items: { title?: string; text: string }[] }
  | { kind: 'table'; caption: string; columns: string[]; rows: ProcessCell[][] }
  | { kind: 'links'; items: ProcessLink[] }
  | { kind: 'filters'; lead: string; items: { title?: string; text: string }[] };
export type ProcessSection = { id: string; title: string; blocks: ProcessBlock[] };

const zip = (number: number, label = `ZIP ${number}`): ProcessLink => ({ label, section: 'ZIPs', record: `zip-${String(number).padStart(4, '0')}` });
const essay = (record: string, label: string): ProcessLink => ({ label, href: `?view=blog&section=all&record=${record}` });

export const governanceProcess: {
  reviewedAt: string; title: string; summary: string; facts: { name: string; value: string }[]; sections: ProcessSection[]; sources: { label: string; href: string }[];
} = {
  reviewedAt: '2026-11-14',
  title: 'How Zcash governance works',
  summary: 'Who decides, how a proposal moves from an idea to activation, and where the Dev Fund debate stands.',
  facts: [{ name: 'Decision basis', value: 'Rough consensus' }, { name: 'Proposal format', value: 'ZIP' }, { name: 'Final say', value: 'Whoever runs the software' }],
  sections: [
    { id: 'in-one-minute', title: 'In one minute', blocks: [
      { kind: 'filters', lead: 'No single organization runs Zcash. A change becomes real only after three filters: the community reaches rough consensus, development organizations implement it, and the people who run the network, including miners, exchanges, node operators and wallets, choose to install the new version.', items: [
        { title: 'Anyone can propose', text: 'a change by writing a ZIP (Zcash Improvement Proposal) and opening a public discussion on the Zcash Forum.' },
        { title: 'The community signals', text: 'its view through discussion and polls: community panels such as ZCAP, and ZEC-weighted coinholder votes. Polls are signals, not binding decisions.' },
        { title: 'Development organizations interpret', text: 'the result. Without rough consensus nothing changes and the protocol stays as it is.' },
        { title: 'With consensus,', text: 'the teams implement the change in the node software and schedule a network upgrade at a block height.' },
        { title: 'The network has the final say.', text: 'If part of the network refuses the new version, the chain can split.' },
      ] },
      { kind: 'links', items: [{ label: 'Polls and network upgrades', section: 'Voting', lane: 'archive' }, { label: 'Read the ZIPs', section: 'ZIPs' }] },
    ] },
    { id: 'who-does-what', title: 'Who does what', blocks: [
      { kind: 'p', text: 'Power is spread out. The people who write code do not decide alone, the organizations that hold funds do not decide alone, and a vote does not oblige anyone to install anything.' },
      { kind: 'table', caption: 'Roles in Zcash governance', columns: ['Who', 'What they do', 'What they cannot do alone'], rows: [
        ['Development organizations: Zcash Foundation, ZODL, Shielded Labs, Project Tachyon, Valar Group', 'Write and review ZIPs, implement the code, draft the poll questions, interpret the results and set the activation height of a network upgrade', 'Force the network to adopt a change'],
        ['Zcash Foundation', 'Maintains Zebra, the reference node, and has historically run ZCAP', 'Change the protocol on its own'],
        ['Shielded Labs', 'Donation-funded organization that proposes changes such as the NSM, and one of the key-holder organizations of the coinholder fund', 'Change the protocol on its own'],
        ['Zcash Community Grants (ZCG)', 'Committee that distributes the 8% block reward share as milestone-based grants', 'Change its own share of the Dev Fund'],
        ['Coinholders', 'Vote with ZEC weight in polls and in the coinholder grants program, which receives the 12% share', 'Bind anyone: votes are signals, except grant decisions, which follow the program rules'],
        ['ZCAP and other panels', 'Community advisory panels, alongside ZecHub, the Engineering Caucus and regional communities, that answer polls and elect the ZCG committee', 'Decide on their own'],
        ['ZIP editors', 'Review drafts for content and format, assign numbers and merge. By consensus among themselves they may reject a draft or an update on the grounds listed in ZIP 0, and they approve every change of status except an owner’s move between Draft and Withdrawn', 'Refuse publication without a ground from ZIP 0 and an explanation, override an owner’s objection without a public rationale, or activate a change: that takes implementation and adoption by the network'],
        ['Whoever runs the network: miners, node operators, exchanges, wallets, users', 'Choose which software to run. This is where a rule becomes real', 'Nothing. This is the final say'],
      ] },
      { kind: 'p', text: 'ZIP 0 names the current ZIP editors and their affiliations, Shielded Labs among them, requires each to declare conflicts of interest, and notes that reviewing proposals for security, correctness or implementability is not their primary responsibility.' },
      { kind: 'p', text: 'Until the second halving in 2024, the trademark agreement between the Electric Coin Company and the Zcash Foundation worked as a two-of-two model: both had to agree to any protocol change. ECC withdrew from that agreement around the halving, and since then rough consensus is measured across several panels and the coinholder polls.' },
      { kind: 'links', items: [{ label: 'ZCAP panel and comparison', section: 'ZCAP' }, { label: 'Grant records', section: 'Grants' }, essay('zcash-governance-is-a-superpower', 'Essay: Zcash Governance Is a Superpower')] },
    ] },
    { id: 'from-idea-to-activation', title: 'From idea to activation', blocks: [
      { kind: 'p', text: 'A proposal passes through seven stages and can stop at any of them. Writing code or publishing a ZIP is not enough to change the protocol.' },
      { kind: 'list', ordered: true, items: [
        { title: 'Idea and forum debate.', text: 'Someone opens a topic on the community forum and argues for the change.' },
        { title: 'Draft ZIP.', text: 'The proposal is written in the ZIP format and sent as a pull request to the zcash/zips repository. At this point it is a draft without a number. The ZIP editors typically review it for content and format and suggest changes, which its owners may decline; by consensus they may reject it on the grounds listed in ZIP 0.' },
        { title: 'Public discussion.', text: 'The community comments, competing proposals appear, and the authors revise the text.' },
        { title: 'Sentiment polls.', text: 'The development organizations draft the questions and options, publish them for feedback, and then the panels and the coinholders vote.' },
        { title: 'Reading the consensus.', text: 'The organizations interpret the result. Without rough consensus no proposal advances and the protocol stays as it is.' },
        { title: 'Implementation and network upgrade.', text: 'With consensus, the teams implement the change in the Zebra and Zakura nodes and pick an activation height. Recent example: NU6.3 (Ironwood) activated at block 3,428,143 on 28 July 2026.' },
        { title: 'Adoption.', text: 'The change only counts if miners, exchanges, node operators and wallets install the new version before the activation height.' },
      ] },
      { kind: 'p', text: 'Polls are not binding. They feed rough consensus because Zcash has no formal on-chain governance. Coinholder participation grew from a few hundred thousand ZEC in the first polls to more than 2.3 million ZEC in the most recent one, according to the Shielded Labs essay linked below.' },
      { kind: 'links', items: [{ label: 'Network upgrade records', section: 'Voting', lane: 'upgrades' }, { label: 'Poll archive', section: 'Voting', lane: 'archive' }, essay('thoughts-on-sentiment-polling-and-governance', 'Essay: Thoughts on Sentiment Polling and Governance')] },
    ] },
    { id: 'what-a-zip-is', title: 'What a ZIP is and how to read one', blocks: [
      { kind: 'p', text: 'A ZIP (Zcash Improvement Proposal) describes a change precisely enough to become code. It is the bill, not the law: approving the text activates nothing.' },
      { kind: 'list', items: [
        { title: 'Where they live:', text: 'in the zcash/zips repository on GitHub. ZIP 0 describes the process itself.' },
        { title: 'Types:', text: 'consensus ZIPs change network rules and need a network upgrade; process ZIPs cover governance and the Dev Fund (the 1000 series); informational and standards ZIPs cover wallets and interoperability.' },
        { title: 'Lifecycle:', text: 'Draft, Proposed, then Implemented and Final for consensus and standards ZIPs, or usually Active for process and informational ones. Withdrawn means the owners retired it; Rejected marks a ZIP with no progress for a year; Obsolete and Reserved (a number held before a ZIP is published) also exist.' },
        { title: 'From Draft to Proposed:', text: 'ZIP 0 asks that the owner consider the ZIP complete and that there be rough consensus on the forums, validated by consensus among the ZIP editors. A ZIP with significant security or privacy implications also needs an independent security review first. Proposed is not activation.' },
        { title: 'Drafts have no number.', text: 'The file is named draft-<author>-<topic> until the editors assign one.' },
      ] },
      { kind: 'table', caption: 'ZIPs that explain the current moment', columns: ['ZIP', 'Topic'], rows: [
        [zip(0), 'The ZIP process: how proposals are written, numbered and advanced'],
        [zip(1015), 'The current Dev Fund: 8% to ZCG and 12% to a lockbox'],
        [zip(1016), 'Community and coinholder funding model: the lockbox becomes a coinholder-controlled fund with quarterly votes'],
        [zip(214), 'Addresses and dates of the funding streams'],
      ] },
      { kind: 'p', text: 'Many important proposals spend weeks as open pull requests waiting for editor attention. This portal renders those pull requests too, as unofficial previews labelled with their pull request number and commit, so they can be read and discussed before the merge. The normative text remains the repository.' },
      { kind: 'links', items: [{ label: 'Numbered ZIPs', section: 'ZIPs', lane: 'zips' }, { label: 'Unnumbered drafts', section: 'ZIPs', lane: 'drafts' }, { label: 'Open pull requests, rendered', section: 'ZIPs', lane: 'proposals' }] },
    ] },
    { id: 'dev-fund-and-zcg', title: 'The Dev Fund and ZCG: where things stand', blocks: [
      { kind: 'p', lead: 'As of 14 November 2026.', text: 'Nothing has been decided. Polling is planned for 16 to 30 Nov. If no proposal passes, the current rules continue until the third halving in 2028, when the Dev Fund ends and the full block reward goes to miners.' },
      { kind: 'p', lead: 'How it works today.', text: 'The Dev Fund is a protocol rule that sets aside 20% of each block: 8% to ZCG and 12% to the coinholder-controlled fund (ZIPs 1015 and 1016). The streams end at block 4,406,400, the third halving. The Dev Fund and the grant programs are different things: if the Dev Fund ended tomorrow, ZCG and the coinholder program would keep the balances they already hold.' },
      { kind: 'table', caption: 'Proposals on the table, all draft ZIPs readable under ZIPs in this portal', columns: ['Proposal', 'Author', 'What it does'], rows: [
        [{ label: 'Future Dev and Legal Defense Fund Lockbox (PR 1428, merged as a draft on 11 Nov)', href: 'https://github.com/zcash/zips/pull/1428' }, 'aquietinvestor', 'Ends the ZCG stream and sends the same 8% to a new lockbox for future development and legal defense; ZCG removes 50,000 ZEC from circulation, credited to the NSM'],
        [{ label: 'Winding Down Zcash Community Grants (PR 1423)', href: 'https://github.com/zcash/zips/pull/1423' }, 'thowar2', 'Winds ZCG down gradually; since a 10 Nov revision, also redirects its 8% stream and residual funds to the Future Dev and Legal Defense Fund Lockbox'],
        [{ label: 'Zcash Adoption Pool, ZAP (PR 1431, merged as a draft on 13 Nov)', href: 'https://github.com/zcash/zips/pull/1431' }, 'daira', 'Keeps ZCG’s 8% stream and its treasury, and refocuses the grants program on wider ownership and use of ZEC'],
        ['Keep existing arrangements (question 4 of the draft poll)', 'vaspholdings', 'The status quo: ZCG keeps its 8% stream until the 2028 halving, with its treasury and operations unchanged'],
        ['Drafts submitted after 8 Nov', 'Several authors', 'Not part of this round of polling: the organizers kept the deadline'],
      ] },
      { kind: 'p', lead: 'Points of friction on the forum:', text: 'whether it is legitimate to move balances ZCG already holds, how the share was chosen, the lack of a dollar cap, and the pace, with some participants asking for at least three months of debate.' },
      { kind: 'list', ordered: true, items: [
        { title: 'Done:', text: 'proposals closed on 8 Nov. The organizers posted draft poll questions on 10 Nov and a second version on 13 Nov.' },
        { title: 'Now:', text: 'comments on the questions, which the organizers plan to make final by 15 Nov.' },
        { text: 'Community panels and coinholders vote from 16 to 30 Nov. Each proposal is its own question, answered Support, Oppose or Abstain.' },
        { text: 'The organizations read the result. Without consensus, nothing changes. If more than one proposal has broad support, the organizers say they may hold a runoff poll.' },
        { text: 'With consensus, the change enters a future network upgrade with an activation height announced in advance.' },
      ] },
      { kind: 'p', text: 'The draft poll asks about each proposal separately and tells voters to consider each one independently: they may support more than one, including proposals that conflict with each other.' },
      { kind: 'links', items: [{ label: 'Dev Fund calendar and draft questions', section: 'Voting', lane: 'dev-fund' }, { label: 'Forum thread: Future Dev and Legal Defense Fund ZIP', href: 'https://forum.zcashcommunity.com/t/future-dev-and-legal-defense-fund-zip/58611' }, { label: 'ZCG applications under review', section: 'Proposals', lane: 'review' }, essay('thoughts-on-the-dev-fund', 'Essay: Thoughts on the Dev Fund')] },
    ] },
    { id: 'chain-fork', title: 'Could there be a chain fork?', blocks: [
      { kind: 'p', text: 'Yes. It is possible by design, but unlikely while the consensus process works, because a contested fork is expensive for every side.' },
      { kind: 'list', items: [
        { title: 'Every Zcash network upgrade is a hard fork.', text: 'Nodes that do not upgrade end up on a separate chain. Normally everyone upgrades and nobody notices.' },
        { title: 'A contested fork', text: 'happens when a meaningful part of the network runs one version and another part runs a different one. Two coins appear, and exchanges, wallets and miners have to choose which one to call ZEC.' },
        { title: 'Why it is hard:', text: 'a version without exchanges, wallets and miners tends to lose value. The polling process exists to test support before activation and avoid that scenario.' },
        { title: 'Two nodes, one protocol:', text: 'Zebra (Zcash Foundation) and Zakura (Valar Group and Project Tachyon) are both full nodes, and zcashd is at the end of its life. Two implementations limit the power of any single team, but both must follow the same ZIPs exactly; the Zcash Foundation has proposed conformance tests between implementations.' },
      ] },
      { kind: 'p', lead: 'Who has the final say?', text: 'Whoever runs software and whoever gives the coin its value. Polls measure sentiment; they are not the governance itself.' },
    ] },
    { id: 'glossary', title: 'Glossary', blocks: [
      { kind: 'table', caption: 'Terms used in this guide', columns: ['Term', 'Meaning'], rows: [
        ['Dev Fund', '20% of each block set aside for development by protocol rule, until the 2028 halving'],
        ['Lockbox', 'A protocol-level reserve that accumulates ZEC until a decision on its use'],
        ['Key-holder organization', 'An organization holding keys of the coinholder fund that can veto a payment on legal grounds'],
        ['NSM (Network Sustainability Mechanism)', 'A Shielded Labs proposal to return ZEC to future issuance, extending the miner reward'],
        ['Network upgrade (NU)', 'A change of network rules that activates at a fixed block height, for example NU6.1, NU6.3, NU7'],
        ['Rough consensus', 'Broad support, not unanimity and not a simple majority'],
        ['Halving', 'The block reward halves roughly every four years; the next halving is in 2028'],
        ['Hard fork', 'A rule change incompatible with older versions'],
        ['FPF', 'Financial Privacy Foundation, which administers the coinholder grants program'],
        ['ZCAP', 'Zcash Community Advisory Panel, which answers polls and elects the ZCG committee'],
      ] },
    ] },
  ],
  sources: [
    { label: 'Forum overview of the process by aquietinvestor, 4 November 2026', href: 'https://forum.zcashcommunity.com/t/future-dev-and-legal-defense-fund-zip/58611/69' },
    { label: 'Future Dev and Legal Defense Fund ZIP · forum thread', href: 'https://forum.zcashcommunity.com/t/future-dev-and-legal-defense-fund-zip/58611' },
    { label: 'ZCG and the Dev Fund: timeline for proposals and polling · forum thread', href: 'https://forum.zcashcommunity.com/t/zcg-and-the-dev-fund-timeline-for-proposals-and-polling/58906' },
    { label: 'Open ZIP drafts rendered from pull requests · zips.auzum197.com', href: 'https://zips.auzum197.com/new/' },
    { label: 'ZIP 0: the ZIP process', href: 'https://zips.z.cash/zip-0000' },
    { label: 'ZIP 1016', href: 'https://zips.z.cash/zip-1016' },
    { label: 'Zebra, Zakura, and the road through NU6.3 · forum', href: 'https://forum.zcashcommunity.com/t/zebra-zakura-and-the-road-through-nu6-3/56703' },
    { label: 'Introducing Zakura', href: 'https://zakura.com/announcements/introducing-zakura/' },
  ],
};
