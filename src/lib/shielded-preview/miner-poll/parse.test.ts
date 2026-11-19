import { describe, expect, it } from 'vitest';
import { parseMinerTally } from './parse';
import { eligibleBlocks, minerPoll } from './poll';

// Structure of the Foundation's public tally. Live and final counts below are test inputs.
function page(height: number, tallied: number, ballots: number, status: string, sections = '') {
  const fmt = (value: number) => value.toLocaleString('en-US');
  return '<main><h1>NU7.1 miner poll</h1><div class="tiles">' +
    [['Status', status], ['Blocks tallied', fmt(tallied)], ['Blocks with a ballot', fmt(ballots)]]
      .map(([title, value]) => '<div><h3>' + title + '</h3><p class="big">' + value + '</p></div>').join('') +
    '</div>' + sections + '<footer>Updated 2026-11-19 15:00 UTC, at Mainnet block ' + fmt(height) + '.</footer></main>';
}

describe('NU7.1 miner tally', () => {
  it('reads zero counts only when the source reports them', () => {
    expect(parseMinerTally(page(minerPoll.start - 1, 0, 0, 'Not started'))).toMatchObject({
      phase: 'upcoming', updatedAt: '2026-11-19T15:00:00.000Z', withBallot: 0, tallied: 0, questions: null,
    });
    expect(() => parseMinerTally('<main>Not available</main>')).toThrow();
    expect(() => parseMinerTally(page(minerPoll.start, 1, 1, 'Live').replace('Blocks tallied', 'unknown'))).toThrow();
    expect(() => parseMinerTally(page(minerPoll.start, 1, 1, 'Live', '<aside class="demo">Example</aside>'))).toThrow();
  });
  it('keeps question counts separate and withholds unrecognized breakdowns', () => {
    const questions = [1, 2, 3, 4, 5].map(id =>
      '<h3>Q' + id + '. Example</h3><div class="legend"><span>Support: 1 (0.1%)</span><span>Oppose: 0</span><span>Abstain: 1</span></div>').join('');
    const html = page(minerPoll.start + 4, 5, 2, 'Voting', questions);
    expect(parseMinerTally(html)).toMatchObject({ phase: 'counting', tallied: 5, withBallot: 2 });
    expect(parseMinerTally(html).questions).toHaveLength(5);
    expect(parseMinerTally(html).questions?.[4]).toEqual({ id: 5, support: 1, oppose: 0, abstain: 1 });
    expect(parseMinerTally(html.replace('Support: 1', 'Support: 4')).questions).toBeNull();
    expect(parseMinerTally(html.replace('Q5.', 'Q4.')).questions).toBeNull();
    expect(parseMinerTally(html.replace('Oppose: 0', 'Oppose: 0%')).questions).toBeNull();
  });
  it('accepts inclusive boundaries and requires an official final status and 100 confirmations', () => {
    expect(() => parseMinerTally(page(minerPoll.start, 2, 0, 'Voting'))).toThrow();
    expect(() => parseMinerTally(page(minerPoll.start, 1, 2, 'Voting'))).toThrow();
    expect(parseMinerTally(page(minerPoll.end + 98, eligibleBlocks, 7, 'Final')).phase).toBe('confirming');
    expect(parseMinerTally(page(minerPoll.end + 99, eligibleBlocks, 7, 'Provisional')).phase).toBe('confirming');
    expect(parseMinerTally(page(minerPoll.end + 99, eligibleBlocks, 7, 'Final')).phase).toBe('final');
  });
});
