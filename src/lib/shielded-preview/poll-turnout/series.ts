/** Turnout over time: running totals, kept light enough to send every minute. */

export interface SeriesPoint {
  /** ISO time. */
  at: string;
  /** The running total at that time. */
  value: number;
}

/** Points are kept per half hour: fine enough for a day, light enough for two weeks. */
const BUCKET = 1_800_000;

/** One point per event, the running total after it, oldest first. */
export function cumulative(times: readonly number[]): { at: number; value: number }[] {
  return [...times].sort((a, b) => a - b).map((at, i) => ({ at, value: i + 1 }));
}

/** At most one point per bucket (its last), plus the very last point, so a two-week poll stays a few hundred points. */
export function thin(points: readonly { at: number; value: number }[], bucket = BUCKET): { at: number; value: number }[] {
  const kept: { at: number; value: number }[] = [];
  points.forEach((point, i) => {
    const next = points[i + 1];
    if (!next || Math.floor(next.at / bucket) !== Math.floor(point.at / bucket)) kept.push(point);
  });
  return kept;
}

/** The series as the route sends it: ISO times, nothing before the poll opened. */
export function toSeries(points: readonly { at: number; value: number }[], opensAt: number): SeriesPoint[] {
  return thin(points.filter((p) => Number.isFinite(p.at))).map((p) => ({
    at: new Date(Math.max(p.at, opensAt)).toISOString(),
    value: p.value,
  }));
}

/** A block's time from the nearest known blocks on each side, assuming steady blocks between them. */
export function blockTime(height: number, anchors: ReadonlyMap<number, number>): number | null {
  const exact = anchors.get(height);
  if (exact !== undefined) return exact;
  let below: [number, number] | null = null;
  let above: [number, number] | null = null;
  for (const anchor of anchors) {
    if (anchor[0] < height && (!below || anchor[0] > below[0])) below = anchor;
    if (anchor[0] > height && (!above || anchor[0] < above[0])) above = anchor;
  }
  if (below && above) return below[1] + ((above[1] - below[1]) * (height - below[0])) / (above[0] - below[0]);
  return null;
}
