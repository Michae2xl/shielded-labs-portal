import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { initialPortalData } from '@/lib/shielded-preview/provider';
import { legacyProjectResourceHref } from '@/lib/shielded-preview/editorial/library';
import { labsAnswer } from '@/lib/shielded-preview/portals';
import { requestOrigin, shareMetadata } from '@/lib/shielded-preview/share';
import GovernancePortal from '../governance/governance-portal';
import { governanceMetadata } from '../governance/governance-metadata';
import Portal from './portal';
export const dynamic = 'force-dynamic';
type PageParams = { view?: string; project?: string; section?: string; record?: string; lane?: string; q?: string; simulation?: string };
/** Each shared link describes its own page; previews stay out of search indexes. */
export async function generateMetadata({ searchParams }: { searchParams: Promise<PageParams> }): Promise<Metadata> {
  const [request, params] = await Promise.all([headers(), searchParams]);
  const answer = labsAnswer(params);
  // Whatever this address hands to the governance portal is described as that portal's page.
  if ('redirect' in answer || answer.page === 'governance') return governanceMetadata(params, request);
  return { ...shareMetadata(params, requestOrigin(request)), robots: { index: false, follow: false } };
}
export default async function ShieldedPreviewPage({ searchParams }: { searchParams: Promise<{ view?: string; project?: string; section?: string; record?: string; q?: string; simulation?: string }> }) {
  if (process.env.SHIELDED_LABS_PREVIEW !== '1') notFound();
  const params = await searchParams;
  // Governance has its own address. Links from before the split still name it as a view of this one, and the bare root still opens it.
  const answer = labsAnswer(params);
  if ('redirect' in answer) redirect(answer.redirect);
  if (answer.page === 'governance') return <GovernancePortal/>;
  const canonical = legacyProjectResourceHref(`?${new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))}`);
  if (canonical) redirect(canonical);
  return <Portal initial={initialPortalData()} initialView={params.view} initialProjectId={params.project} initialSection={params.section} initialRecord={params.record} />;
}
