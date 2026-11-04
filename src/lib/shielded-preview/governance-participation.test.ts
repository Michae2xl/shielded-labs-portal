import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GovernanceParticipation, { CurrentParticipationRound, GovernanceReference } from '@/app/shielded-preview/governance-participation';
import GovernanceProgramGuide from '@/app/shielded-preview/governance-program-guide';
import { participationGuideId, participationPhase, participationRound } from './governance-participation';

describe('Published Q4 calendar', () => {
  it('identifies the open call without treating it as an open vote', () => {
    expect(participationRound.label).toBe('Q4 2026');
    expect(participationPhase(Date.parse('2026-11-01T18:00:00Z'))).toEqual({ id: 'submissions', label: 'Accepting proposals' });
  });

  it('closes submissions at the published UTC deadline and preserves the gap before review', () => {
    expect(participationPhase(Date.parse('2026-11-13T19:59:59Z')).id).toBe('submissions');
    expect(participationPhase(Date.parse('2026-11-13T20:00:00Z')).id).toBeNull();
    expect(participationPhase(Date.parse('2026-11-16T00:00:00Z')).id).toBe('review');
  });

  it('distinguishes the scheduled voting window from published results', () => {
    expect(participationPhase(Date.parse('2026-12-16T20:00:00Z')).id).toBeNull();
    expect(participationPhase(Date.parse('2026-12-17T00:00:00Z'))).toEqual({ id: 'voting', label: 'Scheduled voting period' });
    expect(participationPhase(Date.parse('2026-12-29T20:00:00Z'))).toEqual({ id: null, label: 'Voting period ended' });
  });

  it('does not claim an active phase before the call or without a usable clock', () => {
    expect(participationPhase(Date.parse('2026-10-29T23:59:59Z')).id).toBeNull();
    expect(participationPhase(null).label).toBe('Published schedule');
    expect(participationPhase(NaN).id).toBeNull();
  });
});

describe('Participation stays inside the portal', () => {
  const links = (markup: string) => [...markup.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([, attributes, content]) => ({
    href: attributes.match(/href="([^"]+)"/)?.[1].replaceAll('&amp;', '&') ?? '',
    external: attributes.includes('target="_blank"'),
    label: content.replace(/<[^>]*>/g, ''),
  }));

  it('opens every generic guide in an internal record with a valid section', () => {
    const overview = renderToStaticMarkup(createElement(GovernanceParticipation)) + renderToStaticMarkup(createElement(GovernanceReference));
    const guide = renderToStaticMarkup(createElement(GovernanceProgramGuide, { onBack: () => {} }));
    for (const label of ['Program guide', 'Application guide', 'Wallet guide', 'Communities', 'How it works']) {
      const link = links(overview).find(item => item.label === label)!;
      expect(link, label).toBeDefined();
      expect(link.external, label).toBe(false);
      expect(link.href.startsWith('?'), label).toBe(true);
      const url = new URL(link.href, 'https://portal.example');
      expect(url.searchParams.get('section')).toBe('voting');
      expect(url.searchParams.get('record')).toBe(participationGuideId);
      if (url.hash) expect(guide).toContain(`id="${url.hash.slice(1)}"`);
    }
  });

  it('opens the current proposals inside Voting', () => {
    const round = renderToStaticMarkup(createElement(CurrentParticipationRound));
    const outbound = links(round).filter(link => link.href.startsWith('https://openzcash.org/'));
    expect(outbound).toHaveLength(0);
    const proposalLink = links(round).find(link => link.label === 'View proposals')!;
    expect(proposalLink.external).toBe(false);
    expect(proposalLink.href).toBe('?view=governance&section=voting');
    expect(renderToStaticMarkup(createElement(GovernanceProgramGuide, { onBack: () => {} }))).not.toContain('openzcash.org');
  });
});
