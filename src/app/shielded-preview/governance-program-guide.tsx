'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { participationGuideSections, participationRound, participationSources as sources } from '@/lib/shielded-preview/governance-participation';
import { coinholderProposalsHref } from '@/lib/shielded-preview/coinholder-proposals';
import GovernanceGlyph from './governance-glyph';
import s from './governance-program-guide.module.css';

function Arrow({ external = false }: { external?: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={external ? 'M6 18 18 6M6 6h12v12' : 'M4 12h16m-6-6 6 6-6 6'}/></svg>;
}
function External({ href, children, primary = false }: { href: string; children: ReactNode; primary?: boolean }) {
  return <a className={primary ? s.primary : s.link} href={href} target="_blank" rel="noopener noreferrer">{children}<Arrow external/></a>;
}

export default function GovernanceProgramGuide({ onBack }: { onBack: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    let frame = 0;
    const followAnchor = () => {
      const anchor = location.hash.slice(1);
      if (!participationGuideSections.some(section => section.id === anchor) && anchor !== 'program-sources') {
        heading.current?.focus({ preventScroll: true });
        return;
      }
      frame = requestAnimationFrame(() => {
        const section = document.getElementById(anchor);
        if (section instanceof HTMLDetailsElement) section.open = true;
        section?.scrollIntoView({ block: 'start' });
        section?.focus({ preventScroll: true });
      });
    };
    followAnchor();
    window.addEventListener('hashchange', followAnchor);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('hashchange', followAnchor); };
  }, []);

  return <article className={s.guide} aria-labelledby="program-guide-title">
    <div className={s.topline}><button onClick={onBack}><span className={s.back}><Arrow/></span>Governance overview</button><span>Coinholder grants</span></div>
    <header className={s.intro}><h1 ref={heading} tabIndex={-1} id="program-guide-title">Program guide</h1><p>Get funding for completed Zcash work. Help choose what gets funded.</p></header>

    <section className={s.calendar} aria-label={participationRound.label + ' calendar'}>
      <div className={s.calendarLabel}><strong>{participationRound.label}</strong><span>20:00 UTC deadlines</span></div>
      <dl>{participationRound.phases.map(phase => <div key={phase.id}><dt>{phase.label}</dt><dd>{phase.dates}</dd></div>)}</dl>
      <External href={sources.calendar}>FPF calendar</External>
    </section>

    <div className={s.paths}>
      <section className={s.path} id="program-apply" tabIndex={-1} aria-labelledby="apply-title">
        <header><span className={s.icon}><GovernanceGlyph kind="proposals" size={23}/></span><div><h2 id="apply-title">Apply for a grant</h2><p>For work you have already finished.</p></div></header>
        <ol className={s.steps}>
          <li><h3>Show your work</h3><p>Link to what you built and explain who it helps.</p></li>
          <li><h3>Send an application</h3><p>Name your team, request an amount in USD and explain the budget.</p></li>
          <li><h3>Share it for review</h3><p>Post your GitHub application on the Zcash Forum. Link the discussion back.</p></li>
        </ol>
        <div className={s.actions}><External href={sources.application} primary>Apply on GitHub</External><External href={sources.forum}>Zcash Forum</External></div>
        <details className={s.extra}><summary>What to prepare</summary><ul><li>Evidence of completed work.</li><li>Your team and budget in USD.</li><li>Previous funding and conflicts of interest.</li></ul><External href={sources.applicationGuide}>FPF application requirements</External></details>
      </section>

      <section className={s.path} id="program-voting" tabIndex={-1} aria-labelledby="vote-title">
        <header><span className={s.icon}><GovernanceGlyph kind="voting" size={23}/></span><div><h2 id="vote-title">Vote with ZEC</h2><p>ZEC is Zcash’s coin. Holders help decide.</p></div></header>
        <ol className={s.steps}>
          <li><h3>Read the proposals</h3><p>Check the work delivered and the funding requested.</p></li>
          <li><h3>Check the voting rules</h3><p>Q4 wallet and eligibility instructions are still pending.</p></li>
          <li><h3>Vote during the round</h3><p>Follow those instructions during 17–29 December.</p></li>
        </ol>
        <div className={s.actions}><a className={s.primary} href={coinholderProposalsHref}>View proposals<Arrow/></a></div>
        <details className={s.extra}><summary>Wallets used in Q3</summary><p>Q4 support has not been confirmed here.</p><div className={s.wallets}><External href={sources.zodl}>ZODL</External><External href={sources.zkool}>Zkool · GitHub</External><External href={sources.vizor}>Vizor</External></div></details>
      </section>
    </div>

    <section className={s.community} id="program-community" tabIndex={-1} aria-label="Join the community">
      <div><h2>Join the discussion</h2><p>Anyone can review proposals and share feedback.</p><div className={s.inlineLinks}><External href={sources.forum}>Zcash Forum</External><External href={sources.zechub}>ZecHub</External></div></div>
      <div><h2>Join ZCAP</h2><p>The Zcash Community Advisory Panel gives input to the Zcash Foundation.</p><External href={sources.zcap}>Eligibility · Zcash Foundation</External></div>
    </section>

    <div className={s.references}>
      <details className={s.reference} id="program-governance" tabIndex={-1}><summary>How funding and governance work</summary><div><p>Coinholders vote on grants for completed work. A funding decision and its payment are separate records.</p><p>Protocol polls gather opinions. Network upgrades take effect when the network adopts the software.</p><p>Block rewards: <strong>8% to ZCG</strong> · <strong>12% to the coinholder fund</strong>.</p><External href={sources.funding}>Read ZIP 1016</External></div></details>
      <details className={s.reference} id="program-sources" tabIndex={-1}><summary>Sources & program rules</summary><div className={s.inlineLinks}><External href={sources.shieldedLabs}>Shielded Labs · Governance</External><External href={sources.applicationGuide}>FPF · Application requirements</External><External href={sources.calendar}>FPF · Q4 calendar</External></div></details>
    </div>
  </article>;
}
