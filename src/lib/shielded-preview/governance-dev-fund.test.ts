import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { DevFundOverviewCard, DevFundProposals, DevFundVoting } from '@/app/shielded-preview/governance-dev-fund';
import { ProposalsCollection, VotingCollection } from '@/app/shielded-preview/governance-collections';
import GovernanceOverview from '@/app/shielded-preview/governance-overview';
import { devFundHref, devFundLane, devFundNextSteps, devFundPhase, devFundTimeline } from './governance-dev-fund';
import { emptyCoinholderSource } from './coinholder-proposals';
import snapshot from './governance-data/snapshot.json';
import record from './governance-data/record.json';
import type { GovernanceData } from './governance-types';
import { searchPortal } from './portal-search';

const at = (value: string) => Date.parse(value);
const onNavigate = vi.fn();
const controls = { search: '', onSearch: vi.fn(), filter: 'all', onFilter: vi.fn(), page: 1, onPage: vi.fn(), onNavigate };

describe('ZCG / Dev Fund published timeline', () => {
  it('keeps the dates of the published timeline', () => {
    expect(devFundTimeline.steps.map(step => step.dates)).toEqual(['8 Nov', '9 Nov', '9 – 15 Nov', '16 – 30 Nov']);
    expect(devFundTimeline.steps[0].endsAt).toBe('2026-11-08T23:59:00Z');
    expect(devFundTimeline.steps[3].endsAt).toBe('2026-11-30T23:59:00Z');
  });

  it('moves through the phases at the published boundaries', () => {
    expect(devFundPhase(at('2026-11-05T17:00:00Z')).label).toBe('Accepting proposals');
    expect(devFundPhase(at('2026-11-08T23:58:59Z')).id).toBe('proposals');
    expect(devFundPhase(at('2026-11-08T23:59:00Z')).id).toBe('discussion');
    expect(devFundPhase(at('2026-11-15T23:59:59Z')).id).toBe('discussion');
    expect(devFundPhase(at('2026-11-16T00:00:00Z')).label).toBe('Planned polling period');
    expect(devFundPhase(at('2026-11-30T23:59:00Z'))).toEqual({ id: null, label: 'Polling period ended' });
    expect(devFundPhase(null).label).toBe('Published timeline');
  });

  it('shows only the dates still ahead', () => {
    expect(devFundNextSteps(null)).toHaveLength(4);
    expect(devFundNextSteps(at('2026-11-05T17:00:00Z'))).toHaveLength(4);
    expect(devFundNextSteps(at('2026-11-09T12:00:00Z')).map(step => step.id)).toEqual(['questions', 'discussion', 'polling']);
    expect(devFundNextSteps(at('2026-11-20T12:00:00Z')).map(step => step.id)).toEqual(['polling']);
    expect(devFundNextSteps(at('2026-12-01T00:00:00Z'))).toEqual([]);
  });

  it('opens the Governance overview with the card and links to the details', () => {
    const markup = renderToStaticMarkup(createElement(GovernanceOverview, { data: snapshot as unknown as GovernanceData, pollCount: record.polls.length, onNavigate }));
    expect(markup.indexOf(devFundTimeline.title)).toBeGreaterThan(-1);
    expect(markup.indexOf(devFundTimeline.title)).toBeLessThan(markup.indexOf('How to participate'));
    const card = renderToStaticMarkup(createElement(DevFundOverviewCard, { onNavigate }));
    expect(card).toContain(`href="${devFundHref('voting').replaceAll('&', '&amp;')}"`);
    for (const step of devFundTimeline.steps) expect(card).toContain(step.dates);
  });

  it('explains how to submit, and cites ZIP 0 inside the portal', () => {
    const markup = renderToStaticMarkup(createElement(DevFundProposals, { onNavigate }));
    expect(markup).toContain('Anyone can submit a proposal.');
    expect(markup).toContain('Sunday, 8 Nov 2026 · 23:59 UTC');
    expect(markup).toContain('record=zip-0000');
    expect(markup).toContain('https://forum.zcashcommunity.com"');
    expect(markup).toContain('zcg-and-the-dev-fund-timeline-for-proposals-and-polling/58906');
    expect(markup).toContain('https://x.com/aquietinvestor/status/2118369236636869070');
  });

  it('keeps its Proposals tab apart from ZCG applications and Coinholder grants', () => {
    const row = { id: 'review:1', title: 'A regular application', applicant: 'Someone', amount: 1, status: 'under_review', summary: '', submitted: null, decided: null, url: null, sourceUrl: null, origin: '' };
    const markup = renderToStaticMarkup(createElement(ProposalsCollection, { ...controls, datasets: { review: [row], history: [] }, coinholderSource: emptyCoinholderSource, lane: devFundLane, onLane: vi.fn(), source: emptyCoinholderSource, round: 'all', onRound: vi.fn(), busy: false }));
    expect(markup).toContain('Submit a proposal');
    expect(markup).not.toContain('A regular application');
    expect(markup).not.toContain('Search proposals');
  });

  it('shows the calendar in Voting and states that NU 7.1 is conditional', () => {
    const markup = renderToStaticMarkup(createElement(VotingCollection, { ...controls, source: emptyCoinholderSource, lane: devFundLane, onLane: vi.fn(), busy: false }));
    for (const step of devFundTimeline.steps) expect(markup).toContain(step.summary);
    expect(markup).toContain('Not approved or scheduled');
    expect(markup).toContain('It depends on rough consensus after polling.');
    expect(markup).not.toContain('Q4 2026');
  });

  it('shows questions, answers and results only once they are published', () => {
    const empty = renderToStaticMarkup(createElement(DevFundVoting, { onNavigate }));
    expect(empty).toContain('Not published yet. Publication is planned for 9 Nov.');
    expect(empty).not.toContain('Published questions');
    expect(empty).not.toContain('Published results');
    const published = renderToStaticMarkup(createElement(DevFundVoting, { onNavigate, published: {
      questions: { publishedAt: '2026-11-09', url: 'https://forum.zcashcommunity.com/t/questions/1', items: [{ question: 'An example question?', answers: ['First answer', 'Second answer'] }] },
      results: { publishedAt: '2026-12-01', url: 'https://forum.zcashcommunity.com/t/results/2' },
    } }));
    expect(published).toContain('An example question?');
    expect(published).toContain('Second answer');
    expect(published).toContain('Published results');
    expect(published).not.toContain('Not published');
  });

  it('can be found through the portal search', () => {
    expect(searchPortal('dev fund polling', [])).toContainEqual({ title: devFundTimeline.title, kind: 'Governance', href: devFundHref('voting') });
    expect(searchPortal('NU 7.1', []).map(result => result.href)).toContain(devFundHref('voting'));
  });
});
