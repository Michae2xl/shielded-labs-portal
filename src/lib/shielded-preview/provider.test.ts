import { afterEach, describe, expect, it, vi } from 'vitest';
import snapshot from './github-snapshot.json';
vi.mock('server-only', () => ({}));

const currentSha = 'a'.repeat(40);
const githubCommit = (repo: string, sha = currentSha) => ({
  sha,
  html_url: `https://github.com/ShieldedLabs/${repo}/commit/${sha}`,
  commit: { message: 'A new change\nDetails', author: { name: 'Example', date: '2026-10-25T21:00:00Z' } },
  author: { login: 'example', avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4', html_url: 'https://github.com/example', type: 'User' },
});
const repositoryName = (url: string) => new URL(url).pathname.split('/')[3];

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.resetModules(); });
describe('Internal preview source and access boundaries', () => {
  it('fails closed when the preview has not been explicitly enabled', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '');
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const { GET } = await import('../../app/api/shielded-preview/route');
    expect((await GET()).status).toBe(404);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('retains dated GitHub evidence on failure and does not synthesize grants', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { getPortalData } = await import('./provider');
    const result = await getPortalData();
    expect(result.repos.every(r => r.state === 'snapshot')).toBe(true);
    expect(result.repos.every(r => r.commits.length > 0)).toBe(true);
    expect(result.grantsState).toBe('unavailable');
    expect(result.grants).toEqual([]);
    expect(result.grantsFetchedAt).toBeNull();
    // A public commit title can discuss email without exposing Git identity fields.
    expect(/"email"\s*:/.test(JSON.stringify(result))).toBe(false);
  });
  it('coalesces refresh requests and preserves the latest successful observation after a later failure', async () => {
    let now = 1000000; vi.spyOn(Date, 'now').mockImplementation(() => now);
    const fetcher = vi.fn(async (url: string) => Response.json(url.includes('openzcash.org') ? { data: [] } : [githubCommit(repositoryName(url))]));
    vi.stubGlobal('fetch', fetcher);
    const { getPortalData } = await import('./provider');
    const [first, concurrent] = await Promise.all([getPortalData(), getPortalData()]);
    expect(first).toBe(concurrent); expect(fetcher).toHaveBeenCalledTimes(7);
    expect(first.repos[0].commits[0]).toMatchObject({ login: 'example', avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4', profileUrl: 'https://github.com/example', authorType: 'User' });
    expect(fetcher.mock.calls.filter(([url]) => url.includes('api.github.com')).every(([url]) => url.includes('per_page=100'))).toBe(true);
    now += 300001; fetcher.mockRejectedValue(new Error('offline'));
    const second = await getPortalData();
    expect(second.repos[0].commits[0].sha).toBe(currentSha);
    expect(second.repos[0].state).toBe('snapshot');
    expect(second.repos[0].fetchedAt).toBe(first.repos[0].fetchedAt);
  });

  it('keeps invalid or incomplete source records out of live observations without affecting healthy repositories', async () => {
    const invalid = githubCommit('crosslink_monolith');
    invalid.sha = 'undefined';
    vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(url.includes('openzcash.org') ? { data: [] } : repositoryName(url) === 'crosslink_monolith' ? [githubCommit('crosslink_monolith'), invalid] : [githubCommit(repositoryName(url))])));
    const { getPortalData } = await import('./provider');
    const result = await getPortalData();
    expect(result.repos[0].state).toBe('snapshot');
    expect(result.repos[0].refreshError).toBe('invalid-response');
    expect(result.repos[0].commits).toEqual(snapshot.repos[0].commits);
    expect(result.repos.slice(1).every(repo => repo.state === 'live')).toBe(true);
  });

  it.each(['wrong repository', 'wrong hash', 'wrong profile', 'invalid author date', 'missing author date'])(
    'retains the prior evidence when a source has a %s', async issue => {
      vi.stubGlobal('fetch', vi.fn(async (url: string) => {
        if (url.includes('openzcash.org')) return Response.json({ data: [] });
        const entry = githubCommit(repositoryName(url));
        if (issue === 'wrong repository') entry.html_url = `https://github.com/another/repository/commit/${currentSha}`;
        if (issue === 'wrong hash') entry.html_url = entry.html_url.replace(currentSha, 'b'.repeat(40));
        if (issue === 'wrong profile') entry.author.html_url = 'https://github.com/someone-else';
        if (issue === 'invalid author date') entry.commit.author.date = 'not a date';
        if (issue === 'missing author date') return Response.json([{ ...entry, commit: { message: entry.commit.message, author: { name: 'Example' }, committer: { name: 'Maintainer', date: '2026-10-26T21:00:00Z' } } }]);
        return Response.json([entry]);
      }));
      const { getPortalData } = await import('./provider');
      expect((await getPortalData()).repos.every(repo => repo.state === 'snapshot')).toBe(true);
    },
  );

  it('normalizes source author dates to UTC while preserving GitHub app identities', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('openzcash.org')) return Response.json({ data: [] });
      const entry = githubCommit(repositoryName(url));
      entry.commit.author.date = '2026-10-25T23:30:00-03:00';
      entry.author = { ...entry.author, login: 'Copilot', html_url: 'https://github.com/apps/copilot-swe-agent', type: 'Bot' };
      return Response.json([entry]);
    }));
    const { getPortalData } = await import('./provider');
    const result = await getPortalData();
    expect(result.repos.every(repo => repo.state === 'live')).toBe(true);
    expect(result.repos.every(repo => repo.refreshError === null)).toBe(true);
    expect(result.repos[0].commits[0]).toMatchObject({ date: '2026-10-26T02:30:00.000Z', login: 'Copilot', profileUrl: 'https://github.com/apps/copilot-swe-agent', authorType: 'Bot' });
  });

  it.each([
    { status: 403, remaining: '0', reason: 'rate-limited' },
    { status: 403, remaining: '5', reason: 'unavailable' },
    { status: 429, remaining: '5', reason: 'rate-limited' },
    { status: 503, remaining: '5', reason: 'unavailable' },
  ])('reports $reason for HTTP $status without replacing dated observations', async ({ status, remaining, reason }) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status, headers: { 'x-ratelimit-remaining': remaining } })));
    const { getPortalData } = await import('./provider');
    const result = await getPortalData();
    expect(result.repos.every(repo => repo.state === 'snapshot' && repo.refreshError === reason)).toBe(true);
    expect(result.repos.map(repo => repo.fetchedAt)).toEqual(snapshot.repos.map(repo => repo.fetchedAt));
  });

  it.each(['oversized', 'duplicate'])('rejects a %s response instead of overstating the bounded sample', async issue => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json(url.includes('openzcash.org') ? { data: [] } : Array.from({ length: issue === 'oversized' ? 101 : 2 }, (_, index) => githubCommit(repositoryName(url), issue === 'oversized' ? index.toString(16).padStart(40, '0') : currentSha)))));
    const { getPortalData } = await import('./provider');
    expect((await getPortalData()).repos.every(repo => repo.state === 'snapshot')).toBe(true);
  });

  it('keeps the bundled sample hashes, source links and observation dates internally consistent', () => {
    expect(snapshot.repos.length).toBeGreaterThan(0);
    for (const repo of snapshot.repos) {
      expect(repo.commits.length).toBeLessThanOrEqual(100);
      expect(new Set(repo.commits.map(commit => commit.sha)).size).toBe(repo.commits.length);
      expect(Number.isFinite(Date.parse(repo.fetchedAt))).toBe(true);
      for (const commit of repo.commits) {
        expect(commit.sha).toMatch(/^[0-9a-f]{40}$/);
        expect(commit.url).toBe(`${repo.url}/commit/${commit.sha}`);
        expect(Number.isFinite(Date.parse(commit.date))).toBe(true);
        expect(Date.parse(commit.date)).toBeLessThanOrEqual(Date.parse(repo.fetchedAt));
      }
    }
  });

  it('accepts the source shapes of every saved author, app profile and repository', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('openzcash.org')) return Response.json({ data: [] });
      const repo = snapshot.repos.find(repo => repo.name === repositoryName(url))!;
      return Response.json(repo.commits.map(commit => ({
        sha: commit.sha,
        html_url: commit.url,
        commit: { message: commit.title, author: { name: commit.author, date: commit.date } },
        author: commit.login ? { login: commit.login, html_url: commit.profileUrl, avatar_url: commit.avatarUrl, type: commit.authorType } : null,
      })));
    }));
    const { getPortalData } = await import('./provider');
    const result = await getPortalData();
    expect(result.repos.every(repo => repo.state === 'live' && repo.refreshError === null)).toBe(true);
    expect(result.repos.map(repo => repo.commits.length)).toEqual(snapshot.repos.map(repo => repo.commits.length));
  });
});
