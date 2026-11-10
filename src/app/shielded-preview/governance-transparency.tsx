'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import record from '@/lib/shielded-preview/governance-data/record.json';
import catalog from '@/lib/shielded-preview/editorial/catalog.json';
import type { GovernanceData } from '@/lib/shielded-preview/governance-types';
import { bundledZips } from '@/lib/shielded-preview/zips/library';
import { disclosedDocuments } from '@/lib/shielded-preview/transparency/involvement';
import { editorialPolicy } from '@/lib/shielded-preview/transparency/policy';
import { ageLabel, DAY, freshness, MINUTE, type Freshness } from '@/lib/shielded-preview/transparency/thermometer';
import { treasurySheetUrl, treasuryTabs, zecPricePage } from '@/lib/shielded-preview/treasury';
import { laneForAnchor, transparencyLane, transparencyLanes } from '@/lib/shielded-preview/transparency/lanes';
import { Tabs } from './governance-collections';
import c from './governance-collections.module.css';
import { EvidenceKey, EvidenceTag, ExternalMark, day } from './transparency';
import { DebateExplorer } from './transparency-debates';
import { InvolvementCard } from './transparency-involvement';
import type { EvidenceKind } from '@/lib/shielded-preview/transparency/evidence';
import t from './transparency.module.css';

type Reading = { id: string; label: string; checkedAt: string | null; every: number; cadence: string; detail: string };
const dots: Record<Freshness, string> = { fresh: t.fresh, aging: t.aging, stale: t.stale, unknown: '' };
const words: Record<Freshness, string> = { fresh: 'Current', aging: 'Ageing', stale: 'Overdue', unknown: 'Not checked' };
const latest = (values: (string | null | undefined)[]) => values.filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;

const disclosed = disclosedDocuments(bundledZips.entries);

/** Ledger tiles share a six-column row: up to three on the first row, the rest split the second. */
function spans(count: number) {
  const first = count === 4 ? 2 : Math.min(3, count);
  return Array.from({ length: count }, (_, index) => 6 / (index < first ? first : count - first));
}

function useLiveTimes() {
  const [times, setTimes] = useState<{ nsm: string | null; github: string | null; crosslink: string | null; loaded: boolean }>({ nsm: null, github: null, crosslink: null, loaded: false });
  useEffect(() => {
    let active = true;
    const read = async (url: string) => { try { const response = await fetch(url, { signal: AbortSignal.timeout(15000) }); return response.ok ? await response.json() : null; } catch { return null; } };
    // Read now and every minute, so a source that was briefly unavailable shows up once it answers.
    const load = () => void Promise.all([read('/api/shielded-preview/nsm'), read('/api/shielded-preview')]).then(([nsm, portal]) => {
      if (active) setTimes({ nsm: nsm?.observedAt ?? null, github: portal?.checkedAt ?? null, crosslink: portal?.crosslinkRelease?.state === 'live' ? portal.checkedAt : null, loaded: true });
    });
    load();
    const timer = setInterval(() => { if (!document.hidden) load(); }, 60000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  return times;
}

export default function GovernanceTransparency({ data, lane, onLane }: { data: GovernanceData; lane: string; onLane: (value: string) => void }) {
  const view = transparencyLane(lane);
  const live = useLiveTimes();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  // An anchor opens the tab that holds it, then scrolls to it once that tab is on screen.
  const choose = useRef(onLane);
  const pending = useRef<string | null>(null);
  useEffect(() => { choose.current = onLane; });
  useEffect(() => {
    const scrollTo = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
    // Changing tab rewrites the address without its anchor: put it back and tell the tab's own listeners.
    if (pending.current) { history.replaceState(null, '', `${location.search}#${pending.current}`); pending.current = null; window.dispatchEvent(new Event('hashchange')); }
    const reveal = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      const target = laneForAnchor(id);
      if (target && target !== view) { pending.current = id; choose.current(target); } else scrollTo(id);
    };
    reveal();
    window.addEventListener('shielded:navigate', reveal);
    window.addEventListener('hashchange', reveal);
    return () => { window.removeEventListener('shielded:navigate', reveal); window.removeEventListener('hashchange', reveal); };
  }, [view]);

  const readings: Reading[] = [
    { id: 'nsm', label: 'NSM balance', checkedAt: live.nsm, every: MINUTE, cadence: 'Every minute', detail: 'Computed from node pool values (ZIP 237), via Blockchair.' },
    { id: 'governance', label: 'Grants, proposals, votes and ZCAP', checkedAt: data.checkedAt, every: 5 * MINUTE, cadence: 'Every 5 minutes', detail: 'OpenZcash ledger, FPF applications, ZCAP roster, ZCG treasury sheet and CoinGecko price.' },
    { id: 'github', label: 'Code activity', checkedAt: live.github, every: 5 * MINUTE, cadence: 'Every 5 minutes', detail: 'Shielded Labs repositories on GitHub.' },
    { id: 'zips', label: 'ZIP index', checkedAt: bundledZips.meta.syncedAt, every: DAY, cadence: 'Bundled with each release', detail: 'Read from the zcash/zips repository; a live feed needs a read token.' },
    { id: 'editorial', label: 'Blog and site pages', checkedAt: latest((catalog as { observedAt?: string }[]).map(entry => entry.observedAt)), every: 7 * DAY, cadence: 'Weekly import', detail: 'Imported from shieldedlabs.net.' },
    { id: 'record', label: 'Poll and upgrade archive', checkedAt: record.checkedAt, every: 14 * DAY, cadence: 'Reviewed by hand', detail: 'Each poll and upgrade keeps its own sources.' },
  ];
  const commit = bundledZips.meta.upstream.commit;
  const nu7 = record.upgrades.find(upgrade => upgrade.name === 'NU7');
  const lastPoll = [...record.polls].filter(poll => poll.kind !== 'test').sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))[0];
  type Evidence = { kind: EvidenceKind; claim: string; checked: string | null; sources: { label: string; url: string }[] };
  const evidence: Evidence[] = [
    ...(nu7?.height && nu7.time ? [{ kind: 'fact' as const, claim: `NU7 activated at block ${nu7.height.toLocaleString('en-US')} on ${day(nu7.time)}`, checked: ('checkedAt' in nu7 && nu7.checkedAt) || record.checkedAt, sources: [{ label: `Block ${nu7.height.toLocaleString('en-US')}`, url: `https://blockchair.com/zcash/block/${nu7.height}` }, { label: 'ZIP 259', url: nu7.source }] }] : []),
    { kind: 'fact', claim: 'The NSM balance is recomputed each minute from the chain’s value pools, with the ZIP 237 formula', checked: live.nsm, sources: [{ label: 'ZIP 237', url: 'https://zips.z.cash/zip-0237' }, { label: 'Chain data', url: 'https://blockchair.com/zcash' }] },
    ...(lastPoll ? [{ kind: 'record' as const, claim: `Most recent vote in the archive: ${lastPoll.name}`, checked: record.checkedAt, sources: lastPoll.sources.slice(0, 1).map(url => ({ label: 'Published result', url })) }] : []),
    { kind: 'record', claim: 'Each ZIP’s status is read from its own header', checked: bundledZips.meta.syncedAt, sources: [{ label: commit ? `zcash/zips at ${commit.slice(0, 7)}` : 'zcash/zips', url: commit ? `https://github.com/zcash/zips/commit/${commit}` : 'https://github.com/zcash/zips' }] },
    { kind: 'record', claim: 'Grant budgets and payments are ledger entries, not on-chain proof of delivery', checked: data.grants.observedAt, sources: [{ label: 'OpenZcash ledger', url: data.grants.url }] },
    { kind: 'record', claim: 'Treasury holdings are the ZCG sheet’s figures; dollar values use the live ZEC price, or the sheet’s if the feed is down', checked: data.treasury.observedAt, sources: [{ label: 'ZCG treasury sheet', url: treasurySheetUrl(treasuryTabs.zcg) }, { label: 'CoinGecko', url: zecPricePage }] },
  ];
  const ledgerSpans = spans(evidence.length);

  return <div className={t.page}>
    <h2 className={t.srOnly}>Transparency</h2>
    <div className={`${c.collection} ${t.lanes}`}><Tabs label="Transparency views" value={view} items={transparencyLanes} onChange={onLane}/></div>
    {view === 'debates' && <DebateExplorer/>}
    {view === 'involvement' && <InvolvementCard rows={disclosed}/>}

    {view === 'method' && <><section className={`${t.card} ${t.keyCard}`} aria-labelledby="evidence-key-title">
      <div className={t.cardHead}><h3 id="evidence-key-title">How content is marked</h3><span className={t.meta}>Every claim carries one of these marks</span></div>
      <EvidenceKey/>
    </section>

    <section className={t.card} id="editorial-policy" aria-labelledby="editorial-policy-title">
      <div className={t.cardHead}><h3 id="editorial-policy-title">Editorial policy</h3></div>
      <dl className={t.policy}>{editorialPolicy.map(item => <div key={item.title}><dt>{item.title}</dt><dd>{item.text}</dd></div>)}</dl>
      <p className={t.note}>Anything without the Shielded Labs mark is reported from its source, with the date it was checked.</p>
    </section></>}

    {view === 'evidence' && <><section className={t.card} id="evidence" aria-labelledby="evidence-title">
      <div className={t.cardHead}><h3 id="evidence-title">Evidence ledger</h3><span className={t.meta}>Claims and what proves them</span></div>
      <ul className={t.ledger}>{evidence.map((row, index) => <li key={row.claim} data-kind={row.kind} style={{ '--span': ledgerSpans[index] } as CSSProperties}>
        <div className={t.ledgerTop}><EvidenceTag kind={row.kind} small/><span>{row.checked ? `Checked ${ageLabel(row.checked, now).toLowerCase()}` : live.loaded ? 'Unavailable now' : 'Checking…'}</span></div>
        <strong>{row.claim}</strong>
        <div className={t.evidenceLinks}>{row.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<ExternalMark/></a>)}</div>
      </li>)}</ul>
    </section>

    <section className={`${t.card} ${t.thermometer}`} id="source-thermometer" aria-labelledby="source-thermometer-title">
      <div className={t.cardHead}><h3 id="source-thermometer-title">Source thermometer</h3><span className={t.meta}>{live.loaded ? 'Live check' : 'Checking…'}</span></div>
      <ul className={t.readings}>{readings.map(reading => {
        const level = reading.id === 'nsm' || reading.id === 'github' ? (live.loaded ? freshness(reading.checkedAt, reading.every, now) : 'unknown') : freshness(reading.checkedAt, reading.every, now);
        const state = level === 'unknown' ? (live.loaded ? 'Unavailable now' : 'Checking…') : `${words[level]} · ${ageLabel(reading.checkedAt, now)}`;
        return <li key={reading.id}><span className={`${t.dot} ${dots[level]}`} aria-hidden="true"/><strong>{reading.label}</strong><span>{state}</span><small>{reading.cadence}. {reading.detail}</small></li>;
      })}</ul>
      <div className={t.legend}><span><i className={`${t.dot} ${t.fresh}`}/>Within its cadence</span><span><i className={`${t.dot} ${t.aging}`}/>Late</span><span><i className={`${t.dot} ${t.stale}`}/>Overdue</span></div>
    </section></>}
  </div>;
}
