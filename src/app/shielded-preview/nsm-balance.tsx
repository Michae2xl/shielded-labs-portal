'use client';

import { useEffect, useState } from 'react';
import { formatZec, NSM, type NsmSource } from '@/lib/shielded-preview/nsm/balance';
import { zipHref } from '@/lib/shielded-preview/zips/library';
import s from './nsm-balance.module.css';

const POLL = 30_000;
const CHAIN_DATA = 'https://api.blockchair.com/zcash';
const TARGET_SPACING_MS = 25_000;
const count = (value: number) => value.toLocaleString('en-US');
const status = (source: NsmSource | null) => !source ? 'Loading' : source.state === 'fetched' ? 'Live' : source.state === 'stale' ? 'Last reading' : 'Unavailable';
function age(time: string, now: number) {
  const seconds = Math.max(0, Math.round((now - Date.parse(time)) / 1000));
  if (seconds < 90) return `${seconds} s ago`;
  return seconds < 5_400 ? `${Math.round(seconds / 60)} min ago` : `${Math.round(seconds / 3_600)} h ago`;
}
// The reissuance height is fixed; the calendar month assumes the 25-second target spacing.
function reissuanceMonth(height: number, time: string) {
  const at = Date.parse(time) + (NSM.reissuanceHeight - height) * TARGET_SPACING_MS;
  return new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(at));
}

/** Whole ZEC at full weight and the eight decimals lighter, so the amount reads at a glance. */
function ZecAmount({ zatoshi, className }: { zatoshi: number; className?: string }) {
  const [whole, fraction] = formatZec(zatoshi).split('.');
  return <data className={className} value={zatoshi}><span>{whole}</span><span className={s.fraction}>.{fraction}</span><span className={s.unit}> ZEC</span></data>;
}

function State({ source }: { source: NsmSource | null }) {
  return <span className={s.state} data-state={source?.state ?? 'loading'}><span className={s.dot} aria-hidden="true"/>{status(source)}</span>;
}

export function useNsmBalance() {
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
  return { source, now };
}

/** The balance as the chain reports it; without a reading it shows the balance ZIP 237 seeds at activation. */
export function NsmBalanceCard({ source, now }: { source: NsmSource | null; now: number }) {
  const reading = source?.reading ?? null;
  const balance = reading?.balanceZat ?? (source ? NSM.initialBalanceZat : null);
  return <section className={s.card} aria-labelledby="nsm-balance-heading" data-state={source?.state ?? 'loading'}>
    <div className={s.heading}><h2 id="nsm-balance-heading">NSM balance</h2><State source={source}/></div>
    <div className={s.reading} aria-live="polite">
      {balance === null ? <p className={s.value}><span className={s.placeholder}>—</span></p> : <p className={s.value}><ZecAmount zatoshi={balance}/></p>}
      <p className={s.meta}>{reading ? <>Block {count(reading.height)} · {age(reading.time, now)}</> : source ? 'Balance at NU7 activation' : 'Reading the chain tip'}</p>
    </div>
    <dl className={s.tiles}>
      <div className={s.tile}><dt>Balance at NU7 activation</dt><dd>{formatZec(NSM.initialBalanceZat)} ZEC</dd><small>Left unclaimed before NU6</small></div>
      <div className={s.tile}><dt>Removed since NU7</dt><dd>{reading ? `+${formatZec(reading.removedSinceActivationZat)} ZEC` : '—'}</dd><small>60% of each block’s fees, ZIP 235</small></div>
      <div className={s.tile}><dt>Reissuance begins</dt><dd>Block {count(NSM.reissuanceHeight)}</dd><small>{reading ? `Estimated ${reissuanceMonth(reading.height, reading.time)} at 25-second blocks` : 'Fixed by ZIP 237'}</small></div>
    </dl>
    <p className={s.note}>Scheduled issuance minus the chain value pools at the tip, as <a href={zipHref('zip-0237')}>ZIP 237</a> defines it. Chain data from <a href={source?.source ?? CHAIN_DATA} target="_blank" rel="noopener noreferrer">Blockchair</a>.</p>
  </section>;
}

/** The project card's slot for the latest update, holding the live balance instead. */
export function NsmCardSignalView({ source, now }: { source: NsmSource | null; now: number }) {
  const reading = source?.reading ?? null;
  return <div className={s.signal}>
    <span className={s.signalLabel}>NSM balance<State source={source}/></span>
    {reading ? <ZecAmount zatoshi={reading.balanceZat} className={s.signalValue}/> : <span className={s.signalValue}><span className={s.placeholder}>—</span></span>}
    <small>{reading ? `Block ${count(reading.height)} · ${age(reading.time, now)} · +${formatZec(reading.removedSinceActivationZat)} ZEC since NU7` : source ? 'Chain data unavailable' : 'Reading the chain tip'}</small>
  </div>;
}

export function NsmCardSignal() {
  const { source, now } = useNsmBalance();
  return <NsmCardSignalView source={source} now={now}/>;
}

export default function NsmBalance() {
  const { source, now } = useNsmBalance();
  return <NsmBalanceCard source={source} now={now}/>;
}
