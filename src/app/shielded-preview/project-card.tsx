'use client';

import type { ReactNode } from 'react';
import type { Project } from '@/lib/shielded-preview/content';
import { projectPublications, publicationQuote } from '@/lib/shielded-preview/project-publications';
import { projectLastCommit, projectShortcuts, projectSignal } from '@/lib/shielded-preview/project-summary';
import type { Repository } from '@/lib/shielded-preview/types';
import { EditorialLink } from './editorial';
import { ProjectLink } from './project-detail';
import s from './project-collection.module.css';

function DateStamp({ date }: { date: string }) {
  return <time dateTime={date}>{new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date))}</time>;
}

export default function ProjectCard({ item, repositories, glyph, arrow, onSelect, onFollow, heading: Heading = 'h2' }: {
  item: Project; repositories: readonly Repository[]; glyph: ReactNode; arrow: ReactNode; heading?: 'h2' | 'h3';
  onSelect: (item: Project) => void; onFollow: (href: string) => void;
}) {
  const publication = projectPublications[item.id];
  const signal = projectSignal(item);
  const commit = projectLastCommit(item, repositories);
  const shortcuts = projectShortcuts(item);
  return <article className={s.card}>
    <ProjectLink className={s.cardLink} project={item} onSelect={onSelect}>
      <div className={s.heading}>{glyph}<Heading>{item.name}</Heading>{arrow}</div>
    </ProjectLink>
    <p className={s.quote}><q cite={publication.presentation.source}>{publicationQuote(publication.presentation)}</q></p>
    {signal && <div className={s.signal}>
      <span className={s.signalLabel}>{signal.label}{signal.date && <> · <DateStamp date={signal.date}/></>}</span>
      <span className={s.signalText}>{signal.quotedFrom ? <q cite={signal.quotedFrom}>{signal.text}</q> : signal.text}</span>
      {signal.detail && <small>Published window · {signal.detail}</small>}
    </div>}
    <div className={s.footer}>
      <span className={s.status}>{publication.badge?.text ?? item.category}</span>
      {commit && <span className={s.commit}>Last commit <DateStamp date={commit.date}/>{commit.fork ? ' · fork' : ''}</span>}
    </div>
    <nav className={s.shortcuts} aria-label={`${item.name} shortcuts`}>
      {shortcuts.map(shortcut => <EditorialLink key={shortcut.label} href={shortcut.href} onFollow={onFollow} className={s.shortcut}>{shortcut.label}{shortcut.count !== null && <span>{shortcut.count}</span>}</EditorialLink>)}
    </nav>
  </article>;
}
