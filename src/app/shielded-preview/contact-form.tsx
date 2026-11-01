'use client';

import { useRef, useState, type FormEvent } from 'react';
import s from './contact-form.module.css';

export default function ContactForm({ onPrivacy }: { onPrivacy: () => void }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const busy = useRef(false);
  const status = useRef<HTMLDivElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    busy.current = true; setState('sending'); setFields({}); setMessage('');
    try {
      const response = await fetch('/api/shielded-preview/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(25_000), body: JSON.stringify({ name: values.get('name'), email: values.get('email'), message: values.get('message'), consent: values.get('consent') === 'on', website: values.get('website') ?? '' }) });
      const result = await response.json() as { sent?: boolean; error?: string; fields?: Record<string, string> };
      if (!response.ok || result.sent !== true) { setFields(result.fields ?? {}); throw new Error(result.error || 'Sending could not be confirmed. Your draft is still here. Please wait before trying again.'); }
      form.reset(); setState('sent'); setMessage('Your message has been sent to Shielded Labs. Thank you for getting in touch.');
    } catch (error) {
      setState('error'); setMessage(error instanceof Error && !(error instanceof TypeError) && !(error instanceof DOMException) ? error.message : 'Sending could not be confirmed. Your draft is still here. Please wait before trying again.');
    } finally {
      busy.current = false;
      requestAnimationFrame(() => status.current?.focus({ preventScroll: true }));
    }
  }
  return <form className={s.form} onSubmit={submit} aria-label="Contact Shielded Labs">
    <p className={s.lead}>Questions, ideas or a collaboration in mind? Write to the team.</p>
    <fieldset disabled={state === 'sending' || state === 'sent'}>
      <div className={s.pair}>
        <label htmlFor="contact-name">Name<input id="contact-name" name="name" autoComplete="name" required minLength={2} maxLength={120} aria-invalid={Boolean(fields.name)} aria-describedby={fields.name ? 'contact-name-error' : undefined}/>{fields.name && <small id="contact-name-error" className={s.error}>{fields.name}</small>}</label>
        <label htmlFor="contact-email">Email<input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} aria-invalid={Boolean(fields.email)} aria-describedby={fields.email ? 'contact-email-error' : undefined}/>{fields.email && <small id="contact-email-error" className={s.error}>{fields.email}</small>}</label>
      </div>
      <label htmlFor="contact-message">Message<textarea id="contact-message" name="message" required minLength={10} maxLength={2000} rows={6} aria-invalid={Boolean(fields.message)} aria-describedby={fields.message ? 'contact-message-error' : undefined}/>{fields.message && <small id="contact-message-error" className={s.error}>{fields.message}</small>}</label>
      <div hidden aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
      <label className={s.consent}><input name="consent" type="checkbox" required/><span>I agree to share my name, email and message with Shielded Labs so the team can respond.</span></label>
      {fields.consent && <small className={s.error}>{fields.consent}</small>}
    </fieldset>
    <div className={s.actions}>
      {state === 'sent' ? <button type="button" onClick={event => { event.preventDefault(); setState('idle'); setMessage(''); }}>Write another message</button> : <button type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send message'}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></button>}
      <a href="?view=about&section=privacy" onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onPrivacy(); } }}>Privacy policy</a>
    </div>
    <div ref={status} tabIndex={-1} role="status" aria-live="polite" className={`${s.status} ${state === 'error' ? s.error : ''}`}>{message}</div>
  </form>;
}
