import { describe, expect, it, vi } from 'vitest';
import { createContactHandler } from './contact';

const message = { name: 'Test Reader', email: 'reader@example.com', message: 'An integration test that is never sent.', consent: true, website: '' };
const request = (body: unknown = message, origin = 'http://localhost:4246') => new Request('http://localhost:4246/api/shielded-preview/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body) });
const provider = (status: string, extra = {}) => vi.fn<typeof fetch>().mockResolvedValue(Response.json({ status, ...extra }));

describe('Shielded Labs contact integration (mocked provider only)', () => {
  it('maps only approved fields to the fixed public form and deduplicates repeats', async () => {
    const fetcher = provider('mail_sent');
    const contact = createContactHandler(fetcher);
    const first = await contact(request());
    expect(await first.json()).toEqual({ sent: true });
    expect((await contact(request())).status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe('https://shieldedlabs.net/wp-json/contact-form-7/v1/contact-forms/32/feedback');
    expect(options?.redirect).toBe('error');
    const fields = options?.body as FormData;
    expect(fields.get('_wpcf7_unit_tag')).toBe('wpcf7-f32-o1');
    expect(fields.get('your-message')).toBe(message.message);
    expect(fields.has('consent')).toBe(false);
  });
  it('rejects cross-origin, invalid, overlong and honeypot submissions without upstream mail', async () => {
    const fetcher = provider('mail_sent');
    const contact = createContactHandler(fetcher);
    expect((await contact(request(message, 'https://elsewhere.example'))).status).toBe(403);
    for (const change of [{ email: 'wrong' }, { message: 'x'.repeat(2001) }, { consent: false }, { website: 'spam' }, { name: 'Name\nBcc: person' }]) expect((await contact(request({ ...message, ...change }))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('rejects oversized streaming bodies even without Content-Length', async () => {
    const fetcher = provider('mail_sent');
    expect((await createContactHandler(fetcher)(request({ ...message, message: 'x'.repeat(25_000) }))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(['mail_failed', 'spam', 'aborted', 'acceptance_missing', 'unexpected'])('does not turn %s into success', async status => {
    const response = await createContactHandler(provider(status))(request());
    expect(response.ok).toBe(false);
    expect((await response.json()).sent).not.toBe(true);
  });
  it('keeps provider validation errors attached to their fields', async () => {
    const response = await createContactHandler(provider('validation_failed', { invalid_fields: [{ field: 'your-email' }] }))(request());
    expect(response.status).toBe(422);
    expect((await response.json()).fields.email).toContain('email');
  });
  it('does not automatically resend after an uncertain timeout', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('Timeout'));
    const contact = createContactHandler(fetcher);
    expect((await contact(request())).status).toBe(503);
    expect((await contact(request())).status).toBe(503);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('limits attempts independently of client-supplied IP headers and expires the window', async () => {
    let now = 1;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json({ status: 'mail_sent' }));
    const contact = createContactHandler(fetcher, () => now);
    for (let i = 0; i < 10; i++) expect((await contact(request({ ...message, message: `Unique message number ${i}` }))).status).toBe(200);
    expect((await contact(request())).status).toBe(429);
    now += 600_001;
    expect((await contact(request())).status).toBe(200);
  });
});
