import { notFound, redirect } from 'next/navigation';
import { initialPortalData } from '@/lib/shielded-preview/provider';
import { legacyProjectResourceHref } from '@/lib/shielded-preview/editorial/library';
import Portal from './portal';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shielded Labs · Governance & Research', robots: { index: false, follow: false } };
export default async function ShieldedPreviewPage({ searchParams }: { searchParams: Promise<{ view?: string; project?: string; section?: string; record?: string; q?: string; simulation?: string }> }) {
  if (process.env.SHIELDED_LABS_PREVIEW !== '1') notFound();
  const params = await searchParams;
  const canonical = legacyProjectResourceHref(`?${new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))}`);
  if (canonical) redirect(canonical);
  return <Portal initial={initialPortalData()} initialView={params.view} initialProjectId={params.project} initialSection={params.section} initialRecord={params.record} />;
}
