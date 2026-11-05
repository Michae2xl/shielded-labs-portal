import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { projects } from '@/lib/shielded-preview/content';
import type { PortalData, Repository } from '@/lib/shielded-preview/types';
import { activityHref } from '@/lib/shielded-preview/development-navigation';
import { sourceHref, sourceOpensInPortal } from '@/lib/shielded-preview/editorial/library';
import { officialProjectExcerpts } from '@/lib/shielded-preview/official-project-excerpts';
import { projectPublications, publicationQuote } from '@/lib/shielded-preview/project-publications';
import ProjectDetail from './project-detail';

const data: PortalData = { repos: [], grants: [], checkedAt: '2026-10-25', grantsState: 'unavailable', grantsFetchedAt: null };
const nsm = projects.find(project => project.id === 'nsm')!;
// A citation opens the local document that holds its text; anything else opens the source.
const sourceLink = (source: string) => `href="${sourceHref(source).replaceAll('&', '&amp;')}"`;
const renderFaq = (record: string | null) => renderToStaticMarkup(createElement(ProjectDetail, {
  project: nsm, section: 'faq', record, data, glyph: null, onSection: () => {}, onFollow: () => {},
}));

describe('Official project excerpts', () => {
  it.each(projects)('preserves the Shielded Labs quote and opens its actual source for $name', project => {
    const excerpt = officialProjectExcerpts[project.id];
    const markup = renderToStaticMarkup(createElement(ProjectDetail, {
      project, section: 'overview', record: null, data, glyph: null, onSection: () => {}, onFollow: () => {},
    }));
    const quotedParagraph = renderToStaticMarkup(createElement('p', null, `“${excerpt.text}”`));
    expect(markup).toContain(quotedParagraph);
    expect(markup).toContain(`cite="${excerpt.source}"`);
    expect(markup).toContain(sourceLink(excerpt.source));
    expect(markup).toContain(`aria-label="Shielded Labs source for ${project.name}"`);
    expect(new URL(excerpt.source).hostname).toBe('shieldedlabs.net');
    if (!sourceOpensInPortal(excerpt.source)) expect(markup).toContain(`href="${excerpt.source}" aria-label="Shielded Labs source for ${project.name}" target="_blank"`);
  });
});

describe('Official presentation and progress', () => {
  it.each(projects)('uses the same sourced progress and next steps across tabs for $name', project => {
    const copy = projectPublications[project.id];
    for (const section of ['overview', 'progress']) {
      const markup = renderToStaticMarkup(createElement(ProjectDetail, {
        project, section, record: null, data, glyph: null, onSection: () => {}, onFollow: () => {},
      }));
      for (const excerpt of [copy.progress, copy.next, ...(section === 'overview' ? [copy.presentation] : [])]) {
        const quote = publicationQuote(excerpt);
        if (quote !== null) expect(markup).toContain(renderToStaticMarkup(createElement('q', { cite: excerpt.source }, quote)));
        for (const step of excerpt.steps ?? []) expect(markup).toContain(renderToStaticMarkup(createElement('q', { cite: excerpt.source }, step)));
        expect(markup).toContain(sourceLink(excerpt.source));
      }
      if (copy.next.text === null && !copy.next.steps?.length) expect(markup).toContain('Not specified in this source.');
      else expect(markup).not.toContain('Not specified in this source.');
    }
  });
});

describe('Project FAQ direct records', () => {
  it('opens the project FAQ when no record is specified or its record matches', () => {
    for (const record of [null, 'nsm-guide']) {
      const markup = renderFaq(record);
      expect(markup).toContain('Search questions and answers');
      expect(markup).not.toContain('Document not found');
    }
  });

  it('does not substitute another document for a missing or foreign FAQ record', () => {
    for (const record of ['missing-record', 'crosslink-faq', 'nsm-simulator']) {
      const markup = renderFaq(record);
      expect(markup).toContain('Document not found');
      expect(markup).not.toContain('Search questions and answers');
      expect(markup).toContain('?view=projects&amp;project=nsm&amp;section=faq');
    }
  });
});

describe('Project development records', () => {
  const repository = (name: string, fork = false): Repository => ({
    name, fork, branch: 'main', description: '', language: 'Rust', url: `https://github.com/ShieldedLabs/${name}`,
    fetchedAt: '2026-11-01T12:00:00Z', state: 'snapshot',
    commits: [{ sha: 'a'.repeat(40), title: 'Shared change', author: 'Example', login: 'example', date: '2026-10-31T12:00:00Z', url: `https://github.com/ShieldedLabs/${name}/commit/${'a'.repeat(40)}` }],
  });
  const renderDevelopment = (id: string, repos: Repository[] = []) => renderToStaticMarkup(createElement(ProjectDetail, {
    project: projects.find(project => project.id === id)!, section: 'development', record: null,
    data: { ...data, repos }, glyph: null, onSection: () => {}, onFollow: () => {},
  }));
  const hrefAttribute = (href: string) => `href="${href.replaceAll('&', '&amp;')}"`;

  it.each(projects)('opens Development directly for $name, without falling back to Overview', project => {
    const markup = renderDevelopment(project.id);
    expect(markup).toContain('id="project-development"');
    expect(markup).not.toContain('id="project-overview"');
    if (!project.repos.length) {
      expect(markup).toContain('No repository linked yet');
      expect(markup).toContain(`?view=projects&amp;project=${project.id}&amp;section=resources`);
      expect(markup).not.toContain('Repository activity is currently unavailable');
    }
  });

  it('keeps fork context in repository, commit and explorer links', () => {
    const repo = repository('zebra-dynamic-fees', true);
    const markup = renderDevelopment('fees', [repo]);
    for (const record of [undefined, `repo:${repo.name}`, `commit:${repo.commits[0].sha}`]) {
      expect(markup).toContain(hrefAttribute(activityHref({ repo: repo.name, includeForks: true, record })));
    }
    expect(markup).toContain('Fork repository');
    expect(markup).toContain('excluded from core activity totals');
  });

  it('deduplicates shared hashes and only links repositories belonging to the project', () => {
    const markup = renderDevelopment('crosslink', [repository('crosslink_monolith'), repository('crosslink_book'), repository('zero')]);
    expect(markup.match(/Shared change/g)).toHaveLength(1);
    expect(markup).toContain(hrefAttribute(activityHref({ repo: 'crosslink_monolith', record: `commit:${'a'.repeat(40)}` })));
    expect(markup).not.toContain('repo%3Azero');
  });

  it('distinguishes unavailable repository data from an empty commit sample', () => {
    const missing = renderDevelopment('crosslink', [repository('crosslink_monolith')]);
    expect(missing).toContain('Crosslink docs');
    expect(missing).toContain('Repository record currently unavailable');
    expect(missing).not.toContain('repo%3Acrosslink_book');
    const empty = renderDevelopment('zero', [{ ...repository('zero'), commits: [] }]);
    expect(empty).toContain('No commits are available in this repository sample');
    expect(empty).toContain('Saved record');
    expect(empty).not.toContain('No repository linked yet');
  });
});
