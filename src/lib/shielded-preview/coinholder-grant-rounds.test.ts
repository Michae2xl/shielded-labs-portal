import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GrantRounds from '@/app/shielded-preview/governance-grant-rounds';
import { coinholderGrantRounds } from './coinholder-grant-rounds';

describe('Coinholder grant rounds', () => {
  it('lists every round in the archive, newest first, with what the vote approved', () => {
    expect(coinholderGrantRounds().map(round => `${round.label}: ${round.approved ?? '-'}/${round.proposals ?? '-'}`)).toEqual(
      ['Q3 2026: 17/37', 'Q2 2026: -/-', 'Q1 2026: 1/6', 'Q4 2025: 5/9']);
  });
  it('keeps a postponed round without inventing a result, and carries each round’s caveat', () => {
    const rounds = coinholderGrantRounds();
    expect(rounds[1]).toMatchObject({ decided: false, approved: null, proposals: null, note: 'Submissions carried into Q3' });
    expect(rounds[2].note).toBe('Plus a separate question on rescinding a Q4 2025 grant');
    expect(rounds[3].note).toBe('One approved grant was later vetoed by key-holders');
    for (const round of rounds.filter(item => item.decided)) expect(round.approved!).toBeLessThanOrEqual(round.proposals!);
  });
  it('prefers the live result for the round it belongs to and leaves the others alone', () => {
    const rounds = coinholderGrantRounds({ label: 'Q3 2026', proposals: 37, approved: 18 });
    expect(rounds[0]).toMatchObject({ approved: 18, proposals: 37 });
    expect(coinholderGrantRounds({ label: 'Q9 2030', proposals: 1, approved: 1 })).toEqual(coinholderGrantRounds());
  });
  it('draws one row per round with its figure in words', () => {
    const html = renderToStaticMarkup(createElement(GrantRounds, { rounds: coinholderGrantRounds(), onNavigate: () => {} }));
    expect([...html.matchAll(/<strong>(Q\d \d{4})<\/strong>/g)].map(match => match[1])).toEqual(['Q3 2026', 'Q2 2026', 'Q1 2026', 'Q4 2025']);
    expect(html).toContain('17 of 37');
    expect(html).toContain('1 of 6');
    expect(html).toContain('5 of 9');
    expect(html).toContain('Postponed 11 Jun 2026');
    expect(html).toContain('Submissions carried into Q3');
    expect(html).toContain('section=results');
    expect(html).toContain('record=poll%3A2025-11-cdrgp-q4-round');
  });
});
