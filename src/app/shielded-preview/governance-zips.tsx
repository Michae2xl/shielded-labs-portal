'use client';

import { createElement, useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { bundledZips, filterZips, laneForRecord, proposalChange, zipLabel, zipLane, zipLanes, zipStatuses, zipTitle, zipsRepository, type ZipLane } from '@/lib/shielded-preview/zips/library';
import type { ZipDocument, ZipNode, ZipsIndex } from '@/lib/shielded-preview/zips/types';
import type { Source } from '@/lib/shielded-preview/governance-types';
import GovernanceRecord from './governance-record';
import GovernanceGlyph from './governance-glyph';
import { Arrow, Collection, Empty, Link, Search, SourceInfo, Tabs, pageRows, visiblePage, type CollectionNavigate, type Controls } from './governance-collections';
import a from './governance-archive.module.css';
import z from './governance-zips.module.css';

const date = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)) : 'Not recorded';
const titles: Record<ZipLane, string> = { zips: 'Numbered ZIPs', drafts: 'Unnumbered drafts', guides: 'Writing guides', proposals: 'Open pull requests' };
const laneIcons: Record<ZipLane, 'zips' | 'process' | 'pull'> = { zips: 'zips', drafts: 'zips', guides: 'process', proposals: 'pull' };
// Scroll to the anchor on the first load and after a link; Back and Forward keep the browser's restored position.
let scrollToAnchor = true;
const elementTags = new Set('span p h2 h3 h4 h5 h6 a strong em ul ol li dl dt dd blockquote pre code table thead tbody tfoot tr th td figure figcaption img br hr sup sub'.split(' '));
const mathTags = new Set('math mrow mi mn mo msup msub msubsup mfrac msqrt mroot mtext mspace mover munder munderover mtable mtr mtd mstyle mpadded mphantom menclose semantics mmultiscripts mprescripts'.split(' '));
const mathAttributes = new Set('display mathvariant displaystyle stretchy fence separator lspace rspace form accent accentunder width height depth voffset linethickness columnalign rowalign columnspacing rowspacing notation largeop movablelimits symmetric minsize maxsize mathsize scriptlevel'.split(' '));
const mathValue = /^[A-Za-z0-9 .%,+-]{0,40}$/;
const loaded = new Map<string, ZipDocument>();

function syncLabel(index: ZipsIndex) {
  const commit = index.meta.upstream.commit ? ` · commit ${index.meta.upstream.commit.slice(0, 7)}` : '';
  return `${index.state === 'fetched' ? 'Synchronized' : 'Bundled snapshot'} ${date(index.meta.syncedAt)}${commit}${index.error ? ' · Refresh unavailable' : ''}`;
}
const repositorySource = (index: ZipsIndex): Source<unknown> => ({ data: null, state: index.state === 'fetched' ? 'fetched' : 'snapshot', observedAt: index.meta.upstream.committedAt, url: zipsRepository, error: index.error });

function Stat({ value, name, note }: { value: ReactNode; name: string; note?: string | null }) {
  return <div><span>{name}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}
function External({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></a>;
}

/** Links inside a proposal: other records stay in the portal, anchors scroll, everything else opens the source site. */
function ZipLink({ href, onNavigate, children }: { href: string; onNavigate: CollectionNavigate; children: ReactNode }) {
  if (href.startsWith('?view=governance&section=zips&record=')) {
    const target = new URL(href, 'https://portal.example');
    const id = target.searchParams.get('record') ?? '';
    const click = (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      onNavigate('ZIPs', id);
      scrollToAnchor = true;
      if (target.hash) history.replaceState(null, '', `${location.search}${target.hash}`);
    };
    return <a href={href} onClick={click}>{children}</a>;
  }
  if (href.startsWith('#') || href.startsWith('mailto:')) return <a href={href}>{children}</a>;
  if (/^https?:\/\//.test(href)) return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
  return <span>{children}</span>;
}

/** Render allowlisted nodes only; unknown tags and attributes are dropped, never passed through. */
export function ZipBody({ nodes, onNavigate, math = false }: { nodes: ZipNode[]; onNavigate: CollectionNavigate; math?: boolean }) {
  return nodes.map((node, index) => {
    if (typeof node === 'string') return node;
    if (node.tag === 'math' || (math && mathTags.has(node.tag))) {
      const attributes = Object.fromEntries(Object.entries(node.attrs ?? {}).filter(([key, value]) => mathAttributes.has(key) && mathValue.test(value)));
      return createElement(node.tag, { key: index, ...attributes, ...(node.tag === 'math' ? { xmlns: 'http://www.w3.org/1998/Math/MathML' } : {}) }, <ZipBody nodes={node.children} onNavigate={onNavigate} math/>);
    }
    if (math || !elementTags.has(node.tag)) return null;
    const children = <ZipBody nodes={node.children} onNavigate={onNavigate}/>;
    if (node.tag === 'a') return <ZipLink key={index} href={node.href ?? ''} onNavigate={onNavigate}>{children}</ZipLink>;
    if (node.tag === 'img') {
      if (!/^\/shielded-preview\/zips\/[A-Za-z0-9][A-Za-z0-9._-]*\.png$/.test(node.src ?? '')) return null;
      // Figures are PNG copies from the repository, served locally at their original size.
      // eslint-disable-next-line @next/next/no-img-element
      return <img key={index} src={node.src} alt={node.alt || 'Figure from the proposal'} loading="lazy" decoding="async"/>;
    }
    if (node.tag === 'br' || node.tag === 'hr') return createElement(node.tag, { key: index });
    const props: Record<string, unknown> = { key: index, id: node.id };
    if (node.tag === 'td' || node.tag === 'th') { props.colSpan = node.colspan; props.rowSpan = node.rowspan; }
    if (node.tag === 'ol' && node.start) props.start = node.start;
    const element = createElement(node.tag, props, children);
    return node.tag === 'table' ? <div key={index} className={z.tableScroll} role="region" aria-label="Table" tabIndex={0}>{element}</div> : element;
  });
}

export function ZipsCollection({ index, lane, onLane, ...controls }: Controls & { index: ZipsIndex; lane: ZipLane; onLane: (value: string) => void }) {
  const { search, onSearch, filter, onFilter, page, onPage, onNavigate } = controls;
  const rows = filterZips(index.entries, { lane, status: filter, query: search });
  const statuses = zipStatuses(index.entries, lane);
  const count = (id: ZipLane) => index.entries.filter(entry => zipLane(entry) === id).length;
  return <Collection archive id="zips" title={titles[lane]} context="Zcash Improvement Proposals"
    tabs={<Tabs label="ZIP collections" value={lane} onChange={onLane} items={zipLanes.map(item => ({ id: item.id, name: item.name, count: count(item.id), icon: laneIcons[item.id] }))}/>}
    toolbar={<><Search name="Search ZIPs" value={search} onChange={onSearch}/>{statuses.length > 1 && <select aria-label="Filter ZIP status" value={filter} onChange={event => onFilter(event.target.value)}><option value="all">All statuses</option>{statuses.map(status => <option key={status} value={status}>{status}</option>)}</select>}</>}
    total={rows.length} page={page} onPage={onPage}
    notice={lane === 'proposals' ? 'Unofficial previews rendered from open pull requests. Anyone can open a pull request; nothing here is part of the ZIPs until the editors merge it.' : 'A ZIP is a specification, not a decision. Its status comes from the document header; activation on the network is a separate milestone recorded under Voting.'}
    aside={<><div><h3>Reading these records</h3><p>Rendered from the zcash/zips repository with its wording, links and formulas. Status follows the latest revision listed in the header.</p><p>{syncLabel(index)}</p></div><SourceInfo name="zcash/zips repository" source={repositorySource(index)}/></>}
  >
    <div className={a.columns} aria-hidden="true"><span>{lane === 'proposals' ? 'Pull request' : 'Proposal'}</span><div className={a.measures}><span>Status</span><span>{lane === 'proposals' ? 'Activity' : 'Last change'}</span></div><span/></div>
    <ul className={a.rows} aria-label={titles[lane]}>{pageRows(rows, page).map(entry => <li key={entry.id}><Link section="ZIPs" id={entry.id} selection={{ lane, filter, search, page: visiblePage(page, rows.length) }} onNavigate={onNavigate} className={a.record}>
      {entry.pull ? <span className={a.ballotNumber}><span className={z.srOnly}>Pull request </span>#{entry.pull.number}</span> : entry.number === null ? <span className={a.symbol} aria-hidden="true"><GovernanceGlyph kind={entry.kind === 'guide' ? 'process' : 'zips'} size={23}/></span> : <span className={a.ballotNumber}><span className={z.srOnly}>ZIP </span>{entry.number}</span>}
      <div className={a.identity}><h3>{entry.title}</h3><div className={a.meta}>{entry.pull ? <><span>{proposalChange(entry)}</span><span>{entry.pull.author}</span>{entry.pull.draft && <span>Draft pull request</span>}</> : <><span>{zipLabel(entry)}</span><span>{entry.category}</span></>}{!entry.pull && entry.owners.length > 0 && <span>{entry.owners.slice(0, 2).join(', ')}{entry.owners.length > 2 ? ` +${entry.owners.length - 2}` : ''}</span>}</div></div>
      <div className={a.measures}><span className={a.measure}><span className={a.mobileLabel}>Status</span><span className={a.status}>{entry.status}</span></span><span className={a.measure}><span className={a.mobileLabel}>{entry.pull ? 'Activity' : 'Last change'}</span>{entry.updatedAt ? <time dateTime={entry.updatedAt}>{date(entry.updatedAt)}</time> : <small>Not recorded</small>}</span></div><Arrow/>
    </Link></li>)}</ul>
    {!rows.length && <Empty onReset={() => { onSearch(''); onFilter('all'); }}/>}
  </Collection>;
}

export function ZipRecord({ id, index, onBack, onNavigate }: { id: string; index: ZipsIndex; onBack: () => void; onNavigate: CollectionNavigate }) {
  const [state, setState] = useState<{ id: string; document: ZipDocument | null; failed: boolean }>({ id, document: null, failed: false });
  useEffect(() => {
    if (loaded.has(id)) return;
    let active = true;
    fetch(`/api/shielded-preview/zips?id=${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(20000) })
      .then(async response => {
        if (!response.ok) throw new Error('Document unavailable');
        const document = await response.json() as ZipDocument;
        if (!Array.isArray(document.body)) throw new Error('Invalid document');
        loaded.set(id, document);
        if (active) setState({ id, document, failed: false });
      })
      .catch(() => { if (active) setState({ id, document: null, failed: true }); });
    return () => { active = false; };
  }, [id]);
  const textReady = loaded.has(id) || (state.id === id && Boolean(state.document));
  useEffect(() => {
    if (!textReady) return;
    const wanted = scrollToAnchor;
    scrollToAnchor = false;
    if (!wanted || !location.hash) return;
    let anchor = location.hash.slice(1);
    try { anchor = decodeURIComponent(anchor); } catch { /* Keep malformed anchors inert. */ }
    requestAnimationFrame(() => globalThis.document.getElementById(anchor)?.scrollIntoView());
  }, [id, textReady]);
  const entry = index.entries.find(item => item.id === id);
  if (!entry) return <section className={z.empty}><h1 tabIndex={-1}>Record not found</h1><p>This proposal is not in the current ZIP index.</p><button onClick={onBack}>All ZIPs<Arrow/></button></section>;
  const proposalText = loaded.get(id) ?? (state.id === id ? state.document : null);
  const failed = state.id === id && state.failed;
  const outline = (proposalText?.headings ?? []).filter(heading => heading.level <= 3).slice(0, 60).map(heading => ({ id: heading.id, label: heading.title, level: heading.level }));
  const owners = entry.owners.length > 4 ? `${entry.owners.slice(0, 4).join(', ')} and ${entry.owners.length - 4} more` : entry.owners.join(', ');
  const pull = entry.pull;
  return <GovernanceRecord title={zipTitle(entry)} context={pull ? 'Open pull request · unofficial preview' : entry.kind === 'guide' ? 'ZIP writing guide' : entry.kind === 'draft' ? 'Draft Zcash Improvement Proposal' : 'Zcash Improvement Proposal'} subtitle={pull ? pull.title : entry.category}
    metrics={pull ? <><Stat name="Header status" value={entry.status} note={entry.statusDetail}/><Stat name="Change" value={proposalChange(entry)}/><Stat name="Author" value={pull.author} note={pull.draft ? 'Draft pull request' : null}/><Stat name="Last activity" value={date(pull.updatedAt)}/></> : <><Stat name="Status" value={entry.status} note={entry.statusDetail}/><Stat name="Created" value={date(entry.created)}/><Stat name="Last change" value={date(entry.updatedAt)}/><Stat name={entry.owners.length === 1 ? 'Owner' : 'Owners'} value={owners || 'Not recorded'}/></>}
    sections={[]} outline={outline} backLabel={titles[zipLane(entry)]} onBack={onBack} idPrefix="zip"
    sources={<>
      {pull ? <p>Unofficial preview rendered from the pull request head, commit {pull.headSha.slice(0, 7)}, with its original wording. The pull request is the canonical text until the editors merge it. {syncLabel(index)}.</p> : <p>Text rendered from the repository with its original wording; the repository remains the canonical version. {syncLabel(index)}.{entry.license ? ` License: ${entry.license}.` : ''}</p>}
      {pull ? <><External href={pull.url}>Pull request #{pull.number} on GitHub</External><External href={entry.source}>File at this commit</External></> : <><External href={entry.source}>Source file on GitHub</External><External href={entry.official}>Official rendering · zips.z.cash</External></>}
      {entry.discussionsTo && <External href={entry.discussionsTo}>Discussion</External>}
      {!pull && entry.pullRequest && <External href={entry.pullRequest}>Pull request</External>}
    </>}
  >
    {pull && <div className={z.preview} role="note"><strong>Unofficial preview.</strong> Rendered from pull request #{pull.number} at commit {pull.headSha.slice(0, 7)}; not part of the ZIPs until merged. {pull.files.length > 1 && <>The pull request also changes {pull.files.filter(file => file !== pull.file).join(', ')}. </>}{entry.base && <Link section="ZIPs" id={entry.base} onNavigate={onNavigate}>Read the current {entry.number === null ? 'document' : `ZIP ${entry.number}`}<Arrow/></Link>}</div>}
    <section id="zip-document" className={z.document}>{pull && <div className={z.previewTag} role="note">Unofficial preview · Pull request #{pull.number}</div>}{proposalText ? <ZipBody nodes={proposalText.body} onNavigate={onNavigate}/> : <p className={z.status} role="status">{failed ? 'The proposal text could not be loaded. Try again or read it at the source.' : 'Loading the proposal text…'}</p>}</section>
  </GovernanceRecord>;
}

export default function GovernanceZips({ selected, lane, filter, search, page, onNavigate, onSearch, onFilter, onPage, onLane }: {
  selected: string | null; lane: ZipLane; filter: string; search: string; page: number; onNavigate: CollectionNavigate;
  onSearch: (value: string) => void; onFilter: (value: string) => void; onPage: (value: number) => void; onLane: (value: string) => void;
}) {
  const [index, setIndex] = useState<ZipsIndex>(bundledZips);
  useEffect(() => {
    let active = true;
    fetch('/api/shielded-preview/zips', { signal: AbortSignal.timeout(15000) })
      .then(async response => {
        if (!response.ok) throw new Error('Index unavailable');
        const data = await response.json() as ZipsIndex;
        if (active && Array.isArray(data.entries) && data.entries.length) setIndex(data);
      })
      .catch(() => { /* The bundled snapshot stays in place. */ });
    return () => { active = false; };
  }, []);
  if (selected) return <ZipRecord id={selected} index={index} onBack={() => onNavigate('ZIPs', null, { lane: laneForRecord(selected, index.entries) })} onNavigate={onNavigate}/>;
  return <ZipsCollection index={index} lane={lane} onLane={onLane} search={search} onSearch={onSearch} filter={filter} onFilter={onFilter} page={page} onPage={onPage} onNavigate={onNavigate}/>;
}
