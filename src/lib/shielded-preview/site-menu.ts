/** The tabs of shieldedlabs.net, in the site's order, so the poll page offers the way back to it. */
export const SITE_HOME = 'https://shieldedlabs.net/';
export type SiteMenuItem = { label: string; href: string; current?: boolean };
const page = (label: string, path = `${label.toLowerCase()}/`): SiteMenuItem => ({ label, href: `${SITE_HOME}${path}` });

export const siteMenu: SiteMenuItem[] = [
  page('Home', ''),
  page('Team'),
  page('Projects'),
  { label: 'Governance', href: 'https://governance.shieldedlabs.net/', current: true },
  page('Blog'),
  page('Contact'),
  page('Transparency'),
];
