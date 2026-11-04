'use client';

import { useEffect, useRef, useSyncExternalStore, type FormEvent } from 'react';
import s from './contact-form.module.css';

type ContactDraft = { name: string; email: string; message: string; consent: boolean; website: string };
type ContactState = { draft: ContactDraft; state: 'idle' | 'sending' | 'sent' | 'error'; message: string; fields: Record<string, string> };
const emptyDraft = (): ContactDraft => ({ name: '', email: '', message: '', consent: false, website: '' });
const unconfirmed = 'Sending could not be confirmed. Your draft is still here. Please wait before trying again.';

/** Owned by the About view, so navigating to Privacy never persists or discards a draft. */
export function createContactFormController(fetcher: typeof fetch = fetch) {
  let snapshot: ContactState = { draft: emptyDraft(), state: 'idle', message: '', fields: {} };
  let busy = false;
  const listeners = new Set<() => void>();
  function update(next: ContactState) { snapshot = next; listeners.forEach(listener => listener()); }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    edit: (changes: Partial<ContactDraft>) => update({ ...snapshot, draft: { ...snapshot.draft, ...changes } }),
    startNew: () => update({ draft: emptyDraft(), state: 'idle', message: '', fields: {} }),
    async submit() {
      if (busy || snapshot.state === 'sent') return;
      if (process.env.NEXT_PUBLIC_SHIELDED_LABS_FEEDBACK_PREVIEW === '1') {
        update({ ...snapshot, state: 'idle', fields: {}, message: 'Demo only — your message has not been sent.' });
        return;
      }
      const submitted = snapshot.draft;
      busy = true;
      update({ ...snapshot, state: 'sending', fields: {}, message: '' });
      let fields: Record<string, string> = {};
      try {
        const response = await fetcher('/api/shielded-preview/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(25_000), body: JSON.stringify(submitted) });
        const result = await response.json() as { sent?: boolean; error?: string; fields?: Record<string, string> };
        if (!response.ok || result.sent !== true) { fields = result.fields ?? {}; throw new Error(result.error || unconfirmed); }
        const sameDraft = snapshot.draft === submitted;
        update({ ...snapshot, draft: sameDraft ? emptyDraft() : snapshot.draft, state: sameDraft ? 'sent' : 'idle', fields: {}, message: 'Your message has been sent to Shielded Labs. Thank you for getting in touch.' });
      } catch (error) {
        const sameDraft = snapshot.draft === submitted;
        update({ ...snapshot, state: sameDraft ? 'error' : 'idle', fields: sameDraft ? fields : {}, message: error instanceof Error && !(error instanceof TypeError) && !(error instanceof DOMException) ? error.message : unconfirmed });
      } finally { busy = false; }
    },
  };
}
export type ContactFormController = ReturnType<typeof createContactFormController>;

export default function ContactForm({ controller, onPrivacy }: { controller: ContactFormController; onPrivacy: () => void }) {
  const feedbackPreview = process.env.NEXT_PUBLIC_SHIELDED_LABS_FEEDBACK_PREVIEW === '1';
  const { draft, state, message, fields } = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const status = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!message) return;
    const frame = requestAnimationFrame(() => status.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [message]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void controller.submit();
  }
  return <form className={s.form} onSubmit={submit} aria-label="Contact Shielded Labs">
    <p className={s.lead}>{feedbackPreview ? 'Prototype form. You can try the fields; no messages will be sent.' : 'Questions, ideas or a collaboration in mind? Write to the team.'}</p>
    <fieldset disabled={state === 'sending' || state === 'sent'}>
      <div className={s.pair}>
        <label htmlFor="contact-name">Name<input id="contact-name" name="name" autoComplete="name" value={draft.name} onChange={event => controller.edit({ name: event.target.value })} required minLength={2} maxLength={120} aria-invalid={Boolean(fields.name)} aria-describedby={fields.name ? 'contact-name-error' : undefined}/>{fields.name && <small id="contact-name-error" className={s.error}>{fields.name}</small>}</label>
        <label htmlFor="contact-email">Email<input id="contact-email" name="email" type="email" autoComplete="email" value={draft.email} onChange={event => controller.edit({ email: event.target.value })} required maxLength={254} aria-invalid={Boolean(fields.email)} aria-describedby={fields.email ? 'contact-email-error' : undefined}/>{fields.email && <small id="contact-email-error" className={s.error}>{fields.email}</small>}</label>
      </div>
      <label htmlFor="contact-message">Message<textarea id="contact-message" name="message" value={draft.message} onChange={event => controller.edit({ message: event.target.value })} required minLength={10} maxLength={2000} rows={6} aria-invalid={Boolean(fields.message)} aria-describedby={fields.message ? 'contact-message-error' : undefined}/>{fields.message && <small id="contact-message-error" className={s.error}>{fields.message}</small>}</label>
      <div hidden aria-hidden="true"><label>Website<input name="website" value={draft.website} onChange={event => controller.edit({ website: event.target.value })} tabIndex={-1} autoComplete="off"/></label></div>
      <label className={s.consent}><input name="consent" type="checkbox" checked={draft.consent} onChange={event => controller.edit({ consent: event.target.checked })} required/><span>{feedbackPreview ? 'I understand this is a prototype; no message will be sent.' : 'I agree to share my name, email and message with Shielded Labs so the team can respond.'}</span></label>
      {fields.consent && <small className={s.error}>{fields.consent}</small>}
    </fieldset>
    <div className={s.actions}>
      {state === 'sent' ? <button type="button" onClick={event => { event.preventDefault(); controller.startNew(); }}>Write another message</button> : <button type="submit" disabled={state === 'sending'}>{feedbackPreview ? 'Test form' : state === 'sending' ? 'Sending…' : 'Send message'}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></button>}
      <a href="?view=about&section=privacy" onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onPrivacy(); } }}>Privacy policy</a>
    </div>
    <div ref={status} tabIndex={-1} role="status" aria-live="polite" className={`${s.status} ${state === 'error' ? s.error : ''}`}>{message}</div>
  </form>;
}
