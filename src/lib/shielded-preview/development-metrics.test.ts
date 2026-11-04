import { describe, expect, it } from 'vitest';
import { contributorKey, developmentCommits, developmentContributors, developmentDays, filterDevelopment, heatLevel, windowCommits } from './development-metrics';
import type { Commit, Repository } from './types';

const commit = (sha: string, fields: Partial<Commit> = {}): Commit => ({ sha, title: 'Improve transport validation', author: 'Alex', login: 'alex', date: '2026-10-25T12:00:00Z', url: `https://github.com/ShieldedLabs/example/commit/${sha}`, ...fields });
const repository = (name: string, commits: Commit[], fork = false): Repository => ({ name, commits, fork, branch: 'main', description: '', url: `https://github.com/ShieldedLabs/${name}`, language: 'Rust', fetchedAt: '2026-10-25T22:00:00Z' });

describe('Development heatmap evidence', () => {
  it('deduplicates hashes, retains each source and excludes inherited fork history by default', () => {
    const repos = [repository('first', [commit('shared')]), repository('second', [commit('shared'), commit('unique')]), repository('fork', [commit('inherited'), commit('shared')], true)];
    const observed = developmentCommits(repos);
    expect(observed).toHaveLength(2);
    expect(observed.find(c => c.sha === 'shared')?.repositories).toEqual(['first', 'second']);
    const withForks = developmentCommits(repos, true);
    expect(withForks).toHaveLength(3);
    expect(withForks.find(c => c.sha === 'shared')?.repositories).toEqual(['first', 'second', 'fork']);
    expect(repos[0].commits[0]).not.toHaveProperty('repositories');
  });

  it('includes the entire UTC window, including empty days, without accepting dates outside it', () => {
    const days = developmentDays('2026-03-01T23:59:59Z', 3);
    expect(days).toEqual(['2026-02-27', '2026-02-28', '2026-03-01']);
    const commits = developmentCommits([repository('one', [
      commit('before', { date: '2026-02-26T23:59:59Z' }),
      commit('first', { date: '2026-02-27T00:00:00Z' }),
      commit('last', { date: '2026-03-01T23:59:59Z' }),
      commit('after', { date: '2026-03-02T00:00:00Z' }),
      commit('invalid', { date: 'not a date' }),
    ])]);
    expect(windowCommits(commits, days).map(c => c.sha)).toEqual(['last', 'first']);
    expect(filterDevelopment(commits, { day: days[1] })).toEqual([]);
  });

  it('normalizes offset dates before ordering, choosing the UTC window and drilling into a day', () => {
    const days = developmentDays('2026-10-25T23:30:00-03:00', 2);
    expect(days).toEqual(['2026-10-25', '2026-10-26']);
    const commits = developmentCommits([repository('one', [
      commit('utc-first', { date: '2026-10-26T00:30:00Z' }),
      commit('utc-latest', { date: '2026-10-25T23:30:00-03:00' }),
      commit('previous-day', { date: '2026-10-26T00:30:00+03:00' }),
    ])]);
    expect(commits.map(c => c.sha)).toEqual(['utc-latest', 'utc-first', 'previous-day']);
    expect(windowCommits(commits, ['2026-10-26']).map(c => c.sha)).toEqual(['utc-latest', 'utc-first']);
    expect(filterDevelopment(commits, { day: '2026-10-25' }).map(c => c.sha)).toEqual(['previous-day']);
  });

  it('uses the freshest observation of a shared hash while retaining every repository', () => {
    const saved = { ...repository('saved', [commit('shared', { login: null, profileUrl: null })]), state: 'snapshot' as const };
    const refreshed = { ...repository('refreshed', [commit('shared', { profileUrl: 'https://github.com/alex', url: 'https://github.com/ShieldedLabs/refreshed/commit/shared' })]), state: 'live' as const, fetchedAt: '2026-10-26T22:00:00Z' };
    const [observed] = developmentCommits([saved, refreshed]);
    expect(observed).toMatchObject({ login: 'alex', profileUrl: 'https://github.com/alex', url: 'https://github.com/ShieldedLabs/refreshed/commit/shared', repositories: ['saved', 'refreshed'], sourceRepository: 'refreshed' });
    expect(developmentCommits([refreshed, saved])[0]).toMatchObject({ login: observed.login, profileUrl: observed.profileUrl, url: observed.url });
    expect(saved.commits[0].login).toBeNull();
  });

  it('prefers a live source at the same observation time even when date formatting differs', () => {
    const saved = { ...repository('saved', [commit('shared', { login: null })]), state: 'snapshot' as const };
    const live = { ...repository('live', [commit('shared')]), state: 'live' as const, fetchedAt: '2026-10-25T22:00:00.000Z' };
    expect(developmentCommits([saved, live])[0]).toMatchObject({ login: 'alex', sourceRepository: 'live' });
  });

  it('keeps identical unlinked names distinct from accounts and recognizes automation', () => {
    const commits = developmentCommits([repository('one', [
      commit('linked'), commit('renamed', { login: 'Alex', author: 'Alex New' }),
      commit('unlinked', { login: null }),
      commit('bot', { login: 'Copilot', author: 'Copilot', authorType: 'Bot' }),
    ])]);
    const people = developmentContributors(commits);
    expect(people).toHaveLength(3);
    expect(people.find(p => p.id === 'github:alex')?.commits).toBe(2);
    expect(people.find(p => p.id === 'git:Alex')?.commits).toBe(1);
    expect(people.find(p => p.id === 'github:copilot')?.bot).toBe(true);
  });

  it('intersects repository, exact identity, day and search filters for cell drill-down', () => {
    const commits = developmentCommits([
      repository('one', [commit('match'), commit('other-person', { login: null }), commit('other-day', { date: '2026-10-24T12:00:00Z' })]),
      repository('two', [commit('other-repo')]),
    ]);
    const conditions = { repo: 'one', contributor: contributorKey(commit('match')), day: '2026-10-25', query: ' TRANSPORT ' };
    expect(filterDevelopment(commits, conditions).map(c => c.sha)).toEqual(['match']);
    expect(filterDevelopment(commits, { ...conditions, query: 'not present' })).toEqual([]);
    expect(filterDevelopment(commits, { query: 'other-repo' }).map(c => c.sha)).toEqual(['other-repo']);
  });

  it('uses fixed legend thresholds so filters never rescale activity misleadingly', () => {
    expect([0, 1, 2, 4, 5, 9, 10, 100].map(heatLevel)).toEqual([0, 1, 2, 2, 3, 3, 4, 4]);
  });
});
