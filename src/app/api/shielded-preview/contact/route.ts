import { createContactHandler } from '@/lib/shielded-preview/contact';

export const runtime = 'nodejs';
const contact = createContactHandler();

export async function POST(request: Request) {
  if (process.env.SHIELDED_LABS_PREVIEW !== '1') return new Response('Not found', { status: 404 });
  return contact(request);
}
