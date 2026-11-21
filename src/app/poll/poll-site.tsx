'use client';

import { useEffect, useState } from 'react';
import { pollDay } from '@/lib/shielded-preview/poll-turnout/view';
import { usePollTurnout } from '@/app/shielded-preview/poll-turnout';
import ThemeToggle from '@/app/governance/theme-toggle';
import { DevFundVoting } from '@/app/shielded-preview/governance-dev-fund';
import { ShieldMark } from '@/app/shielded-preview/shield';
import portal from '@/app/shielded-preview/portal.module.css';
import typography from '@/app/shielded-preview/typography.module.css';
import s from './poll-site.module.css';
import '@/app/governance/governance-theme.css';

// The page stands alone: nothing in it leads to the rest of the portal.
const stay = () => {};
const sectionLinks = [
  { href: '#how-to-take-part', label: 'How to participate', icon: 'm6 11 5-7 7 5-5 7z M5 14H4l-2 6h20l-2-6h-3' },
  { href: '#wallet-tutorials', label: 'Video tutorials', icon: 'M3 5h18v14H3z M10 9l5 3-5 3z' },
  { href: '#poll-turnout-questions', label: 'Coinholder activity by question', icon: 'M4 4v16h17 M8 16v-4 M13 16V7 M18 16v-6' },
  { href: '#poll-turnout', label: 'Panels', icon: 'M3 4h7v7H3z M14 4h7v7h-7z M3 15h7v5H3z M14 15h7v5h-7z' },
  { href: '#miner-sentiment', label: 'Miner sentiment', icon: 'm12 3 8 4.5v9L12 21l-8-4.5v-9z M4 7.5l8 4.5 8-4.5 M12 12v9' },
] as const;
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
            <ShieldMark size={30} />
            <strong className={s.brandName}>Zcash Governance</strong>
          </span>
          <ThemeToggle className={s.theme} />
        </div>
      </header>
      <main className={s.main}>
        <section className={s.hero} aria-labelledby="poll-title">
          <div className={s.intro}>
            <h1 id="poll-title">ZCG / Dev Fund poll</h1>
            <p className={s.lead}>
              Coinholders, ZCAP members and community panels vote on five questions about Zcash grant funding and target block time. Miners can signal on the same questions in the blocks they mine.
            </p>
            <nav className={s.sectionNav} aria-label="Poll sections">
              {sectionLinks.map(({ href, label, icon }) => (
                <a key={href} href={href} className={href === '#wallet-tutorials' ? s.tutorialLink : undefined}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icon} /></svg>
                  <span>{label}</span>
                </a>
              ))}
            </nav>
          </div>
          <Status />
        </section>
        <DevFundVoting onNavigate={stay} />
      </main>
      <footer className={s.foot}>
        <div className={s.footInner}>
          <div className={s.identity}>
            <span className={s.caption}>Maintained by</span>
            <a className={s.labs} href="https://shieldedlabs.net/">
              <ShieldMark size={34} />
              <span><strong>Shielded Labs</strong><span className={s.domain}>shieldedlabs.net <i aria-hidden="true">↗</i></span></span>
            </a>
          </div>
          <div className={s.directory}>
            <div className={s.directoryHead}>
              <a className={s.caption} id="footer-projects" href="https://shieldedlabs.net/projects/">Explore our projects <i aria-hidden="true">↗</i></a>
              <a className={s.githubLink} href="https://github.com/ShieldedLabs" aria-label="Shielded Labs on GitHub">GitHub <i aria-hidden="true">↗</i></a>
            </div>
            <nav className={s.network} aria-labelledby="footer-projects">
              {[
                { name: 'NSM', description: 'Network sustainability', href: 'https://nsm.shieldedlabs.net/' },
                { name: 'Crosslink', description: 'Hybrid consensus', href: 'https://shieldedlabs.net/crosslink/' },
                { name: 'Epoch', description: 'Post-quantum cryptography', href: 'https://shieldedlabs.net/epoch-future-proof-cryptography-for-zcash/' },
              ].map(({ name, description, href }) => (
                <a key={name} href={href}>
                  <span className={s.projectTitle}>{name} <i aria-hidden="true">↗</i></span>
                  <span className={s.projectTopic}>{description}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
