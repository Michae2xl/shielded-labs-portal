'use client';

import { useEffect, useRef, useState } from 'react';
import { eligibleBlocks, minerPoll, type MinerReading } from '@/lib/shielded-preview/miner-poll/poll';
import { NU7_1_TURNOUT } from '@/lib/shielded-preview/poll-turnout/turnout';
import { formatCount, stampLabel } from '@/lib/shielded-preview/poll-turnout/view';
import { leavingLink } from '@/lib/shielded-preview/editorial/library';
import { OutArrow } from './governance-link';
import fund from './governance-dev-fund.module.css';
import panel from './poll-turnout.module.css';
import s from './miner-sentiment.module.css';

const phaseLabel = { upcoming: 'Not started', counting: 'Provisional tally', confirming: 'Awaiting final tally', final: 'Final tally' };

const percent = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
const tallyCommand = `miner-poll tally --election nu7-1 --options 3,3,3,3,3 --network mainnet --start ${minerPoll.start} --end ${minerPoll.end} --addr 127.0.0.1:8232`;

function VerifyTally() {
  const command = useRef<HTMLElement>(null);
  const [copyStatus, setCopyStatus] = useState('');
  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(tallyCommand);
      setCopyStatus('Command copied.');
    } catch {
      const selection = window.getSelection();
      if (command.current && selection) {
        selection.selectAllChildren(command.current);
        setCopyStatus('Command selected. Use your device’s copy action.');
      } else {
        setCopyStatus('Select the command to copy it.');
      }
    }
  }
  return <details className={s.details}>
    <summary>Verify the tally</summary>
    <div className={s.verify}>
      <p>From block {formatCount(minerPoll.start)}, run Zebra’s <code>miner-poll</code> against a synced mainnet <code>zebrad</code> node with RPC enabled.</p>
      <div className={s.command}>
        <pre><code ref={command}>{tallyCommand}</code></pre>
        <button className={fund.resourceButton} type="button" onClick={copyCommand}>Copy command</button>
      </div>
      <span role="status" className={s.copyStatus}>{copyStatus}</span>
      <p>Compare <code>blocks_with_ballot</code> with the official tally at the same <code>tallied_through_height</code>.</p>
    </div>
  </details>;
}

function StatusNote({ reading }: { reading: MinerReading }) {
  switch (reading.phase) {
    case 'upcoming': {
      const remaining = minerPoll.start - reading.height;
      return <>Opens in {formatCount(remaining)} {remaining === 1 ? 'block' : 'blocks'} (block {formatCount(minerPoll.start)})</>;
    }
    case 'counting': return <>Last eligible block {formatCount(minerPoll.end)}.</>;
    case 'confirming': return <>{minerPoll.confirmations} confirmations required.</>;
    case 'final': return <>Through block {formatCount(minerPoll.end)}.</>;
  }
}

export function MinerCard({ reading, failed = false }: { reading: MinerReading | null; failed?: boolean }) {
  return <section id="miner-sentiment" className={panel.panel} aria-labelledby="miner-heading" tabIndex={-1}>
    <header className={panel.head}>
      <div><h3 id="miner-heading">Miner sentiment</h3><p className={panel.sub}>Miners and pools can submit one ballot per block on the five NU7.1 questions.</p></div>
    </header>
    {reading ? <>
      <dl className={s.metrics} aria-label="NU7.1 miner poll summary">
        <div><dt>Status</dt><dd>{phaseLabel[reading.phase]}</dd><dd className={s.note}><StatusNote reading={reading}/></dd></div>
        <div><dt>Blocks tallied</dt><dd>{formatCount(reading.tallied)}</dd>
          <dd className={s.note}>of {formatCount(eligibleBlocks)} eligible blocks{reading.tallied > 0 && ` (${percent.format(reading.tallied / eligibleBlocks)})`}</dd></div>
        <div><dt>Blocks with a ballot</dt><dd>{formatCount(reading.withBallot)}</dd>
          {reading.tallied > 0 && <dd className={s.note}>{percent.format(reading.withBallot / reading.tallied)} of tallied blocks</dd>}</div>
      </dl>
      <p className={s.stamp}>Updated <time dateTime={reading.updatedAt}>{stampLabel(Date.parse(reading.updatedAt))}</time> · Mainnet block {formatCount(reading.height)}</p>
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
    <VerifyTally/>
    <nav className={s.links} aria-label="Miner poll resources">
      {[
        ['Official tally', minerPoll.tally],
        ['Poll rules', minerPoll.definition],
        ['Ballot builder', minerPoll.builder],
        ['Foundation announcement', minerPoll.announcement],
      ].map(([label, href]) => (
        <a key={href} className={fund.resourceButton} href={href} {...leavingLink(href)}>{label}<OutArrow/></a>
      ))}
    </nav>
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
