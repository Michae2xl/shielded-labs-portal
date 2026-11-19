/**
 * The launch address shows one page as a site of its own: the ZCG / Dev Fund poll. Its root serves that page,
 * any other page there leads back to the root, and only the data the page reads is served. The preview address
 * keeps the whole portal.
 */
export const LAUNCH_HOSTS = ['governance.shieldedlabs.net'] as const;
export const LAUNCH_PAGE = '/poll';
/** The data the poll page reads; every other API stays off the launch address. */
const LAUNCH_APIS = ['/api/shielded-preview/turnout', '/api/shielded-preview/miner-poll'];
/** The share image, only for the poll itself. */
const SHARE_IMAGE = '/api/shielded-preview/og';
const isPollShare = (search: string) => {
  const params = new URLSearchParams(search);
  return params.get('view') === 'governance' && params.get('section') === 'voting' && params.get('lane') === 'dev-fund';
};

export type LaunchRoute = { rewrite: string } | { redirect: string } | { notFound: true } | null;

/** The host a request was made to, without a port, as the hosting proxy forwards it. */
export function requestHost(headers: { get(name: string): string | null }): string {
  const host = headers.get('x-forwarded-host') ?? headers.get('host') ?? '';
  return host.split(',')[0].trim().toLowerCase().replace(/:\d+$/, '');
}
export const isLaunchHost = (host: string) => (LAUNCH_HOSTS as readonly string[]).includes(host);

/** What the launch address does with a path; null when the request is not on it or needs nothing. */
export function launchRoute(host: string, pathname: string, search = ''): LaunchRoute {
  if (!isLaunchHost(host)) return null;
  if (pathname === '/') return { rewrite: LAUNCH_PAGE };
  if (pathname === SHARE_IMAGE) return isPollShare(search) ? null : { notFound: true };
  if (pathname.startsWith('/api/')) return LAUNCH_APIS.includes(pathname) ? null : { notFound: true };
  // The page's own path stays open: the server runs this again for the rewritten request.
  if (pathname === '/governance' || pathname === '/shielded-preview' || pathname === '/landing' || pathname.startsWith('/landing/')) return { redirect: '/' };
  return null;
}
