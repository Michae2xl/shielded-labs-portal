import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MinerCard } from './miner-sentiment';
import type { MinerReading } from '@/lib/shielded-preview/miner-poll/poll';

const reading: MinerReading = {
  updatedAt: '2026-11-19T15:00:00Z', phase: 'upcoming', height: 3_589_939, tallied: 0, withBallot: 0, questions: null,
};
const render = (data: MinerReading | null, failed = false) => renderToStaticMarkup(createElement(MinerCard, { reading: data, failed }));

describe('miner sentiment card', () => {
  it('shows the tally source even when the counts are unavailable', () => {
    const html = render(null, true);
    expect(html).toContain('The official tally is unavailable');
    expect(html).toContain('https://miner-poll.zfnd.org/');
    expect(html).not.toContain('<dt>Blocks with a ballot</dt>');
    expect(html).toContain('Verify the tally');
  });
  it('shows verified pre-opening counts and block distance', () => {
    const html = render(reading);
    expect(html).toContain('Not started');
    expect(html).toContain('Opens in 1,261 blocks');
    expect(html).not.toContain('Results by question');
    expect(html).not.toContain('No blocks tallied yet');
    expect(html).toContain('of 38,451 eligible blocks');
  });
  it('shows the official command and explains how to compare readings', () => {
    const html = render(null, true);
    expect(html).toContain('miner-poll tally --election nu7-1 --options 3,3,3,3,3 --network mainnet --start 3591200 --end 3629650 --addr 127.0.0.1:8232');
    expect(html).toContain('tallied_through_height');
    expect(html).toContain('blocks_with_ballot');
    expect(html).toContain('Copy command');
  });
  it('uses the whole window for progress and tallied blocks for ballot coverage', () => {
    const html = render({ ...reading, phase: 'counting', tallied: 200, withBallot: 50 });
    expect(html).toContain('of 38,451 eligible blocks (0.5%)');
    expect(html).toContain('25.0% of tallied blocks');
  });
  it('preserves a previous reading on refresh failure and separates abstentions from unanswered blocks', () => {
    const html = render({ ...reading, phase: 'counting', tallied: 10, withBallot: 5,
      questions: [{ id: 1, support: 2, oppose: 0, abstain: 1 }] }, true);
    expect(html).toContain('Showing the last reading received');
    expect(html).toContain('<td>2</td><td>0</td><td>1</td><td>7</td>');
  });
});
