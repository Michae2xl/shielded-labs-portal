'use client';

import { useRef, useState, type Dispatch, type ReactNode, type Ref, type SetStateAction } from 'react';
import type { Project } from '@/lib/shielded-preview/content';
import { FORUM, GUIDE_SOURCE, ISSUES, REPOSITORY, RELEASES, operateSteps, participationPaths, pathNotes, referencedIssues, relatedPages, rewardDetails, steps, type GuidePath } from '@/lib/shielded-preview/crosslink-guide/guide';
import { history, paidRounds, releaseNotes, releaseTag, reportedPaid, sourcesChecked } from '@/lib/shielded-preview/crosslink-guide/history';
import { categories, communityTools, type ToolCategory } from '@/lib/shielded-preview/crosslink-guide/tools';
import { editorialCatalog, editorialHref, opensInPortal } from '@/lib/shielded-preview/editorial/library';
import { projectHref } from '@/lib/shielded-preview/project-navigation';
import { EditorialLink } from './editorial';
import SectionMenu from './section-menu';
import { ShieldMark } from './shield';
import s from './crosslink-participate.module.css';

type Follow = (href: string) => void;
const toolPaths: Record<string, string> = {
  network: 'M12 8v8M8 6H5v12h3m8-12h3v12h-3M9 3h6v5H9zM9 16h6v5H9z',
  search: 'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  terminal: 'm5 7 5 5-5 5m8 0h6M3 3h18v18H3z',
  database: 'M20 6c0 2-4 3-8 3S4 8 4 6s4-3 8-3 8 1 8 3ZM4 6v12c0 2 4 3 8 3s8-1 8-3V6M4 12c0 2 4 3 8 3s8-1 8-3',
  wallet: 'M3 6h16v4H3V6Zm0 4v10h18V10H3Zm12 3h6v4h-6v-4Z',
  book: 'M12 5v16M12 5C8 2 4 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-2-1-6-2-10 1Z',
  check: 'm5 12 4 4L19 6',
};
function Glyph({ name }: { name: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={toolPaths[name] ?? toolPaths.network}/></svg>;
}
function Arrow({ external = false }: { external?: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d={external ? 'M6 18 18 6M6 6h12v12' : 'M4 12h16m-6-6 6 6-6 6'}/></svg>;
}
/** A reference with a page in the portal opens it; anything else leaves in a new tab. */
function Source({ href, onFollow, children, className = s.source }: { href: string; onFollow: Follow; children: ReactNode; className?: string }) {
  return <EditorialLink href={href} onFollow={onFollow} className={className}><span>{children}</span><Arrow external={!opensInPortal(href)}/></EditorialLink>;
}
function Logo({ src }: { src: string }) {
  // Local copies of organization logos; no third-party image requests.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt=""/>;
}

function Checklist({ done, setDone, open, setOpen, onFollow }: { done: number[]; setDone: Dispatch<SetStateAction<number[]>>; open: number | null; setOpen: Dispatch<SetStateAction<number | null>>; onFollow: Follow }) {
  const next = steps.findIndex((_, index) => !done.includes(index));
  return <>
    <h3 className={s.srOnly}>Testing checklist</h3>
    <progress className={s.progress} max={steps.length} value={done.length} aria-label="Checklist progress"/>
    <ol className={s.steps}>{steps.map((step, index) => {
      const complete = done.includes(index);
      return <li key={step.title} data-done={complete || undefined} data-next={index === next || undefined} data-open={open === index || undefined}>
        <div className={s.stepHeader}>
          <label className={s.check}>
            <input type="checkbox" checked={complete} onChange={() => setDone(current => current.includes(index) ? current.filter(item => item !== index) : [...current, index])} aria-label={`Complete step ${index + 1}: ${step.title}`}/>
            <span aria-hidden="true">{complete ? <Glyph name="check"/> : String(index + 1).padStart(2, '0')}</span>
          </label>
          <button type="button" aria-expanded={open === index} aria-controls={`crosslink-step-${index}`} onClick={() => setOpen(current => current === index ? null : index)}>{step.title}<span className={s.toggle} aria-hidden="true"/></button>
        </div>
        <div id={`crosslink-step-${index}`} hidden={open !== index} className={s.stepBody}>
          <p>{step.body.map((part, key) => typeof part === 'string' ? part : <strong key={key}>{part.bold}</strong>)}</p>
          <p className={s.verify}><Glyph name="check"/><span>{step.check}</span></p>
          <Source href={step.href} onFollow={onFollow}>Source instructions</Source>
        </div>
      </li>;
    })}</ol>
    <div className={s.progressFoot}><span>{done.length === steps.length ? 'Cycle complete.' : 'Progress saved for this visit.'}</span>{done.length > 0 && <button type="button" onClick={() => setDone([])}>Reset</button>}</div>
  </>;
}

export default function CrosslinkParticipate({ project, view, headingRef, onFollow }: { project: Project; view: string | null; headingRef: Ref<HTMLHeadingElement>; onFollow: Follow }) {
  const [path, setPath] = useState<GuidePath>('test');
  // Kept here so progress survives moving between the guide's tabs during a visit.
  const [done, setDone] = useState<number[]>([]);
  const [open, setOpen] = useState<number | null>(0);
  const [category, setCategory] = useState<ToolCategory>('All');
  const [communityView, setCommunityView] = useState<'tools' | 'issues'>('tools');
  const content = useRef<HTMLDivElement>(null);
  const active = view === 'tools' || view === 'incentives' ? view : 'guide';
  const show = (next: string) => onFollow(projectHref(project, 'participate', next === 'guide' ? undefined : next));
  const visibleTools = communityTools.filter(tool => category === 'All' || tool.category === category);
  const notes = pathNotes[path];
  const related = relatedPages.flatMap(id => editorialCatalog.filter(entry => entry.id === id));
  const delegator = communityTools.find(tool => tool.name === 'Zingo Delegator')!;

  return <div className={s.participate}>
    <section className={s.hero} aria-labelledby="project-panel-heading">
      <div className={s.heroCopy}>
        <Source href="https://shieldedlabs.net/" onFollow={onFollow} className={s.brand}>Shielded Labs</Source>
        <h2 id="project-panel-heading" ref={headingRef} tabIndex={-1}>Help shape the next layer of Zcash.</h2>
        <p>A practical testing guide, community tools and incentive updates for the Crosslink feature net.</p>
        <div className={s.heroActions}>
          <Source href={releaseNotes} onFollow={onFollow} className={s.primary}>Download {releaseTag}</Source>
          <button type="button" className={s.secondary} onClick={() => { setPath('test'); show('guide'); content.current?.scrollIntoView({ behavior: 'instant', block: 'start' }); }}>Start testing<Arrow/></button>
          <Source href={`${FORUM}/39`} onFollow={onFollow} className={s.secondary}>Program rules</Source>
        </div>
      </div>
      <div className={s.art} aria-hidden="true">
        <span className={s.ringOuter}/><span className={s.ringInner}/><span className={s.shield}><ShieldMark size={42}/></span>
        <span className={s.layerWork}>Proof of work</span><span className={s.layerStake}>Proof of stake</span>
        <span className={s.caption}>One network. Two layers.</span>
      </div>
    </section>

    <div ref={content} className={s.content}>
      <SectionMenu label="Crosslink test guide" value={active} onChange={show} items={[{ id: 'guide', label: 'Guide' }, { id: 'tools', label: 'Community tools', count: communityTools.length }, { id: 'incentives', label: 'Incentives' }]}/>

      {active === 'guide' && <>
        <p className={s.note}>Guide curated by OpenZcash · Instructions linked below.</p>
        <SectionMenu secondary label="Choose how to contribute" value={path} onChange={next => setPath(next as GuidePath)} items={participationPaths}/>
        <div className={s.guideGrid}>
          <section className={s.card}>
            {path === 'test' && <Checklist done={done} setDone={setDone} open={open} setOpen={setOpen} onFollow={onFollow}/>}
            {path === 'build' && <>
              <h3>Development resources</h3>
              <p>Official repository and issue tracker, alongside tools shared by the community.</p>
              <div className={s.resourceRows}>
                <div><h4>Shielded Labs repository</h4><Source href={REPOSITORY} onFollow={onFollow}>Source code</Source></div>
                <div><h4>Selected public issues</h4><button type="button" className={s.source} onClick={() => { setCommunityView('issues'); show('tools'); }}><span>Issues & discussions</span><Arrow/></button></div>
                <div><h4>Community projects</h4><button type="button" className={s.source} onClick={() => { setCommunityView('tools'); show('tools'); }}><span>Browse tools</span><Arrow/></button></div>
                <div><h4>Repository activity</h4><Source href={projectHref(project, 'development')} onFollow={onFollow}>Development</Source></div>
              </div>
            </>}
            {path === 'operate' && <>
              <h3>Prepare your finalizer.</h3>
              <p>Use the release instructions for your network. Keep your node online and verify its participation.</p>
              <ol className={s.operate}>{operateSteps.map((step, index) => <li key={step.title}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><h4>{step.title}</h4><p>{step.text}</p><Source href={step.href} onFollow={onFollow}>{step.link}</Source></div></li>)}</ol>
              <p className={s.note}>OpenZcash summary of the linked {releaseTag} instructions. Follow the documentation for the release you run.</p>
            </>}
          </section>
          <aside className={s.aside}>
            <section className={s.card}>
              <h3>{notes.heading}</h3>
              <p className={s.detail}>{notes.detail}</p>
              <ol className={s.rules}>{notes.rules.map(([title, text], index) => <li key={title}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><h4>{title}</h4><p>{text}</p></div></li>)}</ol>
            </section>
            {path === 'test' && <div className={s.options}>
              <details>
                <summary>Running a finalizer?</summary>
                <div><p>The {releaseTag} instructions describe copying your desktop finalizer identity and staking to it during a Staking Day. A finalizer must be online to participate.</p><Source href={releaseNotes} onFollow={onFollow}>{releaseTag} finalizer instructions</Source></div>
              </details>
              <details>
                <summary>Using a phone?</summary>
                <div><p>Zingo Delegator has a mobile guide. Its linked build is from Season 1; confirm Round 3 compatibility with the team.</p><Source href={delegator.href} onFollow={onFollow}>Mobile guide</Source></div>
              </details>
            </div>}
            <button type="button" className={s.explore} onClick={() => { setCategory('All'); setCommunityView('tools'); show('tools'); }}><span>Explore community tools</span><Arrow/></button>
            <section className={s.card}>
              <h3>Also in this portal</h3>
              <ul className={s.related}>{related.map(entry => <li key={entry.id}><EditorialLink href={editorialHref(entry)} onFollow={onFollow}><span>{entry.title}</span><Arrow/></EditorialLink></li>)}</ul>
            </section>
          </aside>
        </div>
      </>}

      {active === 'tools' && <>
        <div className={s.heading}><h3>Community tools</h3><Source href={FORUM} onFollow={onFollow}>Join the conversation</Source></div>
        <SectionMenu secondary label="Community resources" value={communityView} onChange={next => setCommunityView(next as 'tools' | 'issues')} items={[{ id: 'tools', label: 'Tools', count: communityTools.length }, { id: 'issues', label: 'Issues & discussions', count: referencedIssues.length }]}/>
        {communityView === 'tools' ? <>
          <div className={s.filters} role="group" aria-label="Filter community tools">{categories.map(item => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
          <p className={s.note} aria-live="polite">{visibleTools.length} resources · Confirm network compatibility in the project’s notes.</p>
          <div className={s.toolGrid}>{visibleTools.map(tool => <article className={s.tool} key={tool.name}>
            <div className={s.toolTop}>
              <span className={s.toolLogo}>{tool.logo ? <Logo src={tool.logo}/> : <Glyph name={tool.symbol}/>}</span>
              <div><h4><Source href={tool.href} onFollow={onFollow} className={s.toolName}>{tool.name}</Source></h4><span className={s.author}>{tool.author}</span></div>
            </div>
            <p>{tool.description}</p>
            <details><summary>Notes & source</summary><span className={s.type}>{tool.category}</span><p>{tool.note}</p><Source href={tool.source} onFollow={onFollow}>Original contribution</Source></details>
          </article>)}</div>
          <p className={s.note}>Public resources located in the forum and linked projects. Listing does not imply current-network support or endorsement.</p>
        </> : <>
          <p className={s.note}>Selected by OpenZcash · Original GitHub titles. Check the source for current status.</p>
          <div className={s.issues}>{referencedIssues.map(issue => <article key={issue.id} className={s.issue}><span>#{issue.id}</span><h4><Source href={`${ISSUES}/${issue.id}`} onFollow={onFollow} className={s.toolName}>{issue.title}</Source></h4></article>)}</div>
          <div className={s.issuesFoot}><p className={s.note}>Curated references · No assignment or funding implied.</p><Source href={ISSUES} onFollow={onFollow}>All issues</Source><Source href={FORUM} onFollow={onFollow}>Forum discussion</Source></div>
        </>}
      </>}

      {active === 'incentives' && <>
        <section className={s.card} aria-labelledby="crosslink-pool">
          <h3 id="crosslink-pool">Incentive pool</h3>
          <div className={s.pool}><p className={s.poolTotal}><strong>{reportedPaid}</strong><span>/ 500 ZEC</span><small>reported paid</small></p><strong className={s.poolShare}>{reportedPaid / 500 * 100}<small>%</small></strong></div>
          <div className={s.track} role="progressbar" aria-label="Reported payments from the program allocation" aria-valuemin={0} aria-valuemax={500} aria-valuenow={reportedPaid} aria-valuetext={`${reportedPaid} of 500 ZEC reported paid`}>{paidRounds.map(round => <span key={round.round} style={{ width: `${round.total / 500 * 100}%` }}/>)}</div>
          <div className={s.legend}><span data-kind="earned">Mining & staking</span><span data-kind="discretionary">Discretionary</span></div>
          <ol className={s.rounds}>{paidRounds.map(round => <li key={round.round}>
            <div className={s.roundHead}><div><h4>Round {round.round}</h4><span>Reported {round.reported}</span></div><strong>{round.total} ZEC<span><Glyph name="check"/>Paid</span></strong></div>
            <div className={s.split}>
              <span data-kind="earned" style={{ flexGrow: round.earned }} title={`Mining & staking: ${round.earned} ZEC`}><span className={s.srOnly}>Mining & staking: </span>{round.earned}<span className={s.srOnly}> ZEC</span></span>
              <span data-kind="discretionary" style={{ flexGrow: round.discretionary }} title={`Discretionary: ${round.discretionary} ZEC`}><span className={s.srOnly}>Discretionary: </span>{round.discretionary}<span className={s.srOnly}> ZEC</span></span>
            </div>
            <details><summary>Details & sources</summary><p>{round.recipients} mining and staking recipients. {round.note}</p><p>Claims closed {round.claim}.</p><div className={s.links}><Source href={round.source} onFollow={onFollow}>Payout report</Source><Source href={round.claimSource} onFollow={onFollow}>Claim announcement</Source></div></details>
          </li>)}</ol>
        </section>
        <div className={s.roundStatus}><span><strong>Round 3</strong> · Running on the {releaseTag} network; reward amount and claim dates pending.</span><Source href={`${FORUM}/101`} onFollow={onFollow}>Follow the round</Source></div>
        <div className={s.rewards}>{rewardDetails.map(item => <section className={s.card} key={item.title}><h4>{item.title}</h4><p>{item.text}</p><Source href={item.href} onFollow={onFollow}>{item.link}</Source></section>)}</div>
        <section className={s.card} aria-labelledby="crosslink-timeline">
          <div className={s.heading}><h3 id="crosslink-timeline">Timeline</h3><Source href={FORUM} onFollow={onFollow}>Forum</Source></div>
          <ol className={s.timeline}>{history.map(event => <li key={event.title} data-kind={event.kind}><time>{event.date}</time><details><summary><span>{event.title}</span><small>{event.kind}</small></summary><p>{event.detail}</p><Source href={event.source} onFollow={onFollow}>Original source</Source></details></li>)}</ol>
        </section>
      </>}
    </div>

    <footer className={s.footer}><span>Curated by <EditorialLink href={GUIDE_SOURCE} onFollow={onFollow}>OpenZcash</EditorialLink> · Sources checked {sourcesChecked}</span><Source href={FORUM} onFollow={onFollow}>Crosslink forum</Source><Source href={RELEASES} onFollow={onFollow}>All releases</Source></footer>
  </div>;
}
