import { releaseNotes, releaseTag } from './history';

export const FORUM = 'https://forum.zcashcommunity.com/t/crosslink-incentivized-feature-net/55210';
export const ISSUES = 'https://github.com/ShieldedLabs/crosslink_monolith/issues';
export const REPOSITORY = 'https://github.com/ShieldedLabs/crosslink_monolith';
export const RELEASES = 'https://github.com/ShieldedLabs/crosslink_monolith/releases';
export const NETWORK_DIAGNOSTICS = 'https://ctaz.cash/';
/** The guide was written for OpenZcash, which keeps the same text and checks its sources. */
export const GUIDE_SOURCE = 'https://openzcash.org/ongoing-test/crosslink';

// Exact titles checked against the upstream GitHub API on 17 Oct 2026.
// This is a curated index, not an assignment board or live issue-status feed.
export const referencedIssues = [
  { id: 255, title: 'Crash After Clicking Edit Stake Button Due to Out-of-Bounds' },
  { id: 231, title: 'Reliable height/sync status' },
  { id: 219, title: '"You are on an old version; please upgrade"' },
];

export type GuidePath = 'test' | 'build' | 'operate';
export const participationPaths: { id: GuidePath; label: string }[] = [
  { id: 'test', label: 'Test' },
  { id: 'build', label: 'Build' },
  { id: 'operate', label: 'Operate' },
];

type Part = string | { bold: string };
export const steps: { title: string; body: Part[]; check: string; href: string }[] = [
  { title: 'Install & back up', body: ['Download the build for your OS. Open the app and privately back up your test-wallet seed. Use cTAZ only. Shielded Labs ships weekly; only the current chain earns rewards, so upgrade within a week of each release.'], check: 'Record your OS and build.', href: releaseNotes },
  { title: 'Sync the network', body: ['Let the node catch up. Compare a block’s height and hash with a same-network explorer. Check that finalized height advances too.'], check: 'Matching chain. Advancing finality.', href: `${FORUM}/66` },
  { title: 'Get test funds', body: ['Request cTAZ from the app’s faucet, or mine. Desktop CPU mining starts after sync by default.'], check: 'Funds arrive in your own wallet.', href: releaseNotes },
  { title: 'Choose a finalizer & stake', body: ['Check recent votes, then copy a finalizer’s identity. During a staking window: ', { bold: 'Stake → Paste Identity → amount.' }], check: 'Confirm the bond and destination.', href: releaseNotes },
  { title: 'Change your delegation', body: ['Open ', { bold: 'Edit Stake' }, ', select a bond and retarget it to another finalizer. Retargeting also works outside staking windows.'], check: 'Same bond, new destination.', href: releaseNotes },
  { title: 'Unstake & withdraw', body: ['Begin unbonding in ', { bold: 'Edit Stake' }, '. Once the bond is withdrawable, withdraw during an allowed window.'], check: 'Confirm the transaction and returned funds.', href: releaseNotes },
  { title: 'Share what you found', body: ['Record version, OS, time, transaction IDs and expected versus actual behavior. Recheck after restarting. Remove secrets before reporting.'], check: 'Report desktop-app problems in the official issue tracker.', href: ISSUES },
];

export const pathNotes: Record<GuidePath, { heading: string; detail: string; rules: [string, string][] }> = {
  test: { heading: 'Before you start', detail: 'Desktop app · cTAZ only', rules: [
    ['Separate wallet', 'Use a test wallet. Keep its seed private.'],
    ['Allow time', 'Follow the app’s staking windows.'],
    ['Verify results', 'Save transaction IDs. Confirm each outcome.'],
  ] },
  build: { heading: 'Before contributing', detail: 'Work with the maintainers', rules: [
    ['Check the discussion', 'Read the issue and coordinate with its maintainers.'],
    ['Keep evidence useful', 'Include versions, reproduction steps and expected results.'],
    ['Confirm scope', 'A listed issue does not imply funding or assignment.'],
  ] },
  operate: { heading: 'Before you start', detail: 'Desktop app · cTAZ only', rules: [
    ['Same network', 'Match your release and explorer network.'],
    ['Stay available', 'Keep the node online and watch its participation.'],
    ['Protect your keys', 'Keep wallet seeds and private keys out of reports.'],
  ] },
};

export const operateSteps = [
  { title: 'Confirm the release', text: 'Check your build and network before following operator instructions.', link: `${releaseTag} release notes`, href: releaseNotes },
  { title: 'Set up your identity', text: 'Review the documented delegation and finalizer setup.', link: `${releaseTag} finalizer instructions`, href: releaseNotes },
  { title: 'Observe participation', text: 'Check roster membership, recent votes and advancing finality with same-network tools.', link: 'Network diagnostics', href: NETWORK_DIAGNOSTICS },
];

export const rewardDetails = [
  { title: 'Earned cTAZ counts.', text: 'Mining and staking earnings determine the proportional reward. Simply holding faucet or transferred funds does not qualify.', link: 'Eligibility', href: `${FORUM}/39` },
  { title: 'Claims stay with Shielded Labs.', text: 'Wait for the round’s private submission instructions. Previous claims used test-wallet viewing keys and a mainnet payout address. Never share a seed or spending key.', link: 'Previous claim process', href: `${FORUM}/94` },
];

/** Portal pages a tester is likely to want next, so the guide stays connected to the rest of the project. */
export const relatedPages = [
  'crosslink-guide',
  'crosslink-faq',
  'crosslink-simulator',
  'crosslink-handbook',
  'crosslink-incentivized-feature-nets',
  'crosslink-feature-net-reflections-on-the-first-six-weeks',
];
