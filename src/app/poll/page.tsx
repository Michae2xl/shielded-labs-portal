import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { governanceMetadata } from '@/app/governance/governance-metadata';
import { THEME_SCRIPT } from '@/app/governance/theme';
import PollSite from './poll-site';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  return {
    ...governanceMetadata({ section: 'voting', lane: 'dev-fund' }, await headers()),
    title: 'Zcash Governance',
    icons: { icon: '/logos/shielded-labs.png' },
  };
}
/** The ZCG / Dev Fund poll as a site of its own: what the launch address shows at its root. */
export default function PollPage() {
  if (process.env.SHIELDED_LABS_PREVIEW !== '1') notFound();
  return <>
    <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}/>
    <PollSite/>
  </>;
}
