import { describe, expect, it } from 'vitest';
import { HELIOS_PAGE, heliosBallotTimes, heliosUrls, heliosVoterIds } from './helios';

const BRASIL = 'b2b63125-8cee-4f9c-bab5-dd8d5de0d030';

describe('panels on Helios', () => {
  it('keeps one time per voter, the latest ballot’s, read as UTC', () => {
    const times = heliosBallotTimes([
      { voter_uuid: 'a', cast_at: '2026-11-16 11:39:21.731163', vote_hash: 'h1' },
      { voter_uuid: 'b', cast_at: '2026-11-16 12:24:46.692601', vote_hash: 'h2' },
      { voter_uuid: 'a', cast_at: '2026-11-16 13:00:00.000001', vote_hash: 'h3' },
    ]);
    expect(times.sort()).toEqual([Date.parse('2026-11-16T12:24:46.692Z'), Date.parse('2026-11-16T13:00:00.000Z')]);
    expect(() => heliosBallotTimes({ ballots: [] })).toThrow();
  });
  it('counts a ballot without a time, and never returns ids or names', () => {
    expect(heliosBallotTimes([{ voter_uuid: 'a' }])).toHaveLength(1);
    expect(heliosVoterIds([{ uuid: 'v1', name: 'Someone' }])).toEqual(['v1']);
  });
  it('builds URLs only for an election id', () => {
    expect(heliosUrls(BRASIL).ballots).toBe(`https://vote.heliosvoting.org/helios/elections/${BRASIL}/ballots/`);
    expect(heliosUrls(BRASIL).voters('v 2')).toBe(`https://vote.heliosvoting.org/helios/elections/${BRASIL}/voters/?limit=${HELIOS_PAGE}&after=v%202`);
    expect(() => heliosUrls('../admin')).toThrow('Helios');
  });
});
