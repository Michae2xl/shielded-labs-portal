import type { Project } from './content';
import { editorialCatalog, editorialHref } from './editorial/library';
import { projectHref } from './project-navigation';
import { projectPublications, publicationQuote } from './project-publications';
import type { Repository } from './types';
import { bundledZips, zipHref, zipLabel } from './zips/library';
import type { ZipEntry } from './zips/types';

type ZipReference = { zip: number; note?: string } | { pull: number; note?: string };

/** Reviewed by hand: a keyword match on titles links unrelated ZIPs. Each basis names the source of the association. */
const curatedZips: Partial<Record<Project['id'], { basis: string; references: ZipReference[] }>> = {
  crosslink: { basis: 'Crosslink specification proposed by Shielded Labs contributors in an open pull request.', references: [{ pull: 1216 }] },
  nsm: { basis: 'The three ZIPs the Shielded Labs NSM page associates with the mechanism.', references: [{ zip: 233 }, { zip: 234 }, { zip: 235 }] },
  ironwood: { basis: 'ZIPs listed in the NU6.3 network upgrade record.', references: [{ zip: 258 }, { zip: 2006 }, { zip: 2005 }, { zip: 229 }] },
  fees: { basis: 'The fee mechanism the project roadmap works within, and the marginal-fee change it describes.', references: [{ zip: 317, note: 'Parameters cited by the project roadmap' }, { zip: 2009, note: 'Marginal fee of 1,000 zatoshi, as in the roadmap' }] },
};

export type ProjectZip = { id: string; label: string; title: string; status: string; note: string | null; href: string };
export type ProjectZips = { basis: string; syncedAt: string; rows: ProjectZip[] };

/** Curated ZIPs that exist in the index; a merged or closed pull request simply drops out of the list. */
export function projectZips(project: Pick<Project, 'id'>, entries: readonly ZipEntry[] = bundledZips.entries): ProjectZips | null {
  const curated = curatedZips[project.id];
  if (!curated) return null;
  const rows = curated.references.flatMap(reference => {
    const matches = 'zip' in reference
      ? entries.filter(entry => entry.kind === 'zip' && entry.number === reference.zip)
      : entries.filter(entry => entry.pull?.number === reference.pull);
    return matches.map(entry => ({
      id: entry.id, label: zipLabel(entry), title: entry.title, status: entry.status, href: zipHref(entry.id),
      note: reference.note ?? (entry.pull ? 'Open pull request · unofficial preview' : null),
    }));
  });
  return rows.length ? { basis: curated.basis, syncedAt: bundledZips.meta.syncedAt, rows } : null;
}

export type ProjectSignal = { label: string; text: string; quotedFrom: string | null; detail: string | null; date: string | null };

/** The most useful published line for a project card, in the source's own words where one exists. */
export function projectSignal(project: Pick<Project, 'id'>): ProjectSignal | null {
  const publication = projectPublications[project.id];
  const next = publicationQuote(publication.next) ?? publication.next.steps?.[0];
  if (next) return { label: 'What comes next', text: next, quotedFrom: publication.next.source, detail: publication.next.window ?? null, date: null };
  const latest = editorialCatalog.filter(entry => entry.projects.includes(project.id) && entry.view === 'blog').sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
  if (latest) return { label: 'Latest update', text: latest.title, quotedFrom: null, detail: null, date: latest.publishedAt };
  if (publication.records.length) return { label: publication.recordsHeading, text: publication.records.map(record => record.title).join(' · '), quotedFrom: null, detail: null, date: null };
  return null;
}

/** Newest commit in the observed sample of the project's repositories; a fork's history can include upstream work. */
export function projectLastCommit(project: Pick<Project, 'repos'>, repositories: readonly Repository[]) {
  const linked = repositories.filter(repository => (project.repos as readonly string[]).includes(repository.name));
  const commits = linked.flatMap(repository => repository.commits.map(commit => ({ date: commit.date, fork: repository.fork })));
  return commits.sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
}

export type ProjectShortcut = { label: string; count: number | null; href: string };

/** Only what exists: a project without a simulator, FAQ, ZIP or repository shows no empty shortcut. */
export function projectShortcuts(project: Pick<Project, 'id' | 'repos'>, entries: readonly ZipEntry[] = bundledZips.entries): ProjectShortcut[] {
  const reading = editorialCatalog.filter(entry => entry.projects.includes(project.id));
  const research = reading.filter(entry => entry.category !== 'Simulator' && entry.category !== 'FAQ');
  const simulator = reading.find(entry => entry.category === 'Simulator');
  const zips = projectZips(project, entries);
  return [
    ...(research.length ? [{ label: 'Research', count: research.length, href: projectHref(project.id, 'resources') }] : []),
    ...(reading.some(entry => entry.view === 'resources' && entry.category.includes('FAQ')) ? [{ label: 'FAQ', count: null, href: projectHref(project.id, 'faq') }] : []),
    ...(zips ? [{ label: 'ZIPs', count: zips.rows.length, href: `${projectHref(project.id)}#project-zips` }] : []),
    ...(simulator ? [{ label: 'Simulator', count: null, href: editorialHref(simulator) }] : []),
    ...(project.repos.length ? [{ label: 'Code', count: project.repos.length, href: projectHref(project.id, 'development') }] : []),
  ];
}
