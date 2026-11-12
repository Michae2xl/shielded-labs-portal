/**
 * This app serves two portals. Zcash governance answers on its own address; every other view is a page
 * of the Shielded Labs portal. Links between pages keep one form, `?view=<view>&…`, and each portal
 * resolves it: its own pages open in place, the other portal's pages open at that portal's address.
 */
export const GOVERNANCE_PATH = '/governance';
export const LABS_PATH = '/';
export const labsViews = ['overview', 'projects', 'activity', 'impact', 'people', 'blog', 'resources', 'about', 'website'] as const;
export type LabsView = typeof labsViews[number];
export type Portal = 'governance' | 'labs';
/** Query parameters as a request delivers them: a value may be missing or repeated. */
export type RequestParams = Record<string, string | string[] | undefined>;

export const isLabsView = (value: string | null | undefined): value is LabsView => labsViews.some(view => view === value);

function parts(link: string) {
  const mark = link.indexOf('#');
  return { params: new URLSearchParams(mark < 0 ? link : link.slice(0, mark)), hash: mark < 0 ? '' : link.slice(mark) };
}
function address(path: string, params: URLSearchParams, hash: string) {
  const query = params.toString();
  return `${path}${query ? `?${query}` : ''}${hash}`;
}

/** A governance page's address: the portal's own path and the link's query, without the `view` that named the portal. */
export function governanceAddress(link = ''): string {
  const { params, hash } = parts(link);
  params.delete('view');
  return address(GOVERNANCE_PATH, params, hash);
}

/** A Labs page's address: the view stays, since it names the page. */
export function labsAddress(link = ''): string {
  const { params, hash } = parts(link);
  return address(LABS_PATH, params, hash);
}

/** The portal a `?view=…` link belongs to; null for anything that is not a portal link. */
export function portalOf(link: string): Portal | null {
  if (!link.startsWith('?')) return null;
  const view = parts(link).params.get('view');
  return view === 'governance' ? 'governance' : isLabsView(view) ? 'labs' : null;
}

const requestQuery = (request: RequestParams) => new URLSearchParams(Object.entries(request).flatMap(([key, value]) => {
  const first = Array.isArray(value) ? value[0] : value;
  return first ? [[key, first]] : [];
}));

export type LabsAnswer = { page: Portal } | { redirect: string };
/**
 * What the Labs address does with a request. One that names no Labs view is a governance link from before the
 * portals had separate addresses, so it is redirected. One that asks for nothing but the portal gets the
 * governance front page in place: the hosting health check asks the bare root for a 2xx.
 */
export function labsAnswer(request: RequestParams): LabsAnswer {
  const params = requestQuery(request);
  if (isLabsView(params.get('view'))) return { page: 'labs' };
  const destination = governanceAddress(`?${params}`);
  return destination === GOVERNANCE_PATH ? { page: 'governance' } : { redirect: destination };
}

/** The address the governance portal should show when it was opened at another one, or with a leftover `view`; null when it is already its own. */
export function governanceCanonical(pathname: string, search: string, hash: string): string | null {
  return pathname === GOVERNANCE_PATH && !new URLSearchParams(search).has('view') ? null : governanceAddress(`${search}${hash}`);
}

/** The governance address needs no `view`: a Labs view goes to the Labs portal, anything else is dropped. */
export function governanceRedirect(request: RequestParams): string | null {
  const params = requestQuery(request);
  const view = params.get('view');
  if (view === null) return null;
  return isLabsView(view) ? labsAddress(`?${params}`) : governanceAddress(`?${params}`);
}
