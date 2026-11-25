import { describe, expect, it } from 'vitest';
import { governanceIntro, plainText } from './governance-intro';

describe('governance overview text', () => {
  it('keeps the published wording, word for word', () => {
    expect(governanceIntro.title).toBe('Governance Overview');
    expect(plainText(governanceIntro.summary)).toBe('Zcash governance has evolved significantly over the years, moving from a relatively centralized model toward a broader, more decentralized process. Today, it is useful to distinguish between two related but separate functions: determining support for changes to the Zcash protocol and deciding how ecosystem funding is allocated.');
    expect(governanceIntro.functions.map(item => `${item.lead} ${plainText(item.text)}`)).toEqual([
      'Protocol Governance: Changes to Zcash are developed and discussed openly through the ZIP process, with community panels and coinholders helping gauge support for proposed upgrades. These are polls, not binding votes. Zcash has no onchain governance mechanism that automatically determines which changes are adopted. Instead, polling provides input into a broader rough-consensus process, with changes ultimately taking effect when network participants choose to adopt the software.',
      'Funding: Zcash currently allocates 20% of block rewards to ecosystem development. Of this, 8% goes to Zcash Community Grants (ZCG) and 12% goes to the Coinholder-Directed Retroactive Grants Program, which allows ZEC holders to decide which grant proposals should receive funding. We provide information below on how to participate in the coinholder grants program.',
    ]);
  });
});
