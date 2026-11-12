'use client';

import { useEffect, type MouseEvent } from 'react';
import { resolveEditorialLink } from '@/lib/shielded-preview/editorial/library';
import { GOVERNANCE_PATH, governanceAddress, governanceCanonical, labsAddress, portalOf } from '@/lib/shielded-preview/portals';
import Governance from '@/app/shielded-preview/governance';
import PortalFooter from '@/app/shielded-preview/portal-footer';
import portal from '@/app/shielded-preview/portal.module.css';
import typography from '@/app/shielded-preview/typography.module.css';
import GovernanceHeader from './governance-header';
import s from './governance-portal.module.css';

/** Where a link clicked inside the governance frame leads: a governance address to open in place, a Labs address to navigate to, or null to leave it to the browser. */
export function governanceLinkTarget(href: string): { here: string } | { away: string } | null {
  if (href === GOVERNANCE_PATH) return { here: GOVERNANCE_PATH };
  if (!href.startsWith('?view=')) return null;
  const resolved = resolveEditorialLink(href) ?? href;
  const owner = portalOf(resolved);
  return owner === 'governance' ? { here: governanceAddress(resolved) } : owner === 'labs' ? { away: labsAddress(resolved) } : null;
}

/** Open a governance page in place: the address changes and the sections read it, as they do on back and forward. */
function openHere(address: string) {
  // A link to the page already open moves the view, not the history.
  if (address !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.pushState(null, '', address);
  window.dispatchEvent(new Event('shielded:navigate'));
  window.scrollTo({ top: 0, behavior: 'instant' });
  const mark = address.indexOf('#');
  if (mark < 0) return;
  let anchor = address.slice(mark + 1);
  try { anchor = decodeURIComponent(anchor); } catch { /* Keep malformed fragments inert. */ }
  requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView());
}

/** The governance portal: the governance sections in their own frame, with no Labs menu around them. */
export default function GovernancePortal() {
  // Opened at the bare root, which answers with this front page: show the portal's own address.
  useEffect(() => {
    const canonical = governanceCanonical(window.location.pathname, window.location.search, window.location.hash);
    if (canonical) window.history.replaceState(null, '', canonical);
  }, []);
  /** A link with no handler of its own: governance pages open in place, Labs pages at the Labs address. */
  function followPortalLink(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('a') : null;
    const href = link?.getAttribute('href');
    if (!link || !href || link.target) return;
    const target = governanceLinkTarget(href);
    if (!target) return;
    event.preventDefault();
    if ('here' in target) openHere(target.here);
    else window.location.assign(target.away);
  }
  return <div className={`${portal.portal} ${typography.readable}`} onClick={followPortalLink}>
    <a className={s.skip} href="#governance-content">Skip to content</a>
    <GovernanceHeader/>
    <div className={s.workspace}>
      <main id="portal-main" className={s.main}>
        <Governance/>
        <PortalFooter compact base="/"/>
      </main>
    </div>
  </div>;
}
