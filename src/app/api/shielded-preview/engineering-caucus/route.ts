import { ballotCenter } from '@/lib/shielded-preview/engineering-caucus/poll';
import { readCaucusTotals } from '@/lib/shielded-preview/engineering-caucus/parse';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.SHIELDED_LABS_PREVIEW !== '1') return new Response(null, { status: 404 });
  try {
    const response = await fetch(ballotCenter, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Helios unavailable');
    const totals = readCaucusTotals(await response.text());
    return Response.json({ ...totals, checkedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' } });
  } catch {
    return Response.json({ error: 'Helios turnout unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
