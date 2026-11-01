import 'server-only';
import snapshot from './github-snapshot.json';
import type { Commit, Grant, PortalData, Repository } from './types';

const TTL = 300_000;
let cache: { at: number; data: PortalData } | undefined;
let pending: Promise<PortalData> | undefined;

async function json(url: string) {
  const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'OpenZcash-internal-preview' }, signal: AbortSignal.timeout(8000), cache: 'no-store' });
  if (!response.ok) throw new Error('Public source unavailable');
  return response.json();
}

async function refresh(): Promise<PortalData> {
  const [repos, ledger] = await Promise.all([
    Promise.all(snapshot.repos.map(async (repo): Promise<Repository> => {
      try {
        const raw = await json(`https://api.github.com/repos/ShieldedLabs/${repo.name}/commits?sha=${encodeURIComponent(repo.branch)}&per_page=100`);
        if (!Array.isArray(raw)) throw new Error('Invalid source');
        const commits: Commit[] = raw.map(c => ({ sha: String(c.sha), title: String(c.commit.message).split('\n')[0], author: String(c.commit.author?.name ?? 'Unknown author'), login: c.author?.login ?? null, avatarUrl: c.author?.avatar_url ?? null, profileUrl: c.author?.html_url ?? null, authorType: c.author?.type ?? null, date: String(c.commit.author?.date ?? c.commit.committer.date), url: String(c.html_url) }));
        return { ...repo, commits, fetchedAt: new Date().toISOString(), state: 'live' };
      } catch {
        // Preserve the last successful observation; never regress to an older bundled snapshot.
        const previous = cache?.data.repos.find(item => item.name === repo.name);
        return { ...(previous ?? repo), state: 'snapshot' };
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
