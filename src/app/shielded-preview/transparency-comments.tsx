'use client';

import { useRef, type CSSProperties } from 'react';
import type { Debate, Voice } from '@/lib/shielded-preview/transparency/debates';
import { commentRows, directionCounts, filterRows, paginate, sortRows, type SortOrder } from '@/lib/shielded-preview/transparency/comments';
import { pointKind, sourceType, type Speaker } from '@/lib/shielded-preview/transparency/evidence';
import { EvidenceTag, ExternalMark, day } from './transparency';
import t from './transparency.module.css';

const speakerTags: Record<Speaker, string> = { position: 'Shielded Labs', community: 'Community', press: 'Press report' };
function SortMark() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 4v16m0 0-4-4m4 4 4-4M16 20V4m0 0-4 4m4-4 4 4"/></svg>;
}

type TableProps = { debate: Debate; voice: Voice; side: string | null; order: SortOrder; page: number; onOrder: (order: SortOrder) => void; onPage: (page: number) => void; onSide: (side: string | null) => void };

/** Every sourced comment on the topic, filtered by direction, a page at a time, newest first unless the reader flips it. */
export function CommentsTable({ debate, voice, side, order, page, onOrder, onPage, onSide }: TableProps) {
  const box = useRef<HTMLElement>(null);
  const view = paginate(sortRows(filterRows(commentRows(debate), voice, side), order), page);
  const counts = directionCounts(debate, voice);
  const go = (next: number) => { onPage(next); box.current?.scrollIntoView({ block: 'nearest' }); };
  return <section ref={box} className={`${t.block} ${t.comments}`} aria-labelledby={`comments-${debate.id}`}>
    <div className={t.tableBar}>
      <h4 id={`comments-${debate.id}`}>Comments</h4>
      <span className={t.meta} aria-live="polite">{view.total ? `${view.from}–${view.to} of ${view.total}` : 'No comments match these filters'}</span>
      <div className={t.tableTools}>
        <button type="button" className={t.chipButton} onClick={() => onOrder(order === 'newest' ? 'oldest' : 'newest')}>{order === 'newest' ? 'Newest first' : 'Oldest first'}<SortMark/></button>
      </div>
    </div>
    <div className={t.directionRow} role="group" aria-label="Filter comments by direction" style={{ '--tiles': debate.sides.length + 1 } as CSSProperties}>
      <button type="button" aria-pressed={side === null} onClick={() => onSide(null)}><span><strong>All directions</strong></span><span className={t.directionCount}>{counts.reduce((sum, item) => sum + item.count, 0)}</span></button>
      {counts.map(({ side: item, count, shieldedLabs }) => <button key={item.label} type="button" aria-pressed={side === item.label} onClick={() => onSide(side === item.label ? null : item.label)}>
        <span><strong>{item.label}</strong>{shieldedLabs > 0 && <small>{shieldedLabs} from Shielded Labs</small>}</span>
        <span className={t.directionCount}>{count}</span>
      </button>)}
    </div>
    <p className={t.directionNote}>Comments are collected to cover every direction, so these counts show coverage, not support. Measured sentiment comes from the votes above.</p>
    <table className={t.table}>
      <caption className={t.srOnly}>Comments on {debate.title}, page {view.page} of {view.pages}</caption>
      <thead><tr><th scope="col" aria-sort={order === 'newest' ? 'descending' : 'ascending'}>Date</th><th scope="col">Who</th><th scope="col">Direction</th><th scope="col">Argument</th><th scope="col"><span className={t.srOnly}>Source</span></th></tr></thead>
      <tbody>{view.rows.map(row => {
        const kind = pointKind(row);
        const source = row.via ?? sourceType(row.url);
        return <tr key={`${row.url}:${row.text.slice(0, 24)}`} data-kind={kind}>
          <td className={t.cDate}><time dateTime={row.date}>{day(row.date)}</time></td>
          <td className={t.cWho}><span>{row.author}</span><EvidenceTag kind={kind} label={speakerTags[kind]} small/></td>
          <td className={t.cSide}><span>{row.side.short}</span></td>
          <td className={t.cText}>{row.text}</td>
          <td className={t.cSource}><a href={row.url} target="_blank" rel="noopener noreferrer" aria-label={`${source}: ${row.author}, ${day(row.date)} (opens in a new tab)`}>{source}<ExternalMark/></a></td>
        </tr>;
      })}</tbody>
    </table>
    {view.pages > 1 && <nav className={t.pager} aria-label="Comment pages">
      <button type="button" onClick={() => go(view.page - 1)} disabled={view.page === 1}>Previous</button>
      <ol>{Array.from({ length: view.pages }, (_, index) => index + 1).map(number => <li key={number}>
        <button type="button" aria-current={number === view.page ? 'page' : undefined} aria-label={`Page ${number}`} onClick={() => go(number)}>{number}</button>
      </li>)}</ol>
      <button type="button" onClick={() => go(view.page + 1)} disabled={view.page === view.pages}>Next</button>
    </nav>}
  </section>;
}
