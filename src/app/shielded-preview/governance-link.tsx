'use client';

import type { ReactNode } from 'react';
import { governanceSectionSlug, type GovernanceSection } from '@/lib/shielded-preview/governance-sections';
import { defaultProposalRound } from '@/lib/shielded-preview/coinholder-proposals';

export type CollectionSelection = { lane?: string; filter?: string; search?: string; page?: number; basis?: 'include' | 'exclude'; round?: string; activity?: string };
export type CollectionNavigate = (section: GovernanceSection, id?: string | null, selection?: CollectionSelection) => void;

export function OutArrow() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>;
}

export function Arrow() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>;
}

export function Link({ section, id, selection, onNavigate, children, className }: {
  section: GovernanceSection; id?: string; selection?: CollectionSelection; onNavigate: CollectionNavigate; children: ReactNode; className?: string;
}) {
  const params = new URLSearchParams({ view: 'governance', section: governanceSectionSlug(section) });
  if (id) params.set('record', id);
  if (selection?.lane) params.set('lane', selection.lane);
  if (selection?.filter && selection.filter !== 'all') params.set('filter', selection.filter);
  if (selection?.search) params.set('q', selection.search);
  if (selection?.page && selection.page > 1) params.set('page', String(selection.page));
  if (selection?.basis === 'exclude') params.set('basis', 'exclude');
  // A list's own default round stays out of the address; any other choice, "all" included, is written.
  if (selection?.round && selection.round !== (section === 'Proposals' ? defaultProposalRound(selection.lane ?? '') : 'all')) params.set('round', selection.round);
  if (selection?.activity && selection.activity !== 'all') params.set('activity', selection.activity);
  return <a href={`?${params}`} className={className} onClick={event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(section, id, selection);
  }}>{children}</a>;
}
