import { describe, expect, it } from 'vitest';
import { POLICY_HREF } from '@/app/shielded-preview/transparency';
import { debateHref, debates } from './debates';
import { laneForAnchor, transparencyLane, transparencyLanes } from './lanes';

describe('Transparency tabs', () => {
  it('opens on the debates and ignores an unknown tab', () => {
    expect(transparencyLanes.map(lane => lane.id)).toEqual(['debates', 'involvement', 'evidence', 'method']);
    expect(transparencyLane('evidence')).toBe('evidence');
    for (const value of ['', 'review', 'Debates']) expect(transparencyLane(value)).toBe('debates');
  });
  it('finds the tab that holds each in-page anchor, so older links still land', () => {
    expect(laneForAnchor('editorial-policy')).toBe('method');
    expect(laneForAnchor('evidence')).toBe('evidence');
    expect(laneForAnchor('source-thermometer')).toBe('evidence');
    for (const debate of debates) expect(laneForAnchor(new URL(debateHref(debate), 'https://portal.test').hash.slice(1))).toBe('debates');
    expect(laneForAnchor('unknown')).toBeNull();
  });
  it('links the editorial policy with its tab already selected', () => {
    const url = new URL(POLICY_HREF, 'https://portal.test');
    expect(url.searchParams.get('lane')).toBe(laneForAnchor(url.hash.slice(1)));
  });
});
