import type { BodyTurnout, TurnoutSnapshot } from './turnout';
import type { SeriesPoint } from './series';

/** What the turnout panel computes from a snapshot: values at a time, the time axis, the day count. */

const DAY = 86_400_000;
const fmt = new Intl.NumberFormat('en-US');
export const formatCount = (value: number | null, approximate = false) => (value === null ? '—' : `${approximate ? '≈ ' : ''}${fmt.format(value)}`);

const UTC_DAY = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const UTC_TIME = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' });
export const dayLabel = (ms: number) => UTC_DAY.format(ms);
export const timeLabel = (ms: number) => `${UTC_TIME.format(ms)} UTC`;
export const stampLabel = (ms: number) => `${UTC_DAY.format(ms)}, ${UTC_TIME.format(ms)} UTC`;

/** The running total at a time: the last point at or before it, null before the first. */
export function valueAt(series: readonly SeriesPoint[], at: number): number | null {
  let value: number | null = null;
  for (const point of series) {
    if (Date.parse(point.at) > at) break;
    value = point.value;
  }
  return value;
}

/** A body's count at a time, as far as it is known: a count read by hand is known only from its last reading on. */
export function knownAt(body: Pick<BodyTurnout, 'series' | 'timing'>, at: number): number | null {
  if (body.timing !== 'recorded') return valueAt(body.series, at);
  const last = body.series.at(-1);
  if (!last) return null;
  if (at >= Date.parse(last.at)) return last.value;
  const exact = body.series.find((p) => Date.parse(p.at) === at);
  return exact ? exact.value : null;
}

/** How far a body's line reaches: a live count holds until now; a count read by hand stops at its last reading. */
export function lineEnd(body: BodyTurnout, now: number): number | null {
  const last = body.series.at(-1);
  if (!last) return null;
  return body.timing === 'recorded' ? Date.parse(last.at) : Math.max(Date.parse(last.at), now);
}

/** A clean top for a row's scale: 1, 2 or 5 times a power of ten, above the largest value. */
export function niceMax(value: number): number {
  if (value <= 4) return 4;
  const power = 10 ** Math.floor(Math.log10(value * 1.12));
  return [1, 2, 2.5, 5, 10].map((m) => m * power).find((top) => top >= value * 1.12) ?? 10 * power;
}

const HOUR = 3_600_000;
const STEPS = [HOUR, 3 * HOUR, 6 * HOUR, 12 * HOUR, DAY, 2 * DAY, 3 * DAY, 7 * DAY];

/** Ticks on whole UTC hours or days, as many as fit about every 90 pixels. */
export function timeTicks(start: number, end: number, width: number): number[] {
  const room = Math.max(2, Math.floor(width / 90));
  const step = STEPS.find((s) => (end - start) / s <= room) ?? STEPS.at(-1)!;
  // Hours sit on the clock; days count from the first midnight of the span, so the opening day is labelled.
  const first = Math.ceil(start / Math.min(step, DAY)) * Math.min(step, DAY);
  return Array.from({ length: Math.max(0, Math.floor((end - first) / step) + 1) }, (_, i) => first + i * step);
}
/** A tick's label: the date at midnight UTC, the hour otherwise. */
export const tickLabel = (ms: number) => (ms % DAY === 0 ? UTC_DAY.format(ms) : UTC_TIME.format(ms));

/** The span the chart shows: the whole poll, or from the opening to now with a little room after it. */
export function chartSpan(opensAt: number, closesAt: number, now: number, range: 'so-far' | 'whole'): { start: number; end: number } {
  if (range === 'whole' || now >= closesAt) return { start: opensAt, end: closesAt };
  const elapsed = Math.max(HOUR, now - opensAt);
  return { start: opensAt, end: Math.min(closesAt, now + Math.max(HOUR / 2, elapsed * 0.04)) };
}

/** "Day 2 of 15" while polls are open. */
export function pollDay(snapshot: Pick<TurnoutSnapshot, 'opensAt' | 'closesAt'>, now: number): { day: number; days: number } {
  const opens = Date.parse(snapshot.opensAt);
  // 16 Nov 00:00 to 1 Dec 02:59 UTC is the published 16–30 Nov: fifteen days.
  const days = Math.max(1, Math.round((Date.parse(snapshot.closesAt) - opens) / DAY));
  return { day: Math.min(days, Math.max(1, Math.floor((now - opens) / DAY) + 1)), days };
}

/** One row per poll day so far: each body's count at the end of that day (by hand: its last reading), or now for today. */
export function dailyRows(snapshot: TurnoutSnapshot, now: number): { day: number; values: (number | null)[] }[] {
  const opens = Date.parse(snapshot.opensAt);
  const until = Math.min(now, Date.parse(snapshot.closesAt));
  const rows: { day: number; values: (number | null)[] }[] = [];
  for (let start = opens; start <= until; start += DAY) {
    const end = Math.min(start + DAY - 1, until);
    // A count read by hand shows its last reading that day.
    rows.push({ day: start, values: snapshot.bodies.map((body) => (body.series.length ? valueAt(body.series, end) : null)) });
  }
  return rows;
}

/**
 * What each body added on each poll day (UTC): the change in its count over the day. Days still to come are
 * marked future; the last day runs on to the close. A count read by hand adds what its readings that day add.
 */
export function dailyNew(snapshot: TurnoutSnapshot, now: number): { day: number; future: boolean; values: (number | null)[] }[] {
  const opens = Date.parse(snapshot.opensAt);
  const closes = Date.parse(snapshot.closesAt);
  const { days } = pollDay(snapshot, now);
  return Array.from({ length: days }, (_, i) => {
    const start = opens + i * DAY;
    if (start > now) return { day: start, future: true, values: snapshot.bodies.map(() => null) };
    const end = Math.min(i === days - 1 ? closes : start + DAY - 1, now);
    return {
      day: start,
      future: false,
      values: snapshot.bodies.map((body) => {
        if (!body.series.length) return null;
        const before = i === 0 ? 0 : (valueAt(body.series, start - 1) ?? 0);
        const after = valueAt(body.series, end);
        return after === null ? null : Math.max(0, after - before);
      }),
    };
  });
}
