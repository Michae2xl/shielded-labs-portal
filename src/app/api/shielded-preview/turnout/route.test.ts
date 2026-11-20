import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});
describe('turnout route', () => {
  it('keeps the same local portal access boundary', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '');
    const { GET } = await import('./route');
    expect((await GET()).status).toBe(404);
  });
  it('returns the snapshot without caching it in the browser', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '1');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    const { GET } = await import('./route');
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    const body = await response.json();
    expect(body.bodies.map((b: { name: string; state: string }) => [b.name, b.state])).toEqual([
      ['Coinholders', 'unavailable'],
      ['ZCAP', 'recorded'],
      ['Zcash Brasil', 'unavailable'],
      ['ZecHub', 'unavailable'],
      ['Zcash Engineering Caucus', 'unavailable'],
    ]);
  });
});
