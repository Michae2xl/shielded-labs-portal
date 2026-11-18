'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { pollDay } from '@/lib/shielded-preview/poll-turnout/view';
import { usePollTurnout } from '@/app/shielded-preview/poll-turnout';
import ThemeToggle from '@/app/governance/theme-toggle';
import ContextNotice from '@/app/shielded-preview/context-notice';
import { DevFundVoting } from '@/app/shielded-preview/governance-dev-fund';
import { ShieldMark } from '@/app/shielded-preview/shield';
import portal from '@/app/shielded-preview/portal.module.css';
import typography from '@/app/shielded-preview/typography.module.css';
import s from './poll-site.module.css';
import '@/app/governance/governance-theme.css';

// The page stands alone: nothing in it leads to the rest of the portal.
const stay = () => {};
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const CLOSE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' });

function useNow() {
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
  return now;
}

/** Where the poll stands: open or closed, the time left, and how far through its days it is. */
function Status() {
  const { snapshot } = usePollTurnout();
  const now = useNow();
  if (!snapshot || now === null) return <aside className={s.status} aria-label="Poll status" />;
  const closes = Date.parse(snapshot.closesAt);
  const open = snapshot.phase === 'open';
  const left = Math.max(0, closes - now);
  const { day, days } = pollDay(snapshot, now);
  const progress = Math.min(1, Math.max(0, (now - Date.parse(snapshot.opensAt)) / (closes - Date.parse(snapshot.opensAt))));
  return (
    <aside className={s.status} aria-label="Poll status" data-open={open || undefined}>
      <p className={s.state}>
        <span className={s.dot} aria-hidden="true" />
        {open ? 'Polling open' : snapshot.phase === 'upcoming' ? 'Polling not open yet' : 'Polls closed'}
      </p>
      {open ? (
        <>
          <p className={s.left}>
            <strong>{Math.floor(left / DAY)}</strong>
            <span>d</span>
            <strong>{Math.floor((left % DAY) / HOUR)}</strong>
            <span>h left</span>
          </p>
          <p className={s.closes}>Closes {CLOSE.format(closes)} UTC</p>
          <div className={s.progress} role="progressbar" aria-label="Poll days" aria-valuemin={1} aria-valuemax={days} aria-valuenow={day} aria-valuetext={`Day ${day} of ${days}`}>
            <span style={{ width: `${(progress * 100).toFixed(1)}%` }} />
          </div>
          <p className={s.day}>
            Day {day} of {days}
          </p>
        </>
      ) : (
        <p className={s.closes}>{snapshot.phase === 'upcoming' ? 'Opens 16 Nov 2026' : `Closed ${CLOSE.format(closes)} UTC. Results come from the organizers.`}</p>
      )}
    </aside>
  );
}

/** The poll page as a site of its own: the governance mark, the poll, and who maintains it. */
export default function PollSite() {
  return (
    <div className={`${portal.portal} ${typography.readable} ${s.site}`}>
      <header className={s.bar}>
        <div className={s.barInner}>
          <span className={s.brand}>
            <Image src="/logos/zcash.svg" width={30} height={30} alt="" />
            <span className={s.brandName}>
              <small>Zcash</small>
              <strong>Governance</strong>
            </span>
          </span>
          <ThemeToggle className={s.theme} />
        </div>
      </header>
      <main className={s.main}>
        <section className={s.hero} aria-labelledby="poll-title">
          <div className={s.intro}>
            <h1 id="poll-title">ZCG / Dev Fund poll</h1>
            <p className={s.lead}>
              Five questions on ZCG and the Dev Fund, answered by coinholders, ZCAP and community panels.
            </p>
            <ul className={s.facts}>
              <li>16 Nov to 1 Dec 2026</li>
              <li>Results after polls close</li>
              <li>Turnout live from public sources</li>
            </ul>
            <nav className={s.sectionNav} aria-label="Poll sections">
              <a href="#poll-turnout">Live turnout</a>
              <a href="#panel-ballots">Panel ballots</a>
              <a href="#how-to-take-part">How to take part</a>
              <a className={s.tutorialLink} href="#wallet-tutorials">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.5v11L13 8z" /></svg>
                Voting tutorials
              </a>
            </nav>
          </div>
          <Status />
        </section>
        <DevFundVoting onNavigate={stay} />
        <ContextNotice className={s.notice}>Polls inform decisions. ZIP status, node releases and network activation remain separate milestones.</ContextNotice>
      </main>
      <footer className={s.foot}>
        <a className={s.labs} href="https://shieldedlabs.net" target="_blank" rel="noopener noreferrer">
          <ShieldMark size={18} />
          <span>
            Maintained by <strong>Shielded Labs</strong>
          </span>
        </a>
        <span>Neutral governance information. Every count links its source.</span>
      </footer>
    </div>
  );
}
