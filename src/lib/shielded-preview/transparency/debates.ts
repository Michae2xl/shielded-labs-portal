/**
 * Debated topics where Shielded Labs is a party, with each side's own published arguments.
 * Summaries are ours. Each point links the exact post or document it summarises; on `verifiedOn` every
 * source was opened and checked to contain the argument. A point whose source could not be checked is left out.
 */
import { pointKind, type Speaker } from './evidence';

/** `via` names the outlet when the point is a press report of someone’s words. */
export type DebatePoint = { text: string; author: string; date: string; url: string; shieldedLabs?: boolean; via?: string };
/** A direction the debate could take; `short` names it in the comments table. */
export type DebateSide = { label: string; short: string; points: DebatePoint[] };
/** A published vote on the debated question, option by option, in ballot order. */
export type MeasuredVote = { pollId: string; question: string; options: { label: string; zec: number }[]; source: string };
export type Debate = {
  id: 'nsm' | 'crosslink' | 'dev-fund'; title: string; question: string; status: string; verifiedOn: string;
  /** Short name for the topic tabs. */
  tab: string;
  sides: DebateSide[]; projects: string[];
  /** Ids of archived polls on this question (record.json), newest first; `vote` is the latest one with published results. */
  polls: string[]; vote?: MeasuredVote;
  /** ZIP ids, or id prefixes for pull requests whose files may change between syncs. */
  zips: string[];
};

const forum = (path: string) => `https://forum.zcashcommunity.com/t/${path}`;

export const debates: Debate[] = [
  {
    id: 'nsm', tab: 'NSM', title: 'Network Sustainability Mechanism', verifiedOn: '2026-11-07', projects: ['nsm'], zips: ['zip-0233', 'zip-0234', 'zip-0235', 'zip-0237'],
    polls: ['2026-09-nu7-scope-coinholder-vote', '2026-02-nu7-protocol-feature-sentiment-poll', '2024-12-nsm-coinholder-poll'],
    // Published results, question 1; the forum post lists each option in ZEC.
    vote: { pollId: '2026-09-nu7-scope-coinholder-vote', question: 'NSM issuance smoothing', source: 'https://forum.zcashcommunity.com/t/nu7-coinholder-vote/56912/42', options: [
      { label: 'Smooth issuance curve', zec: 22384.875 },
      { label: 'Preserve halvings', zec: 2375932.375 },
      { label: 'Do not include issuance smoothing in NU7', zec: 4147.625 },
      { label: 'Abstain', zec: 1072.125 },
    ] },
    question: 'Should Zcash remove part of its fees from circulation, change how removed ZEC is reissued, and keep or smooth the halvings?',
    status: 'NU7 activated on 6 Nov 2026 at block 3,543,405. It deployed ZIP 235 (60% of fees removed) and ZIP 237 (halving-preserving issuance), not ZIP 233 or ZIP 234.',
    sides: [
      { label: 'Remove fees, keep the halvings', short: 'Keep the halvings', points: [
        { text: 'Reports that ZCAP and coinholders both back fee removal, and asks that it be separated from issuance smoothing and each part judged on its own.', author: 'Zcash Foundation', date: '2026-02-23', url: forum('nu7-polling-results-what-we-heard-and-where-we-go-from-here/54775/1') },
        { text: 'Notes that smoothing was unresolved (84% ZCAP support, 83.5% coinholder opposition) and puts a “preserve halvings” option to coinholders.', author: 'joshs', date: '2026-05-15', url: forum('nu7-sentiment-polling-questions-for-community-review-coinholder-voting-via-zodl/55713/1') },
        { text: 'Says some coinholders see the emission schedule as part of Zcash’s identity, and that it is open to designs that keep the halvings.', author: 'aquietinvestor', date: '2026-02-23', url: forum('shielded-labs-thoughts-on-polling-governance/54773/1'), shieldedLabs: true },
        { text: 'Says the preserve-halvings option has no smoothing and should state that it does not reissue funds, and that the 60% fee requirement deserves its own separate governance question.', author: 'daira', date: '2026-05-25', url: forum('nu7-sentiment-polling-questions-for-community-review-coinholder-voting-via-zodl/55713/49') },
        { text: 'Proposes tracking deposited funds separately and issuing a fixed fraction of that balance each block on top of regular issuance, so the NSM works without smoothing the whole curve.', author: 'conradoplg', date: '2024-12-04', url: forum('network-sustainability-mechanism-nsm/42703/280') },
        { text: 'Says holders bought in under the existing halving schedule and supply cap, and objects to ending halvings, among other protocol changes.', author: 'emersonian', date: '2025-01-09', url: forum('network-sustainability-mechanism-nsm/42703/300') },
        { text: 'Says the halving schedule should be left untouched, that changing it hurts trust in governance, and that any issuance change should lean deflationary.', author: 'Jgx7', date: '2024-01-29', url: forum('network-sustainability-mechanism-nsm/42703/151') },
        { text: 'Argues that making block issuance continuous is a radical change bundled with the burn account, and supports voluntary burns reissued along a smooth curve instead.', author: 'ValarDragon', date: '2026-01-29', url: forum('nu-7-discussions-nsm/54497/2') },
      ] },
      { label: 'Support the full NSM, smoothing included', short: 'Full NSM', points: [
        { text: 'Argues that issuance smoothing is simpler because burning and issuance stay separate, and that tracking burned ZEC apart from unissued supply adds complexity.', author: 'aquietinvestor', date: '2025-01-08', url: forum('network-sustainability-mechanism-nsm/42703/286'), shieldedLabs: true },
        { text: 'Calls smoothing easier to implement and more straightforward, while acknowledging that many people link halvings to Bitcoin’s monetary design.', author: 'aquietinvestor', date: '2026-05-19', url: forum('nu7-sentiment-polling-questions-for-community-review-coinholder-voting-via-zodl/55713/14'), shieldedLabs: true },
        { text: 'Argues that saving funds now, while issuance is high, for future users’ security does not really constrain those users.', author: 'Siegfried', date: '2026-03-04', url: forum('proposed-nsm-update-long-term-security/54824/7') },
        { text: 'Argues that a single simple issuance rule, as in ZIP 234, builds trust among outsiders, even though it lacks halving events.', author: 'zooko', date: '2026-05-20', url: forum('nu7-sentiment-polling-questions-for-community-review-coinholder-voting-via-zodl/55713/25'), shieldedLabs: true },
        { text: 'Says the NSM is needed for decades-long survival without raising the 21M cap, and that fee removal and smooth reissuance are paired halves of one design.', author: 'shieldedmark', date: '2026-01-29', url: forum('nu-7-discussions-nsm/54497/7'), shieldedLabs: true },
        { text: 'Supports moving to a smoothing mechanism, arguing halvings add risk for miners buying ASICs and that more predictable issuance could help hashrate.', author: 'artkor', date: '2025-01-09', url: forum('network-sustainability-mechanism-nsm/42703/287') },
        { text: 'Argues that the NSM is necessary because Zcash copies Bitcoin’s security design, and that a Bitcoin security failure would expose ZEC to the same risk.', author: 'gigantes', date: '2024-12-03', url: forum('network-sustainability-mechanism-nsm/42703/259') },
        { text: 'Argues that NSM with ZIP 234 should go into NU7, because it eases a later proof-of-stake move under the cap, and notes issuance changed before at Blossom.', author: 'tokidoki', date: '2025-01-10', url: forum('network-sustainability-mechanism-nsm/42703/304') },
        { text: 'Argues for implementing the burn and reintroduction mechanisms together in NU7, since adding burning alone creates technical debt like the lockbox and avoids a rushed later upgrade.', author: 'nuttycom', date: '2024-12-03', url: forum('network-sustainability-mechanism-nsm/42703/253') },
      ] },
      { label: 'Caution on lock-in, priority and timing', short: 'Caution', points: [
        { text: 'Warns that a fixed reissuance rule could prove as hard to change as the original halving schedule, and asks for care with the contract made with future users.', author: 'nuttycom', date: '2026-03-03', url: forum('proposed-nsm-update-long-term-security/54824/6') },
        { text: 'Proposes a separate long-term security fund fed by 60% of fees, with halvings unchanged, and does not rank the work as a short-term priority.', author: 'ValarDragon', date: '2026-02-27', url: forum('proposed-nsm-update-long-term-security/54824/1') },
        { text: 'Argues that fee revenue is still small next to the block subsidy, so the fund should accumulate before anything is paid out.', author: 'ValarDragon', date: '2026-02-27', url: forum('proposed-nsm-update-long-term-security/54824/1') },
        { text: 'Warns that adding smoothing and a new economic model to NU7 risks delaying ZSAs and later upgrades, and says community consensus on the approach is not established.', author: 'joshs', date: '2025-01-10', url: forum('network-sustainability-mechanism-nsm/42703/311') },
        { text: 'Argues that bundling ZSAs and the NSM in one upgrade raises complexity risk, citing the NU5 delay and a possible network halt, and favors separating them.', author: 'Dodger', date: '2024-12-03', url: forum('network-sustainability-mechanism-nsm/42703/274') },
        { text: 'Argues that debating the NSM now draws attention from communicating ZSAs, and that the NSM lacks consensus, so effort should stay on simpler goals.', author: 'kworks', date: '2024-12-03', url: forum('network-sustainability-mechanism-nsm/42703/255') },
        { text: 'Says the NSM is promising but premature, listing user confusion, unproven-mechanism risk and limited miner benefit, and suggests preparing code but delaying activation until after the 2028 halving.', author: 'gotope', date: '2024-11-21', url: forum('network-sustainability-mechanism-nsm/42703/223') },
        { text: 'Prefers delaying activation of the smoothing portion to roughly late 2026 or afterward, citing doubts about pulling issuance forward and about taking compensation from future validators.', author: 'noamchom', date: '2024-01-29', url: forum('network-sustainability-mechanism-nsm/42703/134') },
        { text: 'Says the NSM timing feels wrong given past underestimates, prefers only the deposit field now, and is uneasy that smoothing ends halvings and departs from expectations.', author: 'conradoplg', date: '2024-12-03', url: forum('network-sustainability-mechanism-nsm/42703/252') },
      ] },
    ],
  },
  {
    id: 'crosslink', tab: 'Crosslink', title: 'Crosslink', verifiedOn: '2026-11-07', projects: ['crosslink'], zips: ['pr-1216-'], polls: [],
    question: 'Should Zcash adopt Crosslink, a hybrid Proof-of-Work and Proof-of-Stake design with BFT finality?',
    status: 'Not activated on mainnet. Shielded Labs runs public test networks; no governance decision has been taken.',
    sides: [
      { label: 'In favour: finality and hybrid security', short: 'In favour', points: [
        { text: 'Argues that splitting rewards between mining and staking means an attacker would have to compromise both layers to control the network.', author: 'shieldedmark', date: '2025-09-12', url: forum('crosslink-early-tokenomics-design/52154/1'), shieldedLabs: true },
        { text: 'Argues that Crosslink adds economic finality, linked to stronger security and consistent deposit times.', author: 'shieldedmark', date: '2025-03-07', url: forum('shielded-labs-crosslink-deployment-updates/49706/3'), shieldedLabs: true },
        { text: 'Argues, in the earlier trailing-finality discussion, that finality is a valuable security property some uses need.', author: 'daira', date: '2023-07-24', url: forum('the-trailing-finality-layer/45133/10') },
        { text: 'Argues that testnets for proposed features should need no approval, so the community can judge a working Crosslink rather than a theory, without pushing activation.', author: 'aquietinvestor', date: '2026-04-03', url: forum('crosslink-incentivized-feature-net/55210/8'), shieldedLabs: true },
        { text: 'Says that layering proof-of-stake finality over proof-of-work through Crosslink is an elegant solution, while noting the market and builders may not agree.', author: 'br33zybail', date: '2026-09-08', url: forum('proof-of-work-must-never-be-abandoned/57468/11') },
        { text: 'Supports moving to proof of stake so Zcash has a sustainable security budget, arguing the consensus mechanism should change while other Bitcoin weaknesses are fixed.', author: 'Siegfried', date: '2026-09-08', url: forum('proof-of-work-must-never-be-abandoned/57468/14') },
        { text: 'Asks critics to propose another fix for probabilistic finality, warning that without it private money depends on miners declining to reverse transactions.', author: 'gigantes', date: '2026-04-18', url: forum('crosslink-incentivized-feature-net/55210/27') },
        { text: 'Supports the trailing finality approach as the safest route from PoW to PoS despite extra complexity, and prefers Snowman over Tendermint for its validator count.', author: 'Milton', date: '2023-07-21', url: forum('the-trailing-finality-layer/45133/3') },
        { text: 'Says a shorter unbonding period brings Crosslink in line with successful projects, and suggests tenure bonuses and a larger validator set to improve censorship resistance.', author: 'Angst01', date: '2025-10-27', url: forum('crosslink-updated-staking-design/52695/5') },
        { text: 'Says Crosslink v1 aims to ship quickly without governance changes, and that the PoS consensus algorithm can be swapped after v1 because of the hybrid design.', author: 'shielded-nate', date: '2025-05-07', url: forum('zcash-pos-sdks-discussion/50945/16'), shieldedLabs: true },
      ] },
      { label: 'Against or not yet: risk, complexity, governance', short: 'Against or not yet', points: [
        { text: 'Argues that a staking layer adds complexity and new security assumptions, and that Zcash should stay on Nakamoto consensus.', author: 'Josh Swihart', date: '2026-10-25', url: 'https://ambcrypto.com/not-good-for-zcash-zodl-founder-pushes-back-against-crosslink-upgrade/', via: 'AMBCrypto' },
        { text: 'Argues that engineering has outpaced governance: there is no agreed standard for judging activation support.', author: 'ShieldOrder', date: '2026-02-10', url: forum('shielded-labs-crosslink-deployment-updates/49706/14') },
        { text: 'Summarises an independent mechanism-design audit that rates some findings critical before activation, including a liveness risk that would need a recovery path.', author: 'ShieldOrder', date: '2026-03-18', url: forum('evaluation-memo-crosslink-zebra-mechanism-design-audit/55027/1') },
        { text: 'Argues that social slashing adds attack surface and a pause-button risk, and that proven proof-of-stake incentive designs should replace Crosslink’s custom mechanisms.', author: 'Karma', date: '2025-09-17', url: forum('crosslink-early-tokenomics-design/52154/68') },
        { text: 'Warns that skipping slashing is justified only while PoW remains, and that a later move to pure PoS could expose earlier stakers to unexpected slashing.', author: 'str4d', date: '2025-09-18', url: forum('crosslink-early-tokenomics-design/52154/74') },
        { text: 'Warns that long unbonding periods risk path dependency and urges gathering coinholder signals early so the community veto keeps its weight.', author: 'ebfull', date: '2025-09-17', url: forum('crosslink-early-tokenomics-design/52154/67') },
        { text: 'Warns that proof of stake tends to centralize and that outside liquid staking tokens could gain control of finality, urging the issue be addressed now.', author: 'januszgrze', date: '2025-09-18', url: forum('crosslink-early-tokenomics-design/52154/73') },
        { text: 'Argues the staking design imposes a cost on ZEC holders that pure PoW lacks, which investors will notice, and may conflict with anonymity set size.', author: 'Chewbacca', date: '2025-09-13', url: forum('crosslink-early-tokenomics-design/52154/44') },
        { text: 'Argues that a 40-day lockup adds a risk premium to a volatile asset and hurts adoption, and urges parameters used by chains that gained adoption.', author: 'thailand85', date: '2025-09-13', url: forum('crosslink-early-tokenomics-design/52154/12') },
        { text: 'Prefers an Avalanche-style hybrid with PoW, as eCash did, over Crosslink, noting it could be a softfork that is easy to revert.', author: 'DexMan', date: '2025-09-30', url: forum('crosslink-early-tokenomics-design/52154/93') },
        { text: 'Says Zcash should have gone straight to pure PoS, ideally with Avalanche-style consensus, though relitigating that choice now would waste time.', author: 'Milton', date: '2025-04-21', url: forum('zcash-pos-sdks-discussion/50945/5') },
        { text: 'Questions whether the custom Noise-over-UDP transport amounts to building a new protocol, and asks whether QUIC or DTLS trade-offs were weighed given built-in post-quantum key exchange.', author: 'daira', date: '2026-04-26', url: forum('shielded-labs-crosslink-deployment-updates/49706/19') },
      ] },
    ],
  },
  {
    id: 'dev-fund', tab: 'Dev Fund', title: 'ZCG and the Dev Fund', verifiedOn: '2026-11-07', projects: [], zips: ['draft-mcgee-future-dev-legal-defense-fund'],
    // No vote on this question yet; these earlier votes set the Dev Fund that ZCG's share comes from.
    polls: ['2025-05-devfund-funding-model-poll', '2024-07-ywallet-devfund-runoff'],
    question: 'What should happen to Zcash Community Grants’ share of the Dev Fund before its scheduled expiry?',
    status: 'Proposals and polling are under way on the forum, on the timeline posted on 5 Nov 2026. ZIP pull request #1428 was merged on 11 Nov 2026 with Draft status, the status of every initial submission under ZIP 0.',
    sides: [
      { label: 'Redirect ZCG’s share to a Future Dev and Legal Defense lockbox', short: 'Lockbox', points: [
        { text: 'Asks the community to back a ZIP that ends ZCG’s funding stream and accrues the share in a new fund.', author: 'zooko', date: '2026-10-30', url: forum('future-dev-and-legal-defense-fund-zip/58611/1'), shieldedLabs: true },
        { text: 'The draft ZIP ends the 8% ZCG stream at activation and holds it for future development and legal defense.', author: 'Bowe, Wilcox, McGee', date: '2026-10-30', url: 'https://github.com/zcash/zips/pull/1428', shieldedLabs: true },
        { text: 'Describes the poll as deciding only ZCG’s share for now, leaving ZCG’s wider role to be revisited later.', author: 'aquietinvestor', date: '2026-11-05', url: forum('zcg-and-the-dev-fund-timeline-for-proposals-and-polling/58906/1'), shieldedLabs: true },
        { text: 'Backs the lockbox ZIP as a middle path: ZCG keeps running on its treasury without reforms, while only new issuance goes to a fund for later development and legal defense.', author: 'ebfull', date: '2026-11-05', url: forum('future-dev-and-legal-defense-fund-zip/58611/74') },
        { text: 'Backs the ZIP, speaking personally rather than for the ZCG committee, since it moves 50,000 ZEC to the NSM while ZCG keeps paying for security work, as advocated in June.', author: 'GGuy', date: '2026-11-02', url: forum('future-dev-and-legal-defense-fund-zip/58611/52') },
        { text: 'Calls the lockbox compromise better than other written proposals but asks to clarify the development versus legal defense split, and says ending the dev fund mainly benefits miners.', author: 'zerodartz', date: '2026-11-04', url: forum('future-dev-and-legal-defense-fund-zip/58611/71') },
      ] },
      { label: 'End ZCG or the Dev Fund, and where the funds go', short: 'End ZCG', points: [
        { text: 'Argues that coinholders pay for ZCG without controlling it, so the committee model lacks accountability to them.', author: 'maxdesalle', date: '2026-10-26', url: forum('end-zcg-and-send-its-funds-to-the-nsm/58515/1') },
        { text: 'Argues for ending the whole development fund, not only the ZCG stream.', author: 'joshs', date: '2026-10-27', url: forum('end-zcg-and-send-its-funds-to-the-nsm/58515/6') },
        { text: 'Says the NSM already exists, which makes it the easiest destination for redirected funds.', author: 'ebfull', date: '2026-10-27', url: forum('end-zcg-and-send-its-funds-to-the-nsm/58515/15') },
        { text: 'Cautions that the NSM could become a future dev fund in waiting, still moving funds away from development for now.', author: 'secparam', date: '2026-10-27', url: forum('end-zcg-and-send-its-funds-to-the-nsm/58515/13') },
        { text: 'Backs ending ZCG and expects a coinholder vote would favor it, while suggesting a negotiated deal that gives ZCG members something, to avoid a conflict or fork.', author: 'seernet', date: '2026-10-26', url: forum('end-zcg-and-send-its-funds-to-the-nsm/58515/5') },
        { text: 'Argues ZCG funding amounts to taxation without representation through an insular body, and calls for stopping the block subsidy to it rather than reducing its take.', author: 'thailand85', date: '2026-10-29', url: forum('zcg-gets-too-much-zec-heres-our-plan-to-fix-that/58566/3') },
        { text: 'Proposes capping ZCG holdings at a USD value based on a trailing six-month price average, sending any excess to the NSM, since the program was built for smaller sums.', author: 'ValarDragon', date: '2026-10-29', url: forum('zcg-gets-too-much-zec-heres-our-plan-to-fix-that/58566/28') },
        { text: 'Argues ZCG should be abolished and funded work left to donors, sponsors and competition as in Bitcoin, accepting that many community projects would lose support.', author: 'januszgrze', date: '2026-10-27', url: forum('end-zcg-and-send-its-funds-to-the-nsm/58515/33') },
      ] },
      { label: 'Keep ZCG, restructure it, or change nothing', short: 'Keep or restructure', points: [
        { text: 'Asks that the poll offer a “no change” option keeping the 8% ZCG and 12% coinholder-controlled streams until they expire.', author: 'vaspholdings', date: '2026-11-07', url: forum('zcg-and-the-dev-fund-timeline-for-proposals-and-polling/58906/10') },
        { text: 'Argues for restructuring ZCG rather than dissolving it, and calls accountability the core issue.', author: 'strahncryptography', date: '2026-10-29', url: forum('zcg-gets-too-much-zec-heres-our-plan-to-fix-that/58566/15') },
        { text: 'Objects to the redirect and asks for months of deliberation before reallocating ZCG’s funds.', author: 'emersonian', date: '2026-10-30', url: forum('future-dev-and-legal-defense-fund-zip/58611/8') },
        { text: 'Would keep the 12% coinholder-voted grant fund and cut only the committee.', author: 'Umbredak', date: '2026-10-27', url: forum('end-zcg-and-send-its-funds-to-the-nsm/58515/18') },
        { text: 'Opposes ending community grants, urging more marketing spend with experienced nonprofit leadership running the larger treasury, and arguing private investors will not fund Zcash at that scale.', author: 'emersonian', date: '2026-10-27', url: forum('end-zcg-and-send-its-funds-to-the-nsm/58515/53') },
        { text: 'Disputes that coinholders own the grants treasury or hold exclusive authority, noting the funding model gives community grants an independent channel, while accepting that ZCG spending deserves scrutiny.', author: 'wobbzz', date: '2026-10-29', url: forum('zcg-gets-too-much-zec-heres-our-plan-to-fix-that/58566/40') },
        { text: 'Opposes the lockbox ZIP, saying it ends ZCG funding while sending it to a fund with undefined uses, and points to the ZAP proposal as another option.', author: 'fabacab', date: '2026-11-05', url: forum('future-dev-and-legal-defense-fund-zip/58611/72') },
        { text: 'Welcomes the taper idea as a middle ground that keeps the grants program running, and argues ZCG’s allocation belongs to it under the protocol.', author: 'vinibarbosa', date: '2026-10-29', url: forum('zcg-gets-too-much-zec-heres-our-plan-to-fix-that/58566/11') },
        { text: 'Declines to back the lockbox ZIP for now, asking how idle funds would be allocated without a process, and suggests keeping development and legal defense funds separate with USD targets.', author: 'divijpandya', date: '2026-10-31', url: forum('future-dev-and-legal-defense-fund-zip/58611/34') },
        { text: 'Says ZCG’s structure and lack of defined goals are the problem rather than the idea, and proposes fixing governance, setting clear goals, and possibly splitting funding into accountable, time-limited organizations.', author: 'zcashminer1', date: '2026-10-30', url: forum('end-zcg-and-send-its-funds-to-the-nsm/58515/137') },
        { text: 'Says ZCG’s fund has outgrown its current management, favors restructuring and possibly a short pause, and asks how the community’s wishes on moving funds to the NSM would be determined.', author: 'Shawn', date: '2026-10-27', url: forum('end-zcg-and-send-its-funds-to-the-nsm/58515/74') },
      ] },
    ],
  },
];

const coversZip = (debate: Debate, id: string) => debate.zips.some(zip => zip.endsWith('-') ? id.startsWith(zip) : zip === id);
export const debatesForZip = (id: string) => debates.filter(debate => coversZip(debate, id));
export const debatesForProject = (id: string) => debates.filter(debate => debate.projects.includes(id));
export const debateHref = (debate: Pick<Debate, 'id'>) => `?view=governance&section=transparency#debate-${debate.id}`;

/** Filter for debate points by who is speaking; `all` keeps every point. */
export type Voice = 'all' | Speaker;
const speakers: Speaker[] = ['position', 'community', 'press'];

/** Points per voice in a debate, `all` first, leaving out voices with no points. */
export function voiceCounts(debate: Debate): { voice: Voice; count: number }[] {
  const points = debate.sides.flatMap(side => side.points);
  const counts = speakers.map(voice => ({ voice, count: points.filter(point => pointKind(point) === voice).length }));
  return [{ voice: 'all', count: points.length }, ...counts.filter(item => item.count > 0)];
}

/** Every side of a debate with only the points of one voice; a side left empty is kept, so the reader sees it. */
export const filterSides = (debate: Debate, voice: Voice): { side: DebateSide; points: DebatePoint[] }[] =>
  debate.sides.map(side => ({ side, points: voice === 'all' ? side.points : side.points.filter(point => pointKind(point) === voice) }));

/** Each option's share of the ZEC that voted on the question. */
export function voteShares(vote: MeasuredVote) {
  const total = vote.options.reduce((sum, option) => sum + option.zec, 0);
  return vote.options.map(option => ({ ...option, share: total ? option.zec / total : 0 }));
}
