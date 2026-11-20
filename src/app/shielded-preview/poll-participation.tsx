'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { leavingLink } from '@/lib/shielded-preview/editorial/library';
import { bodyMarks, NU7_1_PARTICIPATION as how } from '@/lib/shielded-preview/poll-turnout/participation';
import type { SourceLogo } from '@/lib/shielded-preview/poll-turnout/turnout';
import b from './governance-bento.module.css';
import s from './poll-participation.module.css';

const blockClock = new Intl.DateTimeFormat('en-GB', { timeStyle: 'medium', hourCycle: 'h23', timeZone: 'UTC' });

function MainnetBlock() {
  const [tip, setTip] = useState<{ height: number; time: string } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const response = await fetch('/api/shielded-preview/chain-tip', { signal: controller.signal });
        if (!response.ok) throw new Error('Chain tip unavailable');
        const next = await response.json();
        if (!controller.signal.aborted) { setTip(next); setFailed(false); }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(refresh, 30_000);
      }
    }
    void refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, []);
  return <div className={s.block}>
    <span>{failed && tip ? 'Last known block' : 'Mainnet block'}</span>
    {tip ? <>
      <strong>{tip.height.toLocaleString('en-US')}</strong>
      <time dateTime={tip.time} title={tip.time}>{blockClock.format(new Date(tip.time))} UTC</time>
    </> : <small>{failed ? 'Unavailable' : 'Loading…'}</small>}
  </div>;
}

function Out({ href, children, className = s.link }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a className={className} href={href} {...leavingLink(href)}>
      {children}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M6 18 18 6M6 6h12v12" />
      </svg>
    </a>
  );
}

/** A link to paste somewhere rather than open: the whole of it in a field, and a button that copies it. */
function CopyField({ value, label }: { value: string; label: string }) {
  const field = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<'idle' | 'copied' | 'selected'>('idle');
  useEffect(() => {
    if (state === 'idle') return;
    const timer = window.setTimeout(() => setState('idle'), 2400);
    return () => window.clearTimeout(timer);
  }, [state]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      // No clipboard here (an old browser, a page not in focus): select the link to copy by hand.
      field.current?.select();
      setState('selected');
    }
  };
  return (
    <span className={s.copy} data-state={state}>
      <input ref={field} className={s.copyValue} value={value} readOnly aria-label={label} onFocus={(event) => event.currentTarget.select()} />
      <button type="button" className={s.copyButton} onClick={copy}>
        {state === 'copied' ? 'Copied' : state === 'selected' ? 'Selected' : 'Copy'}
      </button>
      <span className={s.status} role="status">
        {state === 'copied' ? `${label} copied` : state === 'selected' ? `${label} selected` : ''}
      </span>
    </span>
  );
}

function Marks({ logos }: { logos: readonly SourceLogo[] }) {
  return (
    <span className={s.marks} aria-hidden="true">
      {logos.map((logo) => (
        <Image key={logo.src} className={s.mark} data-shape={logo.shape} src={logo.src} alt="" width={26} height={26} />
      ))}
    </span>
  );
}

/** How each group votes in the NU7.1 poll: the coinholders' wallets, the ZCAP email, the panels' Helios ballots. */
export default function PollParticipation() {
  const coinholders = bodyMarks('coinholders');
  const zcap = bodyMarks('zcap');
  const panels = how.panels.map((panel) => ({ ...panel, ...bodyMarks(panel.id) }));
  return (
    <section className={`${b.card} ${s.card}`} id="how-to-take-part" aria-labelledby="take-part-heading" tabIndex={-1}>
      <header className={b.header}>
        <h3 id="take-part-heading">How to participate</h3>
        <span className={b.meta}>Until {how.closes}</span>
      </header>
      <p className={s.guidance}>
        {how.guidance.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
      <ol className={s.groups}>
        <li className={s.group}>
          <div className={s.who}>
            <Marks logos={coinholders.logos} />
            <h4>{coinholders.name}</h4>
            <MainnetBlock/>
          </div>
          <div className={s.walletSetup}>
            <a className={s.link} href="#wallet-tutorials">Watch wallet tutorials</a>
            <div>
              <span>Zkool settings link</span>
              <CopyField value={how.coinholders.zkoolSettings} label="Zkool settings link" />
            </div>
          </div>
          <div className={s.links}>
            {coinholders.logos.map((wallet) => wallet.href && <Out key={wallet.name} href={wallet.href}>{wallet.name}</Out>)}
            <Out href={how.coinholders.zkoolSetup}>Organizers’ post</Out>
          </div>
        </li>
        <li className={s.group}>
          <div className={s.who}>
            <Marks logos={zcap.logos} />
            <h4>{zcap.name} members</h4>
          </div>
          <ul className={s.facts}>
            <li>
              Look for “{how.zcap.subject}” from <span className={s.address}>{how.zcap.sender}</span>, and check spam.
            </li>
            <li>Abstain is allowed, but answer at least one question. A sent ballot is final.</li>
          </ul>
          <div className={s.links}>
            <a className={s.link} href={`mailto:${how.zcap.help}`}>
              Help: <span className={s.address}>{how.zcap.help}</span>
            </a>
            <Out href={how.zcap.post}>Zcash Foundation post</Out>
          </div>
        </li>
        <li className={s.group}>
          <div className={s.who}>
            <Marks logos={panels.flatMap((panel) => panel.logos)} />
            <h4>Community panels</h4>
          </div>
          <ul className={s.facts}>
            <li>Only members on each panel’s list can vote.</li>
            <li>They vote on Helios, with the voter ID and password it emails them.</li>
            <li>The Engineering Caucus ballot closes <time dateTime="2026-11-30T23:59:00Z">30 Nov, 23:59 UTC</time>.</li>
          </ul>
          <div className={s.links}>
            {panels.map((panel) => (
              <Out key={panel.id} href={panel.ballot}>
                {panel.name} ballot
              </Out>
            ))}
          </div>
        </li>
      </ol>
      <p className={b.note}>
        Questions about the process: <Out href={how.questions} className={s.inline}>the organizers’ thread on the Zcash Forum</Out>
      </p>
    </section>
  );
}
