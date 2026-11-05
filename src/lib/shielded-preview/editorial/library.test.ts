import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { editorialCatalog, editorialHref, resolveEditorialLink, safeEditorialUrl, searchEditorial, leavingLink, sourceHref } from './library';
import documents from './documents.json';
import { board, institutionalDocuments } from './institutional';
import type { ContentNode } from './types';

describe('Shielded Labs editorial coverage', () => {
  it('contains every public article and a resource for each project', () => {
    expect(editorialCatalog.filter(e => e.view === 'blog')).toHaveLength(20);
    expect(new Set(editorialCatalog.map(e => e.id)).size).toBe(editorialCatalog.length);
    for (const project of ['crosslink', 'epoch', 'nsm', 'ironwood', 'zero', 'fees']) {
      expect(editorialCatalog.some(e => e.view === 'resources' && e.projects.includes(project))).toBe(true);
    }
    expect(board).toHaveLength(5);
    expect(documents.find(e => e.id === 'crosslink-faq')!.headings.filter(h => h.level === 3)).toHaveLength(23);
    expect(documents.find(e => e.id === 'nsm-guide')!.headings.filter(h => h.level === 3)).toHaveLength(11);
  });

  it('preserves coauthors, source dates, and expired vacancy status', () => {
    expect(editorialCatalog.find(e => e.id === 'the-orchard-counterfeiting-vulnerability')!.author).toContain('Taylor Hornby');
    expect(editorialCatalog.find(e => e.id === 'epoch-future-proof-cryptography-for-zcash')!.publishedAt).toMatch(/^2026-10-01/);
    expect(institutionalDocuments.find(e => e.id === 'cryptographer')!.category).toBe('Closed position');
  });

  it('maps every blog URL to an internal readable record', () => {
    for (const entry of editorialCatalog.filter(e => e.view === 'blog')) {
      expect(resolveEditorialLink(entry.source)).toBe(editorialHref(entry));
    }
    expect(resolveEditorialLink('https://shieldedlabs.net/board/')).toBe('?view=about&section=board');
    expect(resolveEditorialLink('https://shieldedlabs.net/team/')).toBe('?view=people');
    expect(resolveEditorialLink('https://shieldedlabs.github.io/zebra-crosslink/design.html')).toContain('record=crosslink-handbook');
    expect(resolveEditorialLink('https://shieldedlabs.net/nsm/')).toContain('record=nsm-guide');
  });

  it('finds question text and names instead of only navigation labels', () => {
    expect(searchEditorial('slashing').some(e => e.id === 'crosslink-faq')).toBe(true);
    expect(searchEditorial('Taylor Hornby').length).toBeGreaterThan(0);
    expect(searchEditorial('definitely-unpublished-word')).toHaveLength(0);
  });

  it('only serves inert text and verified local media', () => {
    const tags = new Set('p h2 h3 h4 h5 h6 a strong em ul ol li blockquote pre code table thead tbody tr th td figure figcaption img br hr sup sub'.split(' '));
    const walk = (node: ContentNode) => {
      if (typeof node === 'string') { expect(node).not.toMatch(/\[\/?(?:vc_|ut_)/); return; }
      expect(tags.has(node.tag), node.tag).toBe(true);
      if (node.href) expect(safeEditorialUrl(node.href)).not.toBeNull();
      if (node.src) {
        expect(node.src).toMatch(/^\/shielded-preview\/editorial\/[a-f0-9]+\.(png|jpe?g|webp|gif)$/);
        expect(existsSync(join(process.cwd(), 'public', node.src))).toBe(true);
      }
      node.children.forEach(walk);
    };
    for (const doc of documents) doc.body.forEach(walk);
  });

  it('rejects active or credential-bearing links', () => {
    for (const value of ['javascript:alert(1)', 'data:text/html,hello', 'https://u:p@example.com', 'java\nscript:bad()']) expect(safeEditorialUrl(value)).toBeNull();
  });
  it('sends cited sources to the local document that holds their text, and nowhere else', () => {
    expect(sourceHref('https://shieldedlabs.net/epoch-future-proof-cryptography-for-zcash/')).toContain('record=epoch-future-proof-cryptography-for-zcash');
    expect(sourceHref('https://zips.z.cash/zip-0258')).toBe('?view=governance&section=zips&record=zip-0258');
    for (const listPage of ['https://shieldedlabs.net/projects/', 'https://shieldedlabs.net/team/', 'https://shieldedlabs.net/governance/']) expect(sourceHref(listPage)).toBe(listPage);
    expect(leavingLink('?view=people')).toEqual({});
    expect(leavingLink('https://example.org/')).toEqual({ target: '_blank', rel: 'noopener noreferrer' });
  });
  it('keeps pinned revisions of a ZIP where they point', () => {
    const pinned = 'https://github.com/zcash/zips/blob/4acf32ac6db409d93041c463880dad6df83875e1/zips/zip-0316.rst';
    expect(resolveEditorialLink(pinned)).toBe(pinned);
    expect(resolveEditorialLink('https://github.com/zcash/zips/blob/main/zips/zip-0316.rst')).toBe('?view=governance&section=zips&record=zip-0316');
  });
  it('leaves footnote markers with no target as text', () => {
    expect(resolveEditorialLink('https://shieldedlabs.net/crosslink-incentivized-feature-nets/#55387e82-e104-405d-a208-028cc523224b')).toBeNull();
  });
});
