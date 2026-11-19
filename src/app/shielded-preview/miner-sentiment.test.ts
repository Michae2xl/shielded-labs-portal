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
    expect(html).not.toContain('blocks with a ballot');
  });
  it('shows verified pre-opening counts and block distance', () => {
    const html = render(reading);
    expect(html).toContain('Not started');
    expect(html).toContain('Opens in 1,261 blocks');
    expect(html).not.toContain('Results by question');
  });
  it('preserves a previous reading on refresh failure and separates abstentions from unanswered blocks', () => {
    const html = render({ ...reading, phase: 'counting', tallied: 10, withBallot: 5,
      questions: [{ id: 1, support: 2, oppose: 0, abstain: 1 }] }, true);
    expect(html).toContain('Showing the last reading received');
    expect(html).toContain('<td>2</td><td>0</td><td>1</td><td>7</td>');
  });
});
