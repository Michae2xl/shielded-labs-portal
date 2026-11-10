import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BlockRewardSplit from '@/app/shielded-preview/block-reward-split';
import { blockRewardSplit, blockRewardSummary } from './block-reward-split';

describe('Block reward split', () => {
  it('accounts for the whole reward, with the Dev Fund at 20%', () => {
    expect(blockRewardSplit.reduce((sum, part) => sum + part.share, 0)).toBe(100);
    expect(blockRewardSplit.filter(part => part.id !== 'miners').reduce((sum, part) => sum + part.share, 0)).toBe(20);
    expect(blockRewardSplit.map(part => part.share)).toEqual([...blockRewardSplit.map(part => part.share)].sort((a, b) => b - a));
  });
  it('states every part in words for readers who cannot see the bar', () => {
    expect(blockRewardSummary()).toBe('Block reward split until the 2028 halving: 80% to miners, 12% to the coinholder fund and 8% to Zcash Community Grants.');
  });
  it('prints each share on its block and names the parts in the same order', () => {
    const html = renderToStaticMarkup(createElement(BlockRewardSplit));
    expect(html).toContain(`aria-label="${blockRewardSummary()}"`);
    expect([...html.matchAll(/data-part="(\w+)"[^>]*>(\d+%)</g)].map(match => `${match[1]} ${match[2]}`)).toEqual(['miners 80%', 'fund 12%', 'zcg 8%']);
    expect([...html.matchAll(/<li data-part="\w+">([^<]+)</g)].map(match => match[1])).toEqual(['Miners', 'Coinholder fund', 'ZCG']);
  });
});
