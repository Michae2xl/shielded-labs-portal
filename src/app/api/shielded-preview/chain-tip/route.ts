import { z } from 'zod';

const stats = z.object({
  data: z.object({
    best_block_height: z.number().int().positive(),
    best_block_time: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
  }),
});

export async function GET() {
  if (process.env.SHIELDED_LABS_PREVIEW !== '1') return new Response(null, { status: 404 });
  try {
    const response = await fetch('https://api.blockchair.com/zcash/stats', {
      next: { revalidate: 30 }, signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Chain tip unavailable');
    const { best_block_height, best_block_time } = stats.parse(await response.json()).data;
    const time = new Date(best_block_time.replace(' ', 'T') + 'Z').toISOString();
    return Response.json({ height: best_block_height, time }, { headers: { 'Cache-Control': 'public, max-age=15' } });
  } catch {
    return Response.json({ error: 'Chain tip unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
