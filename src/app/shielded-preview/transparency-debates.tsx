'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { debates, voiceCounts, type Debate, type Voice } from '@/lib/shielded-preview/transparency/debates';
import type { SortOrder } from '@/lib/shielded-preview/transparency/comments';
import { EvidenceTag, KindIcon, day } from './transparency';
import { CommentsTable } from './transparency-comments';
import { VotesCard } from './transparency-votes';
import t from './transparency.module.css';

const voiceNames: Record<Voice, string> = { all: 'All voices', position: 'Shielded Labs', community: 'Community', press: 'Press' };
const hasVoice = (debate: Debate, voice: Voice) => voiceCounts(debate).some(item => item.voice === voice);
const topicInHash = () => debates.find(debate => decodeURIComponent(location.hash.slice(1)) === `debate-${debate.id}`)?.id;

/** The debated topics in one card: a tab per topic, a filter for who is speaking, the measured sentiment, then every comment in a table filtered by direction. */
export function DebateExplorer() {
  const [topic, setTopic] = useState<Debate['id']>(debates[0].id);
  const [voice, setVoice] = useState<Voice>('all');
  const [side, setSide] = useState<string | null>(null);
  const [order, setOrder] = useState<SortOrder>('newest');
  const [page, setPage] = useState(1);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  // A link such as #debate-crosslink, from a ZIP or project page, opens that topic.
  useEffect(() => {
    const follow = () => { const id = topicInHash(); if (id) { setTopic(id); setVoice('all'); setSide(null); setPage(1); } };
    follow();
    window.addEventListener('shielded:navigate', follow);
    window.addEventListener('hashchange', follow);
    return () => { window.removeEventListener('shielded:navigate', follow); window.removeEventListener('hashchange', follow); };
  }, []);

  const debate = debates.find(item => item.id === topic) ?? debates[0];
  const counts = voiceCounts(debate);
  const active = hasVoice(debate, voice) ? voice : 'all';
  const select = (next: Debate) => { setTopic(next.id); setSide(null); setPage(1); if (!hasVoice(next, voice)) setVoice('all'); };
  const chooseVoice = (next: Voice) => { setVoice(next); setPage(1); };
  const chooseSide = (next: string | null) => { setSide(next); setPage(1); };
  const chooseOrder = (next: SortOrder) => { setOrder(next); setPage(1); };
  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = debates.length - 1;
    const moves: Record<string, number> = { ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(debates[moves[event.key]]);
    tabs.current[moves[event.key]]?.focus();
  };

  return <section className={t.explorer} aria-labelledby="debated-topics-title">
    {debates.map(item => <span key={item.id} id={`debate-${item.id}`} className={t.anchor} aria-hidden="true"/>)}
    <h3 id="debated-topics-title" className={t.srOnly}>Debated topics</h3>
    <div className={t.controls}>
      <div className={t.tabs} role="tablist" aria-label="Debated topics">
        {debates.map((item, index) => <button key={item.id} ref={element => { tabs.current[index] = element; }} type="button" role="tab" id={`debate-tab-${item.id}`} aria-selected={item.id === debate.id} aria-controls="debate-panel" tabIndex={item.id === debate.id ? 0 : -1} title={item.title === item.tab ? undefined : item.title} onClick={() => select(item)} onKeyDown={event => onKey(event, index)}>
          {item.tab}
        </button>)}
      </div>
      <div className={t.voices} role="group" aria-label="Filter arguments by who is speaking">
        <span className={t.voicesLabel} aria-hidden="true">Who is speaking</span>
        {counts.map(item => <button key={item.voice} type="button" aria-pressed={item.voice === active} data-kind={item.voice} onClick={() => chooseVoice(item.voice)}>
          {item.voice !== 'all' && <KindIcon kind={item.voice}/>}{voiceNames[item.voice]}<span>{item.count}</span>
        </button>)}
      </div>
    </div>
    <div role="tabpanel" id="debate-panel" aria-labelledby={`debate-tab-${debate.id}`}>
      <header className={t.debateHead}>
        <p className={t.question}>{debate.question}</p>
        <div className={t.standing}><EvidenceTag kind="record" label="Where it stands" small/><p>{debate.status}</p></div>
      </header>
      <VotesCard debate={debate}/>
      <CommentsTable debate={debate} voice={active} side={side} order={order} page={page} onOrder={chooseOrder} onPage={setPage} onSide={chooseSide}/>
      <p className={t.checked}>Sources checked on {day(debate.verifiedOn)}.</p>
    </div>
  </section>;
}
