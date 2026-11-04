import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Link } from '@/app/shielded-preview/governance-collections';
import GovernanceInsights from '@/app/shielded-preview/governance-insights';
import GovernanceOverview from '@/app/shielded-preview/governance-overview';
import GovernanceZcap from '@/app/shielded-preview/governance-zcap';
import { comparisons } from './comparisons';
import record from './governance-data/record.json';
import snapshot from './governance-data/snapshot.json';
import type { GovernanceData } from './governance-types';
import { participationGuideId } from './governance-participation';

const data = snapshot as unknown as GovernanceData;
const internalLinks = (node: ReactNode) => [...renderToStaticMarkup(node).matchAll(/<a\b[^>]*\bhref="(\?[^"<>]*)"/g)]
  .map(match => new URL(match[1].replaceAll('&amp;', '&'), 'https://portal.example').searchParams);
const destinations = {
  proposals: new Set([...data.review.data.map(row => `review:${row.number}`), ...data.proposals.data.map(row => `history:${row.id}`)]),
  grants: new Set(data.grants.data.map(row => `${row.program}|${row.grant}`)),
  results: new Set(data.verification.data!.rows.map(row => `q3:${row.id}`)),
  voting: new Set([participationGuideId, ...record.polls.filter(row => row.kind !== 'test').map(row => `poll:${row.id}`)]),
};

describe('Governance navigation and supporting records', () => {
  it('uses the same record and list context for normal clicks and native links', () => {
    const onNavigate = vi.fn();
    const selection = { lane: 'members', filter: 'name-desc', search: 'Éva & Lee', page: 3 };
    const id = 'member:["Éva & Lee","eva"]';
    const element = Link({ section: 'ZCAP', id, selection, onNavigate, children: 'Member' });
    const params = new URL(element.props.href, 'https://portal.example').searchParams;
    expect(Object.fromEntries(params)).toEqual({ view: 'governance', section: 'zcap', record: id, lane: 'members', filter: 'name-desc', q: 'Éva & Lee', page: '3' });
    const event = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, preventDefault: vi.fn() };
    element.props.onClick(event);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(onNavigate).toHaveBeenCalledExactlyOnceWith('ZCAP', id, selection);
    onNavigate.mockClear();
    event.preventDefault.mockClear();
    element.props.onClick({ ...event, metaKey: true });
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('routes every overview and insight record link to an existing record in its section', () => {
    const nodes = [createElement(GovernanceOverview, { data, pollCount: record.polls.length, onNavigate: vi.fn() }),
      ...['decisions', 'payments', 'outcomes', 'panels'].map(lane => createElement(GovernanceInsights, { data, lane, onLane: vi.fn(), onNavigate: vi.fn() }))];
    let details = 0;
    for (const node of nodes) for (const params of internalLinks(node)) {
      expect(params.get('view')).toBe('governance');
      const id = params.get('record');
      if (!id) continue;
      const section = params.get('section') as keyof typeof destinations;
      expect(destinations[section]?.has(id), `${section}: ${id}`).toBe(true);
      details++;
    }
    expect(details).toBeGreaterThan(15);
  });

  it('carries insight status, outcome and question selections into the corresponding collection', () => {
    const links = (lane: string) => internalLinks(createElement(GovernanceInsights, { data, lane, onLane: vi.fn(), onNavigate: vi.fn() }));
    const statuses = links('decisions').filter(params => params.has('filter'));
    expect(statuses.map(params => params.get('filter')).sort()).toEqual([...new Set(data.proposals.data.map(row => row.status))].sort());
    expect(statuses.every(params => params.get('section') === 'proposals' && params.get('lane') === 'history')).toBe(true);
    const outcomes = links('outcomes').filter(params => params.has('filter') && !params.has('record'));
    expect([...new Set(outcomes.map(params => params.get('filter')))].sort()).toEqual(['Funded', 'Rejected']);
    expect(outcomes.every(params => params.get('section') === 'results')).toBe(true);
    const questions = links('panels').filter(params => params.get('section') === 'zcap');
    expect(questions.map(params => params.get('filter'))).toEqual(comparisons.rounds[0].questions.map(question => question.id));
    expect(questions.every(params => !params.has('basis'))).toBe(true);
  });

  it('keeps an unlinked payment in its program instead of inventing a grant record', () => {
    const payment = { ...data.payments.data[0], id: 'unlinked-payment', project: 'Unlinked & exact title', sourceSheet: 'coinholder_grants', isPaid: true, paidOutDate: '2026-10-31' };
    const changed = { ...data, grants: { ...data.grants, data: [] }, payments: { ...data.payments, data: [payment] } };
    const links = internalLinks(createElement(GovernanceInsights, { data: changed, lane: 'payments', onLane: vi.fn(), onNavigate: vi.fn() }));
    const related = links.find(params => params.get('q') === payment.project)!;
    expect(related).toBeDefined();
    expect(related.get('section')).toBe('grants');
    expect(related.get('filter')).toBe('coinholder');
    expect(related.has('record')).toBe(false);
  });

  it('gives every ZCAP member a unique source-backed record and retains directory context', () => {
    const ids: string[] = [];
    for (let page = 1; page <= Math.ceil(data.members.data.length / 12); page++) {
      const links = internalLinks(createElement(GovernanceZcap, { source: data.members, selected: null, lane: 'members', filter: 'name-desc', search: '', page, basis: 'include', onNavigate: vi.fn(), onSearch: vi.fn(), onFilter: vi.fn(), onPage: vi.fn(), onBasis: vi.fn() }));
      for (const params of links.filter(params => params.get('record')?.startsWith('member:'))) {
        const id = params.get('record')!;
        const [name, handle] = JSON.parse(id.slice('member:'.length));
        expect(data.members.data.filter(row => row.name === name && row.handle === handle)).toHaveLength(1);
        expect(params.get('lane')).toBe('members');
        expect(params.get('filter')).toBe('name-desc');
        expect(params.get('page') ?? '1').toBe(String(page));
        ids.push(id);
      }
    }
    expect(ids).toHaveLength(data.members.data.length);
    expect(new Set(ids).size).toBe(data.members.data.length);
  });

  it('opens the poll archive from ZCAP instead of the current proposal intake', () => {
    const member = data.members.data[0];
    for (const selected of [null, `member:${JSON.stringify([member.name, member.handle])}`]) {
      const links = internalLinks(createElement(GovernanceZcap, { source: data.members, selected, lane: 'members', filter: 'all', search: '', page: 1, basis: 'include', onNavigate: vi.fn(), onSearch: vi.fn(), onFilter: vi.fn(), onPage: vi.fn(), onBasis: vi.fn() }));
      const archives = links.filter(params => params.get('section') === 'voting' && !params.has('record'));
      expect(archives).toHaveLength(1);
      expect(archives[0].get('lane')).toBe('archive');
    }
  });
});
