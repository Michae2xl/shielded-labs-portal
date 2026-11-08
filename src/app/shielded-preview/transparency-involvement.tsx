'use client';

import { useState } from 'react';
import { debates } from '@/lib/shielded-preview/transparency/debates';
import { involvementFacets, matchesFacet, type DisclosedDocument, type InvolvementFacet } from '@/lib/shielded-preview/transparency/involvement';
import { zipHref, zipLabel } from '@/lib/shielded-preview/zips/library';
import type { ZipEntry } from '@/lib/shielded-preview/zips/types';
import t from './transparency.module.css';

const SHOWN = 8;
type Row = DisclosedDocument<ZipEntry>;

/** What ties a document to Shielded Labs, in a short line: owners on the team page, then the project pages. */
function relation({ disclosure: { people, projects } }: Row) {
  return [
    people.length ? `${people.length === 1 ? 'Owner' : 'Owners'} on the team page: ${people.join(', ')}` : '',
    projects.length ? `On the ${projects.map(project => project.name).join(' and ')} ${projects.length === 1 ? 'page' : 'pages'}` : '',
  ].filter(Boolean).join(' · ');
}
const debateNames = (ids: Row['debates']) => ids.map(id => debates.find(debate => debate.id === id)?.tab ?? id).join(', ');

/** Where Shielded Labs is involved: the count and its filters beside the documents, in one card. */
export function InvolvementCard({ rows }: { rows: Row[] }) {
  const [facet, setFacet] = useState<InvolvementFacet>('all');
  const [open, setOpen] = useState(false);
  const shown = rows.filter(row => matchesFacet(row, facet));
  const visible = open ? shown : shown.slice(0, SHOWN);
  return <section className={`${t.card} ${t.involvement}`} id="shielded-labs-involvement" aria-labelledby="involvement-title">
    <div className={t.summary}>
      <h3 id="involvement-title">Where Shielded Labs is involved</h3>
      <p className={t.count}><strong>{rows.length}</strong><span>documents tie to Shielded Labs through a ZIP header or a project page.</span></p>
      <div className={t.facets} role="group" aria-label="Filter documents">
        {involvementFacets(rows).map(item => <button key={item.facet} type="button" aria-pressed={item.facet === facet} onClick={() => { setFacet(item.facet); setOpen(false); }}>
          <span>{item.label}</span><span>{item.count}</span>
        </button>)}
      </div>
      <p className={t.note}>Read from each ZIP header and the Shielded Labs team and project pages. Older documents predate some authors’ current roles.</p>
    </div>
    <div className={t.documents}>
      <ul className={t.docs}>{visible.map(row => <li key={row.entry.id}><a href={zipHref(row.entry.id)}>
        <span className={t.docTop}>
          <span>{zipLabel(row.entry)}</span>{row.disclosure.created && <span>{row.disclosure.created.slice(0, 4)}</span>}
          {row.debates.length > 0 && <span className={t.flag}>Debated: {debateNames(row.debates)}</span>}
        </span>
        <strong>{row.entry.title}</strong>
        <small>{relation(row)}</small>
      </a></li>)}</ul>
      {shown.length > SHOWN && <button type="button" className={t.moreButton} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? 'Show fewer' : `Show all ${shown.length}`}</button>}
    </div>
  </section>;
}
