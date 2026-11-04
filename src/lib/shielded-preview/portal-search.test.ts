import { describe, expect, it } from 'vitest';
import { searchPortal } from './portal-search';

const navigation = [{ id: 'activity', title: 'Code activity', keywords: 'development commits developers repositories' }, { id: 'projects', title: 'Projects', keywords: 'research documentation resources roadmap' }];

describe('Global page and profile search', () => {
  it('normalizes pasted whitespace and case for every result type', () => {
    for (const query of ['Mark', 'Crosslink', 'commits', 'Foundation', 'slashing']) {
      expect(searchPortal(`  ${query.toUpperCase()}  `, navigation)).toEqual(searchPortal(query, navigation));
    }
    expect(searchPortal('  Mark  Henderson ', navigation)).toContainEqual({ title: 'Mark Henderson', kind: 'Engineering Manager', href: '?view=people&section=engineering&record=person%3Amark-henderson' });
    expect(searchPortal('product  chief', navigation).some(result => result.title === 'Zooko Wilcox')).toBe(true);
  });

  it('keeps exact record destinations for curated documents, projects, milestones and people', () => {
    expect(searchPortal('Crosslink', navigation)).toContainEqual({ title: 'Crosslink', kind: 'Project', href: '?view=projects&project=crosslink' });
    expect(searchPortal('Foundation', navigation)).toContainEqual({ title: 'Foundation in place', kind: 'Milestone', href: '?view=impact&section=engineering&record=milestone%3A2025-03-21' });
    expect(searchPortal('slashing', navigation).some(result => new URL(result.href, 'https://portal.test').searchParams.get('record') === 'crosslink-faq')).toBe(true);
    expect(searchPortal('commits', navigation)).toContainEqual({ title: 'Code activity', kind: 'Portal', href: '?view=activity' });
  });

  it('does not invent results for empty or unmatched searches', () => {
    expect(searchPortal(' \n ', navigation)).toEqual([]);
    expect(searchPortal('unpublished-unique-record', navigation)).toEqual([]);
  });
});
