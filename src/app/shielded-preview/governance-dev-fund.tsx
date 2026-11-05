'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { leavingLink, sourceHref } from '@/lib/shielded-preview/editorial/library';
import { devFundAcceptsProposals, devFundLane, devFundNextSteps, devFundPhase, devFundPublished, devFundSources as sources, devFundTimeline as timeline, type DevFundPublication } from '@/lib/shielded-preview/governance-dev-fund';
import { Arrow, Link, type CollectionNavigate } from './governance-link';
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
      ? <ol className={s.stepper} aria-label="Next dates">{steps.map(step => <li key={step.id} aria-current={current === step.id ? 'step' : undefined}><Stamp step={step}/><span>{step.short}</span></li>)}</ol>
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
        <p className={s.text}>{accepting ? 'Anyone can submit a proposal. Ideally it follows the ZIP 0 format and has its own thread on the Zcash Community Forum.' : 'The published deadline has passed.'}</p>
      </div>
      <div className={s.actions}>
        {accepting && <Cited href={sources.newThread} className={`${s.action} ${s.primary}`}>Start a forum thread</Cited>}
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
  const questionsDue = now !== null && now >= Date.parse(timeline.steps[1].endsAt);
  return <div className={s.lane}>
    <section className={b.card} aria-labelledby="dev-fund-timeline-heading">
      <header className={`${b.header} ${s.centered}`}><h3 id="dev-fund-timeline-heading">Published timeline</h3><Phase now={now}/></header>
      <ol className={`${s.stepper} ${s.detailed}`}>{timeline.steps.map(step => <li key={step.id} aria-current={current === step.id ? 'step' : undefined}>
        <Stamp step={step}/>
        <span>{step.label}</span>
        <p className={s.stepText}>{step.summary}</p>
        {step.id === 'proposals' && <Link section="Proposals" selection={{ lane: devFundLane }} onNavigate={onNavigate} className={s.link}>How to submit<Arrow/></Link>}
      </li>)}</ol>
    </section>

    <div className={s.pair}>
      <div className={s.column}>
      <section className={b.card} aria-labelledby="dev-fund-poll-heading">
        <header className={b.header}><h3 id="dev-fund-poll-heading">Poll questions and answers</h3>{published.questions && <time className={b.meta} dateTime={published.questions.publishedAt}>{date(published.questions.publishedAt)}</time>}</header>
        {published.questions
          ? <><ol className={s.questions}>{published.questions.items.map(item => <li key={item.question}><strong>{item.question}</strong><ul>{item.answers.map(answer => <li key={answer}>{answer}</li>)}</ul></li>)}</ol><Cited href={published.questions.url} className={b.footer}>Published questions</Cited></>
          : <p className={`${s.text} ${s.cardText}`}>{questionsDue ? 'Not recorded here yet. Publication was planned for 9 Nov; check the timeline thread.' : 'Not published yet. Publication is planned for 9 Nov.'}</p>}
      </section>
      <section className={b.card} aria-labelledby="dev-fund-results-heading">
        <header className={b.header}><h3 id="dev-fund-results-heading">Results</h3>{published.results && <time className={b.meta} dateTime={published.results.publishedAt}>{date(published.results.publishedAt)}</time>}</header>
        {published.results
          ? <Cited href={published.results.url} className={b.footer}>Published results</Cited>
          : <p className={`${s.text} ${s.cardText}`}>Not published. The five organizations will publish the results shortly after polls close and assess whether there is rough consensus to move forward with a proposal.</p>}
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
  </div>;
}
