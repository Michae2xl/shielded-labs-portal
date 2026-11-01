import { describe, expect, it } from 'vitest';
import { activityHref, readActivityLocation } from './development-navigation';

const read = (href: string) => readActivityLocation(new URL(href, 'https://example.test').searchParams);

describe('Code activity navigation', () => {
  it('retains filters and a selected heatmap cell through a record and return link', () => {
    const filters = { mode: 'contributors' as const, period: 84 as const, includeForks: true, repo: 'sl-orchard', contributor: 'git:Alex & Sam', query: 'verify #12', selected: 'contributors|git:Alex & Sam|sl-orchard' };
    const detail = read(activityHref({ ...filters, record: 'commit:abc123' }));
    expect(detail).toEqual({ ...filters, record: 'commit:abc123' });
    expect(read(activityHref({ ...detail, record: null }))).toEqual({ ...filters, record: null });
  });
  it('keeps historical repository links working and uses safe defaults for unsupported modes', () => {
    expect(read('?view=activity&section=zero&period=999&mode=invalid&forks=true')).toEqual({ mode: 'days', period: 35, includeForks: false, repo: 'zero', contributor: '', query: '', selected: null, record: null });
    expect(activityHref()).toBe('?view=activity');
  });
  it('does not merge unlinked author names with GitHub accounts', () => {
    const author = 'git:Mark Henderson';
    expect(read(activityHref({ record: `person:${author}` })).record).toBe(`person:${author}`);
    expect(read(activityHref({ record: 'person:github:aphelionz' })).record).not.toBe(`person:${author}`);
  });
});
