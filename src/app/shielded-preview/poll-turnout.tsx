'use client';

import { useEffect, useState, useSyncExternalStore, type CSSProperties, type PointerEvent } from 'react';
import Image from 'next/image';
import type { BodyTurnout, TurnoutSnapshot } from '@/lib/shielded-preview/poll-turnout/turnout';
import { CoinholderCounts, CoinholderVote, coinholderPhase } from './coinholder-vote';
import { chartReadingAt, chartSpan, dailyRows, dayLabel, formatCount, pollDay, stampLabel, timeLabel } from '@/lib/shielded-preview/poll-turnout/view';
import { TurnoutTrack, useCrosshair, useWidth, type Window } from './poll-turnout-chart';
import s from './poll-turnout.module.css';

const POLL = 60_000;
const TRACK_HEIGHT = 74;
type PanelState = 'live' | 'stale' | 'unavailable' | 'loading';

/** One reading for every turnout view on the page: fetched once a minute while the page is visible, shared by all. */
const reading: { snapshot: TurnoutSnapshot | null; failed: boolean; listeners: Set<() => void>; timer: number | null } = {
  snapshot: null,
  failed: false,
  listeners: new Set(),
  timer: null,
};
let current = { snapshot: reading.snapshot, failed: reading.failed };
const publish = () => {
  current = { snapshot: reading.snapshot, failed: reading.failed };
  reading.listeners.forEach((listener) => listener());
};
async function load() {
  try {
    const response = await fetch('/api/shielded-preview/turnout', { cache: 'no-store' });
    if (!response.ok) throw new Error('Turnout unavailable');
    reading.snapshot = (await response.json()) as TurnoutSnapshot;
    reading.failed = false;
  } catch {
    reading.failed = true;
  }
  publish();
}
function subscribe(listener: () => void) {
  reading.listeners.add(listener);
  if (reading.timer === null) {
    void load();
    reading.timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, POLL);
  }
  return () => {
    reading.listeners.delete(listener);
    if (reading.listeners.size === 0 && reading.timer !== null) {
      window.clearInterval(reading.timer);
      reading.timer = null;
    }
  };
}
const SERVER = { snapshot: null, failed: false };
/** The turnout snapshot from the portal's route, read again every minute while the page is visible. */
export function usePollTurnout(): { snapshot: TurnoutSnapshot | null; failed: boolean } {
  return useSyncExternalStore(subscribe, () => current, () => SERVER);
}

const LABEL: Record<PanelState, string> = { live: 'Live', stale: 'Last reading', unavailable: 'Unavailable', loading: 'Loading' };
function panelState(snapshot: TurnoutSnapshot | null, failed: boolean): PanelState {
  if (!snapshot) return failed ? 'unavailable' : 'loading';
  if (failed) return 'stale';
  return snapshot.bodies.some((b) => b.state === 'live') ? 'live' : snapshot.bodies.some((b) => b.state === 'stale') ? 'stale' : 'unavailable';
}

function subtitle(snapshot: TurnoutSnapshot, now: number) {
  const closes = stampLabel(Date.parse(snapshot.closesAt));
  if (snapshot.phase === 'upcoming') return `${snapshot.round} · opens ${dayLabel(Date.parse(snapshot.opensAt))}`;
  if (snapshot.phase === 'counting') return `${snapshot.round} · polls closed ${closes}, tally in progress`;
  if (snapshot.phase === 'closed') return `${snapshot.round} · voting closed`;
  const { day, days } = pollDay(snapshot, now);
  return `${snapshot.round} · day ${day} of ${days} · closes ${closes}`;
}

const percent = (share: number) => `${share > 0 && share < 0.01 ? '<1' : Math.round(share * 100)}%`;
/** The bar under a count, with a few words: the share of who may vote, or for the coinholder vote, of the last poll's votes. */
function meterOf(body: BodyTurnout, value: number | null): { share: number; label: string; extra: string | null } | null {
  if (value === null) return null;
  const p = body.previous;
  if (body.eligible !== null && body.eligible > 0) {
    const share = value / body.eligible;
    return { share, label: `${percent(share)} of ${formatCount(body.eligible)}`, extra: p?.eligible ? ` · last poll ${percent(p.value / p.eligible)}` : null };
  }
  if (p && p.value > 0) return { share: value / p.value, label: `${percent(value / p.value)} of last poll`, extra: null };
  return null;
}
function meterGap(body: BodyTurnout, hover: number | null) {
  if (body.state === 'unavailable') return body.kind === 'vote-chain' ? 'Vote chain not answering' : 'Not read';
  if (hover !== null && body.timing === 'recorded') return 'Not read at this time';
  return body.kind === 'vote-chain' ? 'No earlier poll' : 'Electorate not published';
}
/** Where the count comes from, and how fresh it is; a reading from today needs no date. */
function status(body: BodyTurnout, now: number) {
  if (body.state === 'unavailable') return body.kind === 'vote-chain' ? 'Not answering' : 'Unavailable';
  if (body.timing === 'recorded') {
    if (!body.observedAt) return 'Not read yet';
    const at = Date.parse(body.observedAt);
    const label = body.kind === 'siv' ? (body.state === 'live' ? 'Hourly' : body.state === 'stale' ? 'Delayed' : 'Saved') : 'By hand';
    return dayLabel(at) === dayLabel(now) ? `${label} ${timeLabel(at)}` : `${label} ${dayLabel(at)}, ${timeLabel(at)}`;
  }
  if (body.timing === 'approximate') return 'Estimate';
  if (body.state === 'stale') return body.observedAt ? `Last read ${timeLabel(Date.parse(body.observedAt))}` : 'Last read';
  if (body.timing === 'snapshot' && body.observedAt) return `Updated ${timeLabel(Date.parse(body.observedAt))}`;
  return 'Live';
}

/** Who the card is: logos alone, or links when a mark leads somewhere (the wallets that vote). */
function Logos({ logos }: { logos: BodyTurnout['logos'] }) {
  if (logos.some((logo) => logo.href))
    return (
      <div className={s.logos}>
        {logos.map((logo) => (
          <a key={logo.src} className={s.logoLink} href={logo.href} target="_blank" rel="noopener noreferrer" aria-label={`${logo.name}, wallet site`} title={logo.name}>
            <Image className={s.logo} data-shape={logo.shape} src={logo.src} alt="" width={40} height={40} />
          </a>
        ))}
      </div>
    );
  return (
    <div className={s.logos} role="img" aria-label={logos.map((l) => l.name).join(', ')}>
      {logos.map((logo) => (
        <Image key={logo.src} className={s.logo} data-shape={logo.shape} src={logo.src} alt="" width={40} height={40} title={logo.name} />
      ))}
    </div>
  );
}

function BodyCard({ body, snapshot, w, hover, onPointer, onLeave }: { body: BodyTurnout; snapshot: TurnoutSnapshot; w: Window; hover: number | null; onPointer: (e: PointerEvent<HTMLElement>) => void; onLeave: () => void }) {
  const [chartRef, width] = useWidth<HTMLDivElement>();
  const shares = body.unit === 'shares';
  const phase = shares ? coinholderPhase(snapshot) : null;
  const reading = !shares && hover !== null ? chartReadingAt(body, hover) : null;
  const shown = reading ? reading.value : body.value;
  const meter = meterOf(body, shown);
  return (
    <li className={s.card} data-slot={body.slot} data-state={body.state} data-kind={body.kind}>
      <div className={s.top}>
        <div className={s.who}>
          {body.logos.length > 0 && <Logos logos={body.logos} />}
          <h4 className={s.name}>{body.name}</h4>
        </div>
        {!shares && <p className={s.value}>
          <strong>{formatCount(shown, body.approximate && hover === null)}</strong>
          <span>{shown === 1 ? 'ballot' : 'ballots'}</span>
        </p>}
      </div>
      {shares ? (
        phase === 'Final results'
          ? <p className={s.shareSummary}>See the final ZEC weight by answer.</p>
          : <CoinholderCounts snapshot={snapshot} body={body} />
      ) : (
        <>
          <div className={s.meter} aria-hidden="true">
            <span style={{ width: `${Math.min(100, (meter?.share ?? 0) * 100).toFixed(1)}%` }} />
          </div>
          <p className={s.meterLabel} data-hover={hover !== null || undefined}>
            {reading ? (
              reading.value === null && body.timing === 'recorded' ? meterGap(body, hover) : `At ${stampLabel(reading.at)}`
            ) : meter ? (
              <>
                {meter.label}
                {meter.extra && <span className={s.extra}>{meter.extra}</span>}
              </>
            ) : (
              meterGap(body, hover)
            )}
          </p>
          <div ref={chartRef} className={s.chart} onPointerMove={onPointer} onPointerDown={onPointer} onPointerLeave={onLeave}>
            <TurnoutTrack body={body} w={w} width={width} height={TRACK_HEIGHT} reading={reading} />
          </div>
          <div className={s.span} aria-hidden="true">
            <span>{dayLabel(w.start)}</span>
            <span>{w.end >= w.closes ? dayLabel(w.closes) : 'Now'}</span>
          </div>
        </>
      )}
      {shares ? (
        <p className={s.source}><a href="#poll-turnout-questions">View by question ↓</a></p>
      ) : (
      <p className={s.source}>
        <i className={s.dot} data-state={body.state} aria-hidden="true" />
        {status(body, w.now)} ·{' '}
        <a href={body.source.href} target="_blank" rel="noopener noreferrer">
          {body.source.label} ↗
        </a>
      </p>
      )}
    </li>
  );
}

/** Current coinholder shares and panel ballots, with source links and unit-specific explanations. */
export function PollTurnoutCard({ snapshot, failed = false, now: nowProp }: { snapshot: TurnoutSnapshot | null; failed?: boolean; now?: number }) {
  const state = panelState(snapshot, failed);
  const [range, setRange] = useState<'so-far' | 'whole'>('so-far');
  const now = nowProp ?? (snapshot ? Date.parse(snapshot.checkedAt) : 0);
  const opens = snapshot ? Date.parse(snapshot.opensAt) : 0;
  const closes = snapshot ? Date.parse(snapshot.closesAt) : 0;
  const w: Window | null = snapshot ? { opens, closes, now, ...chartSpan(opens, closes, now, range) } : null;
  const crosshair = useCrosshair(w);
  const panels = snapshot ? { ...snapshot, bodies: snapshot.bodies.filter((body) => body.unit === 'ballots') } : null;
  return (
    <section className={s.panel} id="poll-turnout" aria-labelledby="poll-turnout-heading" data-state={state}>
      <header className={s.head}>
        <div>
          <h3 id="poll-turnout-heading">Live turnout</h3>
          {snapshot && <p className={s.sub}>{subtitle(snapshot, now)}</p>}
        </div>
        <div className={s.controls}>
          {snapshot && snapshot.phase === 'open' && (
            <div className={s.range} role="group" aria-label="Time span" data-range={range}>
              {(['so-far', 'whole'] as const).map((value) => (
                <button key={value} type="button" aria-pressed={range === value} onClick={() => setRange(value)}>
                  {value === 'so-far' ? 'So far' : 'Whole poll'}
                </button>
              ))}
            </div>
          )}
          <span className={s.state} data-state={state}>
            <span className={s.pulse} aria-hidden="true" />
            {LABEL[state]}
          </span>
        </div>
      </header>
      {snapshot && w && panels ? (
        <>
          <ol
            className={s.cards}
            style={{ '--cards': Math.min(4, snapshot.bodies.length) } as CSSProperties}
            tabIndex={0}
            aria-label="Turnout by body. Arrow keys move every chart along the poll; Escape clears."
            onKeyDown={crosshair.onKey}
            onBlur={crosshair.clear}
          >
            {snapshot.bodies.map((body) => (
              <BodyCard key={body.id} body={body} snapshot={snapshot} w={w} hover={crosshair.hover} onPointer={crosshair.onPointer} onLeave={crosshair.clear} />
            ))}
          </ol>
          <CoinholderVote snapshot={snapshot} />
          <footer className={s.foot}>
            <details className={s.table}>
              <summary>Daily panel counts</summary>
              <table>
                <caption className={s.caption}>Each panel’s cumulative ballots at the end of each poll day, UTC. ZCAP shows its last observed total that day.</caption>
                <thead>
                  <tr>
                    <th scope="col">Day</th>
                    {panels.bodies.map((b) => (
                      <th key={b.id} scope="col">
                        {b.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dailyRows(panels, now).map((row) => (
                    <tr key={row.day}>
                      <th scope="row">{dayLabel(row.day)}</th>
                      {row.values.map((v, i) => (
                        <td key={panels.bodies[i].id}>{formatCount(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </footer>
        </>
      ) : (
        <p className={s.waiting}>{failed ? 'Turnout unavailable right now.' : 'Reading the vote chain and the panels.'}</p>
      )}
    </section>
  );
}

export default function PollTurnout() {
  const { snapshot, failed } = usePollTurnout();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);
  return <PollTurnoutCard snapshot={snapshot} failed={failed} now={now ?? undefined} />;
}
