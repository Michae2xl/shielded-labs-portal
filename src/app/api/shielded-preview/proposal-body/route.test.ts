import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/shielded-preview/governance-provider', async () => {
  const snapshot = (await import('@/lib/shielded-preview/governance-data/snapshot.json')).default;
  const { emptyCoinholderSource } = await import('@/lib/shielded-preview/coinholder-proposals');
  return { getGovernanceData: async () => ({ ...snapshot, coinholder: emptyCoinholderSource }) };
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });

describe('Proposal body route', () => {
  it('keeps the local portal access boundary', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '');
    const { GET } = await import('./route');
    expect((await GET(new Request('https://local.test/api?repo=zcg&issue=511'))).status).toBe(404);
  });

  it('refuses malformed references and applications the portal does not list', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '1');
    const upstream = vi.fn();
    vi.stubGlobal('fetch', upstream);
    const { GET } = await import('./route');
    expect((await GET(new Request('https://local.test/api?repo=zcg&issue=abc'))).status).toBe(400);
    expect((await GET(new Request('https://local.test/api?url=https://example.com'))).status).toBe(400);
    expect((await GET(new Request('https://local.test/api?repo=zcg&issue=999999'))).status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('returns the text of a listed application', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '1');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ body: '### Project Summary\nA tool.' }), { status: 200 })));
    const { GET } = await import('./route');
    const response = await GET(new Request('https://local.test/api?repo=zcg&issue=511'));
    expect(response.status).toBe(200);
    expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
    expect(await response.json()).toMatchObject({ state: 'fetched', markdown: '### Project Summary\nA tool.' });
  });
});
