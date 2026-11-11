import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GovernanceProcess from '@/app/shielded-preview/governance-process';
import { governanceProcess } from './governance-process';

vi.mock('server-only', () => ({}));

describe('How it works: finding a section', () => {
  const html = renderToStaticMarkup(createElement(GovernanceProcess, { onBack: () => {}, onNavigate: () => {} }));
  it('lists every section once, in the bar that stays on screen, with a short name', () => {
    const bar = html.slice(html.indexOf('aria-label="Record sections"'), html.indexOf('</nav>', html.indexOf('aria-label="Record sections"')));
    const links = [...bar.matchAll(/href="#(process-[a-z-]+)"[^>]*>([^<]+)</g)].map(match => [match[1], match[2]]);
    expect(links.map(([id]) => id)).toEqual([...governanceProcess.sections.map(section => `process-${section.id}`), 'process-sources']);
    for (const [, label] of links) expect(label.length, label).toBeLessThanOrEqual(20);
    expect(html).not.toContain('On this page');
  });
  it('keeps every source on the page, folded at the end instead of taking a column', () => {
    expect(html).not.toContain('<aside');
    expect(html).toContain('aria-label="Sources and methodology"');
    expect(html).toContain('id="process-sources"');
    for (const source of governanceProcess.sources) expect(html).toContain(source.label.replace(/&/g, '&amp;'));
    expect(html).toContain('Neutral description reviewed on');
  });
});
