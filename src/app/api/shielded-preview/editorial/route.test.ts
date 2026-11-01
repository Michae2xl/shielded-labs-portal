import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

afterEach(() => vi.unstubAllEnvs());
describe('editorial document route', () => {
  it('keeps the same local portal access boundary', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '');
    expect((await GET(new Request('https://local.test/api?id=crosslink-faq'))).status).toBe(404);
  });
  it('returns the complete selected document and no other records', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '1');
    const response = await GET(new Request('https://local.test/api?id=crosslink-faq'));
    expect(response.status).toBe(200);
    const doc = await response.json();
    expect(doc.id).toBe('crosslink-faq');
    expect(doc.body.length).toBeGreaterThan(40);
    expect(doc.headings).toHaveLength(23);
    expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
  });
  it('has a real missing-document state', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '1');
    expect((await GET(new Request('https://local.test/api?id=not-real'))).status).toBe(404);
  });
});
