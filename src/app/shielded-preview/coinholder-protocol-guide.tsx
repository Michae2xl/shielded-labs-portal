import type { ReactNode } from 'react';
import s from './coinholder-protocol-guide.module.css';

function Source({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children} ↗</a>;
}

export function CoinholderProtocolGuide() {
  return (
    <details className={s.guide}>
      <summary>What can you verify in a coinholder vote?</summary>
      <div className={s.scroll} role="region" aria-label="Coinholder protocol comparison" tabIndex={0}>
        <table>
          <caption>This NU7.1 poll uses Valar. Earlier polls used Hanh’s software.</caption>
          <thead><tr><th scope="col">What is public?</th><th scope="col">Hanh · Coin Voting / ZCV</th><th scope="col">Valar · Shielded Vote</th></tr></thead>
          <tbody>
            <tr><th scope="row">During voting</th><td>The server records encrypted ballots. You can count the records. A holder can submit more than one.</td><td>The portal counts accepted vote commitments (casts) per question from chain events. It also counts encrypted fragments (shares) from the round summary. Fragments can arrive later, and a wallet can make multiple commitments.</td></tr>
            <tr><th scope="row">After voting</th><td>With the published election key and ballot archive, an auditor can read the amount assigned to a choice in a decryptable output and add up the results.</td><td>Once the tally is finalized, each answer has a combined voting weight in ZEC. The public tally keeps individual amounts private.</td></tr>
            <tr><th scope="row">Large holders</th><td>Large individual contributions can be visible in a recount. A holder can split or delegate voting power, so those records alone cannot establish who controlled the weight.</td><td>A larger fragment count can carry less ZEC. The records do not give a count of distinct voters or a ranking of holders by voting weight.</td></tr>
            <tr><th scope="row">Reproduce a result</th><td>Use the published election URL and election seed with the audit app or counter for that round. <Source href="https://openzcash.org/coinholders/verify?round=q4-2025">Q4 2025 audit</Source> · <Source href="https://openzcash.org/coinholders/verify?round=q1-2026">Q1 2026 counter</Source></td><td>Read the finalized tally for the round. Divide each answer’s <code>total_value</code> by 8 for ZEC. A synced node can also verify the cryptographic tally. <Source href="https://openzcash.org/coinholders/verify?round=q3-2026">Q3 2026 recount</Source> · <Source href="https://tally.valargroup.org/">Node verification guide</Source></td></tr>
          </tbody>
        </table>
      </div>
    </details>
  );
}
