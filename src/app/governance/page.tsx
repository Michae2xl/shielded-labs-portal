import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { governanceRedirect, type RequestParams } from '@/lib/shielded-preview/portals';
import { governanceMetadata } from './governance-metadata';
import GovernancePortal from './governance-portal';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ searchParams }: { searchParams: Promise<RequestParams> }): Promise<Metadata> {
  const [request, params] = await Promise.all([headers(), searchParams]);
  return governanceMetadata(params, request);
}
export default async function GovernancePage({ searchParams }: { searchParams: Promise<RequestParams> }) {
  if (process.env.SHIELDED_LABS_PREVIEW !== '1') notFound();
  const destination = governanceRedirect(await searchParams);
  if (destination) redirect(destination);
  return <GovernancePortal/>;
}
