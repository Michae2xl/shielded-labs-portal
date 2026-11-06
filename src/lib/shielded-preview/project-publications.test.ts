import { describe, expect, it } from 'vitest';
import documents from './editorial/documents.json';
import type { ContentNode } from './editorial/types';
import { projects } from './content';
import { projectPublications } from './project-publications';

const plain = (node: ContentNode): string => typeof node === 'string' ? node : node.children.map(plain).join('');
const documentFor = (id: string) => documents.find(document => document.id === id)!;

describe('Official project publication provenance', () => {
  it('shows the NSM as the source now describes it', () => {
    expect(projectPublications.nsm.badge?.text).toBe('NU7');
    expect(projectPublications.nsm.progress.text).toContain('approved for NU7');
    expect(projectPublications.nsm.records.map(record => record.title)).toEqual(['ZIP 233', 'ZIP 234', 'ZIP 237', 'ZIP 235']);
  });

  it.each(projects)('preserves imported wording and valid source anchors for $name', project => {
    const copy = projectPublications[project.id];
    for (const excerpt of [copy.presentation, copy.progress, copy.next, ...(copy.badge ? [copy.badge] : [])]) {
      expect(new URL(excerpt.source).hostname).toBe('shieldedlabs.net');
      if (!excerpt.documentId) continue;
      const doc = documentFor(excerpt.documentId);
      expect(doc.source).toBe(excerpt.source);
      const text = [doc.title, ...doc.body.map(node => plain(node as ContentNode))].join(' ');
      for (const part of [excerpt.text, excerpt.detail, excerpt.window, ...excerpt.steps ?? []].filter((part): part is string => Boolean(part))) {
        expect(text).toContain(part);
      }
      if (excerpt.anchor) expect(doc.headings.some(heading => heading.id === excerpt.anchor)).toBe(true);
      if (excerpt.publishedAt) expect(excerpt.publishedAt).toBe(doc.publishedAt.slice(0, 10));
    }
    for (const record of copy.records) {
      const doc = documentFor(record.documentId!);
      expect(doc.source).toBe(record.source);
      expect([doc.title, ...doc.body.map(node => plain(node as ContentNode))].join(' ')).toContain(record.title);
      if (record.anchor) expect(doc.headings.some(heading => heading.id === record.anchor)).toBe(true);
      if (record.href) expect(JSON.stringify(doc.body)).toContain(record.href);
      if (record.dateLabel === 'Published') expect(record.date).toBe(doc.publishedAt.slice(0, 10));
    }
  });

  it('keeps completion dates associated with their actual roadmap heading', () => {
    const body = documentFor('crosslink-roadmap').body as ContentNode[];
    for (const record of projectPublications.crosslink.records) {
      const start = body.findIndex(node => typeof node !== 'string' && node.id === record.anchor);
      const nextHeading = body.findIndex((node, index) => index > start && typeof node !== 'string' && node.tag === 'h3');
      const section = body.slice(start, nextHeading < 0 ? undefined : nextHeading).map(plain).join(' ');
      const date = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(record.date!));
      expect(section).toContain(`Completed: ${date}`);
    }
  });

  it('does not infer next milestones from software activity or historical upgrade instructions', () => {
    for (const id of ['nsm', 'ironwood', 'zero'] as const) {
      expect(projectPublications[id].next.text).toBeNull();
      expect(projectPublications[id].next.steps).toBeUndefined();
    }
  });
});
