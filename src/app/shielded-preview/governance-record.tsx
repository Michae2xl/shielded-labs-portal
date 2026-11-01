'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import s from './governance-record.module.css';

type RecordLayoutProps = {
  title: string;
  context: string;
  subtitle: string;
  metrics: ReactNode;
  children: ReactNode;
  sources: ReactNode;
  sections: { label: string; id: string }[];
  backLabel: string;
  onBack: () => void;
  idPrefix?: string;
  portrait?: ReactNode;
};

export default function GovernanceRecord({ title, context, subtitle, metrics, children, sources, sections, backLabel, onBack, idPrefix = 'governance', portrait }: RecordLayoutProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [title]);

  return <article className={s.page} aria-label={`${context}: ${title}`}>
    <div className={s.recordNav}>
      <button onClick={onBack}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg>{backLabel}</button>
      <nav className={s.sectionNav} aria-label="Record sections">
        {sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.label}</a>)}
        <a href={`#${idPrefix}-sources`}>Sources</a>
      </nav>
    </div>
    <header className={s.intro}>
      <div className={portrait ? s.identity : undefined}>
      {portrait}
      <div>
      <h1 id={`${idPrefix}-record-title`} ref={heading} tabIndex={-1}>{title}</h1>
      {subtitle && subtitle.trim().toLowerCase() !== title.trim().toLowerCase() && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      </div>

    </header>
    <section className={s.statusPanel} aria-label="Record at a glance">{metrics}</section>
    <div className={s.body}>{children}</div>
    <aside className={s.sources} id={`${idPrefix}-sources`} aria-labelledby={`${idPrefix}-sources-title`}>
      <h2 id={`${idPrefix}-sources-title`}>Sources & context</h2>
      {sources}
    </aside>

  </article>;
}
