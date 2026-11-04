import type { Project } from './content';

// Portal glossary. Official presentation and progress copy live in project-publications.ts.
export const projectGuides: Record<Project['id'], {
  terms: { term: string; meaning: string }[];
}> = {
  crosslink: {
    terms: [{term:'Finality',meaning:'The point at which a transaction is considered settled under the protocol’s rules.'},{term:'Staking',meaning:'Committing coins to participate in securing the network, alongside mining in this proposal.'},{term:'Feature net',meaning:'A network for testing a particular feature before any mainnet adoption.'}],
  },
  epoch: {
    terms: [{term:'Post-quantum cryptography',meaning:'Cryptographic designs intended to resist attacks from quantum computers.'},{term:'Formal verification',meaning:'Using mathematical methods to check that a design satisfies specified properties.'}],
  },
  nsm: {
    terms: [{term:'Issuance',meaning:'The release of new coins according to the network’s rules.'},{term:'ZIP',meaning:'A Zcash Improvement Proposal: a document describing a proposed change or standard.'},{term:'Fee burning',meaning:'Removing transaction fees from circulation under a specified protocol rule.'}],
  },
  ironwood: {
    terms: [{term:'Shielded pool',meaning:'The part of Zcash’s transaction system used to hold and transfer protected funds.'},{term:'Orchard',meaning:'A Zcash shielded transaction protocol.'},{term:'NU6.3',meaning:'The network-upgrade identifier associated with Ironwood.'}],
  },
  zero: {
    terms: [{term:'Node',meaning:'Software that connects to the network and checks transactions and blocks.'},{term:'Repository',meaning:'A public record of source code and its changes.'}],
  },
  fees: {
    terms: [{term:'Fee market',meaning:'Rules for how transaction fees respond to demand for network capacity.'},{term:'Forked repository',meaning:'A copy of another codebase. Its history can include work by the original authors.'}],
  },
};
