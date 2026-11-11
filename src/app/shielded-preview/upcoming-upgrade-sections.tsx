'use client';

import type { ReactNode } from 'react';
import record from '@/lib/shielded-preview/governance-data/record.json';
import type { UpcomingUpgrade, UpgradeCandidate, UpgradeDocument } from '@/lib/shielded-preview/upcoming-upgrades';
import ContextNotice from './context-notice';
import { Link, type CollectionNavigate } from './governance-link';
import s from './upcoming-upgrade-sections.module.css';

const day = (value: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
const lastActivated = record.upgrades.find(upgrade => upgrade.name === 'NU7');

function External({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}<span aria-hidden="true"> ↗</span><span className={s.srOnly}> (external source)</span></a>;
}

function Document({ document, onNavigate }: { document: UpgradeDocument; onNavigate: CollectionNavigate }) {
  if (document.record) return <Link section="ZIPs" id={document.record} onNavigate={onNavigate}>{document.label}</Link>;
  if (document.portal) return <Link section="Voting" selection={{ lane: document.portal }} onNavigate={onNavigate}>{document.label}</Link>;
  if (document.url) return <External href={document.url}>{document.label}</External>;
  return <span>{document.label}</span>;
}

function Candidates({ title, items, onNavigate }: { title: string; items: UpgradeCandidate[]; onNavigate: CollectionNavigate }) {
  return <>
    <h3 className={s.groupTitle}>{title}<span>{items.length}</span></h3>
    <ul className={s.candidates}>{items.map(candidate => <li key={candidate.id} className={s.candidate}>
      <h4>{candidate.title}</h4>
      <p>{candidate.summary}</p>
      {candidate.note && <p className={s.note}>{candidate.note}</p>}
      <dl>
        <div><dt>Put forward by</dt><dd><External href={candidate.source}>{candidate.proposedBy}</External></dd></div>
        <div><dt>Specification</dt><dd className={s.documents}>{candidate.documents.map(document => <Document key={document.label} document={document} onNavigate={onNavigate}/>)}</dd></div>
      </dl>
    </li>)}</ul>
  </>;
}

/** The body of the record of an upgrade that is still being discussed: what is proposed, by whom, and what is decided. */
export default function UpcomingUpgradeSections({ upgrade, onNavigate }: { upgrade: UpcomingUpgrade; onNavigate: CollectionNavigate }) {
  const listed = upgrade.candidates.filter(candidate => candidate.standing === 'listed');
  const raised = upgrade.candidates.filter(candidate => candidate.standing === 'raised');
  return <>
    <section id="governance-proposed">
      <h2>What is proposed</h2>
      <p>{upgrade.summary}</p>
      {upgrade.disclosure && <ContextNotice className={s.disclosure}>{upgrade.disclosure}</ContextNotice>}
      <Candidates title={upgrade.listedHeading} items={listed} onNavigate={onNavigate}/>
      {raised.length > 0 && <Candidates title="Also raised for this upgrade" items={raised} onNavigate={onNavigate}/>}
    </section>
    <section id="governance-decided" className={s.decided}>
      <h2>What is decided</h2>
      <p>{upgrade.decided}</p>
      {lastActivated && <p>For NU7, the scope was set by a coinholder vote and community polls before activation. <Link section="Voting" id={`upgrade:${lastActivated.name}`} selection={{ lane: 'upgrades' }} onNavigate={onNavigate}>See the NU7 record</Link></p>}
    </section>
    {upgrade.views.length > 0 && <section id="governance-views">
      <h2>Views in the discussion</h2>
      <ul className={s.views}>{upgrade.views.map(view => <li key={view.url}>
        <div className={s.viewHead}><strong>{view.who}</strong><time dateTime={view.date}>{day(view.date)}</time></div>
        <p>{view.text}</p>
        <External href={view.url}>Read the post</External>
      </li>)}</ul>
      <p className={s.note}>A selection of posts from the thread, summarised here. Each one links to the original.</p>
    </section>}
  </>;
}
