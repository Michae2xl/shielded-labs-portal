import { describe, expect, it } from 'vitest';
import { formatZec, halving, NSM, nsmValueBalance, scheduledBlockSubsidy, scheduledIssuance, sumScheduledSubsidy } from './balance';

describe('NSM Value Balance (ZIP 237)', () => {
  it('follows the halving schedule through Blossom and NU7', () => {
    expect(halving(1_046_399)).toBe(0);
    expect(halving(1_046_400)).toBe(1);
    expect(halving(2_726_399)).toBe(1);
    expect(halving(2_726_400)).toBe(2);
    expect(halving(NSM.nu7ActivationHeight)).toBe(2);
    expect(halving(6_132_389)).toBe(2);
    expect(halving(6_132_390)).toBe(3);
  });

  it('divides the post-Blossom subsidy by three from NU7 (ZIP 218)', () => {
    expect(scheduledBlockSubsidy(0)).toBe(0);
    expect(scheduledBlockSubsidy(9_999)).toBe(624_937_500);
    expect(scheduledBlockSubsidy(10_000)).toBe(625_062_500);
    expect(scheduledBlockSubsidy(20_000)).toBe(1_250_000_000);
    expect(scheduledBlockSubsidy(653_599)).toBe(1_250_000_000);
    expect(scheduledBlockSubsidy(653_600)).toBe(625_000_000);
    expect(scheduledBlockSubsidy(NSM.nu7ActivationHeight - 1)).toBe(156_250_000);
    expect(scheduledBlockSubsidy(NSM.nu7ActivationHeight)).toBe(52_083_333);
    expect(scheduledBlockSubsidy(6_132_390)).toBe(26_041_666);
  });

  it('sums scheduled issuance to the totals ZIP 237 publishes', () => {
    expect(sumScheduledSubsidy(0, 2_726_399)).toBe(1_575_000_000_000_000);
    expect(scheduledIssuance(2_726_399)).toBe(1_575_000_000_000_000);
    expect(scheduledIssuance(2_726_399) - 1_574_963_141_554_480).toBe(NSM.initialBalanceZat);
  });

  it('gives the initial balance from the chain value pools a node reports before activation', () => {
    // Transparent, Sprout, Sapling, Orchard, Ironwood and lockbox pools at block 3,543,404.
    expect(nsmValueBalance(3_543_404, 1_702_620_172_804_480)).toBe(36_858_445_520);
  });

  it('only answers where the formula holds', () => {
    expect(() => nsmValueBalance(NSM.nu7ActivationHeight - 2, 0)).toThrow(RangeError);
    expect(() => nsmValueBalance(NSM.reissuanceHeight, 0)).toThrow(RangeError);
  });

  it('formats zatoshi as ZEC with eight decimals', () => {
    expect(formatZec(36_858_445_520)).toBe('368.58445520');
    expect(formatZec(5)).toBe('0.00000005');
    expect(formatZec(1_234_567_800_000)).toBe('12,345.67800000');
  });
});
