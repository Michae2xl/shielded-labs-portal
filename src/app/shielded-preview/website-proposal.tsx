'use client';

import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import { REVIEWED, sources } from '@/lib/shielded-preview/content';
import { previewDestinationHref, siteEntrances, websiteHref, websiteMenu, websiteResponsibilities, websiteSuggestions, type PreviewDestination } from '@/lib/shielded-preview/website-proposal';
import RecordLayout from './governance-record';
import d from './directory.module.css';
import s from './website-proposal.module.css';

const reviewed = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(REVIEWED));
function Arrow({ external = false }: { external?: boolean }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d={external ? 'M6 18 18 6M6 6h12v12' : 'M4 12h16m-6-6 6 6-6 6'}/></svg>; }
function Stat({ label, children }: { label: string; children: ReactNode }) { return <div><span>{label}</span><strong>{children}</strong></div>; }
function Source({ href, children }: { href: string; children: ReactNode }) { return <a href={href} target="_blank" rel="noopener noreferrer">{children}<Arrow external/></a>; }
function follow(event: MouseEvent<HTMLAnchorElement>, action: () => void) { if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); action(); }

function PreviewLinks({ items, onExplore }: { items: PreviewDestination[]; onExplore: (destination: PreviewDestination) => void }) {
  return <div className={s.previewLinks}>{items.map(item => <a key={item.title} href={previewDestinationHref(item)} onClick={event => follow(event, () => onExplore(item))}><div><h3>{item.title}</h3><p>{item.description}</p></div><Arrow/></a>)}</div>;
}

export default function WebsiteProposal({ section, onNavigate, onExplore }: { section: string | null; onNavigate: (section: string) => void; onExplore: (destination: PreviewDestination) => void }) {
  const active = section ?? 'all';
  const suggestion = websiteSuggestions.find(item => item.id === active);
  const menu = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const nav = menu.current;
    const selected = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !selected) return;
    const reveal = () => { if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: selected.offsetLeft - (nav.clientWidth - selected.offsetWidth) / 2, behavior: 'instant' }); };
    reveal(); const observer = new ResizeObserver(reveal); observer.observe(nav);
    return () => observer.disconnect();
  }, [active]);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [active]);

  return <div className={`${d.directory} ${s.proposal}`}>
    <nav ref={menu} className={`${d.menu} ${s.menu}`} aria-label="Website proposal navigation">{websiteMenu.map(item => <button key={item.id} aria-current={active === item.id ? 'page' : undefined} onClick={() => onNavigate(item.id)}>{item.label}</button>)}</nav>

    {active === 'all' && <>
      <h1 className={d.srOnly} tabIndex={-1} ref={heading}>Website proposal</h1>
      <div className={s.suggestions}>{websiteSuggestions.map(item => <a key={item.id} className={s.suggestion} href={websiteHref(item.id)} onClick={event => follow(event, () => onNavigate(item.id))}><div><span className={s.phase}>{item.phase}</span><h2>{item.title}</h2><p>{item.summary}</p></div><Arrow/></a>)}</div>
      <a className={s.planLink} href={websiteHref('delivery')} onClick={event => follow(event, () => onNavigate('delivery'))}><div><h2>How this comes together</h2><p>Site structure, ongoing updates and the Community Lead’s responsibilities.</p></div><span>Delivery plan<Arrow/></span></a>
      <p className={s.note}>Recommendations · reviewed {reviewed}.</p>
    </>}

    {suggestion && <RecordLayout idPrefix="website" title={suggestion.title} context="Suggested improvement" subtitle={suggestion.summary}
      metrics={<><Stat label="Suggested phase">{suggestion.phase}</Stat><Stat label="Available here">{suggestion.preview}</Stat><Stat label="Next step">{suggestion.next}</Stat></>}
      sections={[{ label: 'Proposal', id: 'website-change' }, { label: 'Delivery checks', id: 'website-checks' }, { label: 'Explore', id: 'website-preview' }]}
      backLabel="All suggestions" onBack={() => onNavigate('all')}
      sources={<><p>Recommendations based on the {reviewed} review.</p>{suggestion.references.map(reference => <Source key={reference.url} href={reference.url}>{reference.title}</Source>)}<a className={s.planSource} href={websiteHref('delivery')} onClick={event => follow(event, () => onNavigate('delivery'))}>Delivery plan<Arrow/></a></>}
    >
      <section id="website-change"><h2>Proposed change</h2><p>{suggestion.action}</p><h3>From the review</h3><p>{suggestion.finding}</p></section>
      <section id="website-checks"><h2>Ready when</h2><ul className={s.checks}>{suggestion.checks.map(check => <li key={check}>{check}</li>)}</ul></section>
      <section id="website-preview"><h2>Related pages</h2><PreviewLinks items={suggestion.destinations} onExplore={onExplore}/></section>
    </RecordLayout>}

    {active === 'delivery' && <RecordLayout idPrefix="website" title="Delivery plan" context="Proposed operating model" subtitle="A clear structure for the site, with a practical routine for keeping it useful and accurate."
      metrics={<><Stat label="Scope">Website & governance</Stat><Stat label="Responsibilities">Six workstreams</Stat><Stat label="Publication">Editorial review</Stat></>}
      sections={[{ label: 'Site structure', id: 'website-structure' }, { label: 'Updates', id: 'website-updates' }, { label: 'Responsibilities', id: 'website-responsibilities' }]}
      backLabel="All suggestions" onBack={() => onNavigate('all')}
      sources={<><p>Reference material from OpenZcash and Shielded Labs informs these delivery recommendations.</p><Source href={sources.projects}>Shielded Labs projects</Source><Source href={sources.governance}>Shielded Labs governance</Source><Source href="https://openzcash.org/zcg/methodology">OpenZcash methodology</Source><div className={s.printAction}><button onClick={() => window.print()}>Print proposal<Arrow/></button></div></>}
    >
      <section id="website-structure"><h2>Three ways into the site</h2><PreviewLinks items={siteEntrances} onExplore={onExplore}/></section>
      <section id="website-updates"><h2>Keep information current</h2><dl className={s.workstreams}>
        <div><dt>Automatic data checks</dt><dd>While the portal is visible, it requests selected GitHub samples and public grant records every five minutes. Governance sources refresh while that area is open.</dd></div>
        <div><dt>Review before publication</dt><dd>Verify milestone status, attribution, outcomes and participation deadlines against primary sources.</dd></div>
        <div><dt>When a source is unavailable</dt><dd>Keep the original date on retained snapshots and make unavailable data visible. A failed check must not imply fresh evidence.</dd></div>
        <div><dt>Planned integrations</dt><dd>Signed webhooks, an editorial review queue and automatic event archiving are proposed additions.</dd></div>
      </dl></section>
      <section id="website-responsibilities"><h2>Community Lead responsibilities</h2><dl className={s.workstreams}>{websiteResponsibilities.map(item => <div key={item.title}><dt>{item.title}</dt><dd>{item.detail}</dd></div>)}</dl></section>
      <section className={s.printOnly}><h2>Suggested improvements</h2>{websiteSuggestions.map(item => <div key={item.id}><h3>{item.title}</h3><p>{item.action}</p><p>{item.phase} · Next step: {item.next}</p></div>)}</section>
    </RecordLayout>}

    {active !== 'all' && active !== 'delivery' && !suggestion && <section className={s.empty}><h1 ref={heading} tabIndex={-1}>Suggestion not found</h1><p>This suggestion is not available in the current proposal.</p><a href={websiteHref('all')} onClick={event => follow(event, () => onNavigate('all'))}>All suggestions<Arrow/></a></section>}
  </div>;
}
