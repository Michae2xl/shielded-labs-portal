'use client';

import type { CoinholderProposal, ApplicationField } from '@/lib/shielded-preview/coinholder-proposals';
import { leavingLink, sourceHref } from '@/lib/shielded-preview/editorial/library';
import type { ReactNode } from 'react';
import { coinholderRoundLabel, coinholderRounds } from '@/lib/shielded-preview/coinholder-rounds';
import type { Source } from '@/lib/shielded-preview/governance-types';
import { participationGuideHref } from '@/lib/shielded-preview/governance-participation';
import GovernanceRecord from './governance-record';
import s from './coinholder-proposals.module.css';

const date = (value: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
function ApplicationText({ field }: { field: ApplicationField }) {
  return <div className={s.applicationField}><h3>{field.heading}</h3>{field.text.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    {field.links.length > 0 && <div className={s.sourceLinks}>{field.links.map(link => { const target = sourceHref(link.url); return <a key={link.url} href={target} {...leavingLink(target)}>{link.label}<span>{target.startsWith('?') ? 'In this portal →' : `${new URL(link.url).hostname.replace(/^www\./, '')} ↗`}</span></a>; })}</div>}
  </div>;
}

export default function CoinholderProposalRecord({ proposal, source, onBack, backLabel = 'Current proposals', related }: {
  proposal: CoinholderProposal; source: Source<CoinholderProposal[] | null>; onBack: () => void;
  backLabel?: string; related?: ReactNode;
}) {
  const summary = proposal.fields.find(field => /^project summary$/i.test(field.heading));
  const fields = proposal.fields.filter(field => !/^(organization or individual name|requested grant amount \(USD\)|category|project summary)$/i.test(field.heading));
  const funding = fields.filter(field => /budget|funding/i.test(field.heading));
  const evidence = fields.filter(field => /proof|success metrics|time period/i.test(field.heading));
  const application = fields.filter(field => !funding.includes(field) && !evidence.includes(field));
  const groups = [{ id: 'application', label: 'Application', fields: application }, { id: 'funding', label: 'Budget & funding', fields: funding }, { id: 'evidence', label: 'Evidence', fields: evidence }].filter(group => group.fields.length > 0);
  return <GovernanceRecord title={proposal.title} context={`Coinholder grants · ${coinholderRoundLabel(proposal.rounds)}`} subtitle={`${proposal.applicant} · #${proposal.number}`}
    idPrefix="coinholder" backLabel={backLabel} onBack={onBack}
    metrics={<><div><span>Requested · USD</span><strong>{proposal.requestedUsdCents === null ? 'Not specified' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(proposal.requestedUsdCents / 100)}</strong></div><div><span>Recorded status</span><strong>{proposal.status}</strong></div><div><span>Submitted</span><strong>{date(proposal.createdAt)}</strong></div></>}
    sections={[{ id: 'coinholder-summary', label: 'Summary' }, ...groups.map(group => ({ id: `coinholder-${group.id}`, label: group.label }))]}
    sources={<><p>Application text and status labels come from the FPF repository. Closed does not mean rejected; approval does not establish payment.</p><dl className={s.recordMeta}><div><dt>Category</dt><dd>{proposal.category ?? 'Not recorded'}</dd></div><div><dt>Last edited</dt><dd>{date(proposal.updatedAt)}</dd></div>{source.observedAt && <div><dt>{source.error ? 'Saved record' : 'Retrieved'}</dt><dd>{date(source.observedAt)}</dd></div>}</dl>{source.error && <p>Refresh unavailable. Showing the last saved application.</p>}<a href={proposal.url} target="_blank" rel="noopener noreferrer">Original application · FPF GitHub ↗</a>{coinholderRounds.filter(round => proposal.rounds.includes(round.id) && round.source).map(round => <a key={round.id} href={round.source!} target="_blank" rel="noopener noreferrer">{round.label} · round source ↗</a>)}<a href={participationGuideHref()}>Program guide →</a></>}
  >
    <section id="coinholder-summary"><h2>Project summary</h2><p>{proposal.summary || 'No summary provided.'}</p>{summary && summary.links.length > 0 && <div className={s.sourceLinks}>{summary.links.map(link => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>)}</div>}{related}</section>
    {groups.map(group => <section key={group.id} id={`coinholder-${group.id}`}><h2>{group.label}</h2>{group.fields.map((field, index) => <ApplicationText key={`${field.heading}:${index}`} field={field}/>)}</section>)}
  </GovernanceRecord>;
}
