'use client';

import Image from 'next/image';
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
          <h1 id="poll-title">ZCG / Dev Fund poll</h1>
          <p>Coinholders, ZCAP and community panels answer the same five questions, 16 to 30 November 2026. Turnout is read live from public sources; the results come after polls close.</p>
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
