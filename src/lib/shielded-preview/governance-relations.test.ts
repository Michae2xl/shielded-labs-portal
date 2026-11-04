import { Children, createElement, isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ProposalGrantLinks } from '@/app/shielded-preview/governance';
import snapshot from './governance-data/snapshot.json';
import { grantsWithSameTitle } from './governance-relations';
import type { GovernanceData } from './governance-types';

const data = snapshot as unknown as GovernanceData;

describe('Proposal and grant relationships', () => {
  it('keeps ZCG and coinholder grants separate even when their titles are identical', () => {
    const title = 'A shared project title';
    const zcg = { ...data.grants.data[0], grant: title, program: 'zcg_regular' };
    const coinholder = { ...zcg, program: 'coinholder' };
    const rows = [zcg, coinholder, { ...zcg, grant: `${title} extended` }];
    expect(grantsWithSameTitle({ title, program: 'zcg' }, rows)).toEqual([zcg]);
    expect(grantsWithSameTitle({ title, program: 'coinholder' }, rows)).toEqual([coinholder]);
    expect(grantsWithSameTitle({ title, program: 'unknown' }, rows)).toEqual([]);
  });

  it('does not present a rejected application as the application paid by a same-title grant', () => {
    const proposals = data.proposals.data.filter(proposal => proposal.title === 'Zcash Arabia (May to September 2026)');
    expect(proposals.map(proposal => proposal.status).sort()).toEqual(['approved', 'rejected']);
    expect(new Set(proposals.map(proposal => proposal.applicationUrl)).size).toBe(2);
    for (const proposal of proposals) {
      const html = renderToStaticMarkup(createElement(ProposalGrantLinks, { proposal, source: data.grants, onNavigate: vi.fn() }));
      expect(html).toContain('Grants with the same title');
      expect(html).toContain('does not confirm funding for this request');
      expect(html).not.toContain('Matching grant');
      expect(html).toContain(`href="${data.grants.url}"`);
    }
  });

  it('opens the precise related grant and leaves the application status intact', () => {
    const proposal = data.proposals.data.find(proposal => proposal.applicationUrl?.endsWith('/289'))!;
    const onNavigate = vi.fn();
    const element = ProposalGrantLinks({ proposal, source: data.grants, onNavigate })!;
    const button = Children.toArray(element.props.children).find(child => isValidElement(child) && child.type === 'button');
    expect(isValidElement<{ onClick: () => void }>(button)).toBe(true);
    if (!isValidElement<{ onClick: () => void }>(button)) throw new Error('Expected a grant link');
    button.props.onClick();
    expect(onNavigate).toHaveBeenCalledExactlyOnceWith('Grants', 'zcg_regular|Zcash Arabia (May to September 2026)');
    expect(proposal.status).toBe('rejected');
  });

  it('omits a relationship when the ledger has no title and program match', () => {
    expect(ProposalGrantLinks({ proposal: { title: 'Unrecorded grant', program: 'zcg' }, source: data.grants, onNavigate: vi.fn() })).toBeNull();
  });
});
