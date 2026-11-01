import type { Project } from './content';

// Plain-language companions to the source-linked project records in content.ts.
// These explain the intent; stage, evidence and activation status remain separate.
export const projectGuides: Record<Project['id'], {
  lead: string; benefit: string; terms: { term: string; meaning: string }[];
}> = {
  crosslink: {
    lead: 'A proposed upgrade to make Zcash transactions final sooner, combining mining with staking.',
    benefit: 'Give people and services a clearer point when a transaction can be treated as settled. The upgrade is still in development.',
    terms: [{term:'Finality',meaning:'The point at which a transaction is considered settled under the protocol’s rules.'},{term:'Staking',meaning:'Committing coins to participate in securing the network, alongside mining in this proposal.'},{term:'Feature net',meaning:'A network for testing a particular feature before any mainnet adoption.'}],
  },
  epoch: {
    lead: 'Research into cryptography that could protect Zcash against future quantum computers.',
    benefit: 'Protect privacy over the long term as cryptography evolves. The designs still need research, review and implementation.',
    terms: [{term:'Post-quantum cryptography',meaning:'Cryptographic designs intended to resist attacks from quantum computers.'},{term:'Formal verification',meaning:'Using mathematical methods to check that a design satisfies specified properties.'}],
  },
  nsm: {
    lead: 'Proposals to support Zcash network security over the long term, within its supply cap.',
    benefit: 'Explore how issuance and fees can support a sustainable network. Each proposal has its own review and adoption process.',
    terms: [{term:'Issuance',meaning:'The release of new coins according to the network’s rules.'},{term:'ZIP',meaning:'A Zcash Improvement Proposal: a document describing a proposed change or standard.'},{term:'Fee burning',meaning:'Removing transaction fees from circulation under a specified protocol rule.'}],
  },
  ironwood: {
    lead: 'An ecosystem upgrade that replaced the vulnerable Orchard pool with a corrected pool.',
    benefit: 'Strengthen assurance about Zcash’s circulating supply after the Orchard vulnerability. The work involved multiple organizations.',
    terms: [{term:'Shielded pool',meaning:'The part of Zcash’s transaction system used to hold and transfer protected funds.'},{term:'Orchard',meaning:'A Zcash shielded transaction protocol.'},{term:'NU6.3',meaning:'The network-upgrade identifier associated with Ironwood.'}],
  },
  zero: {
    lead: 'Software and engineering support for the services that run on Zcash.',
    benefit: 'Help exchanges, wallets, mining pools and node operators work with Zcash infrastructure.',
    terms: [{term:'Node',meaning:'Software that connects to the network and checks transactions and blocks.'},{term:'Repository',meaning:'A public record of source code and its changes.'}],
  },
  fees: {
    lead: 'Work on transaction fees that respond to changing network conditions.',
    benefit: 'Explore fee rules that reflect network demand. The project record distinguishes design work from verified releases.',
    terms: [{term:'Fee market',meaning:'Rules for how transaction fees respond to demand for network capacity.'},{term:'Forked repository',meaning:'A copy of another codebase. Its history can include work by the original authors.'}],
  },
};
