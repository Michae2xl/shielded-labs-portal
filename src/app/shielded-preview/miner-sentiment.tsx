'use client';

import { useEffect, useState } from 'react';
import { eligibleBlocks, minerPoll, type MinerReading } from '@/lib/shielded-preview/miner-poll/poll';
import { NU7_1_TURNOUT } from '@/lib/shielded-preview/poll-turnout/turnout';
import { formatCount, stampLabel } from '@/lib/shielded-preview/poll-turnout/view';
import panel from './poll-turnout.module.css';
import s from './miner-sentiment.module.css';

const phaseLabel = { upcoming: 'Not started', counting: 'Provisional tally', confirming: 'Awaiting final tally', final: 'Final tally' };

export function MinerCard({ reading, failed = false }: { reading: MinerReading | null; failed?: boolean }) {
  return <section id="miner-sentiment" className={panel.panel} aria-labelledby="miner-heading" tabIndex={-1}>
    <header className={panel.head}>
      <div><h3 id="miner-heading">Miner sentiment</h3><p className={panel.sub}>In this Zcash Foundation pilot, miners and pools can answer the five NU7.1 questions in each block they mine. A pool can signal more than once.</p></div>
    </header>
    {reading ? <>
      <div className={s.reading}>
        <div><strong>{formatCount(reading.withBallot)}</strong><span>blocks with a ballot</span></div>
        <div><strong>{formatCount(reading.tallied)}</strong><span>blocks tallied</span></div>
        <div className={s.phase}><b>{phaseLabel[reading.phase]}</b>
          <span>{reading.phase === 'upcoming'
            ? 'Opens in ' + formatCount(minerPoll.start - reading.height) + ' blocks'
            : formatCount(eligibleBlocks) + ' eligible blocks in the poll'}</span></div>
      </div>
      <p className={s.stamp}>Source updated <time dateTime={reading.updatedAt}>{stampLabel(Date.parse(reading.updatedAt))}</time> · Mainnet block {formatCount(reading.height)}</p>
    </> : <p className={s.notice} role="status">{failed ? 'The official tally is unavailable.' : 'Loading the official tally…'}</p>}
    {failed && reading && <p className={s.notice} role="status">Refresh unavailable. Showing the last reading received.</p>}
    {reading?.questions && <details className={s.details}>
      <summary>Results by question</summary>
      <div className={s.tableBox} tabIndex={0} role="region" aria-label="Miner results by question">
        <table><caption>Blocks tallied for each question. “No answer” includes blocks without a ballot and ballots that skipped that question.</caption>
          <thead><tr><th scope="col">Question</th><th scope="col">Support</th><th scope="col">Oppose</th><th scope="col">Abstain</th><th scope="col">No answer</th></tr></thead>
          <tbody>{reading.questions.map(q => <tr key={q.id}><th scope="row">Q{q.id} · {NU7_1_TURNOUT.questions[q.id - 1].label}</th>
            <td>{formatCount(q.support)}</td><td>{formatCount(q.oppose)}</td><td>{formatCount(q.abstain)}</td><td>{formatCount(reading.tallied - q.support - q.oppose - q.abstain)}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </details>}
    <details className={s.details}>
      <summary>How the tally works</summary>
      <p>Each of the {formatCount(eligibleBlocks)} mainnet blocks from {formatCount(minerPoll.start)} through {formatCount(minerPoll.end)} can carry one counted ballot. Miners can support, oppose, abstain or skip a question. Skipping leaves it unanswered.</p>
      <p>The block heights set the voting window. The final tally requires 100 confirmations of the last eligible block. Anyone can verify it with the command on the official tally page and a synced Zebra node.</p>
      <div className={s.links}><a href={minerPoll.definition}>Poll rules ↗</a><a href={minerPoll.announcement}>Foundation announcement ↗</a><a href={minerPoll.builder}>Ballot builder ↗</a></div>
    </details>
    <div className={s.links}><a href={minerPoll.tally}>View official miner tally ↗</a></div>
  </section>;
}

export default function MinerSentiment() {
  const [reading, setReading] = useState<MinerReading | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      let final = false;
      try {
        const response = await fetch('/api/shielded-preview/miner-poll', { signal: controller.signal });
        if (!response.ok) throw new Error('Miner tally unavailable');
        const next: MinerReading = await response.json();
        if (controller.signal.aborted) return;
        setReading(next);
        setFailed(false);
        final = next.phase === 'final';
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!final && !controller.signal.aborted) timer = setTimeout(refresh, 60_000);
      }
    }
    void refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, []);
  return <MinerCard reading={reading} failed={failed}/>;
}
