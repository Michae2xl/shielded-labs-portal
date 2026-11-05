'use client';

import type { ReactNode } from 'react';
import { governanceProcess, type ProcessBlock, type ProcessCell, type ProcessLink } from '@/lib/shielded-preview/governance-process';
import GovernanceRecord from './governance-record';
import { resolveEditorialLink } from '@/lib/shielded-preview/editorial/library';
import { Arrow, Link, type CollectionNavigate } from './governance-collections';
import s from './governance-process.module.css';

const date = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));

function External({ href: reference, children }: { href: string; children: ReactNode }) {
  const href = resolveEditorialLink(reference) ?? reference;
  const internal = href.startsWith('?');
  return <a href={href} {...(internal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>{children}{internal ? <Arrow/> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>}</a>;
}
function ProcessAnchor({ link, onNavigate, className }: { link: ProcessLink; onNavigate: CollectionNavigate; className?: string }) {
  if ('href' in link) return <span className={className}><External href={link.href}>{link.label}</External></span>;
  return <Link section={link.section} id={link.record} selection={link.lane ? { lane: link.lane } : undefined} onNavigate={onNavigate} className={className}>{link.label}{className && <Arrow/>}</Link>;
}
function Cell({ cell, onNavigate }: { cell: ProcessCell; onNavigate: CollectionNavigate }) {
  return typeof cell === 'string' ? <>{cell}</> : <ProcessAnchor link={cell} onNavigate={onNavigate}/>;
}
function Block({ block, onNavigate }: { block: ProcessBlock; onNavigate: CollectionNavigate }) {
  if (block.kind === 'p') return <p>{block.lead && <strong>{block.lead} </strong>}{block.text}</p>;
  if (block.kind === 'list') {
    const items = block.items.map((item, index) => <li key={index}>{item.title && <strong>{item.title} </strong>}{item.text}</li>);
    return block.ordered ? <ol className={s.steps}>{items}</ol> : <ul className={s.points}>{items}</ul>;
  }
  if (block.kind === 'table') return <div className={s.tableScroll} role="region" aria-label={block.caption} tabIndex={0}><table><caption className={s.srOnly}>{block.caption}</caption><thead><tr>{block.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{block.rows.map((row, index) => <tr key={index}>{row.map((cell, column) => column === 0 ? <th key={column} scope="row"><Cell cell={cell} onNavigate={onNavigate}/></th> : <td key={column}><Cell cell={cell} onNavigate={onNavigate}/></td>)}</tr>)}</tbody></table></div>;
  return <div className={s.links}>{block.items.map(link => <ProcessAnchor key={link.label} link={link} onNavigate={onNavigate} className={s.link}/>)}</div>;
}

export default function GovernanceProcess({ onBack, onNavigate }: { onBack: () => void; onNavigate: CollectionNavigate }) {
  const guide = governanceProcess;
  return <GovernanceRecord title={guide.title} context="Guide" subtitle={guide.summary}
    metrics={<>{guide.facts.map(fact => <div key={fact.name}><span>{fact.name}</span><strong>{fact.value}</strong></div>)}</>}
    sections={[]} outline={guide.sections.map(section => ({ id: `process-${section.id}`, label: section.title }))} backLabel="Governance overview" onBack={onBack} idPrefix="process"
    sources={<>
      <p>Neutral description reviewed on {date(guide.reviewedAt)}. Dated statements name their date; the forum and repository links below are the primary sources. Essays published by Shielded Labs are linked where they are the source of a figure.</p>
      {guide.sources.map(source => <External key={source.href} href={source.href}>{source.label}</External>)}
    </>}
  >
    {guide.sections.map(section => <section key={section.id} id={`process-${section.id}`} className={s.section} aria-labelledby={`process-${section.id}-title`}>
      <h2 id={`process-${section.id}-title`}>{section.title}</h2>
      {section.blocks.map((block, index) => <Block key={index} block={block} onNavigate={onNavigate}/>)}
    </section>)}
  </GovernanceRecord>;
}
