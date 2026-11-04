import { afterEach, describe, expect, it, vi } from 'vitest';
import { bundledZips } from './library';
vi.mock('server-only', () => ({}));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.resetModules(); });

const remoteEntry = { ...bundledZips.entries[0], title: 'Fetched title' };
const remoteMeta = { ...bundledZips.meta, syncedAt: '2026-11-04T12:00:00Z' };
function remote(responses: Record<string, unknown>) {
  return vi.fn(async (url: string) => url in responses ? Response.json(responses[url]) : new Response('missing', { status: 404 }));
}
function sentHeaders(call: [string, RequestInit?] | undefined) {
  return (call?.[1]?.headers ?? {}) as Record<string, string>;
}

describe('ZIP sync source boundaries', () => {
  it('serves the bundled snapshot without any network when no sync branch is configured', async () => {
    vi.stubEnv('ZIPS_DATA_URL', '');
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const { getZipsIndex, getZipDocument, zipsDataUrl } = await import('./provider');
    expect(zipsDataUrl()).toBeNull();
    expect(await getZipsIndex()).toBe(bundledZips);
    const document = await getZipDocument('zip-0032');
    expect(document?.title).toBe('Shielded Hierarchical Deterministic Wallets');
    expect(document?.headings.length).toBeGreaterThan(10);
    expect(document?.body.length).toBeGreaterThan(50);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('rejects identifiers that are not bundled records or could escape the documents folder', async () => {
    vi.stubEnv('ZIPS_DATA_URL', '');
    const { getZipDocument } = await import('./provider');
    for (const id of ['../package', 'ZIP-0032', 'zip-0032.json', 'no-such-zip', '', 'zip 0032']) expect(await getZipDocument(id)).toBeNull();
  });
  it('only accepts an https sync base', async () => {
    const { zipsDataUrl } = await import('./provider');
    for (const value of ['http://raw.example/zips-data', 'https://user:pw@raw.example/x', 'https://raw.example/x?y=1', 'not a url']) {
      vi.stubEnv('ZIPS_DATA_URL', value);
      expect(zipsDataUrl()).toBeNull();
    }
    vi.stubEnv('ZIPS_DATA_URL', 'https://raw.example/zips-data/');
    expect(zipsDataUrl()).toBe('https://raw.example/zips-data');
  });
  it('uses a valid sync index and coalesces concurrent refreshes', async () => {
    vi.stubEnv('ZIPS_DATA_URL', 'https://raw.example/zips-data');
    const fetcher = remote({ 'https://raw.example/zips-data/index.json': [remoteEntry], 'https://raw.example/zips-data/meta.json': remoteMeta });
    vi.stubGlobal('fetch', fetcher);
    const { getZipsIndex } = await import('./provider');
    const [a, b] = await Promise.all([getZipsIndex(), getZipsIndex()]);
    expect(a).toBe(b);
    expect(a.state).toBe('fetched');
    expect(a.entries[0].title).toBe('Fetched title');
    expect(a.meta.syncedAt).toBe('2026-11-04T12:00:00Z');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('sends the read-only credential to the sync base only when one is configured', async () => {
    vi.stubEnv('ZIPS_DATA_URL', 'https://raw.example/zips-data');
    const fetcher = remote({ 'https://raw.example/zips-data/index.json': [remoteEntry], 'https://raw.example/zips-data/meta.json': remoteMeta });
    vi.stubGlobal('fetch', fetcher);
    vi.stubEnv('ZIPS_DATA_TOKEN', 'exampleReadOnlyCredential0123456789');
    const { getZipsIndex } = await import('./provider');
    expect((await getZipsIndex()).state).toBe('fetched');
    expect(sentHeaders(fetcher.mock.calls[0]).Authorization).toBe('token exampleReadOnlyCredential0123456789');
    vi.resetModules();
    vi.stubEnv('ZIPS_DATA_TOKEN', '');
    const again = await import('./provider');
    await again.getZipsIndex();
    expect(sentHeaders(fetcher.mock.calls.at(-1)).Authorization).toBeUndefined();
  });
  it('keeps the bundled snapshot, flagged, when the sync branch is unavailable or invalid', async () => {
    vi.stubEnv('ZIPS_DATA_URL', 'https://raw.example/zips-data');
    vi.stubGlobal('fetch', remote({ 'https://raw.example/zips-data/index.json': [{ ...remoteEntry, source: 'javascript:alert(1)' }], 'https://raw.example/zips-data/meta.json': remoteMeta }));
    const { getZipsIndex } = await import('./provider');
    const index = await getZipsIndex();
    expect(index.state).toBe('snapshot');
    expect(index.error).toBe(true);
    expect(index.entries).toEqual(bundledZips.entries);
  });
  it('falls back to the bundled document when the synced document is missing or does not match', async () => {
    vi.stubEnv('ZIPS_DATA_URL', 'https://raw.example/zips-data');
    const fetcher = remote({ 'https://raw.example/zips-data/documents/zip-0032.json': { ...remoteEntry, id: 'zip-0033', headings: [], body: ['x'] } });
    vi.stubGlobal('fetch', fetcher);
    const { getZipDocument } = await import('./provider');
    expect((await getZipDocument('zip-0032'))?.title).toBe('Shielded Hierarchical Deterministic Wallets');
    expect((await getZipDocument('zip-0317'))?.id).toBe('zip-0317');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('serves a valid synced document and caches it', async () => {
    vi.stubEnv('ZIPS_DATA_URL', 'https://raw.example/zips-data');
    const fetcher = remote({ 'https://raw.example/zips-data/documents/zip-0032.json': { ...remoteEntry, id: 'zip-0032', headings: [{ id: 'abstract', title: 'Abstract', level: 2 }], body: [{ tag: 'p', children: ['Synced body'] }] } });
    vi.stubGlobal('fetch', fetcher);
    const { getZipDocument } = await import('./provider');
    expect((await getZipDocument('zip-0032'))?.body).toEqual([{ tag: 'p', children: ['Synced body'] }]);
    expect((await getZipDocument('zip-0032'))?.title).toBe('Fetched title');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
