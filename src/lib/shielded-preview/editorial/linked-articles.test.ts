import { describe, expect, it } from 'vitest';
import { editorialCatalog, editorialHref, resolveEditorialLink, safeEditorialUrl, searchEditorial } from './library';
import { linkedArticles, withLinkedArticles } from './linked-articles';
import type { ContentNode, EditorialEntry } from './types';

const NSM_ARTICLE = 'the-network-sustainability-mechanism-nsm-activates-with-nu7';
const text = (node: ContentNode): string => typeof node === 'string' ? node : node.children.map(text).join(' ');
const post = (id: string, title: string, publishedAt: string, view: EditorialEntry['view'] = 'blog'): EditorialEntry => ({
  id, title, view, publishedAt, updatedAt: publishedAt, observedAt: publishedAt, category: 'News', projects: [], author: 'Someone', source: `https://shieldedlabs.net/${id}/`, summary: '', minutes: 1, headings: [],
});

describe('Articles read at their source', () => {
  it('lists the NSM activation article first, credited to its author and project', () => {
    expect(editorialCatalog.find(entry => entry.view === 'blog')).toMatchObject({
      id: NSM_ARTICLE,
      title: 'The Network Sustainability Mechanism (NSM) Activates with NU7',
      author: 'Jason McGee',
      category: 'News',
      projects: ['nsm'],
      publishedAt: '2026-11-05T21:49:27Z',
      source: 'https://x.com/aquietinvestor/status/2118460712096080208',
    });
  });

  it('holds a short summary and the links, never the article text', () => {
    for (const article of linkedArticles) {
      expect(article.linked?.publisher).toBeTruthy();
      expect(article.image).toBeUndefined();
      expect(article.headings).toEqual([]);
      expect(article.body.map(text).join(' ').split(/\s+/).length).toBeLessThan(80);
      expect(searchEditorial(article.title).map(entry => entry.id)).toContain(article.id);
    }
  });

  it('opens the record inside the portal and reads the article outside it', () => {
    for (const article of linkedArticles) {
      expect(resolveEditorialLink(article.source)).toBe(editorialHref(article));
      expect(safeEditorialUrl(article.source)).toBe(article.source);
      const also = article.linked?.also?.href;
      if (also) expect(resolveEditorialLink(also)).toBe(also);
    }
  });

  it('gives way to the imported post once the site publishes it', () => {
    const [article] = linkedArticles;
    const official = post('official-slug', article.title.replace('Activates', 'activates').replace('(NSM) ', '(NSM)  '), article.publishedAt);
    const merged = withLinkedArticles([official]);
    expect(merged.map(entry => entry.id)).toEqual(['official-slug']);
  });

  it('keeps the blog newest first and leaves other documents after it', () => {
    const merged = withLinkedArticles([
      post('newer', 'Newer', '2026-12-01T00:00:00Z'),
      post('older', 'Older', '2026-10-01T00:00:00Z'),
      post('guide', 'A guide', '2024-01-01T00:00:00Z', 'resources'),
    ]);
    expect(merged.map(entry => entry.id)).toEqual(['newer', NSM_ARTICLE, 'older', 'guide']);
  });
});
