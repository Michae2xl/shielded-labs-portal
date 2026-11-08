import { getGovernanceData } from '@/lib/shielded-preview/governance-provider';
import { getProposalBody } from '@/lib/shielded-preview/proposal-body';
import { allowedRefs, refFromQuery, refKey } from '@/lib/shielded-preview/proposal-refs';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, max-age=300', 'X-Robots-Tag': 'noindex, nofollow' };

/** The full text of one application the portal lists, read on demand from GitHub or the forum. */
export async function GET(request: Request) {
  if (process.env.SHIELDED_LABS_PREVIEW !== '1') return new Response('Not found', { status: 404 });
  const ref = refFromQuery(new URL(request.url).searchParams);
  if (!ref) return Response.json({ error: 'Unknown application' }, { status: 400, headers });
  if (!allowedRefs(await getGovernanceData()).has(refKey(ref))) return Response.json({ error: 'Unknown application' }, { status: 404, headers });
  return Response.json(await getProposalBody(ref), { headers });
}
