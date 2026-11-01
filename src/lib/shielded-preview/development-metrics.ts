import type { Commit, Repository } from './types';

export type ObservedCommit = Commit & { repositories: string[] };
export type Contributor = { id: string; name: string; login: string | null; bot: boolean; commits: number; repositories: string[]; profileUrl: string | null };
export const contributorKey = (commit: Pick<Commit, 'login' | 'author'>) => commit.login ? `github:${commit.login.toLowerCase()}` : `git:${commit.author}`;

/** A hash shared by repositories is one observed commit, retaining every location. */
export function developmentCommits(repos: Repository[], includeForks = false): ObservedCommit[] {
  const byHash = new Map<string, ObservedCommit>();
  for (const repo of repos) {
    if (repo.fork && !includeForks) continue;
    for (const commit of repo.commits) {
      if (!Number.isFinite(Date.parse(commit.date))) continue;
      const previous = byHash.get(commit.sha);
      if (previous) { if (!previous.repositories.includes(repo.name)) previous.repositories.push(repo.name); }
      else byHash.set(commit.sha, { ...commit, repositories: [repo.name] });
    }
  }
  return [...byHash.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export function developmentDays(anchor: string, length: number): string[] {
  const end = Date.parse(`${anchor.slice(0, 10)}T00:00:00Z`);
  return Array.from({ length }, (_, index) => new Date(end - (length - 1 - index) * 86400000).toISOString().slice(0, 10));
}

export function windowCommits(commits: ObservedCommit[], days: string[]) {
  const allowed = new Set(days);
  return commits.filter(commit => allowed.has(commit.date.slice(0, 10)));
}

/** Unlinked author names are never silently merged into a GitHub account. */
export function developmentContributors(commits: ObservedCommit[]): Contributor[] {
  const people = new Map<string, Contributor>();
  for (const commit of commits) {
    const id = contributorKey(commit);
    let person = people.get(id);
    if (!person) { person = { id, name: commit.author, login: commit.login, bot: commit.authorType === 'Bot' || !!commit.login?.endsWith('[bot]'), commits: 0, repositories: [], profileUrl: commit.profileUrl ?? null }; people.set(id, person); }
    person.commits++;
    for (const repo of commit.repositories) if (!person.repositories.includes(repo)) person.repositories.push(repo);
  }
  return [...people.values()].sort((a, b) => Number(a.bot) - Number(b.bot) || a.name.localeCompare(b.name));
}

export function filterDevelopment(commits: ObservedCommit[], filters: { repo?: string; contributor?: string; day?: string; query?: string }) {
  const query = filters.query?.trim().toLowerCase();
  return commits.filter(commit => (!filters.repo || commit.repositories.includes(filters.repo)) && (!filters.contributor || contributorKey(commit) === filters.contributor) && (!filters.day || commit.date.startsWith(filters.day)) && (!query || `${commit.title} ${commit.author} ${commit.login ?? ''} ${commit.sha} ${commit.repositories.join(' ')}`.toLowerCase().includes(query)));
}

export function heatLevel(count: number): number { return count === 0 ? 0 : count === 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4; }

export const repositoryLabels: Record<string, string> = {
  crosslink_monolith: 'Crosslink', zero: 'Zero', shielded_transport_pigeon: 'Shielded transport', crosslink_book: 'Crosslink docs', 'zebra-dynamic-fees': 'Dynamic fees', 'sl-orchard': 'Orchard',
};
