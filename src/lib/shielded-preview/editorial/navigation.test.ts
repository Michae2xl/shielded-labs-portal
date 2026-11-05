import { describe, expect, it } from 'vitest';
import documents from './documents.json';
import { projects } from '../content';
import { contentText } from './faq';
import { institutionalDocuments } from './institutional';
import { editorialCatalog, editorialHref, legacyProjectResourceHref, resolveEditorialLink } from './library';
import { simulatorDocuments } from './simulators';
import type { ContentNode } from './types';

function links(nodes: ContentNode[]): Exclude<ContentNode, string>[] {
  return nodes.flatMap(node => typeof node === 'string' ? [] : [
    ...(node.tag === 'a' ? [node] : []), ...links(node.children),
  ]);
}

describe('Editorial source-to-record navigation', () => {
  const handbook = editorialCatalog.find(entry => entry.id === 'crosslink-handbook')!;
  const handbookLinks = links(documents.find(entry => entry.id === handbook.id)!.body);

  it('connects every catalog record and internal document link to an existing record in the correct view and project', () => {
    const allDocuments = [...documents, ...institutionalDocuments, ...simulatorDocuments];
    const knownProjects = new Set(projects.map(project => project.id as string));
    for (const entry of editorialCatalog) {
      const document = allDocuments.find(item => item.id === entry.id)!;
      expect(document, entry.id).toBeDefined();
      expect(document.projects, entry.id).toEqual(entry.projects);
      expect(document.source, entry.id).toBe(entry.source);
      expect(entry.projects.every(project => knownProjects.has(project)), entry.id).toBe(true);
      const hrefs = [editorialHref(entry), ...links(document.body).map(link => link.href!)];
      for (const href of hrefs) {
        const resolved = resolveEditorialLink(href);
        if (!resolved?.startsWith('?view=')) continue;
        const target = new URL(resolved, 'https://portal.test');
        const view = target.searchParams.get('view');
        const record = target.searchParams.get('record');
        if (view === 'projects') {
          const project = target.searchParams.get('project');
          if (project) expect(knownProjects.has(project), `${entry.id}: ${href}`).toBe(true);
          if (record) {
            const destination = editorialCatalog.find(item => item.id === record)!;
            expect(destination?.view, `${entry.id}: ${href}`).toBe('resources');
            expect(destination.projects, `${entry.id}: ${href}`).toContain(project);
            if (target.searchParams.get('section') === 'faq') expect(destination.category).toContain('FAQ');
          }
        } else if (record && (view === 'blog' || view === 'about')) {
          expect(editorialCatalog.find(item => item.id === record)?.view, `${entry.id}: ${href}`).toBe(view);
        }
      }
    }
  });

  it('opens imported handbook chapters at their actual content', () => {
    for (const [label, anchor] of [
      ['Rationale, Scope, and Goals', 'scope-for-crosslink'],
      ['Build and Usage', 'building-zebra-crosslink'],
      ['Design', 'crosslink-design'],
      ['Implementation', 'crosslink-implementation'],
    ]) {
      const link = handbookLinks.find(node => contentText(node.children) === label && !node.href?.includes('/print.html'))!;
      expect(resolveEditorialLink(link.href!), label).toBe(`${editorialHref(handbook)}#${anchor}`);
    }
  });

  it('opens the chapter when a rule anchor is missing from the print edition', () => {
    expect(resolveEditorialLink('https://shieldedlabs.github.io/zebra-crosslink/design/cl2-construction.html#linearity-rule')).toBe(`${editorialHref(handbook)}#the-crosslink-2-construction`);
    expect(resolveEditorialLink('https://github.com/ShieldedLabs/zebra-crosslink/blob/main/book/src/design/terminology.md')).toBe(`${editorialHref(handbook)}#terminology`);
  });

  it('does not replace absent source files with the book opening', () => {
    for (const source of [
      'https://shieldedlabs.github.io/zebra-crosslink/LICENSE-MIT',
      'https://shieldedlabs.github.io/zebra-crosslink/LICENSE-APACHE',
      'https://shieldedlabs.github.io/zebra-crosslink/user/crosslink-testnet.html',
      'https://github.com/ShieldedLabs/zebra-crosslink/blob/main/README.md',
      'https://shieldedlabs.net/crosslink-faq/#missing-answer',
    ]) expect(resolveEditorialLink(source)).toBe(source);
  });

  it('only internalizes handbook deep links whose target exists in the imported record', () => {
    for (const link of handbookLinks.filter(node => node.href?.startsWith('https://shieldedlabs.github.io/zebra-crosslink/'))) {
      const resolved = resolveEditorialLink(link.href!)!;
      if (!resolved.startsWith('?view=')) continue;
      const target = new URL(resolved, 'https://portal.test');
      expect(target.searchParams.get('record')).toBe(handbook.id);
      expect(handbook.headings.some(heading => heading.id === decodeURIComponent(target.hash.slice(1))), link.href).toBe(true);
    }
  });

  it('keeps malformed source fragments inert and routes the full NSM FAQ to its FAQ screen', () => {
    const malformed = 'https://shieldedlabs.net/nsm/#%E0%A4%A';
    expect(resolveEditorialLink(malformed)).toBe(malformed);
    const faq = new URL(resolveEditorialLink('https://shieldedlabs.net/nsm/#frequently-asked-questions-faq')!, 'https://portal.test');
    expect(faq.searchParams.get('section')).toBe('faq');
    expect(faq.searchParams.get('record')).toBe('nsm-guide');
    expect(faq.hash).toBe('#frequently-asked-questions-faq');
  });

  it('preserves saved FAQ topic and search filters while upgrading old resource links', () => {
    const migrated = new URL(legacyProjectResourceHref('?view=resources&section=crosslink&record=crosslink-faq&topic=security&q=privacy#does-crosslink-compromise-privacy')!, 'https://portal.test');
    expect(migrated.searchParams.get('section')).toBe('faq');
    expect(migrated.searchParams.get('topic')).toBe('security');
    expect(migrated.searchParams.get('q')).toBe('privacy');
    expect(migrated.hash).toBe('#does-crosslink-compromise-privacy');
  });

  it('associates the Crosslink staking article consistently in history and reader metadata', () => {
    const article = editorialCatalog.find(entry => entry.id === 'zcash-and-staking-economics')!;
    const document = documents.find(entry => entry.id === article.id)!;
    expect(article.projects).toEqual(['crosslink']);
    expect(document.projects).toEqual(article.projects);
    expect(document.source).toBe(article.source);
    expect(contentText(document.body)).toContain('Crosslink');
  });
});
