'use client';

import GovernanceReferences from './governance-references';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import s from './governance-record.module.css';

type RecordLayoutProps = {
  title: string;
  context: string;
  subtitle: string;
  metrics: ReactNode;
  children: ReactNode;
  sources: ReactNode;
  sections: { label: string; id: string }[];
  /** Long documents list their headings beside the text instead of in the top bar. */
  outline?: { label: string; id: string; level?: number }[];
  /** A guide reads better at full width: its sources fold into a strip at the end instead of taking a column. */
  sourcesAtEnd?: boolean;
  backLabel: string;
  onBack: () => void;
  idPrefix?: string;
  portrait?: ReactNode;
};

export default function GovernanceRecord({ title, context, subtitle, metrics, children, sources, sections, outline, sourcesAtEnd = false, backLabel, onBack, idPrefix = 'governance', portrait }: RecordLayoutProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [title]);
  const ids = sections.map(section => section.id).join(' ');
  // The tab of the section being read stays highlighted while the page scrolls under the sticky bar.
  useEffect(() => {
    const list = ids ? ids.split(' ') : [];
    if (!list.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // A section counts as read once its top passes just below the sticky bars.
      const line = (bar.current?.getBoundingClientRect().bottom ?? 0) + 32;
      setCurrent(list.reduce((active, id) => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= line ? id : active, list[0]));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [ids]);

  return <article className={s.page} data-wide={sourcesAtEnd || undefined} aria-label={`${context}: ${title}`}>
    <div className={s.recordNav} ref={bar}>
      <button onClick={onBack}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg><span className={s.backLabel}>{backLabel}</span></button>
      {sections.length > 0 && <nav className={s.sectionNav} aria-label="Record sections">
        {sections.map(section => <a key={section.id} href={`#${section.id}`} aria-current={current === section.id ? 'location' : undefined}>{section.label}</a>)}
        <a href={`#${idPrefix}-sources`}>Sources</a>
      </nav>}
    </div>
    <header className={s.intro}>
      <div className={portrait ? s.identity : undefined}>
      {portrait}
      <div>
      <h1 id={`${idPrefix}-record-title`} ref={heading} tabIndex={-1}>{title}</h1>
      {subtitle && subtitle.trim().toLowerCase() !== title.trim().toLowerCase() && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      </div>
      {outline && outline.length > 0 && <details className={s.mobileOutline}><summary>On this page</summary><nav aria-label="On this page">{outline.map(item => <a key={item.id} href={`#${item.id}`} data-level={item.level}>{item.label}</a>)}<a href={`#${idPrefix}-sources`}>Sources</a></nav></details>}

    </header>
    <section className={s.statusPanel} aria-label="Record at a glance">{metrics}</section>
    <div className={s.body}>{children}</div>
    {sourcesAtEnd ? <div className={s.sourcesEnd} id={`${idPrefix}-sources`}><GovernanceReferences><div className={s.sourceList}>{sources}</div></GovernanceReferences></div> : <aside className={s.sources} id={`${idPrefix}-sources`} aria-labelledby={`${idPrefix}-sources-title`}>
      {outline && outline.length > 0 && <nav className={s.outline} aria-label="On this page"><h2>On this page</h2>{outline.map(item => <a key={item.id} href={`#${item.id}`} data-level={item.level}>{item.label}</a>)}</nav>}
      <h2 id={`${idPrefix}-sources-title`}>Sources & context</h2>
      {sources}
    </aside>}

  </article>;
}
