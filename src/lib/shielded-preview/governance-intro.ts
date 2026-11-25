/**
 * The "Governance Overview" text that opens the poll page. Published wording: change it only on request.
 * Double asterisks mark the emphasis the text carries.
 */
export const governanceIntro = {
  title: 'Governance Overview',
  summary: 'Zcash governance has evolved significantly over the years, moving from a relatively centralized model toward a broader, more decentralized process. Today, it is useful to distinguish between two related but separate functions: determining support for changes to the Zcash protocol and deciding how ecosystem funding is allocated.',
  functions: [
    { lead: 'Protocol Governance:', text: 'Changes to Zcash are developed and discussed openly through the ZIP process, with community panels and coinholders helping gauge support for proposed upgrades. These are **polls, not binding votes**. Zcash has no onchain governance mechanism that automatically determines which changes are adopted. Instead, polling provides input into a broader rough-consensus process, with changes ultimately taking effect when network participants choose to adopt the software.' },
    { lead: 'Funding:', text: 'Zcash currently allocates 20% of block rewards to ecosystem development. Of this, **8% goes to Zcash Community Grants (ZCG)** and **12% goes to the Coinholder-Directed Retroactive Grants Program**, which allows ZEC holders to decide which grant proposals should receive funding. We provide information below on how to participate in the coinholder grants program.' },
  ],
} as const;

/** Splits a text at its emphasis marks: the odd parts are the emphasized ones. */
export const emphasisParts = (text: string) => text.split('**');
export const plainText = (text: string) => emphasisParts(text).join('');
