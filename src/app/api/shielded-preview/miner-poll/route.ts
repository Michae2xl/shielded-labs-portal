import { minerPoll } from '@/lib/shielded-preview/miner-poll/poll';
import { parseMinerTally } from '@/lib/shielded-preview/miner-poll/parse';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.SHIELDED_LABS_PREVIEW !== '1') return new Response(null, { status: 404 });
  try {
    const response = await fetch(minerPoll.tally, { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Miner tally unavailable');
    return Response.json(parseMinerTally(await response.text()), {
      headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' },
    });
  } catch {
    return Response.json({ error: 'Miner tally unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
