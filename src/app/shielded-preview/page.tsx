import { notFound } from 'next/navigation';
import { initialPortalData } from '@/lib/shielded-preview/provider';
import Portal from './portal';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shielded Labs · Governance & Research', robots: { index: false, follow: false } };
export default async function ShieldedPreviewPage({ searchParams }: { searchParams: Promise<{ view?: string; project?: string; section?: string; record?: string }> }) {
  if (process.env.SHIELDED_LABS_PREVIEW !== '1') notFound();
  const params = await searchParams;
  return <Portal initial={initialPortalData()} initialView={params.view} initialProjectId={params.project} initialSection={params.section} initialRecord={params.record} />;
}
