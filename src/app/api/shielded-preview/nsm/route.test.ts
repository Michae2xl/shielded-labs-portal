import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });
describe('NSM balance route', () => {
  it('keeps the same local portal access boundary', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '');
    const { GET } = await import('./route');
    expect((await GET()).status).toBe(404);
  });
  it('returns the reading without caching it in the browser', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '1');
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const { GET } = await import('./route');
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect((await response.json()).state).toBe('unavailable');
  });
});
