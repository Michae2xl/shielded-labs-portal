import { describe, expect, it } from 'vitest';
import saved from './governance-data/zcg-schedule.json';
import { parseSchedule, scheduledRows, scheduleGroups, scheduleMonths, scheduleRowUrl, scheduleSnapshotSource, scheduleTotal } from './zcg-schedule';

const header = 'Project,Grantee,"Category \n(as determined by ZCG)","Reporting Frequency \n(as determined by ZCG)",Milestone,Amount (USD),Estimate,Paid Out,ZEC Disbursed,USD Disbursed,ZEC/USD,Grant Status';
const filler = Array.from({ length: 100 }, (_, index) => `Old grant ${index},Someone,Community,NA,1,"$1,000.00",, 1 Jan 2021,10,,$100.00,Completed`);
const sheet = (...rows: string[]) => [header, ...filler, ...rows].join('\n');
const first = filler.length + 2;

describe('ZCG payment schedule', () => {
  it('keeps only open milestones with an amount and no recorded payment, with the row they come from', () => {
    const rows = parseSchedule(sheet(
      '"Wallet, with a comma",Team A,Wallets,Monthly,2,"$12,500.50",  15 Nov 2026,,,,,Open',
      'Paid already,Team B,Community,,1,"$5,000.00",  1 Nov 2026, 3 Nov 2026,4.2,,$1190.00,Open',
      'Cancelled work,Team C,Community,,1,"$5,000.00",  1 Dec 2026,,,,,Cancelled',
      'No amount,Team D,Community,,Startup Funding,,  31 Dec 2026,,,,,Open',
      'Paid in ZEC without a date,Team E,Community,,1,"$900.00",  1 Dec 2026,,1.5,,,Open',
    ));
    expect(rows).toEqual([{ row: first, project: 'Wallet, with a comma', grantee: 'Team A', category: 'Wallets', milestone: '2', usd: 12500.5, estimate: '2026-11-15', condition: null }]);
    expect(scheduleRowUrl(first)).toBe(`https://docs.google.com/spreadsheets/d/1FQ28rDCyRW0TiNxrm3rgD8ai2KGUsXAjPieQmI1kKKg/edit#gid=803214474&range=A${first}`);
  });
  it('keeps the words of the sheet when the estimate is not a date', () => {
    const rows = parseSchedule(sheet('A,B,Security,,3,"$26,000.00",TBD,,,,,Open', 'C,D,Wallets,,1,"$5,000.00",2 months after merge,,,,,Open', 'E,F,Wallets,,1,"$700.00",,,,,,Open', 'G,H,Wallets,,1,"$700.00",31 Feb 2027,,,,,Open'));
    expect(rows.map(row => [row.estimate, row.condition])).toEqual([[null, 'TBD'], [null, '2 months after merge'], [null, null], [null, '31 Feb 2027']]);
  });
  it('refuses a sheet whose columns moved, a login page or a truncated export', () => {
    expect(() => parseSchedule(sheet().replace('Estimate,Paid Out', 'Paid Out,Estimate'))).toThrow('Unexpected sheet layout');
    expect(() => parseSchedule('<!DOCTYPE html><html>Sign in</html>')).toThrow('did not return a table');
    expect(() => parseSchedule([header, ...filler.slice(0, 20)].join('\n'))).toThrow('Incomplete sheet');
  });
  it('splits the schedule around the day the sheet was read and adds amounts in cents', () => {
    const rows = parseSchedule(sheet('A,B,Community,,1,$0.10,  10 Nov 2026,,,,,Open', 'A,B,Community,,2,$0.20,  11 Nov 2026,,,,,Open', 'A,B,Community,,3,$100.30,  2 Jan 2027,,,,,Open', 'A,B,Community,,4,$5.00,TBD,,,,,Open', 'Z,B,Community,,9,$7.00,  9 Jan 2027,,,,,Open', 'Old,B,Community,,5,$40.00,  31 Dec 2025,,,,,Open', 'A,B,Community,,6,$1.00,  1 Jan 2026,,,,,Open'));
    const groups = scheduleGroups(rows, '2026-11-11');
    expect(groups.upcoming.map(row => row.milestone)).toEqual(['2', '3', '9']);
    expect(groups.past.map(row => row.milestone)).toEqual(['1', '6']);
    expect(groups.earlier.map(row => row.milestone)).toEqual(['5']);
    expect(groups.undated.map(row => row.milestone)).toEqual(['4']);
    // Scheduled is what is still ahead plus what slipped past its estimate this year; older estimates stay apart.
    expect(scheduledRows(groups).map(row => row.milestone)).toEqual(['2', '3', '9', '1', '6']);
    expect(scheduleTotal(scheduledRows(groups))).toBe(108.6);
    expect(scheduleTotal(groups.upcoming)).toBe(107.5);
    expect(scheduleMonths(groups.upcoming)).toEqual([{ month: '2026-11', count: 1, usd: 0.2 }, { month: '2027-01', count: 2, usd: 107.3 }]);
  });
  it('reads the saved copy of the sheet, and treats a broken copy as no data instead of an empty schedule', () => {
    const source = scheduleSnapshotSource(saved);
    expect(source.state).toBe('snapshot');
    expect(source.data!.length).toBeGreaterThan(40);
    expect(source.observedAt).toBe(saved.observedAt);
    for (const row of source.data!) { expect(row.usd).toBeGreaterThan(0); expect(row.project).not.toBe(''); }
    const groups = scheduleGroups(source.data!, saved.observedAt.slice(0, 10));
    expect(groups.upcoming.length + groups.past.length + groups.earlier.length + groups.undated.length).toBe(source.data!.length);
    expect(scheduleSnapshotSource({ observedAt: saved.observedAt, csv: 'x'.repeat(2000) })).toMatchObject({ data: null, state: 'unavailable' });
    expect(scheduleSnapshotSource(null)).toMatchObject({ data: null, state: 'unavailable' });
  });
});
