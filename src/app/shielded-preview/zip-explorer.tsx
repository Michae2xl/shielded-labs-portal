'use client';

import { useSyncExternalStore, useState, useRef, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import { outsidePollRound, pollRound, proposalCoverage, proposalsBySignals, proposalAims, proposalTopics, independentPositions, profileImages, proposalColor, proposalGroup, fundStatements, relatedXDiscussion, xCoverage, devFundReviewed, explorerState, fundProposals, fundRelations, isHistorical, matchingProposals, proposalStatements, statementPreview, type FundProposal, type FundStatement } from '@/lib/shielded-preview/zips/dev-fund';
import { devFundSources } from '@/lib/shielded-preview/governance-dev-fund';
import type { ZipsIndex } from '@/lib/shielded-preview/zips/types';
import s from './zip-explorer.module.css';
import m from './proposal-map.module.css';

const subscribe = (notify: () => void) => {
  window.addEventListener('popstate', notify);
  window.addEventListener('shielded:navigate', notify);
  return () => { window.removeEventListener('popstate', notify); window.removeEventListener('shielded:navigate', notify); };
};
const snapshot = () => location.search;
const serverSnapshot = () => '';
const date = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
function External({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}<span aria-hidden="true">↗</span><span className={s.srOnly}> (external source)</span></a>;
}
const outOfPoll = 'Not in Nov poll';
function Badge({ proposal }: { proposal: FundProposal }) {
  return <span className={s.badges}><span className={s.badge} data-muted={isHistorical(proposal)}>{proposal.stage}{proposal.pr ? ` · #${proposal.pr}` : ''}</span>{outsidePollRound(proposal) && <span className={s.badge} data-muted="true">{outOfPoll}</span>}</span>;
}
function Portrait({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const src = profileImages[name];
  return <span className={s.portrait} title={name}>{src && !failed ? <Image src={src} alt="" width={36} height={36} unoptimized onError={() => setFailed(true)}/> : <span aria-hidden="true">{name.split(' ').map(w => w[0]).slice(0, 2).join('')}</span>}</span>;
}
function People({ names }: { names: string[] }) { return <span className={s.people}>{names.map(name => <Portrait name={name} key={name}/>)}</span>; }
const accent = (id: string) => ({ '--accent': proposalColor(id) }) as CSSProperties;
function ParticipantList({ items }: { items: FundStatement[] }) {
  return <ul className={s.participantList}>{[...items].sort((a,b) => a.name.localeCompare(b.name, 'en', {sensitivity:'base'})).map(item => <li key={item.id}>
    <div><External href={item.url}>{item.name}</External><time dateTime={item.date}>{date(item.date)} · {item.platform ?? 'Forum'}</time></div>
    <p>{item.text}</p><small>{item.context}</small>{item.versionSource && <External href={item.versionSource}>Referenced revision</External>}
  </li>)}</ul>;
}
function SignalBar({ id, channel = 'all' }: { id: string; channel?: string }) {
  const positions = independentPositions(id, channel);
  const scale = Math.max(1, ...fundProposals.map(p => independentPositions(p.id, channel).length));
  const kinds = ['Support', 'Concern', 'Opposition'] as const;
  const other = proposalStatements(id).filter(item => !item.author && item.kind === 'Discussion' && (channel === 'all' || (item.platform ?? 'Forum') === channel));
  return <div className={s.signalBar}>
    <div className={s.track} aria-hidden="true" style={{'--unit': `${100 / scale}%`} as CSSProperties}>{kinds.map(kind => <span key={kind} data-kind={kind} style={{width: `${positions.filter(p=>p.kind===kind).length / scale * 100}%`}}/>)}</div>
    <div className={s.positionLists}>{id === 'zap' && positions.length > 0 && <small className={s.versionNote}>Includes responses to different drafts; version context is listed with each source.</small>}{positions.length ? kinds.map(kind => {
      const items = positions.filter(p=>p.kind===kind);
      return items.length ? <details key={kind} data-kind={kind}><summary>{items.length} {kind === 'Concern' ? 'with concerns' : kind.toLowerCase()}</summary><ParticipantList items={items}/></details> : <span key={kind} className={s.noPosition}>No {kind.toLowerCase()} recorded</span>;
    }) : <span className={s.noPosition}>No independent position recorded</span>}
    {other.length > 0 && <details><summary>{other.length} other contributions</summary><small>Context from the discussion; not counted as ZIP endorsements.</small><ParticipantList items={other}/></details>}</div>
  </div>;
}
/** The aim as its authors state it. Lists and the comparison name it once in their own header, so only a lone panel passes `label`. */
function ProposalAim({ proposal, label = false }: { proposal: FundProposal; label?: boolean }) {
  return <div className={s.proposalAim}>{label && <span>{proposal.stage === 'Baseline' ? 'Stated aim' : 'Proposed benefit'}</span>}<p>{proposalAims[proposal.id]}</p><External href={proposal.source}>{proposal.stage === 'Baseline' ? 'Requestor’s source' : 'Authors’ rationale'}</External></div>;
}
function MapBoard({ rows, selected, select }: { rows: FundProposal[]; selected: string; select: (id: string) => void }) {
  const historical = rows.filter(isHistorical);
  const topics = (['Funding', 'Governance', 'Voting'] as const).map(group => ({ id: group, color: proposalTopics[group].color, items: rows.filter(p => proposalGroup(p) === group && !isHistorical(p)) }));
  function node(p: FundProposal) {
    return <button className={m.node} key={p.id} style={accent(p.id)} data-muted={isHistorical(p) || outsidePollRound(p) || undefined} aria-pressed={p.id === selected} onClick={() => select(p.id)}>
      <People names={p.authors}/><strong>{p.short}</strong>
      <small>{isHistorical(p) || p.stage === 'Merged draft' ? p.stage : p.pr ? `PR #${p.pr}` : p.stage === 'Baseline' ? 'ZIP 1016 reference' : 'Forum draft'}</small>
    </button>;
  }
  return <section className={`${s.atlas} ${m.map}`} aria-label="General proposal map">
    <div className={s.mapHeader}><h3>Explore by topic</h3><span>Select a proposal to see its details</span></div>
    <div className={m.board}>
      <div className={m.lanes}>{topics.map(({ id, color, items }) => {
        const inPoll = items.filter(p => !outsidePollRound(p)), outside = items.filter(outsidePollRound);
        return <section className={m.lane} key={id} style={{ '--topic': color } as CSSProperties} aria-label={`${id} proposals`}>
          <header><h4>{id}</h4><span>{items.length}</span><p>{proposalTopics[id].description}</p></header>
          {inPoll.map(node)}
          {/* Said once for the lane, not on every row. */}
          {outside.length > 0 && <><p className={m.laneNote}>{outOfPoll}</p>{outside.map(node)}</>}
          {!items.length && <p className={m.laneEmpty}>No current records in this selection.</p>}
        </section>;
      })}</div>
    </div>
    {historical.length > 0 && <section className={m.earlier} aria-label="Historical proposals"><header><h4>Earlier proposals</h4><p>Withdrawn and earlier drafts</p></header><div>{historical.map(node)}</div></section>}
    <div className={s.atlasFoot}>Draft proposals are not adopted rules.</div>
  </section>;
}

function Statement({ item }: { item: FundStatement }) {
  return <article className={s.statement} data-kind={item.kind}>
    <header><span className={s.statementPerson}><Portrait name={item.name}/><strong>{item.name}</strong></span><span>{item.kind}{item.author ? ' · Contributor' : ''}</span></header>
    <p>{item.text}</p>{item.versionSource && <External href={item.versionSource}>Referenced revision</External>}<details className={s.statementContext}><summary>Context</summary><small>{item.context}</small></details>
    <footer><time dateTime={item.date}>{date(item.date)} · {item.platform ?? 'Forum'}</time><External href={item.url}>Read statement</External></footer>
  </article>;
}
function Details({ proposal, index }: { proposal: FundProposal; index: ZipsIndex }) {
  const current = index.entries.find(p => p.id === proposal.record);
  const changed = current?.pull && current.pull.headSha !== proposal.revision;
  const params = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
  params.set('view', 'governance'); params.set('section', 'zips'); params.set('record', proposal.record ?? '');
  params.set('lane', proposal.stage === 'Merged draft' ? 'drafts' : proposal.pr ? 'proposals' : 'zips');
  return <div className={s.detail}>
    <header><div><span className={s.eyebrow}>Proposal detail</span><h3>{proposal.title}</h3></div><Badge proposal={proposal}/></header>
    <p>{proposal.summary}</p>
    <dl className={s.facts}>
      <div><dt>{proposal.stage === 'Baseline' ? 'Answer choice requested by' : 'Authors / owners'}</dt><dd>{proposal.authors.join(' · ')}</dd></div>
      <div><dt>ZCG stream</dt><dd>{proposal.stream}</dd></div>
      <div><dt>Coinholder stream</dt><dd>{proposal.coinholder}</dd></div>
      <div><dt>Existing treasury</dt><dd>{proposal.treasury}</dd></div>
      <div><dt>Implementation</dt><dd>{proposal.implementation}</dd></div>
    </dl>
    {changed && <p className={s.notice}>A newer ZIP revision is available. This comparison describes the reviewed version linked below.</p>}
    <footer className={s.sourceRow}>
      {current && <a href={`?${params}`}>{proposal.stage === 'Baseline' ? 'Read ZIP 1016' : 'Read ZIP in portal'}<span aria-hidden="true">→</span></a>}
      <External href={proposal.source}>Reviewed source</External>
      <External href={proposal.discussion}>{isHistorical(proposal) ? 'Closure / withdrawal' : 'Discussion'}</External>
      <small>{proposal.pr ? `Revision ${proposal.revision.slice(0, 7)}` : proposal.revision}</small>
    </footer>
  </div>;
}

const STATEMENT_PREVIEW = 6;

export default function ZipExplorer({ index, children }: { index: ZipsIndex; children: ReactNode }) {
  const [openStatements, setOpenStatements] = useState<string | null>(null);
  const focusPanel = useRef<HTMLElement>(null);
  const browsingPanel = useRef<HTMLDivElement>(null);
  const url = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const state = explorerState(new URLSearchParams(url));
  function update(values: Record<string, string | null>, replace = false) {
    const params = new URLSearchParams(location.search);
    params.set('view', 'governance'); params.set('section', 'zips'); params.set('topic', state.topic); params.delete('record');
    for (const [key, value] of Object.entries(values)) { if (value === null) params.delete(key); else params.set(key, value); }
    history[replace ? 'replaceState' : 'pushState'](null, '', `?${params}`);
    window.dispatchEvent(new Event('shielded:navigate'));
  }
  const rows = matchingProposals(state.query, state.past, state.group, state.status);
  const signalRows = proposalsBySignals(rows, state.channel);
  const filtered = Boolean(state.query || state.group !== 'all' || state.status !== 'all');
  const resetFilters = () => update({dq: null, group: null, status: null, past: null});
  const sourceFilter = <label className={s.sourceFilter}><span>Source</span><select aria-label="Statement source" value={state.channel} onChange={e => update({channel: e.target.value === 'all' ? null : e.target.value})}><option value="all">Forum + X</option><option value="Forum">Forum</option><option value="X">X</option></select></label>;
  const selected = rows.find(p => p.id === state.focus) ?? rows[0];
  const compared = fundProposals.filter(p => state.compared.includes(p.id));
  function toggle(id: string) {
    const next = state.compared.includes(id) ? state.compared.filter(item => item !== id) : [...state.compared, id].slice(0, 3);
    update({ compare: next.join(',') });
  }
  const statements = (selected ? proposalStatements(selected.id) : []).filter(item => state.channel === 'all' || (item.platform ?? 'Forum') === state.channel);
  // The overview shows a first handful of statements; the reader opens the rest, and a linked statement always shows.
  const briefStatements = state.panel === 'network' && statements.length > STATEMENT_PREVIEW && openStatements !== selected?.id;
  const previewed = statementPreview(statements, STATEMENT_PREVIEW);
  const timeline = fundStatements.filter(item => rows.some(p => p.id === item.proposal) && (state.channel === 'all' || (item.platform ?? 'Forum') === state.channel)).sort((a,b) => b.date.localeCompare(a.date));
  const timelineDays = [...new Set(timeline.map(item => item.date.slice(0,10)))];
  const select = (id: string, panel?: string) => { update({focus:id, layout:'map', ...(panel ? {panel} : {})}); requestAnimationFrame(() => { focusPanel.current?.scrollIntoView({behavior: 'instant', block: 'start'}); focusPanel.current?.focus({preventScroll: true}); }); };
  const topbar = <div className={s.topbar}>
    <nav aria-label="ZIP scope" className={s.scopes}>
      <button aria-pressed={state.topic === 'dev-fund'} onClick={() => update({ topic: 'dev-fund' })}>Proposals<span>2026</span></button>
      <button aria-pressed={state.topic === 'library'} onClick={() => update({ topic: 'library' })}>ZIP library</button>
    </nav>
    {state.topic === 'dev-fund' && <External href={devFundSources.timeline}>Key dates</External>}
  </div>;
  // The library keeps its own archive styles: the explorer's element rules (links, buttons, headings) stay out of it.
  if (state.topic === 'library') return <><section className={s.explorer} aria-label="ZIP explorer">{topbar}</section>{children}</>;
  return <section className={s.explorer} aria-label="ZIP explorer">
    {topbar}
    <>
      <header className={s.intro}><div><h2>Zcash proposals</h2><p>Explore funding, governance and voting changes.</p></div>
        <nav aria-label="ZIP display" className={s.modes}>
          {(['list', 'map', 'compare'] as const).map((mode, i) => <button key={mode} aria-pressed={state.layout === mode} onClick={() => update({ layout: mode })}><span aria-hidden="true">{['☰', '◇', '◫'][i]}</span>{['List', 'Map', 'Compare'][i]}{mode === 'compare' && compared.length > 0 && <small>{compared.length}</small>}</button>)}
        </nav>
      </header>
      <div className={s.filters} aria-label="Filter proposals" role="group">
        <label className={s.search}><span aria-hidden="true">⌕</span><input type="search" aria-label="Search ZIP proposals" placeholder="Search proposals…" value={state.query} onChange={e => update({ dq: e.target.value || null }, true)}/></label>
        <nav aria-label="Proposal topics" className={s.topicFilters}>{(['all', 'Funding', 'Governance', 'Voting'] as const).map(group => <button key={group} aria-pressed={state.group === group} style={group === 'all' ? undefined : {'--topic':proposalTopics[group].color} as CSSProperties} onClick={() => update({group: group === 'all' ? null : group})}>{group !== 'all' && <i aria-hidden="true"/>}{group === 'all' ? 'All topics' : group}</button>)}</nav>
        <label className={s.statusFilter}><span className={s.srOnly}>Status</span><select aria-label="Proposal status" value={state.status} onChange={e => update({status:e.target.value === 'all' ? null : e.target.value, past:null})}><option value="all">All statuses</option><option value="current">Current proposals</option><option value="historical">Earlier & withdrawn</option></select></label>
      </div>
      <div ref={browsingPanel} tabIndex={-1} className={s.resultsToolbar}>
        <div className={s.resultSummary}><span role="status">{rows.length} {state.layout === 'compare' ? 'available to compare' : rows.length === 1 ? 'proposal' : 'proposals'}</span>{filtered && <button className={s.clearFilters} onClick={resetFilters}>Clear filters</button>}</div>
      </div>
      {!rows.length && <div className={s.empty}><p>No proposals match these filters. Try a different search or clear the filters above.</p></div>}
      {state.layout === 'list' && <div className={s.cards}>{rows.map(p => <article className={s.card} style={accent(p.id)} key={p.id}>
        <header><Badge proposal={p}/><People names={p.authors}/></header>
        <h3>{p.short}</h3><p className={s.authors}>{p.authors.join(' · ')}</p><p>{p.summary}</p>
        <div className={s.cardFoot}><button onClick={() => select(p.id,'network')}>View proposal<span aria-hidden="true">→</span></button><label><input type="checkbox" checked={state.compared.includes(p.id)} disabled={!state.compared.includes(p.id) && state.compared.length >= 3} onChange={() => toggle(p.id)}/>Compare</label></div>
      </article>)}</div>}
      {state.layout === 'map' && selected && <>
        <div className={s.workspaceBar}><nav aria-label="Map views">{[['network','Overview'],['signals','Public positions'],['timeline','Timeline']].map(([panel,label]) => <button key={panel} aria-pressed={state.panel === panel} onClick={() => update({panel})}>{label}</button>)}</nav>{state.panel !== 'network' && sourceFilter}</div>
        {state.panel === 'signals' && <section className={s.signals} aria-label="Documented support bars">
          <header className={s.signalsHeader}><div><h3>Documented support</h3><p>Most recorded positions first, each with its authors’ stated aim. Open a count to see participants and sources.</p></div><span className={s.sampleBadge}>Partial coverage</span></header>
          <div className={s.signalLegend}><span data-kind="Support">Support</span><span data-kind="Concern">Concern</span><span data-kind="Opposition">Opposition</span><small>Accounts, not votes · contributors excluded</small></div>
          {signalRows.map(p => <div key={p.id} className={s.signalRow} data-selected={selected.id === p.id} style={accent(p.id)}>
            <button className={s.signalTitle} aria-pressed={selected.id === p.id} onClick={() => select(p.id)}><span><strong>{p.short}</strong><small>{p.pr ? `#${p.pr} · ` : ''}{p.stage}{outsidePollRound(p) ? ' · not in Nov poll' : ''}</small></span></button>
            <div className={s.positionBody}><ProposalAim proposal={p}/><SignalBar id={p.id} channel={state.channel}/></div>
            <label className={s.comparePick}><input type="checkbox" checked={state.compared.includes(p.id)} disabled={!state.compared.includes(p.id) && state.compared.length >= 3} onChange={() => toggle(p.id)}/><span className={s.srOnly}>Compare {p.short}</span></label>
          </div>)}
          <footer className={s.signalsFoot}><span>No reviewed positions does not mean no support.</span><button onClick={() => update({layout:'compare'})}>Compare selected ({compared.length}) →</button></footer>
        </section>}
        {state.panel === 'network' && <MapBoard rows={rows} selected={selected.id} select={select}/>}
        {state.panel === 'timeline' && <section className={s.chronology} aria-label="Community statement timeline">
          <header><h3>Public statements</h3><span>Newest first · {timeline.length} reviewed</span></header>
          {timelineDays.length ? timelineDays.map(day => <section key={day} className={s.dayGroup} aria-label={date(day)}>
            <div className={s.dayStamp}><time dateTime={day}>{date(day)}</time></div>
            <div className={s.dayEvents}>{timeline.filter(item => item.date.startsWith(day)).map(item => {
              const proposal = fundProposals.find(p => p.id === item.proposal)!;
              return <article className={s.timelineEvent} key={item.id}>
                <header><Portrait name={item.name}/><div className={s.eventAuthor}><strong>{item.name}</strong><small>{item.platform ?? 'Forum'}{item.author ? ' · Contributor' : ''}</small></div><span className={s.positionTag} data-kind={item.kind}><span aria-hidden="true">{item.kind === 'Support' ? '+' : item.kind === 'Concern' ? '?' : item.kind === 'Discussion' ? '·' : '−'}</span>{item.kind}</span></header>
                <button className={s.eventProposal} onClick={() => select(proposal.id,'network')}>{proposal.short}<span aria-hidden="true">→</span></button>
                <p>{item.text}</p>
                <footer><details className={s.statementContext}><summary>Context</summary><small>{item.context}</small></details><External href={item.url}>Original post</External></footer>
              </article>;
            })}</div>
          </section>) : <div className={s.empty}>No statements reviewed for this selection.</div>}
        </section>}
        {state.panel !== 'timeline' && <>
        <section ref={focusPanel} tabIndex={-1} className={s.focusPanel} aria-label={`Selected proposal: ${selected.short}`} style={accent(selected.id)}>
          <button className={s.backToBrowse} onClick={() => { browsingPanel.current?.scrollIntoView({behavior:'instant',block:'start'}); browsingPanel.current?.focus({preventScroll:true}); }}>↑ Back to proposals</button><header><div><span className={s.eyebrow}>{proposalGroup(selected)}</span><h3>{selected.short}</h3><span className={s.focusAuthors}><People names={selected.authors}/>{selected.authors.join(' · ')}</span></div><Badge proposal={selected}/></header>
          <p>{selected.summary}</p>{selected.revised && <p className={s.pollNote}>Revised on {date(selected.revised.on)}: {selected.revised.text} <External href={selected.revised.source}>Author’s update</External></p>}{selected.merged && <p className={s.pollNote}>Merged into the ZIPs repository on {date(selected.merged.on)}, with Draft status. Under ZIP 0, every initial submission has Draft status; Proposed comes after consideration, feedback and rough consensus. <External href={selected.merged.source}>Pull request</External></p>}{outsidePollRound(selected) && <p className={s.pollNote}>Submitted after the 8 Nov deadline; the coordinating organizations left it out of this round of polling. <External href={pollRound.source}>Organizers’ post, 9 Nov</External></p>}<ProposalAim proposal={selected} label/><div className={s.sourceRow}><External href={selected.source}>Proposal source</External><External href={selected.discussion}>{isHistorical(selected) ? 'Status source' : 'Public discussion'}</External><button onClick={() => {const ids = state.compared.includes(selected.id) ? state.compared : [...state.compared.slice(0,2), selected.id];update({layout:'compare',compare:ids.join(',')});}}>Compare this proposal →</button></div>
          <details className={s.proposalDetails} key={selected.id}><summary>Details & full proposal</summary><Details proposal={selected} index={index}/></details>
        </section>
        {fundRelations.some(r => r.from === selected.id || r.to === selected.id) && <div className={s.relations}>{fundRelations.filter(r => r.from === selected.id || r.to === selected.id).map(r => { const other = fundProposals.find(p => p.id === (r.from === selected.id ? r.to : r.from))!; return <div key={`${r.from}-${r.to}`}><span>{r.label}</span><button onClick={() => update({ focus: other.id, past: '1', status: null, dq: null, group: null })}>{other.short} →</button><External href={r.source}>Basis</External></div>; })}</div>}
        <details className={s.reach}><summary>Source coverage <span>Partial · {date(proposalCoverage[selected.id].reviewedOn)}</span></summary><div><p><strong>Forum.</strong> {proposalCoverage[selected.id].forum}</p><p><strong>X.</strong> {proposalCoverage[selected.id].x}</p><p>Missing records mean evidence is not documented here, not that nobody supports the proposal.</p></div></details>
        {state.panel !== 'timeline' && <section aria-label="Source statements" className={s.evidence}><header className={s.evidenceHeader}><div><h3>Who said what</h3><p>{statements.length} reviewed {statements.length === 1 ? 'statement' : 'statements'} · contributors labelled</p></div>{state.panel === 'network' && sourceFilter}</header>{statements.length ? <><div className={s.statements} data-collapsed={briefStatements || undefined}>{statements.map(item => <div key={item.id} id={`statement-${item.id}`} tabIndex={-1} data-preview={previewed.has(item.id) || undefined}><Statement item={item}/></div>)}</div>{state.panel === 'network' && statements.length > STATEMENT_PREVIEW && <button type="button" className={s.moreStatements} aria-expanded={!briefStatements} onClick={() => setOpenStatements(briefStatements ? selected.id : null)}>{briefStatements ? `Show all ${statements.length} statements` : 'Show fewer statements'}</button>}</> : <div className={s.empty}>No statements reviewed for this selection. This does not mean no support.</div>}</section>}
        {selected.id === 'lockbox' && state.channel !== 'Forum' && <details className={s.reach}><summary>Related discussion <span>Outside this proposal’s count</span></summary><div><span className={s.statementPerson}><Portrait name={relatedXDiscussion.name}/><strong>{relatedXDiscussion.name}</strong></span><p>{relatedXDiscussion.text}</p><External href={relatedXDiscussion.url}>Read original post · {date(relatedXDiscussion.date)}</External></div></details>}
        {selected.id === 'lockbox' && state.channel !== 'Forum' && <details className={s.reach}><summary>X conversation · reach snapshot <span>Not support counts</span></summary><div><External href={xCoverage.authorPost}>Sean Bowe’s announcement</External><dl>{[['Replies', xCoverage.replies],['Reposts',xCoverage.reposts],['Likes',xCoverage.likes],['Views',xCoverage.views]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{Number(value).toLocaleString('en-US')}</dd></div>)}</dl><p>Observed {date(xCoverage.reviewedOn)}. Only explicitly reviewed replies enter the statement sample; engagement does not enter the bars.</p></div></details>}
        </>}
      </>}
      {state.layout === 'compare' && <>
        <details className={s.compareChooser} open={compared.length === 0}><summary>Choose proposals <span>{compared.length} / 3 selected</span></summary><fieldset className={s.choose}><legend>Select up to three proposals</legend>{rows.map(p => <label key={p.id}><input type="checkbox" checked={state.compared.includes(p.id)} disabled={!state.compared.includes(p.id) && state.compared.length >= 3} onChange={() => toggle(p.id)}/>{p.short}</label>)}</fieldset></details>
        <div className={s.selection} aria-label="Selected proposals" aria-live="polite">{compared.map(p => <button aria-label={`Remove ${p.short} from comparison`} key={p.id} onClick={() => toggle(p.id)}>{p.short} ×</button>)}</div>
        {!compared.length ? <div className={s.empty}>Select proposals above to compare their funding rules and sources.</div> : <div className={s.tableWrap} role="region" aria-label="ZIP proposal comparison" tabIndex={0}><table className={s.table}><caption>Reviewed versions · all sources · {date(devFundReviewed)}</caption><thead><tr><th scope="col">Compare</th>{compared.map(p => <th scope="col" key={p.id} style={accent(p.id)}><People names={p.authors}/><h3>{p.short}</h3><Badge proposal={p}/></th>)}</tr></thead><tbody>
          <tr><th scope="row">Topic</th>{compared.map(p => <td key={p.id}>{proposalGroup(p)}</td>)}</tr>
          {([['Authors / requestor', 'authors'], ['Proposed change', 'summary'], ['ZCG stream', 'stream'], ['Coinholder stream', 'coinholder'], ['Existing treasury', 'treasury'], ['Implementation', 'implementation']] as const).map(([label, key]) => <tr key={key}><th scope="row">{label}</th>{compared.map(p => <td key={p.id}>{Array.isArray(p[key]) ? p.authors.join(' · ') : p[key]}</td>)}</tr>)}
          <tr><th scope="row">Proposed benefit<small>Authors’ stated aims, not guaranteed outcomes.</small></th>{compared.map(p => <td key={p.id}><ProposalAim proposal={p}/></td>)}</tr>
          <tr><th scope="row">Public positions<small>Partial sample · accounts, not votes. Contributors excluded. Open counts for sources.</small></th>{compared.map(p => <td key={p.id}><SignalBar id={p.id}/></td>)}</tr>
          <tr><th scope="row">Documented responses</th>{compared.map(p => <td key={p.id}>{proposalStatements(p.id).length ? <details className={s.compareSources}><summary>{proposalStatements(p.id).length} statements</summary><ul>{proposalStatements(p.id).map(item => <li key={item.id}><External href={item.url}>{item.name} · {item.kind}{item.author ? ' (contributor)' : ''}</External><small>{date(item.date)} · {item.context}</small></li>)}</ul></details> : <span className={s.muted}>No statement recorded in this sample.</span>}</td>)}</tr>
          <tr><th scope="row">Sources</th>{compared.map(p => <td key={p.id}><External href={p.source}>Reviewed text</External><External href={p.discussion}>Discussion / status</External><button onClick={() => update({ layout: 'map', focus: p.id, past: '1', status: null, dq: null, group: null })}>View proposal →</button></td>)}</tr>
        </tbody></table></div>}
      </>}
      <details className={s.method}><summary>Sources & methodology<span>Reviewed {date(devFundReviewed)}</span></summary><div>
        <p>This is a curated, dated research view, not a complete proposal register or an official ballot. Financial descriptions are summaries of the linked proposal versions, not current treasury balances.</p>
        <p>Authors come from document headers; the baseline names the person requesting that answer choice. Support, concerns and opposition come from explicit statements. Bars count each public account once per proposal using its latest reviewed statement within the selected source. They do not measure unique humans or total community support. Authors and credited contributors are excluded from independent counts. Other contributions without an explicit ZIP position are listed separately. Participant lists use alphabetical order, without weighting fame, followers or affiliation. Missing evidence stays unknown; likes, affiliation and comment volume are not votes.</p>
        <p>Historical statements do not establish support for revised text. Closed and withdrawn proposals remain available for context. Public positions are ordered by the number of reviewed independent accounts in the selected source, with alphabetical ties. This is an activity order, not an approval ranking. This view assigns no probability or consensus score, and does not combine coinholder and community-panel votes.</p>
        <p>Source review is manual and does not update automatically with the ZIP library. Each comparison links its reviewed version. The X sample is partial, collected from publicly visible author posts and replies, not a full conversation crawl. Profile images come from the linked public accounts; initials are used when unavailable. Read the discussion for later changes.</p>
        <div className={s.sourceRow}><External href={devFundSources.zip0}>ZIP process</External><External href={devFundSources.timeline}>Dev Fund process</External></div>
      </div></details>
    </>
  </section>;
}
