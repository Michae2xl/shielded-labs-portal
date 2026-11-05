import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { projects } from '@/lib/shielded-preview/content';
import snapshot from '@/lib/shielded-preview/github-snapshot.json';
import type { Repository } from '@/lib/shielded-preview/types';
import ProjectCard from './project-card';

const render = (id: string) => renderToStaticMarkup(createElement(ProjectCard, {
  item: projects.find(project => project.id === id)!, repositories: snapshot.repos as unknown as Repository[],
  glyph: null, arrow: null, onSelect: vi.fn(), onFollow: vi.fn(),
}));

describe('Project cards', () => {
  it('never nests links, so the card link and its shortcuts stay valid', () => {
    for (const project of projects) {
      let open = 0;
      for (const [tag] of render(project.id).matchAll(/<\/?a\b/g)) {
        open += tag === '<a' ? 1 : -1;
        expect(open).toBeLessThanOrEqual(1);
      }
      expect(open).toBe(0);
    }
  });
  it('shows source wording, repository dates and the fork label', () => {
    const crosslink = render('crosslink');
    expect(crosslink).toContain('Published next step');
    expect(crosslink).toContain('Published window · Q2 2026 - Q2 2027');
    expect(crosslink).toContain('Last commit');
    expect(crosslink).not.toContain('· fork');
    expect(render('ironwood')).toContain('· fork');
  });
  it('omits what a project does not have instead of showing zeros', () => {
    const epoch = render('epoch');
    expect(epoch).not.toContain('Last commit');
    expect(epoch).not.toContain('ZIPs');
    expect(epoch).not.toContain('Code');
    expect(epoch).toContain('Research');
    expect(render('zero')).toContain('Published repositories');
  });
});
