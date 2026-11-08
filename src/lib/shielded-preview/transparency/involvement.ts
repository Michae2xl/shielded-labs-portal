import { projects, team } from '../content';
import { projectZips } from '../project-summary';
import type { ZipEntry } from '../zips/types';
import { debatesForZip, type Debate } from './debates';

/**
 * What a ZIP has to do with Shielded Labs, stated only from evidence: owners in the ZIP header that
 * appear on the team page, a header that names Shielded Labs, and project pages that list the ZIP.
 * The creation year is shown too, so an older document is not read as current Shielded Labs work.
 */
export type Disclosure = { people: string[]; namedInHeader: boolean; created: string | null; projects: { id: string; name: string }[] };

const words = (name: string) => name.toLowerCase().replace(/\(.*?\)/g, ' ').normalize('NFKD').replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean);
const staff = team.map(member => new Set(words(member.name)));
const plainName = (owner: string) => owner.replace(/\s*\(.*?\)\s*/g, ' ').trim();
const namesShieldedLabs = (owner: string) => /shielded\s*labs/i.test(owner);

/** An owner is Shielded Labs staff when the header names the affiliation, or every part of the name matches someone on the team page. */
export function shieldedLabsOwner(owner: string): string | null {
  if (namesShieldedLabs(owner)) return plainName(owner);
  const parts = words(owner);
  return parts.length >= 2 && staff.some(member => parts.every(part => member.has(part))) ? plainName(owner) : null;
}

export function zipDisclosure(entry: Pick<ZipEntry, 'id' | 'owners' | 'created'>): Disclosure | null {
  const people = entry.owners.map(shieldedLabsOwner).filter((name): name is string => Boolean(name));
  const listedBy = projects.filter(project => projectZips(project)?.rows.some(row => row.id === entry.id)).map(project => ({ id: project.id, name: project.name }));
  if (!people.length && !listedBy.length) return null;
  return { people, namedInHeader: entry.owners.some(namesShieldedLabs), created: entry.created ?? null, projects: listedBy };
}

type Disclosable = Pick<ZipEntry, 'id' | 'owners' | 'created'>;
export type DisclosedDocument<E extends Disclosable = Disclosable> = { entry: E; disclosure: Disclosure; debates: Debate['id'][] };

/** Documents whose header or project page ties them to Shielded Labs, newest first, with the debates they belong to. */
export function disclosedDocuments<E extends Disclosable>(entries: E[]): DisclosedDocument<E>[] {
  return entries
    .flatMap(entry => { const disclosure = zipDisclosure(entry); return disclosure ? [{ entry, disclosure, debates: debatesForZip(entry.id).map(debate => debate.id) }] : []; })
    .sort((a, b) => (b.disclosure.created ?? '').localeCompare(a.disclosure.created ?? ''));
}

export type InvolvementFacet = 'all' | 'owners' | 'listed' | 'debated';
const facets: { facet: InvolvementFacet; label: string; test: (row: DisclosedDocument) => boolean }[] = [
  { facet: 'all', label: 'All documents', test: () => true },
  { facet: 'owners', label: 'Owner on the team page', test: row => row.disclosure.people.length > 0 },
  { facet: 'listed', label: 'Listed on a project page', test: row => row.disclosure.projects.length > 0 },
  { facet: 'debated', label: 'Under debate', test: row => row.debates.length > 0 },
];

export const matchesFacet = (row: DisclosedDocument, facet: InvolvementFacet) => facets.find(item => item.facet === facet)!.test(row);

/** The filters for the involvement list with their counts; a filter that would show nothing is left out. */
export const involvementFacets = (rows: DisclosedDocument[]) =>
  facets.map(({ facet, label, test }) => ({ facet, label, count: rows.filter(test).length })).filter(item => item.facet === 'all' || item.count > 0);
