'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import type { BodyTurnout, TurnoutSnapshot } from '@/lib/shielded-preview/poll-turnout/turnout';
import { dailyNew, dayLabel, formatCount, stampLabel } from '@/lib/shielded-preview/poll-turnout/view';
import { usePollTurnout } from './poll-turnout';
import b from './governance-bento.module.css';
import s from './poll-turnout-days.module.css';

function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);
  return now;
}

/** A bar this tall (share of the row's busiest day) has room for its count inside; a shorter one carries it on top. */
const INSIDE = 0.3;

/** A count short enough for a day's bar: 1,234 reads as 1.2k. */
function barLabel(value: number): string {
  return value < 1000 ? formatCount(value) : `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}k`;
}

/** The months the poll's days fall in, for the axis: "Nov", or "Nov – Dec". */
function monthsOf(days: { day: number }[]): string {
  const months = [...new Set(days.map((d) => new Date(d.day).toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })))];
  return months.join(' – ');
}

/** Shares have no daily history: give them their own question axis and total. */
function CoinholderShares({ body, questions }: { body: BodyTurnout; questions: TurnoutSnapshot['questions'] }) {
  const top = Math.max(1, ...questions.map((question) => question.shares ?? 0));
  return (
    <section className={s.sharesBlock} aria-labelledby="coinholder-bars-heading">
      <details className={s.shareDisclosure}>
      <summary className={s.sharesHead}>
        <span id="coinholder-bars-heading" className={s.sharesTitle}>Coinholder network activity</span>
        <span>{body.observedAt ? <>Latest reading · <time dateTime={body.observedAt}>{stampLabel(Date.parse(body.observedAt))}</time></> : 'Awaiting a reading'}</span>
      </summary>
      <p className={s.shareNote}>A taller bar means the network has received more encrypted fragments for that question. Each fragment can carry a different weight.</p>
      <div className={`${s.row} ${s.shareRow}`}>
        <span className={s.who}>
          <span className={s.logos} aria-hidden="true">
            {body.logos.map((logo) => <Image key={logo.src} className={s.logo} data-shape={logo.shape} src={logo.src} alt="" width={20} height={20} />)}
          </span>
          <span className={s.name}>{body.name}</span>
        </span>
        <ol className={s.shareBars} aria-label="Latest shares by question">
          {questions.map((question) => {
            const value = question.shares;
            const height = value ? Math.max(6, (value / top) * 100) : 0;
            const inside = value !== null && value / top >= INSIDE;
            return (
              <li key={question.id} aria-label={`Q${question.id} ${question.label}: ${value === null ? 'shares unavailable' : `${formatCount(value)} shares`}`}>
                <span className={s.slot} aria-hidden="true" title={`Q${question.id} ${question.label}: ${value === null ? 'shares unavailable' : `${formatCount(value)} shares`}`}>
                  {value !== null && value > 0 && <i style={{ height: `${height.toFixed(1)}%` }}>{inside && <b>{barLabel(value)}</b>}</i>}
                  {!inside && <b className={s.over} data-zero={value === 0 || value === null || undefined} style={value ? { bottom: `calc(${height.toFixed(1)}% + 4px)` } : undefined}>{value === null ? '—' : barLabel(value)}</b>}
                </span>
                <span className={s.questionAxis} aria-hidden="true">Q{question.id}</span>
              </li>
            );
          })}
        </ol>
        <span className={s.today}>
          <strong>{formatCount(body.value)}</strong>
          <small>total shares</small>
        </span>
      </div>
      <p className={s.shareNote}>One wallet can contribute many shares. The final tally shows the ZEC behind each answer.</p>
      </details>
    </section>
  );
}

/** Daily panel ballots, followed by a separate row for the latest coinholder shares. */
export function TurnoutByDayCard({ snapshot, now }: { snapshot: ReturnType<typeof usePollTurnout>['snapshot']; now: number | null }) {
  const at = now ?? (snapshot ? Date.parse(snapshot.checkedAt) : 0);
  const panels = snapshot ? { ...snapshot, bodies: snapshot.bodies.filter((body) => body.unit === 'ballots') } : null;
  const days = panels ? dailyNew(panels, at) : [];
  const today = days.findLastIndex((d) => !d.future);
  const coinholders = snapshot?.bodies.find((body) => body.id === 'coinholders' && body.unit === 'shares');
  return (
    <section className={`${b.card} ${s.card}`} aria-labelledby="turnout-days-heading" style={{ '--days': days.length || 15 } as CSSProperties}>
      <header className={b.header}>
        <h3 id="turnout-days-heading">Panel ballots per day</h3>
        <span className={b.meta}>New each day · UTC</span>
      </header>
      {panels && days.length > 0 ? (
        <>
          <ol className={s.rows}>
            {panels.bodies.map((body, index) => {
              const values = days.map((d) => d.values[index]);
              const top = Math.max(1, ...values.map((v) => v ?? 0));
              const latest = today >= 0 ? values[today] : null;
              const spoken = days
                .filter((d) => !d.future)
                .map((d, i) => `${values[i] === null ? 'not known' : formatCount(values[i])} on ${dayLabel(d.day)}`)
                .join(', ');
              return (
                <li key={body.id} className={s.row} data-slot={body.slot} aria-label={`${body.name}: ${spoken}`}>
                  <span className={s.who}>
                    <span className={s.logos} aria-hidden="true">
                      {body.logos.map((logo) => (
                        <Image key={logo.src} className={s.logo} data-shape={logo.shape} src={logo.src} alt="" width={20} height={20} />
                      ))}
                    </span>
                    <span className={s.name}>{body.name}</span>
                  </span>
                  <span className={s.bars} aria-hidden="true">
                    {days.map((d, i) => {
                      const value = d.future ? null : values[i];
                      const height = value ? Math.max(6, (value / top) * 100) : 0;
                      const inside = value !== null && value / top >= INSIDE;
                      return (
                        <span key={d.day} className={s.slot} data-future={d.future || undefined} data-today={i === today || undefined} title={d.future ? dayLabel(d.day) : `${dayLabel(d.day)}: ${formatCount(value)}`}>
                          {value !== null && value > 0 && <i style={{ height: `${height.toFixed(1)}%` }}>{inside && <b>{barLabel(value)}</b>}</i>}
                          {value !== null && !inside && (
                            <b className={s.over} data-zero={value === 0 || undefined} style={value > 0 ? { bottom: `calc(${height.toFixed(1)}% + 4px)` } : undefined}>
                              {barLabel(value)}
                            </b>
                          )}
                        </span>
                      );
                    })}
                  </span>
                  <span className={s.today}>
                    <strong>{latest === null ? '—' : latest > 0 ? `+${formatCount(latest)}` : '0'}</strong>
                    <small>today</small>
                  </span>
                </li>
              );
            })}
          </ol>
          <div className={s.axis} aria-hidden="true">
            <span className={s.month}>{monthsOf(days)}</span>
            <span className={s.days}>
              {days.map((d, i) => (
                <span key={d.day} data-today={i === today || undefined}>
                  {new Date(d.day).getUTCDate()}
                </span>
              ))}
            </span>
          </div>
          <p className={b.note}>Panel ballots received each day. ZCAP uses changes between observed totals; vote times are not published.</p>
          {coinholders && snapshot && <CoinholderShares body={coinholders} questions={snapshot.questions} />}
        </>
      ) : (
        <p className={b.note}>Reading the vote chain and the panels.</p>
      )}
    </section>
  );
}

export default function TurnoutByDay() {
  const { snapshot } = usePollTurnout();
  const now = useNow();
  return <TurnoutByDayCard snapshot={snapshot} now={now} />;
}
