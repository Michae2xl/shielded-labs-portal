import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { DevFundOverviewCard, DevFundProposals, DevFundVoting } from '@/app/shielded-preview/governance-dev-fund';
import { ProposalsCollection, VotingCollection } from '@/app/shielded-preview/governance-collections';
import GovernanceOverview from '@/app/shielded-preview/governance-overview';
import { devFundAcceptsProposals, devFundHref, devFundLane, devFundNextSteps, devFundNotices, devFundPhase, devFundPublished, devFundStepState, devFundTimeline } from './governance-dev-fund';
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
    expect(card).toContain('View details');
    for (const step of devFundTimeline.steps) { expect(card).toContain(step.dates); expect(card).toContain(step.short); }
  });

  it('explains how to submit, and cites ZIP 0 inside the portal', () => {
    const markup = renderToStaticMarkup(createElement(DevFundProposals, { onNavigate }));
    expect(markup).toContain('Anyone can submit a proposal.');
    expect(markup).toContain('Sunday, 8 Nov 2026<small>23:59 UTC</small>');
    expect(markup).toContain('record=zip-0000');
    expect(markup).toContain('href="https://forum.zcashcommunity.com/new-topic?category=governance"');
    expect(markup).toContain('Start a forum thread');
    expect(markup).toContain('https://forum.zcashcommunity.com/c/governance/25');
    expect(markup).toContain('zcg-and-the-dev-fund-timeline-for-proposals-and-polling/58906');
    expect(markup).toContain('https://x.com/aquietinvestor/status/2118369236636869070');
  });

  it('stops inviting new threads once the published deadline has passed', () => {
    expect(devFundAcceptsProposals(null)).toBe(true);
    expect(devFundAcceptsProposals(at('2026-11-08T23:58:59Z'))).toBe(true);
    expect(devFundAcceptsProposals(at('2026-11-08T23:59:00Z'))).toBe(false);
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
    const empty = renderToStaticMarkup(createElement(DevFundVoting, { onNavigate, published: { questions: null, results: null } }));
    expect(empty).toContain('Not published yet. Publication is planned for 9 Nov.');
    expect(empty).not.toContain('Published questions');
    expect(empty).not.toContain('Published results');
    const published = renderToStaticMarkup(createElement(DevFundVoting, { onNavigate, published: {
      questions: { publishedAt: '2026-11-09', url: 'https://forum.zcashcommunity.com/t/questions/1', items: [{ question: 'An example question?', answers: ['First answer', 'Second answer'] }] },
      results: { publishedAt: '2026-12-01', url: 'https://forum.zcashcommunity.com/t/results/2' },
    } }));
    expect(published).toContain('An example question?');
    expect(published).toContain('Second answer');
    expect(published).toContain('Published questions');
    expect(published).toContain('Published results');
    expect(published).not.toContain('Not published');
  });

  it('can be found through the portal search', () => {
    expect(searchPortal('dev fund polling', [])).toContainEqual({ title: devFundTimeline.title, kind: 'Governance', href: devFundHref('voting') });
    expect(searchPortal('NU 7.1', []).map(result => result.href)).toContain(devFundHref('voting'));
  });

  it('reports the organizers’ notices after the deadline, each with its post, and never before', () => {
    const post = 'zcg-and-the-dev-fund-timeline-for-proposals-and-polling/58906/39';
    expect(devFundNotices.lateProposals.url).toContain(post);
    expect(devFundNotices.questions.url).toContain(post);
    // Server markup has no clock yet: it must read as the published timeline, without the later notices.
    const early = renderToStaticMarkup(createElement(DevFundVoting, { onNavigate, published: { questions: null, results: null } }));
    expect(early).toContain('How to submit');
    expect(early).not.toContain('not part of this round');
    expect(early).toContain('Not published yet. Publication is planned for 9 Nov.');
    vi.useFakeTimers({ now: at('2026-11-10T03:00:00Z') });
    try {
      // useNow reads the clock in an effect, which static rendering never runs; the data still has to carry the facts.
      expect(devFundAcceptsProposals(Date.now())).toBe(false);
      expect(devFundPhase(Date.now()).label).toBe('Discussion period');
      expect(Date.parse(devFundNotices.questions.checkedAt)).toBeLessThanOrEqual(Date.now());
    } finally { vi.useRealTimers(); }
  });

  it('shows progress along the timeline without calling unpublished questions done', () => {
    const [proposals, questions, discussion, polling] = devFundTimeline.steps;
    const states = (now: number | null, published = { questions: null, results: null } as Parameters<typeof devFundStepState>[2]) => [proposals, questions, discussion, polling].map(step => devFundStepState(step, now, published));
    expect(states(null)).toEqual(['next', 'next', 'next', 'next']);
    expect(states(at('2026-11-06T00:00:00Z'))).toEqual(['current', 'next', 'next', 'next']);
    expect(states(at('2026-11-09T12:00:00Z'))).toEqual(['done', 'next', 'current', 'next']);
    // The date passed and nothing was published: awaited, never done.
    expect(states(at('2026-11-10T03:00:00Z'))).toEqual(['done', 'awaited', 'current', 'next']);
    expect(states(at('2026-11-10T03:00:00Z'), { questions: { publishedAt: '2026-11-10', url: 'https://forum.zcashcommunity.com/t/1', items: [] }, results: null })).toEqual(['done', 'done', 'current', 'next']);
    expect(states(at('2026-11-20T00:00:00Z'))).toEqual(['done', 'awaited', 'done', 'current']);
    expect(states(at('2026-12-01T00:00:00Z'))[3]).toBe('done');
  });

  it('shows the draft poll as a draft, with the organizers’ instructions and its post', () => {
    const questions = devFundPublished.questions!;
    expect(questions.draft).toBe(true);
    expect(questions.url).toContain('/58906/47');
    expect(questions.items).toHaveLength(5);
    expect(new Set(questions.items.flatMap(item => item.answers))).toEqual(new Set(['Support', 'Oppose', 'Abstain']));
    const markup = renderToStaticMarkup(createElement(DevFundVoting, { onNavigate }));
    expect(markup).toContain('Draft poll questions');
    expect(markup).toContain('the organizers may adjust it before polling opens');
    expect(markup).toContain('You may support more than one proposal');
    expect(markup).toContain('Do you support maintaining ZCG’s existing funding and operations?');
    expect(markup).not.toContain('None had been posted');
    expect(devFundStepState(devFundTimeline.steps[1], at('2026-11-10T21:00:00Z'))).toBe('done');
  });
});

describe('Draft questions about proposals revised after the draft', () => {
  const items = devFundPublished.questions!.items;
  const html = () => renderToStaticMarkup(createElement(DevFundVoting, { onNavigate: () => {}, published: devFundPublished }));
  it('says the Wind Down proposal changed, with the author’s update as the source', () => {
    const windDown = items[0];
    expect(windDown.question).toContain('Wind Down');
    expect(windDown.note?.text).toMatch(/revised/i);
    expect(windDown.note?.url).toContain('/58515/145');
    expect(html()).toContain(windDown.note!.text);
  });
  it('says the ZAP proposal changed on 11 Nov, with the comparison of the two revisions as the source', () => {
    const zap = items[2];
    expect(zap.question).toContain('Zcash Adoption Pool');
    expect(zap.note?.text).toMatch(/revised on 11 Nov/);
    expect(zap.note?.url).toBe('https://github.com/zcash/zips/compare/ad90f2e5b7318338ac9490702c3b0f653a5643a8...28d7618d21971c747c4db3680755d816110acaf1');
    expect(html()).toContain(zap.note!.text);
  });
  it('leaves the other questions without a note', () => {
    expect(items.flatMap((item, index) => item.note ? [index] : [])).toEqual([0, 2]);
  });
});

describe('Revised draft announced by the organizers', () => {
  it('says under the draft questions that a revised draft is to follow, with the organizers’ post', () => {
    expect(devFundNotices.revisedDraft).toMatchObject({ postedAt: '2026-11-11' });
    expect(devFundNotices.revisedDraft.url).toContain('/58906/54');
    const html = renderToStaticMarkup(createElement(DevFundVoting, { onNavigate: () => {}, published: devFundPublished }));
    expect(html).toContain(devFundNotices.revisedDraft.text);
    expect(html).toContain('/58906/54');
  });
  it('drops that line once the questions are no longer a draft', () => {
    const final = { ...devFundPublished, questions: { ...devFundPublished.questions!, draft: false } };
    const html = renderToStaticMarkup(createElement(DevFundVoting, { onNavigate: () => {}, published: final }));
    expect(html).not.toContain(devFundNotices.revisedDraft.text);
    expect(html).not.toContain('/58906/54');
  });
});
