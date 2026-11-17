import { describe, expect, it } from 'vitest';
import { blockTime, cumulative, thin, toSeries } from './series';

const H = 3_600_000;

describe('turnout over time', () => {
  it('counts events into a running total, oldest first', () => {
    expect(cumulative([30, 10, 20])).toEqual([
      { at: 10, value: 1 },
      { at: 20, value: 2 },
      { at: 30, value: 3 },
    ]);
  });
  it('keeps the last point of each half hour, and always the very last', () => {
    const points = [0, 10, 20, H, H + 5].map((at, i) => ({ at, value: i + 1 }));
    expect(thin(points)).toEqual([
      { at: 20, value: 3 },
      { at: H + 5, value: 5 },
    ]);
  });
  it('sends ISO times, nothing before the poll opened', () => {
    expect(toSeries([{ at: -5, value: 1 }, { at: H, value: 2 }], 0)).toEqual([
      { at: new Date(0).toISOString(), value: 1 },
      { at: new Date(H).toISOString(), value: 2 },
    ]);
  });
  it('places a block between its known neighbours, and nowhere without both', () => {
    const anchors = new Map([
      [100, 1_000],
      [200, 3_000],
    ]);
    expect(blockTime(150, anchors)).toBe(2_000);
    expect(blockTime(200, anchors)).toBe(3_000);
    expect(blockTime(50, anchors)).toBeNull();
    expect(blockTime(250, anchors)).toBeNull();
  });
});
