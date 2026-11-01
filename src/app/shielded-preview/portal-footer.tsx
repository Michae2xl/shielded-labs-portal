'use client';

import type { MouseEvent } from 'react';
import { ShieldMark } from './shield';
import s from './portal-footer.module.css';

export default function PortalFooter({ compact, onHome, onContact, onPrivacy, onSources }: {
  compact: boolean; onHome: () => void; onContact: () => void; onPrivacy: () => void; onSources: () => void;
}) {
  function follow(event: MouseEvent<HTMLAnchorElement>, action: () => void) {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); action();
  }
  return <footer className={s.footer} data-compact={compact || undefined}>
    <a className={s.brand} href="?view=overview" onClick={event => follow(event, onHome)}><ShieldMark/><span>Shielded Labs</span></a>
    <nav aria-label="Footer">
      <a href="?view=about&section=contact" onClick={event => follow(event, onContact)}>Contact</a>
      <a href="?view=about&section=privacy" onClick={event => follow(event, onPrivacy)}>Privacy</a>
      {!compact && <button type="button" onClick={onSources}>Sources & methodology</button>}
    </nav>
  </footer>;
}
