import { describe, expect, it } from 'vitest';
import documents from './documents.json';
import { groupContent } from './presentation';
import type { ContentNode } from './types';
import { editorialCatalog, editorialHref, editorialListHref } from './library';

describe('Editorial presentation and return paths', () => {
  it('retains every imported node, inline link and anchor when grouping organization values', () => {
    const original = documents.find(doc => doc.id === 'organization')!.body as ContentNode[];
    const grouped = groupContent(original, 2);
    expect([...grouped.intro, ...grouped.sections.flatMap(s => [s.heading, ...s.body])]).toEqual(original);
    const values = grouped.sections.find(s => s.heading.id === 'values')!;
    const cards = groupContent(values.body, 3);
    expect(cards.sections).toHaveLength(6);
    expect([...cards.intro, ...cards.sections.flatMap(s => [s.heading, ...s.body])]).toEqual(values.body);
  });
  it('leaves unstructured paragraphs intact', () => {
    const body: ContentNode[] = ['lead', { tag: 'p', children: ['paragraph'] }];
    expect(groupContent(body, 2)).toEqual({ intro: body, sections: [] });
  });
  it('retains category and search text in record and list URLs', () => {
    const entry = editorialCatalog.find(e => e.view === 'blog')!;
    const detail = new URL(editorialHref(entry, 'engineering-update', 'privacy & staking'), 'https://portal.test');
    expect(detail.searchParams.get('record')).toBe(entry.id);
    expect(detail.searchParams.get('q')).toBe('privacy & staking');
    const back = new URL(editorialListHref('blog', detail.searchParams.get('section')!, detail.searchParams.get('q')!), detail);
    expect(back.searchParams.get('record')).toBeNull();
    expect(back.searchParams.get('section')).toBe('engineering-update');
    expect(back.searchParams.get('q')).toBe('privacy & staking');
    expect(editorialListHref('blog', 'all')).toBe('?view=blog&section=all');
  });
});
