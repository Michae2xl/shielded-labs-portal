import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { initialPortalData } from '@/lib/shielded-preview/provider';
import { legacyProjectResourceHref } from '@/lib/shielded-preview/editorial/library';
import { shareMetadata, shareOrigin } from '@/lib/shielded-preview/share';
import Portal from './portal';
export const dynamic = 'force-dynamic';
type PageParams = { view?: string; project?: string; section?: string; record?: string; lane?: string; q?: string; simulation?: string };
/** Each shared link describes its own page; previews stay out of search indexes. */
export async function generateMetadata({ searchParams }: { searchParams: Promise<PageParams> }): Promise<Metadata> {
  const request = await headers();
  const host = (request.get('x-forwarded-host') ?? request.get('host'))?.split(',')[0].trim() ?? null;
  return { ...shareMetadata(await searchParams, shareOrigin(host, request.get('x-forwarded-proto')?.split(',')[0].trim() ?? null)), robots: { index: false, follow: false } };
}
export default async function ShieldedPreviewPage({ searchParams }: { searchParams: Promise<{ view?: string; project?: string; section?: string; record?: string; q?: string; simulation?: string }> }) {
  if (process.env.SHIELDED_LABS_PREVIEW !== '1') notFound();
  const params = await searchParams;
  const canonical = legacyProjectResourceHref(`?${new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))}`);
  if (canonical) redirect(canonical);
  return <Portal initial={initialPortalData()} initialView={params.view} initialProjectId={params.project} initialSection={params.section} initialRecord={params.record} />;
}
