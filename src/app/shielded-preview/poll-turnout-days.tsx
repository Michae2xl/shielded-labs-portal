'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { dailyNew, dayLabel, formatCount } from '@/lib/shielded-preview/poll-turnout/view';
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

/** What each body added on each day of the poll: one row of bars per body, today's bar in its colour. */
export function TurnoutByDayCard({ snapshot, now }: { snapshot: ReturnType<typeof usePollTurnout>['snapshot']; now: number | null }) {
  const at = now ?? (snapshot ? Date.parse(snapshot.checkedAt) : 0);
  const days = snapshot ? dailyNew(snapshot, at) : [];
  const today = days.findLastIndex((d) => !d.future);
  return (
    <section className={`${b.card} ${s.card}`} aria-labelledby="turnout-days-heading">
      <header className={b.header}>
        <h3 id="turnout-days-heading">Votes per day</h3>
        <span className={b.meta}>New each day · UTC</span>
      </header>
      {snapshot && days.length > 0 ? (
        <>
          <ol className={s.rows}>
            {snapshot.bodies.map((body, index) => {
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
                      const value = values[i];
                      return (
                        <span key={d.day} className={s.slot} data-future={d.future || undefined} data-today={i === today || undefined} title={d.future ? dayLabel(d.day) : `${dayLabel(d.day)}: ${formatCount(value)}`}>
                          {!d.future && value !== null && value > 0 && <i style={{ height: `${Math.max(8, (value / top) * 100).toFixed(1)}%` }} />}
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
            <span>{dayLabel(days[0].day)}</span>
            <span>{dayLabel(days.at(-1)!.day)}</span>
          </div>
          <p className={b.note}>Coinholder votes and panel ballots that arrived each day. ZCAP from counts read by hand.</p>
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
