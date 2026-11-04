import 'server-only';
import { z } from 'zod';
import snapshot from './github-snapshot.json';
import type { Commit, Grant, PortalData, Repository, RepositoryRefreshError } from './types';

const TTL = 300_000;
const SAMPLE_LIMIT = 100;
let cache: { at: number; data: PortalData } | undefined;
let pending: Promise<PortalData> | undefined;

class SourceError extends Error {
  constructor(readonly reason: RepositoryRefreshError) { super(reason); }
}

const githubCommitSchema = z.object({
  sha: z.string().regex(/^[0-9a-f]{40}$/i).transform(value => value.toLowerCase()),
  html_url: z.string(),
  commit: z.object({
    message: z.string(),
    // A committer date is not evidence of when the author wrote a change.
    author: z.object({ name: z.string().nullable().optional(), date: z.iso.datetime({ offset: true }) }),
  }),
  author: z.object({
    login: z.string().regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\[bot\])?$/i),
    avatar_url: z.string().url().nullable().optional(),
    html_url: z.string().url().nullable().optional(),
    type: z.string().nullable().optional(),
  }).nullable().optional(),
});

function sourceCommits(raw: unknown, repo: Pick<Repository, 'url'>): Commit[] {
  const entries = githubCommitSchema.array().max(SAMPLE_LIMIT).parse(raw);
  if (new Set(entries.map(entry => entry.sha)).size !== entries.length) throw new Error('Duplicate source commits');
  return entries.map(entry => {
    const url = `${repo.url}/commit/${entry.sha}`;
    if (entry.html_url.toLowerCase() !== url.toLowerCase()) throw new Error('Commit source does not match repository and hash');
    const author = entry.author;
    if (author?.html_url) {
      const profile = new URL(author.html_url);
      const matchesIdentity = profile.pathname.toLowerCase() === `/${author.login.toLowerCase()}`;
      const appIdentity = author.type === 'Bot' && /^\/apps\/[a-z0-9-]+$/i.test(profile.pathname);
      if (profile.origin !== 'https://github.com' || profile.username || profile.password || profile.search || profile.hash || (!matchesIdentity && !appIdentity)) throw new Error('Profile source does not match identity');
    }
    return {
      sha: entry.sha,
      title: entry.commit.message.split('\n')[0],
      author: entry.commit.author.name ?? 'Unknown author',
      login: author?.login ?? null,
      avatarUrl: author?.avatar_url ?? null,
      profileUrl: author?.html_url ?? null,
      authorType: author?.type ?? null,
      date: new Date(entry.commit.author.date).toISOString(),
      url,
    };
  });
}

async function json(url: string) {
  const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'Shielded-Labs-Portal' }, signal: AbortSignal.timeout(8000), cache: 'no-store' });
  if (!response.ok) throw new SourceError(response.status === 429 || (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') ? 'rate-limited' : 'unavailable');
  try { return await response.json(); } catch { throw new SourceError('invalid-response'); }
}

async function refresh(): Promise<PortalData> {
  const [repos, ledger] = await Promise.all([
    Promise.all(snapshot.repos.map(async (repo): Promise<Repository> => {
      let failure: RepositoryRefreshError = 'unavailable';
      try {
        const raw = await json(`https://api.github.com/repos/ShieldedLabs/${repo.name}/commits?sha=${encodeURIComponent(repo.branch)}&per_page=${SAMPLE_LIMIT}`);
        // Reject a corrupt response as a unit so partial data is not presented as a healthy sample.
        failure = 'invalid-response';
        const commits = sourceCommits(raw, repo);
        return { ...repo, commits, fetchedAt: new Date().toISOString(), state: 'live', refreshError: null };
      } catch (error) {
        // Preserve the last successful observation; never regress to an older bundled snapshot.
        const previous = cache?.data.repos.find(item => item.name === repo.name);
        return { ...(previous ?? repo), state: 'snapshot', refreshError: error instanceof SourceError ? error.reason : failure };
      }
    })),
    json('https://openzcash.org/api/zcg/data/grants').then(value => {
      if (!Array.isArray(value.data)) throw new Error('Invalid ledger');
      return value.data as Grant[];
    }).catch(() => null),
  ]);
  return { repos, checkedAt: new Date().toISOString(), grants: ledger ?? [], grantsState: ledger ? 'live' : 'unavailable', grantsFetchedAt: ledger ? new Date().toISOString() : null };
}

export async function getPortalData(): Promise<PortalData> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;
  if (!pending) pending = refresh().then(data => { cache = { at: Date.now(), data }; return data; }).finally(() => { pending = undefined; });
  return pending;
}

export function initialPortalData(): PortalData {
  return { repos: snapshot.repos.map(repo => ({ ...repo, state: 'snapshot' })), checkedAt: snapshot.capturedAt, grants: [], grantsState: 'unavailable', grantsFetchedAt: null };
}
