import { describe, expect, it } from 'vitest';
import documents from './documents.json';
import { editorialCatalog, editorialHref, legacyProjectResourceHref, resolveEditorialLink } from './library';
import { faqContent, faqTopics, matchesFaq } from './faq';
import { groupContent } from './presentation';
import type { EditorialDocument } from './types';

describe('Project-owned research and FAQs', () => {
  it('places every guide and tool in its owning project, including old bookmarks', () => {
    const entries = editorialCatalog.filter(entry => entry.view === 'resources');
    expect(entries).toHaveLength(13);
    for (const entry of entries) {
      const href = editorialHref(entry);
      const url = new URL(href, 'https://portal.test');
      expect(url.searchParams.get('view')).toBe('projects');
      expect(url.searchParams.get('project')).toBe(entry.projects[0]);
      expect(url.searchParams.get('record')).toBe(entry.id);
      expect(url.searchParams.get('section')).toBe(entry.category === 'FAQ' ? 'faq' : 'resources');
      expect(resolveEditorialLink(`?view=resources&section=all&record=${entry.id}`)).toBe(href);
    }
    expect(legacyProjectResourceHref('?view=resources')).toBe('?view=projects');
    expect(legacyProjectResourceHref('?view=resources&section=epoch')).toBe('?view=projects&project=epoch&section=resources');
  });

  it('preserves question anchors, searches and simulator scenarios through redirects', () => {
    const old = '?view=resources&section=crosslink&record=crosslink-faq&q=privacy#does-crosslink-compromise-privacy';
    const migrated = new URL(legacyProjectResourceHref(old)!, 'https://portal.test');
    expect(migrated.searchParams.get('section')).toBe('faq');
    expect(migrated.searchParams.get('q')).toBe('privacy');
    expect(migrated.hash).toBe('#does-crosslink-compromise-privacy');
    const nsm = '?view=projects&project=nsm&section=resources&record=nsm-guide#why-is-the-nsm-important';
    expect(legacyProjectResourceHref(nsm)).toBe(nsm.replace('section=resources', 'section=faq'));
    const scenario = new URL(legacyProjectResourceHref('?view=resources&section=simulators&record=crosslink-simulator&simulation=%3Fps%3D50%26c%3D10')!, 'https://portal.test');
    expect(scenario.searchParams.get('project')).toBe('crosslink');
    expect(scenario.searchParams.get('simulation')).toBe('?ps=50&c=10');
    expect(legacyProjectResourceHref('?view=blog&record=example')).toBeNull();
  });

  it('retains all 34 published answers and assigns each question to exactly one topic', () => {
    let total = 0;
    for (const id of Object.keys(faqTopics)) {
      const doc = documents.find(item => item.id === id)! as EditorialDocument;
      const grouped = groupContent(doc.body, 3);
      const content = faqContent(doc);
      total += content.questions.length;
      expect(content.questions.map(item => item.body)).toEqual(grouped.sections.map(item => item.body));
      const categorized = faqTopics[id].flatMap(topic => topic.questions);
      expect(new Set(categorized).size).toBe(categorized.length);
      expect([...categorized].sort()).toEqual(content.questions.map(item => item.id).sort());
      expect(content.questions.every(item => item.title && item.body.length)).toBe(true);
    }
    expect(total).toBe(34);
  });

  it('searches both questions and full answers without losing the NSM introduction', () => {
    const crosslink = faqContent(documents.find(item => item.id === 'crosslink-faq')! as EditorialDocument);
    expect(crosslink.questions.filter(item => matchesFaq(item, 'SLASHING')).length).toBeGreaterThan(0);
    expect(crosslink.questions.find(item => item.id === 'what-is-crosslink')?.body.length).toBeGreaterThan(0);
    expect(crosslink.questions.some(item => matchesFaq(item, 'not-a-published-term'))).toBe(false);
    const nsm = faqContent(documents.find(item => item.id === 'nsm-guide')! as EditorialDocument);
    expect(nsm.intro.some(item => typeof item !== 'string' && item.id === 'summary')).toBe(true);
    expect(nsm.intro.some(item => typeof item !== 'string' && item.id === 'frequently-asked-questions-faq')).toBe(false);
  });
});
