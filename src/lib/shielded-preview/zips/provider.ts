import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { bundledZips } from './library';
import { zipDocumentSchema, zipEntrySchema, zipIdPattern, zipMetaSchema, type ZipDocument, type ZipsIndex } from './types';

const TTL = 300_000;
const INDEX_LIMIT = 3_000_000;
const META_LIMIT = 200_000;
const DOCUMENT_LIMIT = 8_000_000;
const DOCUMENT_CACHE = 48;
const DOCUMENTS_DIR = path.join(process.cwd(), 'src/lib/shielded-preview/zips/documents');
let indexCache: { at: number; data: ZipsIndex } | undefined;
let pending: Promise<ZipsIndex> | undefined;
const documents = new Map<string, { at: number; data: ZipDocument }>();

/** The sync branch base URL, if configured; only https sources are accepted. */
export function zipsDataUrl(): string | null {
  const value = process.env.ZIPS_DATA_URL?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null;
    return url.href.replace(/\/+$/, '');
  } catch { return null; }
}

async function readRemote(url: string, limit: number): Promise<unknown> {
  const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'Shielded-Labs-Portal' }, signal: AbortSignal.timeout(8000), cache: 'no-store' });
  if (!response.ok) throw new Error(`Source unavailable (${response.status})`);
  if (Number(response.headers.get('content-length') ?? 0) > limit) throw new Error('Source exceeds the size limit');
  const text = await response.text();
  if (text.length > limit) throw new Error('Source exceeds the size limit');
  return JSON.parse(text);
}

async function refreshIndex(base: string): Promise<ZipsIndex> {
  const [entries, meta] = await Promise.all([readRemote(`${base}/index.json`, INDEX_LIMIT), readRemote(`${base}/meta.json`, META_LIMIT)]);
  const parsedEntries = zipEntrySchema.array().max(5000).parse(entries);
  if (new Set(parsedEntries.map(entry => entry.id)).size !== parsedEntries.length) throw new Error('Duplicate records in the sync index');
  return { state: 'fetched', observedAt: new Date().toISOString(), error: false, meta: zipMetaSchema.parse(meta), entries: parsedEntries };
}

/** Index from the sync branch when configured; otherwise, or on failure, the last good index or the bundled snapshot. */
export async function getZipsIndex(): Promise<ZipsIndex> {
  const base = zipsDataUrl();
  if (!base) return bundledZips;
  if (indexCache && Date.now() - indexCache.at < TTL) return indexCache.data;
  if (!pending) {
    pending = refreshIndex(base)
      .then(data => { indexCache = { at: Date.now(), data }; return data; })
      .catch(() => { const fallback = { ...(indexCache?.data ?? bundledZips), error: true }; indexCache = { at: Date.now(), data: fallback }; return fallback; })
      .finally(() => { pending = undefined; });
  }
  return pending;
}

async function readLocal(id: string): Promise<ZipDocument | null> {
  // Only ids listed in the bundled index map to files; the id pattern already excludes path separators.
  if (!bundledZips.entries.some(entry => entry.id === id)) return null;
  try {
    const document = zipDocumentSchema.parse(JSON.parse(await readFile(path.join(DOCUMENTS_DIR, `${id}.json`), 'utf8')));
    return document.id === id ? document : null;
  } catch { return null; }
}

async function readRemoteDocument(base: string, id: string): Promise<ZipDocument | null> {
  try {
    const document = zipDocumentSchema.parse(await readRemote(`${base}/documents/${id}.json`, DOCUMENT_LIMIT));
    return document.id === id ? document : null;
  } catch { return null; }
}

export async function getZipDocument(id: string): Promise<ZipDocument | null> {
  if (!zipIdPattern.test(id)) return null;
  const cached = documents.get(id);
  if (cached && Date.now() - cached.at < TTL) return cached.data;
  const base = zipsDataUrl();
  const document = (base ? await readRemoteDocument(base, id) : null) ?? await readLocal(id);
  if (document) {
    if (documents.size >= DOCUMENT_CACHE) documents.delete(documents.keys().next().value!);
    documents.set(id, { at: Date.now(), data: document });
  }
  return document;
}
