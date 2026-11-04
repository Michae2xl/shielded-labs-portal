import { createContactHandler } from '@/lib/shielded-preview/contact';

export const runtime = 'nodejs';
const contact = createContactHandler();

export async function POST(request: Request) {
  if (process.env.SHIELDED_LABS_PREVIEW !== '1') return new Response('Not found', { status: 404 });
  if (process.env.NEXT_PUBLIC_SHIELDED_LABS_FEEDBACK_PREVIEW === '1') {
    return Response.json({ sent: false, error: 'Contact sending is disabled in this feedback prototype.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }
  return contact(request);
}
