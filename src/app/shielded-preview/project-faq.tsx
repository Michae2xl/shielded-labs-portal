'use client';

import { useEffect, useRef, useState } from 'react';
import { faqContent, faqTopics, matchesFaq } from '@/lib/shielded-preview/editorial/faq';
import type { EditorialEntry } from '@/lib/shielded-preview/editorial/types';
import { projectHref } from '@/lib/shielded-preview/project-navigation';
import { DocumentBody, useEditorialDocument } from './editorial';
import ContextNotice from './context-notice';
import prose from './editorial.module.css';
import s from './project-faq.module.css';

const noTopics: (typeof faqTopics)[string] = [];

function CopyAnswerLink({ href }: { href: string }) {
  const [copied, setCopied] = useState(false);
  const [manualLink, setManualLink] = useState('');

  async function copy() {
    const link = new URL(href, window.location.href).href;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setManualLink('');
    } catch {
      setCopied(false);
      setManualLink(link);
    }
  }

  return <div className={s.answerActions}>
    <button type="button" className={s.answerLink} onClick={copy} aria-label={copied ? 'Link copied' : 'Copy answer link'}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{copied ? <path d="m5 12 4 4L20 5"/> : <><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>}</svg>
      <span role="status">{copied ? 'Link copied' : 'Copy answer link'}</span>
    </button>
    {manualLink && <label className={s.manualLink}><span>Copy this link:</span><input aria-label="Answer link" readOnly value={manualLink} onFocus={event => event.currentTarget.select()}/></label>}
  </div>;
}

export default function ProjectFaq({ entry, onFollow }: { entry: EditorialEntry; onFollow: (href: string) => void }) {
  const { result, failed, retry } = useEditorialDocument(entry);
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const scrollTarget = useRef<string | null>(null);
  const topics = faqTopics[entry.id] ?? noTopics;
  const questions = result ? faqContent(result).questions : [];

  useEffect(() => {
    function readLocation() {
      const params = new URLSearchParams(window.location.search);
      let hash = '';
      try { hash = decodeURIComponent(window.location.hash.slice(1)); } catch { /* Ignore malformed saved anchors. */ }
      const question = result && faqContent(result).questions.find(item => item.id === hash);
      const savedQuery = params.get('q') ?? '';
      const savedTopic = topics.some(item => item.id === params.get('topic')) ? params.get('topic')! : 'all';
      const outsideFilter = question && (!matchesFaq(question, savedQuery) || (savedTopic !== 'all' && question.topic !== savedTopic));
      setQuery(outsideFilter ? '' : savedQuery);
      setTopic(outsideFilter ? 'all' : savedTopic);
      setOpenId(question?.id ?? null);
      scrollTarget.current = question?.id ?? null;
    }
    readLocation();
    window.addEventListener('hashchange', readLocation);
    window.addEventListener('popstate', readLocation);
    window.addEventListener('shielded:navigate', readLocation);
    return () => {
      window.removeEventListener('hashchange', readLocation);
      window.removeEventListener('popstate', readLocation);
      window.removeEventListener('shielded:navigate', readLocation);
    };
  }, [result, topics]);

  useEffect(() => {
    if (!openId || scrollTarget.current !== openId) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(openId)?.scrollIntoView({ block: 'start' });
      scrollTarget.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [openId]);

  function filter(nextQuery: string, nextTopic: string) {
    setQuery(nextQuery); setTopic(nextTopic); setOpenId(null);
    const params = new URLSearchParams(window.location.search);
    if (nextQuery) params.set('q', nextQuery); else params.delete('q');
    if (nextTopic !== 'all') params.set('topic', nextTopic); else params.delete('topic');
    window.history.replaceState(null, '', `?${params}`);
  }

  function toggle(id: string) {
    const next = openId === id ? null : id;
    setOpenId(next);
    window.history.replaceState(null, '', `${window.location.search}${next ? `#${encodeURIComponent(next)}` : ''}`);
  }

  const visible = questions.filter(item => (topic === 'all' || topic === item.topic) && matchesFaq(item, query));
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return <section className={s.faq} id="frequently-asked-questions-faq" aria-labelledby="project-panel-heading">
    <header className={s.header}>
      <h2 id="project-panel-heading" tabIndex={-1}>Frequently asked questions</h2>
      <label className={s.search}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></svg>
        <input type="search" aria-label="Search questions and answers" aria-controls="faq-questions" placeholder="Find an answer…" value={query} onChange={event => filter(event.target.value, topic)}/>
      </label>
    </header>
    <div className={s.layout}>
      <nav className={s.topics} aria-label="FAQ topics">
        <button type="button" aria-pressed={topic === 'all'} aria-controls="faq-questions" onClick={() => filter(query, 'all')}>All topics</button>
        {topics.map(item => <button type="button" key={item.id} aria-pressed={topic === item.id} aria-controls="faq-questions" onClick={() => filter(query, item.id)}>{item.label}</button>)}
      </nav>
      <div className={s.questions} id="faq-questions" aria-busy={!result && !failed}>
        {!result ? failed ? <div role="alert" className={s.empty}><p>Questions could not be loaded.</p><button type="button" onClick={retry}>Try again</button></div> : <p role="status">Loading questions…</p> : <>
          <p className={query.trim() && visible.length ? s.count : s.srOnly} role="status">{visible.length} {visible.length === 1 ? 'question' : 'questions'}{query.trim() ? ' found' : ''}</p>
          {visible.length > 0 && <div className={s.accordion}>{visible.map(item => {
            const expanded = openId === item.id;
            return <article key={item.id} id={item.id} className={s.question} data-open={expanded || undefined}>
              <h3><button type="button" id={`${item.id}-button`} aria-expanded={expanded} aria-controls={`${item.id}-answer`} onClick={() => toggle(item.id)}>
                <span>{item.title}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 12h14"/>{!expanded && <path d="M12 5v14"/>}</svg>
              </button></h3>
              <div id={`${item.id}-answer`} role="region" aria-labelledby={`${item.id}-button`} hidden={!expanded} className={s.answer}>
                <div className={prose.prose}><DocumentBody nodes={item.body} onFollow={onFollow}/></div>
                {expanded && <CopyAnswerLink href={`${projectHref(entry.projects[0], 'faq', entry.id)}#${encodeURIComponent(item.id)}`}/>}
              </div>
            </article>;
          })}</div>}
          {!visible.length && <div className={s.empty}><h3>No matching questions</h3><p>Try another term or browse all topics.</p><button type="button" onClick={() => filter('', 'all')}>Clear filters</button></div>}
        </>}
      </div>
    </div>
    {entry.notice && <ContextNotice>{entry.notice}</ContextNotice>}
    <footer className={s.source}><a href={entry.source} target="_blank" rel="noopener noreferrer">Shielded Labs · Original FAQ <span aria-hidden="true">↗</span></a><span>Source updated <time dateTime={entry.updatedAt}>{date.format(new Date(entry.updatedAt))}</time></span></footer>
  </section>;
}
