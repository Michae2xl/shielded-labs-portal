/**
 * The NSM Value Balance on Mainnet as ZIP 237 defines it: everything scheduled for issuance up to a
 * height, minus the issued supply held in the chain value pools at that height. Until the
 * reissuance height no block reissues anything, so that difference is the balance.
 * Subsidy rules: protocol specification § 7.8 with the NU7 changes of ZIP 218.
 */
export const NSM = {
  nu7ActivationHeight: 3_543_405,
  reissuanceHeight: 8_939_664,
  initialBalanceZat: 36_858_445_520,
} as const;

export type NsmReading = { height: number; time: string; issuedSupplyZat: number; balanceZat: number; removedSinceActivationZat: number };
export type NsmSource = { state: 'fetched' | 'stale' | 'unavailable'; observedAt: string | null; reading: NsmReading | null; source: string };

const MAX_BLOCK_SUBSIDY = 1_250_000_000;
const SLOW_START_INTERVAL = 20_000;
const SLOW_START_SHIFT = 10_000;
const BLOSSOM_ACTIVATION_HEIGHT = 653_600;
// The three halving intervals over one denominator: 840,000 × 6 = 1,680,000 × 3 = 5,040,000.
const HALVING_DENOMINATOR = 5_040_000;
// ZIP 237 publishes the scheduled issuance through the last pre-NU6 block; later sums start there.
const CHECKPOINT = { height: 2_726_399, totalZat: 1_575_000_000_000_000 } as const;

export function halving(height: number): number {
  if (height < BLOSSOM_ACTIVATION_HEIGHT) return Math.floor((height - SLOW_START_SHIFT) / 840_000);
  const beforeBlossom = (BLOSSOM_ACTIVATION_HEIGHT - SLOW_START_SHIFT) * 6;
  if (height < NSM.nu7ActivationHeight) return Math.floor((beforeBlossom + (height - BLOSSOM_ACTIVATION_HEIGHT) * 3) / HALVING_DENOMINATOR);
  const beforeNu7 = beforeBlossom + (NSM.nu7ActivationHeight - BLOSSOM_ACTIVATION_HEIGHT) * 3;
  return Math.floor((beforeNu7 + height - NSM.nu7ActivationHeight) / HALVING_DENOMINATOR);
}

export function scheduledBlockSubsidy(height: number): number {
  const slowStartRate = MAX_BLOCK_SUBSIDY / SLOW_START_INTERVAL;
  if (height < SLOW_START_INTERVAL / 2) return slowStartRate * height;
  if (height < SLOW_START_INTERVAL) return slowStartRate * (height + 1);
  // Blossom halves the subsidy for 75-second blocks; NU7 divides it by three again for 25-second blocks.
  const spacing = height < BLOSSOM_ACTIVATION_HEIGHT ? 1 : height < NSM.nu7ActivationHeight ? 2 : 6;
  return Math.floor(MAX_BLOCK_SUBSIDY / (spacing * 2 ** halving(height)));
}

export function sumScheduledSubsidy(from: number, to: number): number {
  let total = 0;
  for (let height = from; height <= to; height += 1) total += scheduledBlockSubsidy(height);
  return total;
}

export function scheduledIssuance(height: number): number {
  return height < CHECKPOINT.height ? sumScheduledSubsidy(0, height) : CHECKPOINT.totalZat + sumScheduledSubsidy(CHECKPOINT.height + 1, height);
}

export function nsmValueBalance(height: number, issuedSupplyZat: number): number {
  if (height < NSM.nu7ActivationHeight - 1) throw new RangeError('The NSM Value Balance starts at the block before NU7.');
  if (height >= NSM.reissuanceHeight) throw new RangeError('From the reissuance height the balance depends on every prior block.');
  return scheduledIssuance(height) - issuedSupplyZat;
}

/** Exact formatting from integer zatoshi, so no digit depends on floating-point rounding. */
export function formatZec(zatoshi: number): string {
  const value = Math.abs(zatoshi);
  return `${zatoshi < 0 ? '-' : ''}${Math.floor(value / 100_000_000).toLocaleString('en-US')}.${String(value % 100_000_000).padStart(8, '0')}`;
}
