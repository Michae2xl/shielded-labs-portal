import type { Project } from './content';

// Verbatim excerpts checked against the linked Shielded Labs pages on 2026-11-01.
// Keep source wording intact; project stage and activation records live separately.
export const officialProjectExcerpts: Record<Project['id'], { text: string; source: string }> = {
  crosslink: {
    text: 'Providing stronger settlement guarantees makes Zcash easier to integrate into the wider crypto economy.',
    source: 'https://shieldedlabs.net/crosslink-faq/',
  },
  epoch: {
    text: 'We’re launching Epoch to protect Zcash users and the monetary base, and to bring greater certainty to Zcash’s long-term security.',
    source: 'https://shieldedlabs.net/epoch-future-proof-cryptography-for-zcash/',
  },
  nsm: {
    text: 'The primary objective of the NSM is to create an automated mechanism that enables users to contribute to the sustainability of the network.',
    source: 'https://shieldedlabs.net/nsm/',
  },
  ironwood: {
    text: 'Ironwood is a Zcash network upgrade designed to make it possible for every user to independently verify the soundness of Zcash’s circulating supply.',
    source: 'https://shieldedlabs.net/ironwood/',
  },
  zero: {
    text: 'Shielded Labs’ enterprise-grade suite of open-source Zcash infrastructure software intended for use by exchanges, mining pools, wallet providers, and other ecosystem partners.',
    source: 'https://shieldedlabs.net/projects/',
  },
  fees: {
    text: 'We are exploring how to make Zcash transaction fees more predictable, user-friendly, and resilient as the network evolves.',
    source: 'https://shieldedlabs.net/fees/',
  },
};
