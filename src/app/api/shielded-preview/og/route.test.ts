import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });
describe('share image route', () => {
  it('keeps the same local portal access boundary', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '');
    const { GET } = await import('./route');
    expect((await GET(new Request('https://portal.example/api/shielded-preview/og'))).status).toBe(404);
  });
  it('draws a PNG for a page, even when the live balance is unavailable', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '1');
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const { GET } = await import('./route');
    const response = await GET(new Request('https://portal.example/api/shielded-preview/og?view=projects&project=nsm'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(1000);
  });
});
