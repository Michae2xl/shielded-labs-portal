// Grant milestones that the ZCG sheet still shows without a payment, with the date the committee estimates for each.
// The sheet is the source. An estimate is not a commitment, and "not recorded" only means that the sheet shows no payment.
import { z } from 'zod';
import { parseCsv } from '@/lib/zcg/csv';
import type { Source } from './governance-types';
import { treasurySheet } from './treasury';

/** The tab that lists every grant milestone: amount, estimate and the payment recorded for it. */
export const scheduleTab = '803214474';
export const scheduleCsvUrl = `https://docs.google.com/spreadsheets/d/${treasurySheet}/export?format=csv&gid=${scheduleTab}`;
export const scheduleSheetUrl = `https://docs.google.com/spreadsheets/d/${treasurySheet}/edit#gid=${scheduleTab}`;
export const scheduleRowUrl = (row: number) => `${scheduleSheetUrl}&range=A${row}`;

export const scheduledPaymentSchema = z.object({
  /** Row of the sheet, as numbered there. */
  row: z.number().int().positive(),
  project: z.string().min(1), grantee: z.string(), category: z.string(), milestone: z.string(),
  usd: z.number().positive(),
  /** Estimated day, or null when the sheet gives none or gives a condition instead. */
  estimate: z.iso.date().nullable(),
  /** The words of the sheet when the estimate is not a date, such as "TBD". */
  condition: z.string().nullable(),
});
export type ScheduledPayment = z.infer<typeof scheduledPaymentSchema>;

const COLUMNS = ['Project', 'Grantee', 'Category', 'Reporting Frequency', 'Milestone', 'Amount (USD)', 'Estimate', 'Paid Out', 'ZEC Disbursed', 'USD Disbursed', 'ZEC/USD', 'Grant Status'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** "15 Nov 2026", the way the sheet writes a day. Anything else is not a date. */
function sheetDay(value: string): string | null {
  const match = /^(\d{1,2}) ([A-Za-z]{3})[A-Za-z]* (\d{4})$/.exec(value);
  const month = match ? MONTHS.indexOf(match[2].toLowerCase()) : -1;
  if (!match || month < 0) return null;
  const year = Number(match[3]), day = Number(match[1]);
  const date = new Date(Date.UTC(year, month, day));
  return date.getUTCMonth() === month && date.getUTCDate() === day ? date.toISOString().slice(0, 10) : null;
}
function dollars(value: string): number | null {
  const amount = Number(value.replace(/[$,\s]/g, ''));
  return value && Number.isFinite(amount) ? amount : null;
}

/** Reads the grants tab. It throws when the layout is not the one it was written for, so a moved column is never read as data. */
export function parseSchedule(csv: string): ScheduledPayment[] {
  if (/^\s*</.test(csv)) throw new Error('The sheet did not return a table');
  const [header = [], ...lines] = parseCsv(csv);
  const names = header.map(cell => cell.split('\n')[0].trim());
  if (COLUMNS.some((name, index) => names[index] !== name)) throw new Error('Unexpected sheet layout');
  const records = lines.map((cells, index) => ({ cell: (column: number) => (cells[column] ?? '').trim(), row: index + 2 })).filter(record => record.cell(0));
  if (records.length < 100) throw new Error('Incomplete sheet');
  return records.flatMap(({ cell, row }) => {
    const usd = dollars(cell(5));
    // Open, no payment date, no ZEC sent, and an amount to pay: everything else is paid, cancelled or carries no payment.
    if (cell(11).toLowerCase() !== 'open' || cell(7) || cell(8) || usd === null || usd <= 0) return [];
    const estimate = sheetDay(cell(6));
    return [scheduledPaymentSchema.parse({ row, project: cell(0), grantee: cell(1), category: cell(2), milestone: cell(4), usd, estimate, condition: estimate || !cell(6) ? null : cell(6) })];
  });
}

/**
 * The schedule around a reference day, which is the day the sheet was read. `past` is an estimate that slipped by earlier in
 * that year; an estimate from an earlier year is kept apart, as an old entry rather than a payment still expected.
 */
export function scheduleGroups(rows: readonly ScheduledPayment[], day: string) {
  const inOrder = (a: ScheduledPayment, b: ScheduledPayment) => (a.estimate ?? '').localeCompare(b.estimate ?? '') || a.row - b.row;
  const year = `${day.slice(0, 4)}-01-01`;
  return {
    upcoming: rows.filter(row => row.estimate !== null && row.estimate >= day).sort(inOrder),
    past: rows.filter(row => row.estimate !== null && row.estimate < day && row.estimate >= year).sort((a, b) => inOrder(b, a)),
    earlier: rows.filter(row => row.estimate !== null && row.estimate < year).sort((a, b) => inOrder(b, a)),
    undated: rows.filter(row => row.estimate === null).sort((a, b) => a.row - b.row),
  };
}
/** What counts as scheduled: the estimates still ahead and those already past in the current year. OpenZcash adds them the same way. */
export const scheduledRows = (groups: Pick<ReturnType<typeof scheduleGroups>, 'upcoming' | 'past'>) => [...groups.upcoming, ...groups.past];
/** Added in cents, so that a long list of amounts does not drift. */
export const scheduleTotal = (rows: readonly ScheduledPayment[]) => rows.reduce((cents, row) => cents + Math.round(row.usd * 100), 0) / 100;
export function scheduleMonths(rows: readonly ScheduledPayment[]) {
  const months = new Map<string, ScheduledPayment[]>();
  for (const row of rows) if (row.estimate) months.set(row.estimate.slice(0, 7), [...(months.get(row.estimate.slice(0, 7)) ?? []), row]);
  return [...months].sort(([a], [b]) => a.localeCompare(b)).map(([month, items]) => ({ month, count: items.length, usd: scheduleTotal(items) }));
}

export const emptyScheduleSource: Source<ScheduledPayment[] | null> = { data: null, state: 'unavailable', observedAt: null, url: scheduleSheetUrl };
const savedSchema = z.object({ observedAt: z.iso.datetime(), csv: z.string().min(1000) });
/** The dated copy bundled with the portal, shown until a live read succeeds. A copy that cannot be read never implies an empty schedule. */
export function scheduleSnapshotSource(saved: unknown): Source<ScheduledPayment[] | null> {
  const parsed = savedSchema.safeParse(saved);
  if (!parsed.success) return emptyScheduleSource;
  try {
    const data = parseSchedule(parsed.data.csv);
    return { data, total: data.length, state: 'snapshot', observedAt: parsed.data.observedAt, url: scheduleSheetUrl };
  } catch { return emptyScheduleSource; }
}
