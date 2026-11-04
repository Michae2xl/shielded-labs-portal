import type { Repository } from './types';
import { developmentCommits, developmentDays } from './development-metrics';

/** Fork ancestry is not evidence of Shielded Labs authorship. Never rank people by volume. */
export function observedCommits(repos: Repository[]) {
  return developmentCommits(repos).map(({ sourceRepository, ...commit }) => ({ ...commit, repo: sourceRepository }));
}

export function activityDays(repos: Repository[], anchor: string, days = 35) {
  const commits = observedCommits(repos);
  return developmentDays(anchor, days).map(day => ({ day, count: commits.filter(c => c.date.startsWith(day)).length }));
}
