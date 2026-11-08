'use client';

import type { ReactNode } from 'react';
import { debateHref, type Debate } from '@/lib/shielded-preview/transparency/debates';
import { evidenceKinds, evidenceLabel, type EvidenceKind } from '@/lib/shielded-preview/transparency/evidence';
import type { Disclosure } from '@/lib/shielded-preview/transparency/involvement';
import t from './transparency.module.css';

export const POLICY_HREF = '?view=governance&section=transparency#editorial-policy';
export const day = (value: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));

const icons: Record<EvidenceKind, ReactNode> = {
  fact: <><path d="m20 7-11 11-5-5"/></>,
  record: <><path d="M7 3h7l4 4v14H7Z"/><path d="M14 3v4h4M10 12h5m-5 4h5"/></>,
  position: <><path d="M12 3 4.5 6v6c0 4.6 3.4 7.7 7.5 9 4.1-1.3 7.5-4.4 7.5-9V6Z"/><path d="M12 3v18" opacity=".5"/></>,
  community: <><path d="M4 5h16v11H9l-5 4Z"/></>,
  press: <><path d="M4 5h13v14H6a2 2 0 0 1-2-2Z"/><path d="M17 9h3v8a2 2 0 0 1-2 2M8 9h5m-5 4h5"/></>,
};
export function KindIcon({ kind }: { kind: EvidenceKind }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[kind]}</svg>;
}
export function ExternalMark() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>;
}
function Arrow() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>;
}

/** The mark every claim carries: what kind of evidence stands behind it. */
export function EvidenceTag({ kind, label, small }: { kind: EvidenceKind; label?: string; small?: boolean }) {
  return <span className={`${t.tag}${small ? ` ${t.tagSmall}` : ''}`} data-kind={kind}><KindIcon kind={kind}/>{label ?? evidenceLabel(kind)}</span>;
}

/** The key to the marks, shown where the marks are used. */
export function EvidenceKey() {
  return <ul className={t.key} aria-label="How content is marked">{evidenceKinds.map(item => <li key={item.kind}><EvidenceTag kind={item.kind}/><span>{item.meaning}</span></li>)}</ul>;
}

/** Marks a statement as Shielded Labs’ own view, linking to how the portal labels positions. */
export function PositionSeal({ label = 'Shielded Labs position' }: { label?: string }) {
  return <a className={t.sealLink} href={POLICY_HREF} title="Shielded Labs’ own statement, not neutral reporting. See how this portal marks content."><EvidenceTag kind="position" label={label}/></a>;
}

/** States, from evidence only, what a ZIP has to do with Shielded Labs. */
export function ZipDisclosure({ disclosure }: { disclosure: Disclosure }) {
  const { people, namedInHeader, created, projects } = disclosure;
  return <div className={t.disclosure} role="note">
    <div className={t.disclosureTags}>{people.length > 0 && <PositionSeal label="Shielded Labs authors"/>}{projects.length > 0 && <EvidenceTag kind="position" label="Listed by Shielded Labs"/>}<EvidenceTag kind="record" label="From the ZIP header"/></div>
    <p>
      {people.length > 0 && <>{people.length === 1 ? 'Owner' : 'Owners'} on the Shielded Labs team page: <strong>{people.join(', ')}</strong>.{namedInHeader ? ' The header names Shielded Labs.' : ''} </>}
      {projects.length > 0 && <>Listed on the {projects.map(project => project.name).join(' and ')} project {projects.length === 1 ? 'page' : 'pages'}{people.length ? '' : '; its owners are not on the team page'}. </>}
      {created && <>Document created in {created.slice(0, 4)}. </>}
      <a href={POLICY_HREF}>How this portal marks involvement</a>
    </p>
  </div>;
}

/** A pointer from a record to the debate it belongs to, on the Transparency page. */
export function DebateLink({ debate }: { debate: Debate }) {
  const points = debate.sides.flatMap(side => side.points);
  return <a className={t.debateLink} href={debateHref(debate)}>
    <span><strong>Debated: {debate.title}</strong><small>{debate.sides.length} positions · {points.filter(point => !point.shieldedLabs).length} community and press sources · {points.filter(point => point.shieldedLabs).length} from Shielded Labs</small></span><Arrow/>
  </a>;
}
