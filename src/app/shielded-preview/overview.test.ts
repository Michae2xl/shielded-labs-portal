import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { projects } from '@/lib/shielded-preview/content';
import snapshot from '@/lib/shielded-preview/github-snapshot.json';
import type { Commit, PortalData, Repository } from '@/lib/shielded-preview/types';
import Overview from './overview';

const checkedAt = '2026-11-04T12:00:00Z';
const commit = (sha: string, title: string, date: string) => ({ sha, title, date, author: 'Example', login: 'example', avatarUrl: null, profileUrl: null, authorType: 'User', url: `https://github.com/ShieldedLabs/zero/commit/${sha}` }) as unknown as Commit;
const base = snapshot.repos as unknown as Repository[];
const data = (zero: Commit[]): PortalData => ({
  repos: base.map(repo => repo.name === 'zero' ? { ...repo, fetchedAt: checkedAt, commits: zero } : { ...repo, commits: [] }),
  checkedAt, grants: [], grantsState: 'unavailable', grantsFetchedAt: null,
});
const render = (zero: Commit[]) => renderToStaticMarkup(createElement(Overview, { data: data(zero), onNavigate: vi.fn(), onProject: vi.fn(), onFollow: vi.fn(), projectGlyph: () => null }));

describe('Shielded Labs overview', () => {
  it('uses the project cards with their shortcuts, as third-level headings under Projects', () => {
    const markup = render([]);
    for (const project of projects) expect(markup).toContain(`>${project.name}</h3>`);
    expect(markup).toContain('What comes next');
    expect(markup).toContain('#project-zips');
    expect(markup).toContain('section=resources');
  });
  it('summarizes the latest real work, skipping automatic merge commits', () => {
    const markup = render([commit('a'.repeat(40), "Merge branch 'code' into dev", '2026-11-03T10:00:00Z'), commit('b'.repeat(40), 'Stabilize source refresh', '2026-11-02T10:00:00Z')]);
    expect(markup).toContain('Stabilize source refresh');
    expect(markup).not.toContain('Merge branch');
  });
  it('never nests links across the page', () => {
    let open = 0;
    for (const [tag] of render([]).matchAll(/<\/?a\b/g)) {
      open += tag === '<a' ? 1 : -1;
      expect(open).toBeLessThanOrEqual(1);
    }
    expect(open).toBe(0);
  });
});
