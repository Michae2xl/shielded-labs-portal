import { describe, expect, it } from 'vitest';
import type { BodyTurnout, TurnoutSnapshot } from './turnout';
import { chartSpan, dailyNew, dailyRows, formatCount, knownAt, lineEnd, niceMax, pollDay, tickLabel, timeTicks, valueAt } from './view';

const H = 3_600_000;
const OPEN = Date.parse('2026-11-16T00:00:00Z');
const CLOSE = Date.parse('2026-12-01T02:59:00Z');
const series = [
  { at: '2026-11-16T00:00:00.000Z', value: 0 },
  { at: '2026-11-16T12:00:00.000Z', value: 3 },
];
const body = (timing: BodyTurnout['timing']) => ({ series, timing }) as BodyTurnout;

describe('reading the chart', () => {
  it('gives the running total at a time, and how far each line reaches', () => {
    expect([valueAt(series, OPEN - 1), valueAt(series, OPEN + H), valueAt(series, OPEN + 13 * H)]).toEqual([null, 0, 3]);
    expect(lineEnd(body('exact'), OPEN + 20 * H)).toBe(OPEN + 20 * H);
    expect(lineEnd(body('recorded'), OPEN + 20 * H)).toBe(OPEN + 12 * H);
  });
  it('knows a count read by hand only at its readings and after the last one', () => {
    expect(knownAt(body('recorded'), OPEN + 6 * H)).toBeNull();
    expect(knownAt(body('recorded'), OPEN)).toBe(0);
    expect(knownAt(body('recorded'), OPEN + 14 * H)).toBe(3);
    expect(knownAt(body('exact'), OPEN + 6 * H)).toBe(0);
  });
  it('rounds a scale up to a clean top', () => {
    expect([niceMax(0), niceMax(3), niceMax(24), niceMax(131), niceMax(1_324)]).toEqual([4, 4, 50, 200, 2_000]);
  });
  it('ticks on whole hours for a day, whole days for the poll', () => {
    const day = timeTicks(OPEN, OPEN + 24 * H, 900);
    expect(day.map(tickLabel)).toEqual(['16 Nov', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '17 Nov']);
    expect(timeTicks(OPEN, CLOSE, 900).map(tickLabel)).toEqual(['16 Nov', '18 Nov', '20 Nov', '22 Nov', '24 Nov', '26 Nov', '28 Nov', '30 Nov']);
  });
  it('shows the poll so far with a little room after now, or the whole poll', () => {
    expect(chartSpan(OPEN, CLOSE, OPEN + 24 * H, 'whole')).toEqual({ start: OPEN, end: CLOSE });
    const soFar = chartSpan(OPEN, CLOSE, OPEN + 24 * H, 'so-far');
    expect(soFar.start).toBe(OPEN);
    expect(soFar.end).toBeGreaterThan(OPEN + 24 * H);
    expect(soFar.end).toBeLessThan(OPEN + 26 * H);
    expect(chartSpan(OPEN, CLOSE, CLOSE + H, 'so-far')).toEqual({ start: OPEN, end: CLOSE });
  });
  it('counts poll days and builds one row per day', () => {
    const snapshot = { opensAt: '2026-11-16T00:00:00Z', closesAt: '2026-12-01T02:59:00Z', bodies: [body('exact')] } as TurnoutSnapshot;
    expect(pollDay(snapshot, OPEN + 25 * H)).toEqual({ day: 2, days: 15 });
    expect(pollDay(snapshot, CLOSE)).toEqual({ day: 15, days: 15 });
    expect(dailyRows(snapshot, OPEN + 25 * H)).toEqual([
      { day: OPEN, values: [3] },
      { day: OPEN + 24 * H, values: [3] },
    ]);
  });
  it('says what each body added on each poll day, and leaves the days to come empty', () => {
    const grow = { series: [{ at: '2026-11-16T00:00:00.000Z', value: 0 }, { at: '2026-11-16T20:00:00.000Z', value: 85 }, { at: '2026-11-17T01:00:00.000Z', value: 105 }], timing: 'exact' } as BodyTurnout;
    const hand = { series: [{ at: '2026-11-16T00:00:00.000Z', value: 0 }, { at: '2026-11-16T23:16:00.000Z', value: 24 }, { at: '2026-11-17T01:04:00.000Z', value: 29 }], timing: 'recorded' } as BodyTurnout;
    const none = { series: [], timing: 'exact' } as unknown as BodyTurnout;
    const snapshot = { opensAt: '2026-11-16T00:00:00Z', closesAt: '2026-12-01T02:59:00Z', bodies: [grow, hand, none] } as TurnoutSnapshot;
    const days = dailyNew(snapshot, OPEN + 26 * H);
    expect(days).toHaveLength(15);
    expect(days.slice(0, 2)).toEqual([
      { day: OPEN, future: false, values: [85, 24, null] },
      { day: OPEN + 24 * H, future: false, values: [20, 5, null] },
    ]);
    expect(days.slice(2).every((d) => d.future && d.values.every((v) => v === null))).toBe(true);
    // The last day runs on to the close.
    const late = { ...snapshot, bodies: [{ series: [{ at: '2026-11-16T00:00:00.000Z', value: 0 }, { at: '2026-12-01T01:00:00.000Z', value: 9 }], timing: 'exact' } as BodyTurnout] };
    expect(dailyNew(late, Date.parse('2026-12-01T02:00:00Z')).at(-1)).toMatchObject({ future: false, values: [9] });
  });
  it('writes counts with separators, and estimates with ≈', () => {
    expect([formatCount(null), formatCount(1324), formatCount(7, true)]).toEqual(['—', '1,324', '≈ 7']);
  });
});
