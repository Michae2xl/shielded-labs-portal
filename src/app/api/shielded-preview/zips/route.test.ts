import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe('ZIP documents route', () => {
  it('keeps the same local portal access boundary', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '');
    const { GET } = await import('./route');
    expect((await GET(new Request('https://local.test/api'))).status).toBe(404);
  });
  it('returns the index with its sync state and one complete document on request', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '1');
    vi.stubEnv('ZIPS_DATA_URL', '');
    const { GET } = await import('./route');
    const index = await (await GET(new Request('https://local.test/api'))).json();
    expect(index.state).toBe('snapshot');
    expect(index.entries.length).toBeGreaterThan(100);
    expect(index.entries[0]).not.toHaveProperty('body');
    const response = await GET(new Request('https://local.test/api?id=zip-0032'));
    expect(response.status).toBe(200);
    expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
    const document = await response.json();
    expect(document.id).toBe('zip-0032');
    expect(document.body.length).toBeGreaterThan(50);
  });
  it('has a real missing-document state', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '1');
    vi.stubEnv('ZIPS_DATA_URL', '');
    const { GET } = await import('./route');
    expect((await GET(new Request('https://local.test/api?id=not-real'))).status).toBe(404);
    expect((await GET(new Request('https://local.test/api?id=..%2Fpackage'))).status).toBe(404);
  });
});
