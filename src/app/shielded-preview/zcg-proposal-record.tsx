'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { zcgGroups } from '@/lib/shielded-preview/application-groups';
import { applicationFields } from '@/lib/shielded-preview/coinholder-proposals';
import { bodyQuery, refFromUrl, type BodyRef } from '@/lib/shielded-preview/proposal-refs';
import GovernanceRecord from './governance-record';
import { Markdown } from './markdown';
import s from './coinholder-proposals.module.css';

type Body = { state: 'loading' | 'fetched' | 'unavailable'; markdown: string | null; source?: string; observedAt?: string | null };
const day = (value: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
const sourceName = (url: string) => url.includes('github.com') ? `GitHub issue #${url.split('/').pop()}` : 'the forum mirror';
type Props = {
  title: string; context: string; subtitle: string; metrics: ReactNode; sources: ReactNode; backLabel: string; onBack: () => void;
  /** Links that may hold the application text, in order of preference: the GitHub issue, then the forum mirror. */
  urls: (string | null | undefined)[];
  summary: string;
  /** Recorded decision, related records and grant links, kept under the summary. */
  extras: ReactNode;
};

/** A ZCG or archived application: the record's facts first, then the full application text read from its source. */
export default function ZcgProposalRecord({ title, context, subtitle, metrics, sources, backLabel, onBack, urls, summary, extras }: Props) {
  // The GitHub issue first, then the forum mirror, so a GitHub limit does not hide the text.
  const key = [...new Set(urls.map(refFromUrl).filter((ref): ref is BodyRef => ref !== null).map(bodyQuery))].join('|');
  const [result, setResult] = useState<{ key: string; body: Body } | null>(null);
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    void (async () => {
      for (const query of key.split('|')) {
        try {
          const response = await fetch(`/api/shielded-preview/proposal-body?${query}`, { signal: controller.signal });
          const data = response.ok ? await response.json() : null;
          if (data?.state === 'fetched' && typeof data.markdown === 'string') { setResult({ key, body: { state: 'fetched', markdown: data.markdown, source: data.source, observedAt: data.observedAt } }); return; }
        } catch { if (controller.signal.aborted) return; }
      }
      if (!controller.signal.aborted) setResult({ key, body: { state: 'unavailable', markdown: null } });
    })();
    return () => controller.abort();
  }, [key]);
  const body: Body = !key ? { state: 'unavailable', markdown: null } : result?.key === key ? result.body : { state: 'loading', markdown: null };
  const { summary: summaryField, sections } = useMemo(() => zcgGroups(body.markdown ? applicationFields(body.markdown) : []), [body.markdown]);

  const provenance = body.state === 'fetched' && body.source
    ? <p>Application text from <a href={body.source} target="_blank" rel="noopener noreferrer">{sourceName(body.source)}</a>{body.observedAt ? `, read ${day(body.observedAt)}` : ''}.</p>
    : null;
  return <GovernanceRecord title={title} context={context} subtitle={subtitle} metrics={metrics} sources={<>{sources}{provenance}</>} backLabel={backLabel} onBack={onBack}
    sections={[{ label: 'Summary', id: 'governance-summary' }, ...sections.map(group => ({ label: group.label, id: `zcg-${group.id}` }))]}>
    <section id="governance-summary">
      <h2>Application summary</h2>
      {summaryField ? <Markdown text={summaryField.markdown}/> : <p>{summary || 'A summary is unavailable. See the original application under Sources.'}</p>}
      {body.state === 'loading' && <p className={s.bodyState} role="status">Loading the full application…</p>}
      {body.state === 'unavailable' && <p className={s.bodyState}>{key ? 'The full application could not be loaded right now.' : 'The full text is only on the original platform.'} Read it at the source listed under Sources.</p>}
      {extras}
    </section>
    {sections.map(group => <section key={group.id} id={`zcg-${group.id}`}>
      <h2>{group.label}</h2>
      {group.fields.map((field, index) => <div key={`${field.heading}:${index}`} className={s.applicationField}><h3>{field.heading}</h3><Markdown text={field.markdown}/></div>)}
    </section>)}
  </GovernanceRecord>;
}
