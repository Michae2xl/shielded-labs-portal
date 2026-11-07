'use client';

import { useEffect, useState } from 'react';
import { formatZec, NSM, type NsmSource } from '@/lib/shielded-preview/nsm/balance';
import { zipHref } from '@/lib/shielded-preview/zips/library';
import s from './nsm-balance.module.css';

const POLL = 30_000;
const CHAIN_DATA = 'https://api.blockchair.com/zcash';
const number = (value: number) => value.toLocaleString('en-US');
function age(time: string, now: number) {
  const seconds = Math.max(0, Math.round((now - Date.parse(time)) / 1000));
  if (seconds < 90) return `${seconds} s ago`;
  return seconds < 5_400 ? `${Math.round(seconds / 60)} min ago` : `${Math.round(seconds / 3_600)} h ago`;
}

/** The balance as the chain reports it; without a reading it shows the balance ZIP 237 seeds at activation. */
export function NsmBalanceCard({ source, now }: { source: NsmSource | null; now: number }) {
  const reading = source?.reading ?? null;
  const balance = reading?.balanceZat ?? (source ? NSM.initialBalanceZat : null);
  const status = !source ? 'Loading' : source.state === 'fetched' ? 'Live' : source.state === 'stale' ? 'Last reading' : 'Unavailable';
  return <section className={s.card} aria-labelledby="nsm-balance-heading" data-state={source?.state ?? 'loading'}>
    <div className={s.heading}>
      <h2 id="nsm-balance-heading">NSM balance</h2>
      <span className={s.status}><span className={s.dot} aria-hidden="true"/>{status}</span>
    </div>
    <div className={s.reading}>
      <p className={s.value} aria-live="polite">{balance === null ? <span className={s.placeholder}>—</span> : <data value={balance}>{formatZec(balance)}</data>}<span className={s.unit}>ZEC</span></p>
      <p className={s.meta}>{reading ? <>Block {number(reading.height)} · {age(reading.time, now)}</> : source ? 'Balance at NU7 activation' : 'Reading the chain tip'}</p>
    </div>
    <dl className={s.facts}>
      <div><dt>Removed since NU7 activation</dt><dd>{reading ? `${formatZec(reading.removedSinceActivationZat)} ZEC` : '—'}</dd></div>
      <div><dt>Reissuance begins</dt><dd>Block {number(NSM.reissuanceHeight)}</dd></div>
    </dl>
    <p className={s.note}>Scheduled issuance minus the chain value pools at the tip, as <a href={zipHref('zip-0237')}>ZIP 237</a> defines it. Chain data from <a href={source?.source ?? CHAIN_DATA} target="_blank" rel="noopener noreferrer">Blockchair</a>.</p>
  </section>;
}

export default function NsmBalance() {
  const [source, setSource] = useState<NsmSource | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch('/api/shielded-preview/nsm', { cache: 'no-store' });
        if (!response.ok) throw new Error('Balance unavailable');
        const next = await response.json() as NsmSource;
        if (active) { setSource(next); setNow(Date.now()); }
      } catch {
        if (active) setSource(current => current?.reading ? { ...current, state: 'stale' } : { state: 'unavailable', observedAt: null, reading: null, source: CHAIN_DATA });
      }
    };
    void load();
    const poll = window.setInterval(() => { if (document.visibilityState === 'visible') void load(); }, POLL);
    const tick = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => { active = false; window.clearInterval(poll); window.clearInterval(tick); };
  }, []);
  return <NsmBalanceCard source={source} now={now}/>;
}
