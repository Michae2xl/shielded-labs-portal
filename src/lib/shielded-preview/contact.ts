import { createHash } from 'node:crypto';
import { z } from 'zod';

// The public form on shieldedlabs.net/contact/ uses this fixed CF7 form.
// No destination, mail headers, tokens or upstream URL are accepted from clients.
const endpoint = 'https://shieldedlabs.net/wp-json/contact-form-7/v1/contact-forms/32/feedback';
const schema = z.object({
  name: z.string().trim().min(2).max(120).refine(value => !/[\r\n\x00-\x1f]/.test(value)),
  email: z.email().max(254),
  message: z.string().trim().min(10).max(2000).refine(value => !value.includes('\0')),
  consent: z.literal(true),
  website: z.string().max(0),
});
type ContactResult = { status: number; body: { sent?: boolean; error?: string; fields?: Record<string, string> } };
const fieldMessages = { name: 'Enter your name (2–120 characters).', email: 'Enter a valid email address.', message: 'Write a message of 10–2,000 characters.', consent: 'Confirm that you want to share these details with Shielded Labs.' };
function reply(result: ContactResult) {
  return Response.json(result.body, { status: result.status, headers: { 'Cache-Control': 'no-store', ...(result.status === 429 ? { 'Retry-After': '600' } : {}) } });
}

async function readBounded(request: Request) {
  if (!request.body) throw new Error('Empty body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    length += next.value.byteLength;
    if (length > 24_000) { await reader.cancel(); throw new Error('Oversized body'); }
    chunks.push(next.value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}

export function createContactHandler(fetcher: typeof fetch = fetch, now = Date.now) {
  // Single-instance protection for this local portal; deploy behind a shared
  // edge rate limit before enabling contact on a multi-instance public service.
  let attempts: number[] = [];
  const requests = new Map<string, { time: number; result: Promise<ContactResult> }>();
  return async function contact(request: Request): Promise<Response> {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host') ?? new URL(request.url).host;
    try {
      if (!origin || !['http:', 'https:'].includes(new URL(origin).protocol) || new URL(origin).host !== host) return reply({ status: 403, body: { error: 'Please send your message from the contact page.' } });
    } catch { return reply({ status: 403, body: { error: 'Invalid origin.' } }); }
    if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({ status: 415, body: { error: 'Unsupported message format.' } });
    let data: unknown;
    try { data = await readBounded(request); } catch { return reply({ status: 400, body: { error: 'The message could not be read. Keep it under 2,000 characters.' } }); }
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0]);
        if (field in fieldMessages) fields[field] = fieldMessages[field as keyof typeof fieldMessages];
      }
      return reply({ status: 400, body: { error: 'Please check your message and try again.', fields } });
    }
    const time = now();
    for (const [key, value] of requests) if (time - value.time > 600_000) requests.delete(key);
    const key = createHash('sha256').update(JSON.stringify(parsed.data)).digest('hex');
    const previous = requests.get(key);
    if (previous) return reply(await previous.result);
    attempts = attempts.filter(attempt => time - attempt < 600_000);
    if (attempts.length >= 10) return reply({ status: 429, body: { error: 'The contact service is busy. Please try again in 10 minutes. Your draft is still here.' } });
    attempts.push(time);
    const result = (async (): Promise<ContactResult> => {
      const body = new FormData();
      body.set('_wpcf7', '32');
      body.set('_wpcf7_unit_tag', 'wpcf7-f32-o1');
      body.set('_wpcf7_locale', 'en_US');
      body.set('your-name', parsed.data.name);
      body.set('your-email', parsed.data.email);
      body.set('your-message', parsed.data.message);
      try {
        const upstream = await fetcher(endpoint, { method: 'POST', body, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15_000) });
        if (!upstream.ok) throw new Error('Contact service unavailable');
        const response = await upstream.json() as { status?: string; invalid_fields?: { field: string }[] };
        if (response.status === 'mail_sent') return { status: 200, body: { sent: true } };
        if (response.status === 'validation_failed') {
          const mapping: Record<string, keyof typeof fieldMessages> = { 'your-name': 'name', 'your-email': 'email', 'your-message': 'message' };
          const fields: Record<string, string> = {};
          for (const field of response.invalid_fields ?? []) { const name = mapping[field.field]; if (name) fields[name] = fieldMessages[name]; }
          return { status: 422, body: { error: 'The contact service could not validate your message. Please check the fields.', fields } };
        }
        if (response.status === 'spam' || response.status === 'aborted' || response.status === 'acceptance_missing') return { status: 422, body: { error: 'The contact service did not accept this submission. Your draft is still here. You can contact info@shieldedlabs.net if this continues.' } };
        if (response.status === 'mail_failed') return { status: 502, body: { error: 'The contact service could not send your message. Your draft is still here.' } };
        throw new Error('Unconfirmed status');
      } catch {
        // A timeout can occur after the provider sent mail. Preserve the draft
        // and this result for 10 minutes, avoiding an automatic duplicate send.
        return { status: 503, body: { error: 'Sending could not be confirmed. Your draft is still here. Please wait 10 minutes before trying this message again.' } };
      }
    })();
    requests.set(key, { time, result });
    return reply(await result);
  };
}
