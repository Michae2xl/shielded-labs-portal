'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { CoinholderProtocolGuide } from './coinholder-protocol-guide';
import { leavingLink, sourceHref } from '@/lib/shielded-preview/editorial/library';
import { devFundAcceptsProposals, devFundLane, devFundNextSteps, devFundNotices as notices, devFundPhase, devFundPublished, devFundStepState, devFundSources as sources, devFundTimeline as timeline, type DevFundPublication } from '@/lib/shielded-preview/governance-dev-fund';
import { Arrow, Link, type CollectionNavigate } from './governance-link';
import PollTurnout from './poll-turnout';
import TurnoutByDay from './poll-turnout-days';
import PollParticipation from './poll-participation';
import b from './governance-bento.module.css';
import p from './governance-participation.module.css';
import s from './governance-dev-fund.module.css';

const date = (value: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));

function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const initial = setTimeout(update, 0);
    const timer = setInterval(update, 60_000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, []);
  return now;
}

function OutArrow() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>;
}
/** A citation: it opens in the portal when the portal holds the document, and leaves otherwise. */
function Cited({ href, children, className = s.link }: { href: string; children: ReactNode; className?: string }) {
  const target = sourceHref(href);
  return <a className={className} href={target} {...leavingLink(target)}>{children}{target.startsWith('?') ? <Arrow/> : <OutArrow/>}</a>;
}
function Phase({ now }: { now: number | null }) {
  const phase = devFundPhase(now);
  return <span className={p.phase} data-active={Boolean(phase.id)} data-open={phase.id === 'proposals'}>{phase.label}</span>;
}
function Stamp({ step }: { step: (typeof timeline.steps)[number] }) {
  return <strong className={s.stamp}>{step.dates}{step.time && <small>{step.time}</small>}</strong>;
}

export function DevFundOverviewCard({ onNavigate }: { onNavigate: CollectionNavigate }) {
  const now = useNow();
  const steps = devFundNextSteps(now);
  const current = devFundPhase(now).id;
  return <section className={`${b.card} ${s.overviewCard}`} aria-labelledby="dev-fund-heading">
    <header className={`${b.header} ${s.centered}`}><h2 id="dev-fund-heading">{timeline.title}</h2><Phase now={now}/></header>
    {steps.length > 0
      ? <ol className={s.stepper} aria-label="Timeline">{timeline.steps.map(step => { const state = devFundStepState(step, now); return <li key={step.id} data-state={state} aria-current={current === step.id ? 'step' : undefined}><Stamp step={step}/><span>{step.short}</span>{state === 'awaited' && <em>Awaited</em>}{step.id === 'questions' && state === 'done' && devFundPublished.questions?.draft && current !== 'polling' && <em>Draft out</em>}{state === 'done' && <em className={s.srOnly}>Done</em>}</li>; })}</ol>
      : <p className={s.closed}>Polling was planned to close on 30 Nov at 23:59 UTC.</p>}
    <Link section="Voting" selection={{ lane: devFundLane }} onNavigate={onNavigate} className={`${b.footer} ${s.details}`}>View details<Arrow/></Link>
  </section>;
}

function Published() {
  return <section className={s.published} aria-label="Source of this timeline">
    <p>Published {date(timeline.publishedAt)} by {timeline.organizations}, the five organizations responsible for coordinating the coinholder voting chain.</p>
    <div><Cited href={sources.timeline}>Forum thread</Cited><Cited href={sources.post}>Post on X</Cited></div>
  </section>;
}

export function DevFundProposals({ onNavigate }: { onNavigate: CollectionNavigate }) {
  const now = useNow();
  const [deadline] = timeline.steps;
  const accepting = devFundAcceptsProposals(now);
  return <div className={s.lane}>
    <section className={b.card} aria-labelledby="dev-fund-submit-heading">
      <header className={`${b.header} ${s.centered}`}><h3 id="dev-fund-submit-heading">Submit a proposal</h3><Phase now={now}/></header>
      <div className={s.submit}>
        <dl className={s.deadline}><dt>{deadline.label}</dt><dd>Sunday, 8 Nov 2026<small>{deadline.time}</small></dd></dl>
        <p className={s.text}>{accepting ? 'Anyone can submit a proposal. Ideally it follows the ZIP 0 format and has its own thread on the Zcash Community Forum.' : `The published deadline has passed. ${notices.lateProposals.text}`}</p>
      </div>
      <div className={s.actions}>
        {accepting && <Cited href={sources.newThread} className={`${s.action} ${s.primary}`}>Start a forum thread</Cited>}
        {!accepting && <Cited href={notices.lateProposals.url} className={s.action}>Organizers’ post, 9 Nov</Cited>}
        <Cited href={sources.zip0} className={s.action}>Read ZIP 0</Cited>
        <Cited href={sources.governance} className={s.action}>Browse Governance threads</Cited>
      </div>
    </section>

    <div className={s.trio}>
      <section className={b.card} aria-labelledby="dev-fund-scope-heading">
        <header className={b.header}><h3 id="dev-fund-scope-heading">What the polls cover</h3></header>
        <blockquote className={s.quote} cite={sources.timeline}>“This poll is about what to do with ZCG’s share of the Dev Fund for now.”</blockquote>
      </section>
      <section className={b.card} aria-labelledby="dev-fund-questions-heading">
        <header className={b.header}><h3 id="dev-fund-questions-heading">Questions</h3></header>
        <p className={`${s.text} ${s.cardText}`}>Ask about the timeline or polling in its thread. Discuss each proposal in its own thread.</p>
        <Cited href={sources.timeline} className={b.footer}>Timeline thread</Cited>
      </section>
      <section className={b.card} aria-labelledby="dev-fund-next-heading">
        <header className={b.header}><h3 id="dev-fund-next-heading">After the deadline</h3></header>
        <p className={`${s.text} ${s.cardText}`}>Proposed poll questions on 9 Nov, then discussion and planned polling.</p>
        <Link section="Voting" selection={{ lane: devFundLane }} onNavigate={onNavigate} className={b.footer}>Polling timeline<Arrow/></Link>
      </section>
    </div>
    <Published/>
  </div>;
}

export function DevFundVoting({ onNavigate, published = devFundPublished }: { onNavigate: CollectionNavigate; published?: DevFundPublication }) {
  const now = useNow();
  const current = devFundPhase(now).id;
  return <div className={s.lane}>
    <PollTurnout/>
    <TurnoutByDay/>
    <PollParticipation/>
    <section className={`${b.card} ${s.compact}`} aria-labelledby="dev-fund-timeline-heading">
      <header className={`${b.header} ${s.centered}`}><h3 id="dev-fund-timeline-heading">Published timeline</h3><Phase now={now}/></header>
      {/* Each step shows its date and name; its text opens in a card on hover, focus or tap. */}
      <ol className={`${s.stepper} ${s.peekable}`}>{timeline.steps.map(step => <li key={step.id} data-state={devFundStepState(step, now, published)} aria-current={current === step.id ? 'step' : undefined} tabIndex={0} aria-describedby={`dev-fund-step-${step.id}`}>
        <Stamp step={step}/>
        <span className={s.short}>{step.short}</span>
        <div className={s.peek} id={`dev-fund-step-${step.id}`}>
          <strong>{step.label}</strong>
          <p>{step.summary}</p>
          {step.id === 'proposals' && (devFundAcceptsProposals(now)
            ? <Link section="Proposals" selection={{ lane: devFundLane }} onNavigate={onNavigate} className={s.link}>How to submit<Arrow/></Link>
            : <><p>{notices.lateProposals.text}</p><Cited href={notices.lateProposals.url}>Organizers’ post, 9 Nov</Cited></>)}
          {step.id === 'polling' && <><p>{notices.closing.text}</p><Cited href={notices.closing.url}>Organizers’ post, 16 Nov</Cited></>}
        </div>
      </li>)}</ol>
    </section>

    <div className={s.pair}>
      <div className={s.column}>
      <section className={b.card} aria-labelledby="dev-fund-results-heading">
        <header className={b.header}><h3 id="dev-fund-results-heading">Results</h3>{published.results && <time className={b.meta} dateTime={published.results.publishedAt}>{date(published.results.publishedAt)}</time>}</header>
        {published.results
          ? <Cited href={published.results.url} className={b.footer}>Published results</Cited>
          : <p className={`${s.text} ${s.cardText}`}>The five organizations will publish their assessment of the poll after voting closes, including whether there is rough consensus to move forward with a proposal.</p>}
      </section>
      </div>
      <section className={b.card} aria-labelledby="dev-fund-upgrade-heading">
        <header className={b.header}><h3 id="dev-fund-upgrade-heading">NU 7.1</h3></header>
        <div className={`${s.cardText} ${s.stack}`}>
          <p className={s.text}><strong>Not approved or scheduled.</strong> It depends on rough consensus after polling. If rough consensus emerges, the engineering teams and miners will work together on a network upgrade and agree on a target date.</p>
          <p className={s.text}>Its primary purpose would be to implement the approved ZIP. Major features and transaction format changes are outside its scope. Smaller improvements could be included if the engineering teams determine they can safely ship by the target date.</p>
        </div>
      </section>
    </div>
    <Published/>
    <section className={s.resources} aria-labelledby="poll-resources-heading">
      <div>
        <h3 id="poll-resources-heading">Resources</h3>
        <p>Track the current round and check how coinholder results are counted.</p>
      </div>
      <Cited href="https://zakura.com/voting/#vote-290ce255ee4c">Zakura vote tracker</Cited>
      <CoinholderProtocolGuide />
    </section>
  </div>;
}
