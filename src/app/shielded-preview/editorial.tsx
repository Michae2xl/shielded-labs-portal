'use client';

import { createElement, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { projects } from '@/lib/shielded-preview/content';
import { aboutSections, categoryId, editorialCatalog, editorialCategories, editorialHref, editorialListHref, resolveEditorialLink, safeEditorialUrl } from '@/lib/shielded-preview/editorial/library';
import { groupContent } from '@/lib/shielded-preview/editorial/presentation';
import { faqContent } from '@/lib/shielded-preview/editorial/faq';
import { projectHref } from '@/lib/shielded-preview/project-navigation';
import { board } from '@/lib/shielded-preview/editorial/institutional';
import { simulators } from '@/lib/shielded-preview/editorial/simulators';
import type { ContentNode, EditorialDocument, EditorialEntry, EditorialView } from '@/lib/shielded-preview/editorial/types';
import SectionMenu from './section-menu';
import Image from 'next/image';
import ContactForm, { createContactFormController, type ContactFormController } from './contact-form';
import SimulatorView from './simulator';
import s from './editorial.module.css';

type Follow = (href: string) => void;
const allowedTags = new Set('p h2 h3 h4 h5 h6 a strong em ul ol li blockquote pre code table thead tbody tr th td figure figcaption img br hr sup sub'.split(' '));
const loaded = new Map<string, EditorialDocument>();
export function EditorialArrow({ back = false, external = false }: { back?: boolean; external?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={back ? { transform: 'rotate(180deg)' } : undefined}><path d={external ? 'M6 18 18 6M6 6h12v12' : 'M4 12h16m-6-6 6 6-6 6'}/></svg>;
}
export function EditorialLink({ href, onFollow, children, className, label }: { href: string; onFollow: Follow; children: ReactNode; className?: string; label?: string }) {
  const safe = resolveEditorialLink(href);
  if (!safe) return <span>{children}</span>;
  const internal = safe.startsWith('?view=');
  function click(event: MouseEvent<HTMLAnchorElement>) {
    if (!internal || event.button || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault(); onFollow(safe!);
  }
  return <a className={className} href={safe} aria-label={label} onClick={click} {...(!internal && !safe.startsWith('#') && !safe.startsWith('mailto:') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
}
function DateLabel({ date }: { date: string }) {
  return <time dateTime={date}>{new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date))}</time>;
}
export function DocumentBody({ nodes, onFollow, actions = false }: { nodes: ContentNode[]; onFollow: Follow; actions?: boolean }) {
  return nodes.map((node, index) => {
    if (typeof node === 'string') return node;
    if (!allowedTags.has(node.tag)) return null;
    const onlyChild = node.children[0];
    if (actions && node.tag === 'p' && node.children.length === 1 && typeof onlyChild !== 'string' && onlyChild?.tag === 'a') {
      return <p key={index} className={s.actionLink}><EditorialLink href={onlyChild.href ?? ''} onFollow={onFollow}><span><DocumentBody nodes={onlyChild.children} onFollow={onFollow}/></span><EditorialArrow/></EditorialLink></p>;
    }
    const children = <DocumentBody nodes={node.children} onFollow={onFollow}/>;
    if (node.tag === 'a') return <EditorialLink key={index} href={node.href ?? ''} onFollow={onFollow}>{children}</EditorialLink>;
    if (node.tag === 'img') {
      if (!/^\/shielded-preview\/editorial\/[a-f0-9]+\.(png|jpe?g|webp|gif)$/.test(node.src ?? '')) return null;
      // Imported editorial illustrations are local and retain their original aspect ratio.
      // eslint-disable-next-line @next/next/no-img-element
      return <img key={index} src={node.src} alt={node.alt || 'Illustration from the source article'} loading="lazy" decoding="async"/>;
    }
    if (node.tag === 'br' || node.tag === 'hr') return createElement(node.tag, { key: index });
    const element = createElement(node.tag, { key: index, id: node.id, ...(node.tag === 'td' || node.tag === 'th' ? { colSpan: node.colspan, rowSpan: node.rowspan } : {}) }, children);
    return node.tag === 'table' ? <div key={index} className={s.tableScroll} role="region" aria-label="Article table" tabIndex={0}>{element}</div> : element;
  });
}
function ResourceIcon({ category }: { category: string }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{category === 'Simulator' ? <><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="var(--surface)"/><circle cx="16" cy="12" r="2" fill="var(--surface)"/><circle cx="10" cy="18" r="2" fill="var(--surface)"/></> : category.includes('FAQ') ? <><path d="M4 3h16v14H9l-5 4Z"/><path d="M10 8a2 2 0 1 1 3 1.7c-.7.4-1 1-1 1.8m0 2h.01"/></> : <><path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/></>}</svg>;
}
function EntryCard({ entry, section, query, onFollow }: { entry: EditorialEntry; section: string; query: string; onFollow: Follow }) {
  const article = entry.view === 'blog';
  if (article) return <EditorialLink className={s.articleCard} href={editorialHref(entry, section, query)} onFollow={onFollow}>
    {entry.image && <Image className={s.thumbnail} src={entry.image.src} alt="" width={entry.image.width} height={entry.image.height} sizes="(max-width: 620px) 96px, 160px"/>}
    <div className={s.articleCopy}>
      <div className={s.cardMeta}>{section === 'all' && <span>{entry.category}</span>}<DateLabel date={entry.publishedAt}/></div>
      <h2>{entry.title}</h2>
      <p className={s.articleByline}>{entry.author}<span aria-hidden="true">·</span>{entry.minutes} min read</p>
    </div>
    <EditorialArrow/>
  </EditorialLink>;
  return <EditorialLink className={`${s.card} ${s.resourceCard}`} href={editorialHref(entry, section, query)} onFollow={onFollow}>
    <div className={s.cardContent}>
      <div className={s.cardMeta}><ResourceIcon category={entry.category}/><span>{entry.category}</span></div>
      <h2>{entry.title}</h2><p>{entry.summary}</p>
      <div className={s.cardFooter}><span>{entry.category === 'Simulator' ? 'Interactive model' : <>Updated <DateLabel date={entry.updatedAt}/></>}</span><EditorialArrow/></div>
    </div>
  </EditorialLink>;
}
export function OrganizationBody({ nodes, onFollow }: { nodes: ContentNode[]; onFollow: Follow }) {
  const content = groupContent(nodes, 2);
  const mission = content.sections.find(section => section.heading.id === 'mission');
  const values = content.sections.find(section => section.heading.id === 'values');
  const cards = values ? groupContent(values.body, 3) : null;
  return <div className={s.organization}>
    <div className={s.missionGrid}>
      <section className={s.organizationCard} aria-labelledby="organization-about-heading">
        <h2 id="organization-about-heading">About</h2>
        <DocumentBody nodes={content.intro} onFollow={onFollow}/>
      </section>
      {mission && <section className={`${s.organizationCard} ${s.missionCard}`} aria-labelledby={mission.heading.id}><DocumentBody nodes={[mission.heading, ...mission.body]} onFollow={onFollow}/></section>}
    </div>
    {values && cards && <section className={s.values} aria-labelledby={values.heading.id}><DocumentBody nodes={[values.heading, ...cards.intro]} onFollow={onFollow}/><div className={s.valueGrid}>{cards.sections.map((section, index) => <section key={section.heading.id ?? index} className={s.valueCard} aria-labelledby={section.heading.id}><DocumentBody nodes={[section.heading, ...section.body]} onFollow={onFollow}/></section>)}</div></section>}
    {content.sections.filter(section => section !== mission && section !== values).map((section, index) => <section key={index} className={s.prose}><DocumentBody nodes={[section.heading, ...section.body]} onFollow={onFollow}/></section>)}
  </div>;
}
export function useEditorialDocument(entry: EditorialEntry) {
  const [result, setResult] = useState<EditorialDocument | null>(loaded.get(entry.id) ?? null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    if (!loaded.has(entry.id)) {
      fetch(`/api/shielded-preview/editorial?id=${encodeURIComponent(entry.id)}`, { signal: controller.signal })
        .then(response => { if (!response.ok) throw new Error('Content unavailable'); return response.json() as Promise<EditorialDocument>; })
        .then(document => { loaded.set(entry.id, document); setResult(document); setFailed(false); })
        .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    }
    return () => controller.abort();
  }, [entry.id, attempt]);
  return { result, failed, retry: () => { setFailed(false); setAttempt(value => value + 1); } };
}

function Reader({ entry, backHref, backLabel, onFollow, embedded = false, contactForm }: { entry: EditorialEntry; backHref?: string; backLabel: string; onFollow: Follow; embedded?: boolean; contactForm?: ContactFormController }) {
  const { result, failed, retry } = useEditorialDocument(entry);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus({ preventScroll: true }); }, [entry.id]);
  useEffect(() => {
    if (!result) return;
    const frame = requestAnimationFrame(() => {
      let id = '';
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [result]);
  const portrait = entry.id.startsWith('board-') ? board.find(person => `board-${person.id}` === entry.id) : null;
  const related = editorialCatalog.filter(item => item.id !== entry.id && item.view === 'blog' && item.projects.some(project => entry.projects.includes(project))).slice(0, 3);
  const source = safeEditorialUrl(entry.source);
  const hasSeparateFaq = embedded && entry.category === 'Guide & FAQ';
  const headings = hasSeparateFaq ? entry.headings.filter(heading => heading.level === 2 && heading.id !== 'frequently-asked-questions-faq') : entry.headings;
  const Title = embedded ? 'h2' : 'h1';
  return <article className={s.reader} data-layout={entry.id === 'organization' ? 'organization' : entry.view === 'about' && entry.id !== 'privacy' ? 'institutional' : 'article'} aria-labelledby="editorial-title">
    <header className={s.readerHeader}>
      {backHref && <EditorialLink href={backHref} onFollow={onFollow} className={s.back}><EditorialArrow back/>{backLabel}</EditorialLink>}
      <div className={s.titleLine}>
        {portrait && <img src={portrait.portrait} width={72} height={72} alt="" className={s.portrait}/> /* eslint-disable-line @next/next/no-img-element */}
        <div><Title className={s.readerTitle} id="editorial-title" ref={title} tabIndex={-1}>{entry.title}</Title></div>
      </div>
      {entry.view === 'blog' && <p className={s.byline}>{entry.author}<span>·</span><DateLabel date={entry.publishedAt}/><span>·</span>{entry.minutes} min read</p>}
      {entry.id !== 'organization' && headings.length > 0 && <label className={s.mobileOutline}><span>On this page</span><select aria-label="Jump to a section" disabled={!result} defaultValue="" onChange={event => { if (event.target.value) window.location.hash = encodeURIComponent(event.target.value); }}><option value="" disabled>Choose a section</option>{headings.filter(h => h.level <= 3).map(h => <option key={h.id} value={h.id}>{h.title}</option>)}</select></label>}
    </header>
    <div className={s.readingColumn}>
      {entry.view === 'blog' && entry.image && <Image className={s.featured} src={entry.image.src} alt={entry.image.alt} width={entry.image.width} height={entry.image.height} sizes="(max-width: 1050px) 95vw, 70vw" priority/>}
      {entry.notice && <p className={s.notice}>{entry.notice}</p>}
      {entry.id === 'organization' && result ? <OrganizationBody nodes={result.body} onFollow={onFollow}/> : entry.id === 'contact' && contactForm ? <ContactForm controller={contactForm} onPrivacy={() => onFollow('?view=about&section=privacy')}/> : <div className={s.prose} aria-busy={!result && !failed}>
        {result ? <DocumentBody nodes={hasSeparateFaq ? faqContent(result).intro : result.body} onFollow={onFollow} actions={entry.view === 'about' && entry.id !== 'privacy'}/> : failed ? <div role="alert"><p>This document could not be loaded.</p><button onClick={retry}>Try again</button></div> : <p role="status">Loading article…</p>}
      </div>}
      {hasSeparateFaq && <div className={s.inlineLinks}><EditorialLink href={projectHref(entry.projects[0], 'faq', entry.id)} onFollow={onFollow}>Frequently asked questions<EditorialArrow/></EditorialLink></div>}

    </div>
    {related.length > 0 && <section className={s.related}><h2>Related reading</h2><div className={s.relatedGrid}>{related.map(item => <EditorialLink key={item.id} href={editorialHref(item)} onFollow={onFollow}><span><small><DateLabel date={item.publishedAt}/></small>{item.title}</span><EditorialArrow/></EditorialLink>)}</div></section>}
    <aside className={s.readerAside}>
      <div className={s.readerAsideContent}>
      {entry.id === 'contact' && <div className={s.contactAside}><h2>Email & social</h2><a href="mailto:info@shieldedlabs.net">info@shieldedlabs.net</a><a href="https://x.com/ShieldedLabs" target="_blank" rel="noopener noreferrer">Shielded Labs on X<EditorialArrow external/></a></div>}
      {entry.id !== 'organization' && headings.length > 0 && <nav aria-label="On this page" className={s.outline}><h2>On this page</h2>{headings.filter(h => h.level <= 3).map(h => <a key={h.id} href={`#${h.id}`} data-level={h.level}>{h.title}</a>)}</nav>}
      {!embedded && entry.projects.length > 0 && <div className={s.context}><h2>Project</h2>{entry.projects.map(id => <EditorialLink key={id} href={`?view=projects&project=${id}`} onFollow={onFollow}>{projects.find(p => p.id === id)?.name}<EditorialArrow/></EditorialLink>)}</div>}
      {entry.id !== 'contact' && <div className={s.source}><h2>Source</h2>{entry.view !== 'blog' && <p>{entry.author}</p>}{entry.dateKind !== 'retrieved' && entry.view !== 'blog' && <p>Source updated <DateLabel date={entry.updatedAt}/></p>}{entry.view === 'blog' && entry.updatedAt.slice(0, 10) !== entry.publishedAt.slice(0, 10) && <p>Updated <DateLabel date={entry.updatedAt}/></p>}<p>Retrieved <DateLabel date={entry.observedAt}/></p>{source && <a href={source} target="_blank" rel="noopener noreferrer">Original source<EditorialArrow external/></a>}</div>}
      </div>
    </aside>
  </article>;
}

export function ProjectDocument({ entry, onFollow }: { entry: EditorialEntry; onFollow: Follow }) {
  const simulator = simulators.find(item => item.id === entry.id);
  const backHref = projectHref(entry.projects[0], 'resources');
  return <div className={s.editorial}>{simulator
    ? <SimulatorView key={entry.id} tool={simulator} onFollow={onFollow} backHref={backHref} embedded/>
    : <Reader key={entry.id} entry={entry} onFollow={onFollow} backHref={backHref} backLabel="Research & guides" embedded/>}</div>;
}

export default function Editorial({ view, section, record, onFollow }: { view: EditorialView; section: string | null; record: string | null; onFollow: Follow }) {
  const [query, setQuery] = useState('');
  const [contactForm] = useState(createContactFormController);
  const listTitle = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const readQuery = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === view) setQuery(params.get('q') ?? '');
    };
    const timer = setTimeout(readQuery, 0);
    window.addEventListener('popstate', readQuery);
    window.addEventListener('shielded:navigate', readQuery);
    return () => { clearTimeout(timer); window.removeEventListener('popstate', readQuery); window.removeEventListener('shielded:navigate', readQuery); };
  }, [view]);
  useEffect(() => { if (!record) listTitle.current?.focus({ preventScroll: true }); }, [record, section]);
  function search(value: string) {
    setQuery(value);
    window.history.replaceState(null, '', editorialListHref(view, current, value));
  }
  const active = section ?? (view === 'about' ? 'organization' : 'all');
  const menu = view === 'blog' ? editorialCategories.map(label => ({ id: categoryId(label), label })) : view === 'resources' ? [{ id: 'all', label: 'All resources' }, { id: 'simulators', label: 'Simulators' }, ...projects.map(p => ({ id: p.id, label: p.name }))] : aboutSections;
  const current = menu.some(item => item.id === active) ? active : menu[0].id;
  const entry = editorialCatalog.find(item => item.view === view && item.id === (record ?? (view === 'about' && current !== 'board' ? current : '')));
  const simulator = entry ? simulators.find(item => item.id === entry.id) : undefined;
  const allEntries = editorialCatalog.filter(item => item.view === view && (view === 'blog' ? current === 'all' || categoryId(item.category) === current : view === 'resources' ? current === 'all' || (current === 'simulators' ? item.category === 'Simulator' : item.projects.includes(current)) : false));
  if (view === 'resources') allEntries.sort((a, b) => projects.findIndex(p => p.id === a.projects[0]) - projects.findIndex(p => p.id === b.projects[0]) || ['Guide', 'Research guide', 'Guide & FAQ', 'FAQ', 'Roadmap', 'Technical reference', 'Simulator'].indexOf(a.category) - ['Guide', 'Research guide', 'Guide & FAQ', 'FAQ', 'Roadmap', 'Technical reference', 'Simulator'].indexOf(b.category));
  const rows = allEntries.filter(item => `${item.title} ${item.author} ${item.summary} ${item.headings.map(h => h.title).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()));
  const baseHref = editorialListHref(view, current, query);
  const compactBlogList = view === 'blog' && !record;
  const navigation = <SectionMenu label={view === 'blog' ? 'Blog categories' : view === 'resources' ? 'Resource projects' : 'About navigation'} items={menu} value={current} onChange={id => { setQuery(''); onFollow(`?view=${view}&section=${id}`); }}/>;
  const searchInput = <label className={s.searchField}><span className={s.srOnly}>Search {view === 'blog' ? 'articles' : 'resources'}</span><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></svg><input type="search" aria-label={view === 'blog' ? 'Search articles' : 'Search resources'} placeholder={view === 'blog' ? 'Search articles…' : 'Find a guide or question…'} value={query} onChange={event => search(event.target.value)}/></label>;
  const resultCount = <p className={query.trim() ? s.searchStatus : s.srOnly} role="status">{rows.length} {view === 'blog' ? rows.length === 1 ? 'article' : 'articles' : rows.length === 1 ? 'resource' : 'resources'}</p>;
  return <div className={s.editorial}>
    {compactBlogList ? <div className={s.blogTools}>{navigation}{searchInput}</div> : navigation}
    {simulator ? <SimulatorView key={simulator.id} tool={simulator} backHref={baseHref} onFollow={onFollow}/> : entry ? <Reader key={entry.id} entry={entry} contactForm={contactForm} backHref={view === 'about' && !entry.id.startsWith('board-') && entry.id !== 'cryptographer' ? undefined : baseHref} backLabel={view === 'about' ? entry.id.startsWith('board-') ? 'Board of Directors' : entry.id === 'cryptographer' ? 'Careers' : 'Overview' : view === 'blog' ? 'Articles' : 'Resources'} onFollow={onFollow}/> : record ? <div className={s.empty}><h1>Document not found</h1><EditorialLink href={baseHref} onFollow={onFollow}>Return to {view}<EditorialArrow/></EditorialLink></div> : view === 'about' ? <section aria-label="Board of Directors"><h1 className={s.srOnly} ref={listTitle} tabIndex={-1}>Board of Directors</h1><div className={s.board}>{board.map(person => <EditorialLink key={person.id} className={s.boardMember} href={`?view=about&section=board&record=board-${person.id}`} onFollow={onFollow}><Image src={person.portrait} width={60} height={60} alt="" unoptimized/><span>{person.name}</span><EditorialArrow/></EditorialLink>)}</div></section> : <>
      <h1 className={s.srOnly} ref={listTitle} tabIndex={-1}>{view === 'blog' ? 'Blog' : 'Project resources'}</h1>
      {compactBlogList ? resultCount : <div className={s.listTools}>{resultCount}{searchInput}</div>}
      <div className={view === 'blog' ? s.articleList : s.list}>{rows.map(item => <EntryCard key={item.id} entry={item} section={current} query={query} onFollow={onFollow}/>)}</div>
      {!rows.length && <div className={s.empty}><p>No matching {view === 'blog' ? 'articles' : 'resources'}.</p><button onClick={() => search('')}>Clear search</button></div>}
    </>}
  </div>;
}
