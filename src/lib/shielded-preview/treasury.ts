import { z } from 'zod';
import { parseCsv } from '@/lib/zcg/csv';
import type { Source } from './governance-types';

/** The ZCG treasury sheet: one tab for ZCG's own holdings, one for the coinholder fund it administers. */
export const treasurySheet = '1FQ28rDCyRW0TiNxrm3rgD8ai2KGUsXAjPieQmI1kKKg';
export const treasuryTabs = { zcg: '135980745', coinholder: '808560406' } as const;
export const treasuryCsvUrl = (gid: string) => `https://docs.google.com/spreadsheets/d/${treasurySheet}/export?format=csv&gid=${gid}`;
export const treasurySheetUrl = (gid: string) => `https://docs.google.com/spreadsheets/d/${treasurySheet}/edit#gid=${gid}`;

/** Where the live ZEC price comes from, as on OpenZcash. */
export const zecPricePage = 'https://www.coingecko.com/en/coins/zcash';

const balanceSchema = z.object({
  zec: z.number().nonnegative(), usdCash: z.number().nullable(), paidOutZec: z.number().nonnegative().nullable(),
  zecUsd: z.number().positive().nullable(),
  accruedZec: z.number().nonnegative().nullable(), liabilitiesUsd: z.number().nonnegative().nullable(), receivableZec: z.number().nonnegative().nullable(),
  height: z.number().int().positive(), blockTime: z.iso.datetime(), current: z.boolean(), source: z.url(),
});
export type TreasuryBalance = z.infer<typeof balanceSchema>;
export type TreasuryPrice = { usd: number; observedAt: string; source: 'CoinGecko' | 'sheet'; url: string };
export type Treasury = { zcg: TreasuryBalance; coinholder: TreasuryBalance; price: TreasuryPrice | null };
export const emptyTreasurySource: Source<Treasury | null> = { data: null, state: 'unavailable', observedAt: null, url: treasurySheetUrl(treasuryTabs.zcg) };

const amount = (value: string | undefined): number | null => {
  if (!value?.trim()) return null;
  const number = Number(value.replace(/[$,\s]/g, ''));
  return Number.isFinite(number) ? number : null;
};
const unsigned = (value: number | null) => value === null ? null : Math.abs(value);
const count = (value: number | null) => value !== null && value >= 0 ? value : null;

/** One balance tab, read by its row labels so a moved row does not break it; throws when the essentials are missing. */
export function parseBalanceTab(csv: string, source: string): TreasuryBalance {
  const rows = parseCsv(csv);
  const cell = (label: RegExp) => rows.find(row => label.test((row[0] ?? '').trim()))?.[1]?.trim();
  const height = amount(cell(/balance as of block height/i));
  const time = Date.parse(`${cell(/^block time/i) ?? ''} UTC`);
  const zec = amount(cell(/^current zec balance/i));
  const zecUsd = amount(cell(/^zecusd price/i));
  if (height === null || zec === null || !Number.isFinite(time)) throw new Error('Unreadable treasury tab');
  return balanceSchema.parse({
    zec, usdCash: amount(cell(/^current usd balance/i)), paidOutZec: amount(cell(/^total zec paid to grant recipients/i)),
    zecUsd: zecUsd && zecUsd > 0 ? zecUsd : null,
    // The sheet signs liabilities as negative dollars; a negative ZEC count would be a sheet error, so it is dropped.
    accruedZec: count(amount(cell(/^total zec accrued to date/i))), liabilitiesUsd: unsigned(amount(cell(/^future grant liabilities \(total in usd\)/i))),
    receivableZec: count(amount(cell(/^total zec receivables/i))), height, blockTime: new Date(time).toISOString(), current: /^ok\b/i.test(cell(/^status/i) ?? ''), source,
  });
}

/** The live price when the feed answered; otherwise the price the sheet recorded with its balances. */
export function treasuryPrice(live: { usd: number; observedAt: string } | null, sheet: TreasuryBalance): TreasuryPrice | null {
  if (live) return { ...live, source: 'CoinGecko', url: zecPricePage };
  return sheet.zecUsd ? { usd: sheet.zecUsd, observedAt: sheet.blockTime, source: 'sheet', url: sheet.source } : null;
}

/** A side's holdings in dollars: its ZEC at the price, plus the USD it keeps. */
export const valueInUsd = (balance: TreasuryBalance, price: TreasuryPrice) => balance.zec * price.usd + (balance.usdCash ?? 0);
