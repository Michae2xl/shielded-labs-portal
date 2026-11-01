import type { Repository } from './types';

/** Fork ancestry is not evidence of Shielded Labs authorship. Never rank people by volume. */
export function observedCommits(repos: Repository[]) {
  const seen = new Set<string>();
  return repos.filter(repo => !repo.fork).flatMap(repo => repo.commits.map(commit => ({ ...commit, repo: repo.name })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(commit => { if (seen.has(commit.sha)) return false; seen.add(commit.sha); return true; });
}

export function activityDays(repos: Repository[], anchor: string, days = 35) {
  const end = Date.parse(anchor.slice(0, 10) + 'T00:00:00Z');
  const commits = observedCommits(repos);
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(end - (days - 1 - i) * 86400000).toISOString().slice(0, 10);
    return { day, count: commits.filter(c => c.date.startsWith(day)).length };
  });
}
