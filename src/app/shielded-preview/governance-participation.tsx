'use client';

import type { Source } from '@/lib/shielded-preview/governance-types';
import { valueInUsd, type Treasury, type TreasuryBalance, type TreasuryPrice } from '@/lib/shielded-preview/treasury';
import { leavingLink, sourceHref } from '@/lib/shielded-preview/editorial/library';
import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { participationGuideHref, participationHref, participationPhase, participationRound, participationSources as sources } from '@/lib/shielded-preview/governance-participation';
import { coinholderProposalsHref } from '@/lib/shielded-preview/coinholder-proposals';
import GovernanceGlyph from './governance-glyph';
import s from './governance-participation.module.css';
import b from './governance-bento.module.css';

function Arrow({ external = false }: { external?: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{external ? <path d="M6 18 18 6M6 6h12v12"/> : <path d="M4 12h16m-6-6 6 6-6 6"/>}</svg>;
}

function External({ href, children, footer = false }: { href: string; children: ReactNode; footer?: boolean }) {
  const target = sourceHref(href);
  return <a className={footer ? b.footer : s.inlineLink} href={target} {...leavingLink(target)}>{children}<Arrow external={!target.startsWith('?')}/></a>;
}

function GuideLink({ anchor, children, footer = false }: { anchor?: Parameters<typeof participationGuideHref>[0]; children: ReactNode; footer?: boolean }) {
  return <a className={footer ? b.footer : s.inlineLink} href={participationGuideHref(anchor)}>{children}<Arrow/></a>;
}

function WalletLink({ wallet, name }: { wallet: 'zodl' | 'zkool' | 'vizor'; name: string }) {
  return <a className={s.walletLink} href={sources[wallet]} target="_blank" rel="noopener noreferrer">
    <Image className={s.walletLogo} src={`/wallet-logos/${wallet}.png`} alt="" width={28} height={28}/>
    <span>{name}<Arrow external/></span>
  </a>;
}

export function CurrentParticipationRound({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const initial = setTimeout(update, 0);
    const timer = setInterval(update, 60_000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, []);
  const phase = participationPhase(now);

  if (compact) return <aside className={s.roundAccess} aria-label="Coinholder round and participation">
    <div><strong>{participationRound.label}</strong><span>{phase.label}</span></div>
    <a className={s.action} href={participationHref}>How to participate<Arrow/></a>
  </aside>;

  return <section className={`${b.card} ${s.round}`} aria-labelledby="participation-round-heading">
    <header className={`${b.header} ${s.roundHeader}`}>
      <div className={s.roundTitle}>
        <h3 id="participation-round-heading">Coinholder grants</h3>
        <span className={s.phase} data-active={Boolean(phase.id)} data-open={phase.id === 'submissions'}>{phase.label}</span>
      </div>
      <span className={s.roundLabel}>{participationRound.label}</span>
    </header>
    <div className={s.schedule}>
      <ol className={s.calendar} aria-label={`${participationRound.label} published schedule`}>
        {participationRound.phases.map(item => <li key={item.id} aria-current={phase.id === item.id ? 'step' : undefined}>
          <span>{item.label}</span><strong aria-label={item.dates}>{item.dates.split(' – ').map((date, part) => <span key={date}>{part > 0 && ' – '}{date}</span>)}</strong>
        </li>)}
      </ol>
    </div>
    <div className={s.calendarSource}><span>Deadlines at 20:00 UTC</span><External href={sources.calendar}>FPF calendar</External></div>
    <a href={coinholderProposalsHref} className={`${b.footer} ${s.roundAction}`}>View proposals<Arrow/></a>
  </section>;
}

export default function GovernanceParticipation() {
  return <section className={s.guide} id="governance-participation" aria-labelledby="participation-heading">
    <header className={s.guideHeader}><h2 id="participation-heading" tabIndex={-1}>How to participate</h2><GuideLink>Program guide</GuideLink></header>

    <div className={s.paths}>
      <CurrentParticipationRound/>
      <article className={b.card}>
        <header className={`${b.header} ${s.pathHeader}`}><GovernanceGlyph kind="proposals" size={21}/><h3>Submit completed work</h3></header>
        <div className={s.pathBody}>
          <p>Submit on GitHub, mirror on the forum and link both.</p>
          <GuideLink anchor="program-apply">Application guide</GuideLink>
        </div>
        <External href={sources.application} footer>Apply on GitHub</External>
      </article>
      <article className={b.card}>
        <header className={`${b.header} ${s.pathHeader}`}><GovernanceGlyph kind="voting" size={21}/><h3>Vote with ZEC</h3></header>
        <div className={s.pathBody}>
          <p>Q4 voting instructions will be published before polling opens.</p>
          <div className={s.wallets}><div><WalletLink wallet="zodl" name="ZODL"/><WalletLink wallet="zkool" name="Zkool"/><WalletLink wallet="vizor" name="Vizor"/></div></div>
        </div>
        <GuideLink anchor="program-voting" footer>Wallet guide</GuideLink>
      </article>
      <article className={b.card}>
        <header className={`${b.header} ${s.pathHeader}`}><GovernanceGlyph kind="zcap" size={21}/><h3>Join ZCAP</h3></header>
        <div className={s.pathBody}>
          <p>Give advisory input and elect the ZCG committee.</p>
          <External href={sources.zcap}>Eligibility & apply</External>
        </div>
        <a className={b.footer} href="?view=governance&section=zcap&lane=members">Explore the panel<Arrow/></a>
      </article>
      <article className={b.card}>
        <header className={`${b.header} ${s.pathHeader}`}><GovernanceGlyph kind="network" size={21}/><h3>Join the discussion</h3></header>
        <div className={s.pathBody}>
          <p>Review proposals and share feedback with the community.</p>
          <div className={s.resources}><External href={sources.zechub}>ZecHub</External><GuideLink anchor="program-community">Communities</GuideLink></div>
        </div>
        <External href={sources.forum} footer>Forum</External>
      </article>
    </div>
  </section>;
}

const zecHeld = (value: number) => `${Math.round(value).toLocaleString('en-US')} ZEC`;
const usdShort = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value);
const usdExact = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const sheetDay = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
const quoteTime = (value: string) => `${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' }).format(new Date(value))} UTC`;

/** One side of the Dev Fund: what it holds, what it paid out and, with a price, what that is worth now. */
function Holding({ label, balance, price, fund = false }: { label: string; balance: TreasuryBalance; price: TreasuryPrice | null; fund?: boolean }) {
  return <div className={fund ? b.holdingFund : undefined}>
    <dt>{label}</dt>
    <dd><strong>{zecHeld(balance.zec)}</strong>{balance.usdCash ? <>{' '}<span className={b.cash}>{`+ ${usdShort(balance.usdCash)}`}</span></> : null}</dd>
    {balance.paidOutZec ? <dd className={b.paid}>{`${zecHeld(balance.paidOutZec)} paid out`}</dd> : null}
    {price && <dd className={b.value}><span>{price.source === 'CoinGecko' ? 'Current value' : 'Value'}</span><strong>{`≈ ${usdShort(valueInUsd(balance, price))}`}</strong></dd>}
  </div>;
}

/** Protocol decisions and the Dev Fund split; with the ZCG treasury sheet loaded, each share also shows what it holds and is worth. */
export function GovernanceReference({ treasury }: { treasury?: Source<Treasury | null> }) {
  const held = treasury?.data ?? null;
  const price = held?.price ?? null;
  return <>
    <section id="governance-roles" className={`${b.card} ${b.protocol}`} aria-labelledby="governance-protocol-heading">
      <header className={b.header}><h3 id="governance-protocol-heading">Protocol decisions</h3></header>
      <div className={b.protocolFlow}><span>Public ZIPs</span><Arrow/><span>Network adoption</span></div>
      <p className={b.note}>Polls advise; they do not activate upgrades.</p>
      <a className={b.footer} href={participationGuideHref('program-governance')}>How it works<Arrow/></a>
    </section>
    <section className={`${b.card} ${b.funding}`} aria-labelledby="governance-allocation-heading">
      <header className={b.header}><h3 id="governance-allocation-heading">Ecosystem funding</h3><span className={b.meta}>20% of block rewards</span></header>
      <div className={b.split} role="img" aria-label="Dev Fund split: 8% of block rewards to ZCG and 12% to the coinholder fund">
        <span className={b.splitZcg}><span>ZCG</span><strong>8%</strong></span>
        <span className={b.splitFund}><span>Coinholder fund</span><strong>12%</strong></span>
      </div>
      {held && <dl className={b.holdings}>
        <Holding label="ZCG holds" balance={held.zcg} price={price}/>
        <Holding label="Coinholder fund holds" balance={held.coinholder} price={price} fund/>
      </dl>}
      <p className={b.note}>{held
        ? <>Holdings from the <a href={held.zcg.source} target="_blank" rel="noopener noreferrer" title={`Blocks ${held.zcg.height.toLocaleString('en-US')} and ${held.coinholder.height.toLocaleString('en-US')}`}>ZCG treasury sheet</a>{`, ${sheetDay(held.zcg.blockTime)}.`}
          {price?.source === 'CoinGecko' && <>{` Valued at ${usdExact(price.usd)} per ZEC (`}<a href={price.url} target="_blank" rel="noopener noreferrer">CoinGecko</a>{`, ${quoteTime(price.observedAt)}).`}</>}
          {price?.source === 'sheet' && ` Valued at ${usdExact(price.usd)} per ZEC, the price the sheet recorded.`}</>
        : 'Share of block rewards.'}</p>
      <External href={sources.funding} footer>ZIP 1016</External>
    </section>
  </>;
}
