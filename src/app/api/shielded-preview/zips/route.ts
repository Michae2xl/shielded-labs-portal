import { getZipDocument, getZipsIndex } from '@/lib/shielded-preview/zips/provider';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, max-age=300', 'X-Robots-Tag': 'noindex, nofollow' };
export async function GET(request: Request) {
  if (process.env.SHIELDED_LABS_PREVIEW !== '1') return new Response('Not found', { status: 404 });
  const id = new URL(request.url).searchParams.get('id');
  if (id === null) return Response.json(await getZipsIndex(), { headers });
  const document = await getZipDocument(id);
  if (!document) return Response.json({ error: 'Document not found' }, { status: 404 });
  return Response.json(document, { headers });
}
