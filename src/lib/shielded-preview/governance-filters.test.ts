import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GovernanceFilters from '@/app/shielded-preview/governance-filters';
import { governanceFilters, trianglePieces } from './governance-filters';
import { governanceProcess } from './governance-process';

describe('The three filters of a Zcash change', () => {
  it('names them in the order a change meets them, as the page states', () => {
    expect(governanceFilters.map(filter => filter.id)).toEqual(['community', 'organizations', 'network']);
    const intro = governanceProcess.sections.find(section => section.id === 'in-one-minute')!.blocks;
    // The art sits beside the page's own opening paragraph and five steps, so nothing is said twice.
    expect(intro[0]).toMatchObject({ kind: 'filters' });
    const block = intro[0] as { lead: string; items: unknown[] };
    expect(block.lead).toContain('three filters');
    expect(block.items).toHaveLength(5);
    expect(intro.filter(item => item.kind === 'list' || item.kind === 'p')).toHaveLength(0);
  });
  it('cuts the triangle into three closed pieces that share their seams, each locking into the next', () => {
    const { pieces, seams } = trianglePieces();
    expect(pieces.map(piece => piece.id)).toEqual(['community', 'organizations', 'network']);
    for (const piece of pieces) expect(piece.path).toMatch(/^M[\d. -]+.*Z$/);
    // A seam is one line used by both neighbours, so a tab on one piece is exactly the notch of the next.
    seams.forEach((seam, index) => {
      const knob = seam[Math.floor(seam.length / 2)].join(' ');
      expect(pieces[index].path).toContain(knob);
      expect(pieces[(index + 1) % 3].path).toContain(knob);
    });
  });
  it('draws the pieces around the Zcash mark and says the same thing in words', () => {
    const html = renderToStaticMarkup(createElement(GovernanceFilters, { lead: 'The opening paragraph.' }, 'The steps'));
    expect(html).toContain('/logos/zcash.svg');
    expect(html).toContain('aria-label="A change to Zcash passes three filters: the community signals, then development organizations implement, then the network adopts or refuses."');
    expect([...html.matchAll(/<text[^>]*>(Community|Organizations|Network)<\/text>/g)].map(match => match[1])).toEqual(['Community', 'Organizations', 'Network']);
    // One text column: the paragraph, then the steps; the art is its own column.
    expect(html.indexOf('The opening paragraph.')).toBeLessThan(html.indexOf('The steps'));
    expect(html).toMatch(/<p class="[^"]*">The opening paragraph\.<\/p>/);
  });
});
