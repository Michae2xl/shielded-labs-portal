/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { SITE_HOME, siteMenu } from '@/lib/shielded-preview/site-menu';
import s from './poll-site.module.css';

/** The Shielded Labs logo, in the ink of the theme, leading to the site. */
export function SiteLogo() {
  return (
    <a className={s.siteLogo} href={SITE_HOME} aria-label="Shielded Labs, home">
      <img className={s.logoOnDark} src="/logos/shielded-labs-site-dark.png" width={800} height={200} alt="" />
      <img className={s.logoOnLight} src="/logos/shielded-labs-site-light.png" width={800} height={200} alt="" />
    </a>
  );
}

/** The site's tabs: a row on a wide screen, behind a "Menu" button on a narrow one. */
export default function SiteTabs() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  return (
    <nav className={s.siteNav} aria-label="Shielded Labs">
      <button type="button" className={s.menuButton} aria-expanded={open} aria-controls="site-tabs" onClick={() => setOpen(value => !value)}>
        <span className={s.menuBars} aria-hidden="true" />
        <span>Menu</span>
      </button>
      <ul className={s.siteTabs} id="site-tabs" data-open={open}>
        {siteMenu.map(({ label, href, current }) => (
          <li key={label}>
            <a href={href} aria-current={current ? 'page' : undefined}>{label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
