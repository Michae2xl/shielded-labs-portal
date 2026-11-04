import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ContactForm, { createContactFormController } from './contact-form';

const draft = { name: 'Audit draft', email: 'reader@example.test', message: 'Local draft used to check navigation.', consent: true, website: '' };
afterEach(() => vi.unstubAllEnvs());
function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>(done => { resolve = done; });
  return { promise, resolve };
}

describe('Contact draft across About navigation (mocked requests only)', () => {
  it('keeps the feedback prototype entirely local and never reports delivery', async () => {
    vi.stubEnv('NEXT_PUBLIC_SHIELDED_LABS_FEEDBACK_PREVIEW', '1');
    const fetcher = vi.fn<typeof fetch>();
    const controller = createContactFormController(fetcher);
    controller.edit(draft);
    await controller.submit();
    expect(fetcher).not.toHaveBeenCalled();
    expect(controller.getSnapshot()).toMatchObject({ state: 'idle', draft, message: 'Demo only — your message has not been sent.' });
    const markup = renderToStaticMarkup(createElement(ContactForm, { controller, onPrivacy: () => {} }));
    expect(markup).toContain('Test form');
    expect(markup).toContain('no messages will be sent.');
  });
  it('restores every controlled field when the contact form remounts with its About controller', () => {
    const fetcher = vi.fn<typeof fetch>();
    const controller = createContactFormController(fetcher);
    const unmount = controller.subscribe(vi.fn());
    controller.edit(draft);
    const beforePrivacy = controller.getSnapshot();
    unmount();
    const remount = controller.subscribe(vi.fn());
    expect(controller.getSnapshot()).toBe(beforePrivacy);
    const markup = renderToStaticMarkup(createElement(ContactForm, { controller, onPrivacy: () => {} }));
    expect(markup).toContain('value="Audit draft"');
    expect(markup).toContain('value="reader@example.test"');
    expect(markup).toContain('>Local draft used to check navigation.</textarea>');
    expect(markup).toMatch(/name="consent"[^>]*checked=""/);
    remount();
    expect(createContactFormController(fetcher).getSnapshot().draft.name).toBe('');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('keeps one pending submission and its success state while Contact is unmounted', async () => {
    const response = deferredResponse();
    const fetcher = vi.fn<typeof fetch>().mockReturnValue(response.promise);
    const controller = createContactFormController(fetcher);
    const unmount = controller.subscribe(vi.fn());
    controller.edit(draft);
    const sending = controller.submit();
    unmount();
    expect(controller.getSnapshot().state).toBe('sending');
    await controller.submit();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetcher.mock.calls[0][1]!.body as string)).toEqual(draft);
    response.resolve(Response.json({ sent: true }));
    await sending;
    expect(controller.getSnapshot()).toMatchObject({ state: 'sent', draft: { name: '', email: '', message: '', consent: false } });
    const markup = renderToStaticMarkup(createElement(ContactForm, { controller, onPrivacy: () => {} }));
    expect(markup).toContain('Write another message');
    controller.startNew();
    expect(controller.getSnapshot()).toMatchObject({ state: 'idle', message: '', fields: {} });
  });

  it('retains the draft and validation errors when a submission fails away from Contact', async () => {
    const response = deferredResponse();
    const fetcher = vi.fn<typeof fetch>().mockReturnValue(response.promise);
    const controller = createContactFormController(fetcher);
    controller.edit(draft);
    const sending = controller.submit();
    response.resolve(Response.json({ error: 'Please check the email.', fields: { email: 'Invalid email.' } }, { status: 422 }));
    await sending;
    expect(controller.getSnapshot()).toMatchObject({ state: 'error', draft, fields: { email: 'Invalid email.' }, message: 'Please check the email.' });
  });

  it.each([true, false])('does not clear or attach stale validation to a newer draft after sent=%s', async sent => {
    const response = deferredResponse();
    const fetcher = vi.fn<typeof fetch>().mockReturnValue(response.promise);
    const controller = createContactFormController(fetcher);
    controller.edit(draft);
    const sending = controller.submit();
    controller.startNew();
    const nextDraft = { ...draft, name: 'New draft', message: 'A different message that has not been sent.' };
    controller.edit(nextDraft);
    response.resolve(sent ? Response.json({ sent: true }) : Response.json({ error: 'Old validation error.', fields: { name: 'Old name error.' } }, { status: 422 }));
    await sending;
    expect(controller.getSnapshot()).toMatchObject({ state: 'idle', draft: nextDraft, fields: {} });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
