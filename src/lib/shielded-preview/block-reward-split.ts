/** How the protocol divides each block reward until the 2028 halving: miners, then the two Dev Fund recipients. Largest first. */
export const blockRewardSplit = [
  { id: 'miners', label: 'Miners', recipient: 'miners', share: 80 },
  { id: 'fund', label: 'Coinholder fund', recipient: 'the coinholder fund', share: 12 },
  { id: 'zcg', label: 'ZCG', recipient: 'Zcash Community Grants', share: 8 },
] as const;

/** The split in one sentence, for the bar's accessible name. */
export function blockRewardSummary() {
  const parts = blockRewardSplit.map(part => `${part.share}% to ${part.recipient}`);
  return `Block reward split until the 2028 halving: ${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}.`;
}
