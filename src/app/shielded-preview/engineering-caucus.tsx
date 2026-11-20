'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ballotCenter, type CaucusReading } from '@/lib/shielded-preview/engineering-caucus/poll';
import { stampLabel } from '@/lib/shielded-preview/poll-turnout/view';
import { OutArrow } from './governance-link';
import panel from './poll-turnout.module.css';
import s from './miner-sentiment.module.css';
import fund from './governance-dev-fund.module.css';
import brand from './engineering-caucus.module.css';

export default function EngineeringCaucus() {
  const [reading, setReading] = useState<CaucusReading | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const response = await fetch('/api/shielded-preview/engineering-caucus', { signal: controller.signal });
        if (!response.ok) throw new Error('Helios unavailable');
        const next: CaucusReading = await response.json();
        if (!controller.signal.aborted) { setReading(next); setFailed(false); }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(refresh, 60000);
      }
    }
    void refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, []);

  return <section id="engineering-caucus" className={panel.panel} aria-labelledby="caucus-heading" tabIndex={-1}>
    <header className={panel.head}><div>
      <h3 id="caucus-heading" className={brand.heading}><Image src="/logos/engineering-caucus.png" width={32} height={32} alt="" />Zcash Engineering Caucus</h3>
      <p className={panel.sub}>Engineers from across the Zcash ecosystem vote on the five NU7.1 proposals through Helios.</p>
    </div></header>
    {reading && <>
      <dl className={s.metrics} aria-label="Engineering Caucus turnout">
        <div><dt>Ballots cast</dt><dd>{reading.cast}</dd></div>
        <div><dt>Registered voters</dt><dd>{reading.eligible}</dd></div>
        <div><dt>Turnout</dt><dd>{(reading.cast / reading.eligible).toLocaleString('en-US', { style: 'percent', maximumFractionDigits: 1 })}</dd></div>
      </dl>
      <p className={s.stamp}>Checked <time dateTime={reading.checkedAt}>{stampLabel(Date.parse(reading.checkedAt))}</time></p>
    </>}
    {(!reading || failed) && <p className={s.notice} role="status">{failed ? reading ? 'Refresh unavailable. Showing the last reading.' : 'Helios turnout is unavailable.' : 'Loading Helios turnout…'}</p>}
    <div className={s.links}><a className={fund.resourceButton} href={ballotCenter} target="_blank" rel="noopener noreferrer">Verify on Helios <OutArrow/></a></div>
  </section>;
}
