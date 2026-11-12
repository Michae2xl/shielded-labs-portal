import type { Metadata } from 'next';
import type { RequestParams } from '@/lib/shielded-preview/portals';
import { requestOrigin, shareMetadata, type ShareParams } from '@/lib/shielded-preview/share';

/** A shared link names the governance portal and describes its own page; previews stay out of search indexes. */
export function governanceMetadata(params: RequestParams, request: { get(name: string): string | null }): Metadata {
  const page: ShareParams = { view: 'governance' };
  for (const key of ['section', 'record', 'lane'] as const) { const value = params[key]; if (typeof value === 'string') page[key] = value; }
  return { ...shareMetadata(page, requestOrigin(request)), applicationName: 'Zcash Governance', robots: { index: false, follow: false } };
}
