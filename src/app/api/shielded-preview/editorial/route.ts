import documents from '@/lib/shielded-preview/editorial/documents.json';
import { institutionalDocuments } from '@/lib/shielded-preview/editorial/institutional';
import { simulatorDocuments } from '@/lib/shielded-preview/editorial/simulators';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  if (process.env.SHIELDED_LABS_PREVIEW !== '1') return new Response('Not found', { status: 404 });
  const id = new URL(request.url).searchParams.get('id');
  const document = [...documents, ...institutionalDocuments, ...simulatorDocuments].find(entry => entry.id === id);
  if (!document) return Response.json({ error: 'Document not found' }, { status: 404 });
  return Response.json(document, { headers: { 'Cache-Control': 'private, max-age=300', 'X-Robots-Tag': 'noindex, nofollow' } });
}
