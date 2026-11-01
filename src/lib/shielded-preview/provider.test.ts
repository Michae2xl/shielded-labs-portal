import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));

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
    const fetcher = vi.fn(async (url: string) => ({ok: true, json: async () => url.includes('openzcash.org') ? { data: [] } : [{sha:'new-commit',html_url:'https://github.com/ShieldedLabs/zero/commit/new-commit',commit:{message:'A new change\nDetails',author:{name:'Example',date:'2026-10-25T21:00:00Z'}},author:{login:'example',avatar_url:'https://avatars.githubusercontent.com/u/1?v=4',html_url:'https://github.com/example',type:'User'}}] }));
    vi.stubGlobal('fetch', fetcher);
    const { getPortalData } = await import('./provider');
    const [first, concurrent] = await Promise.all([getPortalData(), getPortalData()]);
    expect(first).toBe(concurrent); expect(fetcher).toHaveBeenCalledTimes(7);
    expect(first.repos[0].commits[0]).toMatchObject({ login: 'example', avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4', profileUrl: 'https://github.com/example', authorType: 'User' });
    expect(fetcher.mock.calls.filter(([url]) => url.includes('api.github.com')).every(([url]) => url.includes('per_page=100'))).toBe(true);
    now += 300001; fetcher.mockRejectedValue(new Error('offline'));
    const second = await getPortalData();
    expect(second.repos[0].commits[0].sha).toBe('new-commit');
    expect(second.repos[0].state).toBe('snapshot');
    expect(second.repos[0].fetchedAt).toBe(first.repos[0].fetchedAt);
  });
});
