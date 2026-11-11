'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import { sources, team } from '@/lib/shielded-preview/content';
import { directoryHref, personId, type Person } from '@/lib/shielded-preview/directory';
import { personProfile } from '@/lib/shielded-preview/team-profiles';
import portraitData from '@/lib/shielded-preview/team-portraits.json';
import type { Repository } from '@/lib/shielded-preview/types';
import { EditorialLink } from './editorial';
import s from './person-record.module.css';

type Navigate = (section: string, record?: string) => void;
const portraits = portraitData.portraits as Record<string, { src: string }>;
const fullDate = (date: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));

function Arrow({ external = false, back = false }: { external?: boolean; back?: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" style={back ? { transform: 'rotate(180deg)' } : undefined}><path d={external ? 'M6 18 18 6M6 6h12v12' : 'M4 12h16m-6-6 6 6-6 6'}/></svg>;
}
export function Portrait({ person, size = 52 }: { person: Person; size?: number }) {
  const src = portraits[personId(person)]?.src;
  return src
    ? <img className={s.portrait} src={src} width={size} height={size} style={{ width: size, height: size }} alt="" loading={size > 60 ? 'eager' : 'lazy'}/>
    : <span className={s.initials} style={{ width: size, height: size }} aria-hidden="true">{person.name.split(' ').slice(0, 2).map(word => word[0]).join('')}</span>;
}
function PageLink({ section, record, onNavigate, className, children }: { section: string; record?: string; onNavigate: Navigate; className: string; children: ReactNode }) {
  function click(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(section, record);
  }
  return <a className={className} href={directoryHref('people', section, record)} onClick={click}>{children}</a>;
}

export default function PersonRecord({ person, group, repositories, checkedAt, onNavigate, onFollow }: {
  person: Person; group: string; repositories?: Repository[]; checkedAt?: string; onNavigate: Navigate; onFollow: (href: string) => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [person.name]);
  const profile = personProfile(person, repositories, checkedAt);
  const colleagues = team.filter(other => other.group === person.group && other.name !== person.name);
  const hasRecords = Boolean(profile.bio || profile.activity || profile.articles.total || profile.zips.length);
  const showGroup = person.role !== person.group;

  return <article className={s.page} aria-labelledby="person-record-title">
    <PageLink section={group} onNavigate={onNavigate} className={s.back}><Arrow back/>{group === 'all' ? 'All team members' : `All ${group} team members`}</PageLink>

    <header className={s.header}>
      <Portrait person={person} size={96}/>
      <div className={s.identity}>
        <h1 id="person-record-title" ref={heading} tabIndex={-1}>{person.name}</h1>
        <p className={s.role}>{person.role}</p>
        {(showGroup || profile.boardHref) && <div className={s.tags}>
          {showGroup && <PageLink section={person.group.toLowerCase()} onNavigate={onNavigate} className={s.tag}>{person.group}</PageLink>}
          {profile.boardHref && <EditorialLink href={profile.boardHref} onFollow={onFollow} className={s.tag}>Board of Directors</EditorialLink>}
        </div>}
      </div>
      {profile.accounts.length > 0 && <div className={s.accounts} data-paired={profile.accounts.length > 1 || undefined}>{profile.accounts.map(account => <a key={account.label} className={s.account} href={account.href} target="_blank" rel="noopener noreferrer" aria-label={`${person.name} on ${account.label}: ${account.handle}`}><strong>{account.label}</strong><span>{account.handle}</span><Arrow external/></a>)}</div>}
    </header>

    <div className={s.grid} data-single={!hasRecords || undefined}>
      {hasRecords && <div className={s.column}>
        {profile.bio && <section className={s.card} aria-labelledby="person-about">
          <h2 id="person-about">About</h2>
          <blockquote cite={profile.bio.source}><p>{profile.bio.text}</p></blockquote>
          <div className={s.cardLinks}>
            <EditorialLink source href={profile.bio.source} onFollow={onFollow} className={s.cardLink}>From the Epoch announcement<Arrow/></EditorialLink>
            <EditorialLink href={`?view=projects&project=${profile.bio.project}`} onFollow={onFollow} className={s.cardLink}>Epoch project<Arrow/></EditorialLink>
          </div>
        </section>}
        {profile.activity && <section className={s.card} aria-labelledby="person-code">
          <h2 id="person-code">Code activity</h2>
          <ul className={s.rows}>{profile.activity.latest.map(commit => <li key={commit.sha}><EditorialLink href={commit.href} onFollow={onFollow} className={s.row}><time className={s.rowKey} dateTime={commit.date}>{fullDate(commit.date)}</time><span className={s.rowTitle}>{commit.title}<small>{commit.repositories}</small></span><Arrow/></EditorialLink></li>)}</ul>
          {profile.activity.href && <div className={s.cardLinks}><EditorialLink href={profile.activity.href} onFollow={onFollow} className={s.cardLink}>Open in Code activity<Arrow/></EditorialLink></div>}
        </section>}
        {profile.articles.total > 0 && <section className={s.card} aria-labelledby="person-articles">
          <div className={s.cardHeading}><h2 id="person-articles">Articles</h2><span>{profile.articles.total}</span></div>
          <ul className={s.rows}>{profile.articles.latest.map(article => <li key={article.href}><EditorialLink href={article.href} onFollow={onFollow} className={s.row}><time className={s.rowKey} dateTime={article.date}>{fullDate(article.date)}</time><span className={s.rowTitle}>{article.title}</span><Arrow/></EditorialLink></li>)}</ul>
          {profile.articles.total > profile.articles.latest.length && <div className={s.cardLinks}><EditorialLink href={profile.articles.allHref} onFollow={onFollow} className={s.cardLink}>All {profile.articles.total} articles<Arrow/></EditorialLink></div>}
        </section>}
        {profile.zips.length > 0 && <section className={s.card} aria-labelledby="person-zips">
          <div className={s.cardHeading}><h2 id="person-zips">ZIPs</h2><span>{profile.zips.length}</span></div>
          <ul className={s.rows}>{profile.zips.map(zip => <li key={zip.id}><EditorialLink href={zip.href} onFollow={onFollow} className={s.row}><span className={s.rowKey}>{zip.label}</span><span className={s.rowTitle}>{zip.title}{zip.opened ? <small>Open pull request · {fullDate(zip.opened)}</small> : zip.status !== zip.label && <small>{zip.status}</small>}</span><Arrow/></EditorialLink></li>)}</ul>
        </section>}
      </div>}

      <aside className={s.column}>
        {colleagues.length > 0 && <section className={s.card} aria-labelledby="person-team">
          <h2 id="person-team">Also in {person.group}</h2>
          <ul className={s.colleagues}>{colleagues.map(other => <li key={other.name}><PageLink section={group} record={`person:${personId(other)}`} onNavigate={onNavigate} className={s.colleague}><Portrait person={other} size={40}/><span><strong>{other.name}</strong><small>{other.role}</small></span><Arrow/></PageLink></li>)}</ul>
        </section>}
        <section className={s.note} aria-label="Where this profile comes from">
          <p>{profile.sourceNote}</p>
          {profile.announcement && <a href={profile.announcement.source} target="_blank" rel="noopener noreferrer">Announcement<Arrow external/></a>}
          <a href={sources.team} target="_blank" rel="noopener noreferrer">Official team<Arrow external/></a>
        </section>
      </aside>
    </div>
  </article>;
}
