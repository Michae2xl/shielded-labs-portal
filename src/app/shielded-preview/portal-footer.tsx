'use client';

import type { MouseEvent } from 'react';
import { ShieldMark } from './shield';
import s from './portal-footer.module.css';

/** `base` is the Labs address when the footer is shown by the other portal; a link with no handler is followed as written. */
export default function PortalFooter({ compact, base = '', onHome, onContact, onPrivacy, onSources }: {
  compact: boolean; base?: string; onHome?: () => void; onContact?: () => void; onPrivacy?: () => void; onSources?: () => void;
}) {
  function follow(event: MouseEvent<HTMLAnchorElement>, action?: () => void) {
    if (!action || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); action();
  }
  return <footer className={s.footer} data-compact={compact || undefined}>
    <a className={s.brand} href={`${base}?view=overview`} onClick={event => follow(event, onHome)}><ShieldMark/><span>Shielded Labs</span></a>
    <nav aria-label="Footer">
      <a href={`${base}?view=about&section=contact`} onClick={event => follow(event, onContact)}>Contact</a>
      <a href={`${base}?view=about&section=privacy`} onClick={event => follow(event, onPrivacy)}>Privacy</a>
      {!compact && onSources && <button type="button" onClick={onSources}>Sources & methodology</button>}
    </nav>
  </footer>;
}
