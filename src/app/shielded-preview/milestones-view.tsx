'use client';

import type { MouseEvent, ReactNode, Ref } from 'react';
import { MILESTONES_REVIEWED } from '@/lib/shielded-preview/content';
import { directoryHref, milestoneProject, milestoneStories, milestoneYears } from '@/lib/shielded-preview/directory';
import s from './milestones.module.css';

export type Navigate = (section: string, record?: string) => void;
const dayMonth = (date: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(date));
const fullDate = (date: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));

export function Arrow({ back = false, external = false }: { back?: boolean; external?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d={external ? 'M6 18 18 6M6 6h12v12' : back ? 'M20 12H4m6-6-6 6 6 6' : 'M4 12h16m-6-6 6 6-6 6'}/></svg>;
}
export function ViewLink({ section, record, onNavigate, className, children }: { section: string; record?: string; onNavigate: Navigate; className: string; children: ReactNode }) {
  function click(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(section, record);
  }
  return <a className={className} href={directoryHref('impact', section, record)} onClick={click}>{children}</a>;
}

export default function MilestonesView({ group, headingRef, onNavigate }: { group: string; headingRef: Ref<HTMLHeadingElement>; onNavigate: Navigate }) {
  return <>
    <h1 className={s.srOnly} ref={headingRef} tabIndex={-1}>Milestones{group === 'all' ? '' : ` · ${group[0].toUpperCase()}${group.slice(1)}`}</h1>

    {group === 'all' && <div className={s.stories}>{milestoneStories().map(story => <ViewLink key={story.id} section={story.group} onNavigate={onNavigate} className={s.story}>
      <div className={s.storyHeading}><h2>{story.title}</h2><Arrow/></div>
      <p className={s.stat}><strong>{story.value}</strong><span>{story.label}</span></p>
      {story.steps.length > 0 && <div className={s.steps} aria-hidden="true">{story.steps.map((done, index) => <span key={index} data-done={done}/>)}</div>}
      <p className={s.period}>{story.period}</p>
      <p className={s.next}><span>{story.next.label}</span>{story.next.quotedFrom ? <q cite={story.next.quotedFrom}>{story.next.text}</q> : story.next.text}{story.next.detail && <small>{story.next.detail}</small>}</p>
    </ViewLink>)}</div>}

    <div className={s.years}>{milestoneYears(group).map(({ year, entries }) => <section key={year} className={s.year} aria-labelledby={`milestones-${year}`}>
      <h2 id={`milestones-${year}`}>{year}<span>{entries.length} {entries.length === 1 ? 'milestone' : 'milestones'}</span></h2>
      <ol className={s.rail}>{entries.map(item => <li key={item.date}><ViewLink section={group} record={`milestone:${item.date}`} onNavigate={onNavigate} className={s.entry}>
        <time className={s.date} dateTime={item.date} aria-label={fullDate(item.date)}>{dayMonth(item.date)}</time>
        <span className={s.marker} data-type={item.type} aria-hidden="true"/>
        <div className={s.copy}>
          <span className={s.eyebrow}>{[milestoneProject(item).name, group === 'all' ? item.type : null, item.step].filter(Boolean).join(' · ')}</span>
          <h3>{item.name}</h3>
          <p>{item.detail}</p>
        </div>
        <Arrow/>
      </ViewLink></li>)}</ol>
    </section>)}</div>

    <p className={s.footnote}>Sources reviewed {fullDate(MILESTONES_REVIEWED)}</p>
  </>;
}
