import index from './index.json';
import meta from './meta.json';
import type { ZipEntry, ZipMeta, ZipsIndex } from './types';

export const zipLanes = [
  { id: 'zips', name: 'Numbered ZIPs', kind: 'zip' },
  { id: 'drafts', name: 'Unnumbered drafts', kind: 'draft' },
  { id: 'guides', name: 'Writing guides', kind: 'guide' },
  { id: 'proposals', name: 'Open pull requests', kind: 'proposal' },
] as const;
export type ZipLane = typeof zipLanes[number]['id'];
export const zipStatusOrder = ['Draft', 'Proposed', 'Active', 'Implemented', 'Final', 'Withdrawn', 'Rejected', 'Obsolete', 'Reserved'];
export const zipsRepository = 'https://github.com/zcash/zips';

/** The snapshot bundled with the build; a configured sync branch can replace it at runtime. */
export const bundledZips: ZipsIndex = { state: 'snapshot', observedAt: (meta as ZipMeta).syncedAt, error: false, meta: meta as ZipMeta, entries: index as ZipEntry[] };

export const zipRecordId = (number: number) => `zip-${String(number).padStart(4, '0')}`;
export const zipHref = (id: string, fragment = '') => `?view=governance&section=zips&record=${id}${fragment}`;
export const zipLane = (entry: Pick<ZipEntry, 'kind'>): ZipLane => entry.kind === 'zip' ? 'zips' : entry.kind === 'draft' ? 'drafts' : entry.kind === 'guide' ? 'guides' : 'proposals';
export const isZipLane = (value: string | null | undefined): value is ZipLane => zipLanes.some(lane => lane.id === value);
export function laneForRecord(id: string | null, entries: readonly ZipEntry[] = bundledZips.entries): ZipLane {
  const entry = id ? entries.find(item => item.id === id) : undefined;
  return entry ? zipLane(entry) : 'zips';
}
export const zipLabel = (entry: Pick<ZipEntry, 'number' | 'kind' | 'pull'>) => entry.kind === 'proposal' && entry.pull ? `PR ${entry.pull.number}` : entry.number === null ? (entry.kind === 'guide' ? 'Guide' : 'Draft') : `ZIP ${entry.number}`;
/** What an open pull request does to the ZIP set, for lists and the record header. */
export const proposalChange = (entry: Pick<ZipEntry, 'pull' | 'base' | 'number'>) => entry.pull?.change !== 'update' ? 'New ZIP' : entry.number !== null ? `Updates ZIP ${entry.number}` : entry.base?.startsWith('zip-') ? 'Updates a writing guide' : `Updates ${entry.base ?? 'a document'}`;
export const zipTitle = (entry: Pick<ZipEntry, 'number' | 'title'>) => entry.number === null ? entry.title : `ZIP ${entry.number}: ${entry.title}`;
export const zipSummary = (entry: Pick<ZipEntry, 'summary' | 'status'>) => entry.summary || (entry.status === 'Reserved' ? 'Reserved number. No proposal text has been published.' : 'The source document has no abstract.');
const statusRank = (status: string) => { const rank = zipStatusOrder.indexOf(status); return rank === -1 ? zipStatusOrder.length : rank; };

/** Statuses present in a lane, in lifecycle order rather than alphabetically. */
export function zipStatuses(entries: readonly ZipEntry[], lane: ZipLane) {
  return [...new Set(entries.filter(entry => zipLane(entry) === lane).map(entry => entry.status))]
    .sort((a, b) => statusRank(a) - statusRank(b) || a.localeCompare(b));
}
const searchText = (entry: ZipEntry) => `${entry.number === null ? zipLabel(entry) : `zip ${entry.number} zip-${entry.number}`} ${entry.pull ? `pr ${entry.pull.number} pull request ${entry.pull.author}` : ''} ${entry.title} ${entry.owners.join(' ')} ${entry.category} ${entry.status}`.toLowerCase();
const tokens = (query: string) => query.trim().toLowerCase().split(/\s+/).filter(Boolean);
function compare(lane: ZipLane, a: ZipEntry, b: ZipEntry) {
  if (lane === 'zips') return (a.number ?? 0) - (b.number ?? 0);
  if (lane === 'drafts') return (b.created ?? '').localeCompare(a.created ?? '') || a.title.localeCompare(b.title);
  if (lane === 'proposals') return (b.pull?.updatedAt ?? '').localeCompare(a.pull?.updatedAt ?? '') || (b.pull?.number ?? 0) - (a.pull?.number ?? 0) || a.title.localeCompare(b.title);
  return a.title.localeCompare(b.title);
}
const DAY = 86_400_000;
/** Activity windows offered as filters, counted back from when the index was read. */
export const zipActivityWindows = [{ id: '7', days: 7, name: '7 days' }, { id: '30', days: 30, name: '30 days' }, { id: '90', days: 90, name: '90 days' }] as const;
export type ZipActivity = 'all' | typeof zipActivityWindows[number]['id'];
export const isZipActivity = (value: string | null | undefined): value is ZipActivity => value === 'all' || zipActivityWindows.some(window => window.id === value);
/** Opened or created within this many days counts as new. */
export const ZIP_NEW_DAYS = 7;
/** Last movement: the pull request's update, or the file's last change in the repository. */
export const zipActivityAt = (entry: Pick<ZipEntry, 'pull' | 'updatedAt'>) => entry.pull?.updatedAt ?? entry.updatedAt ?? null;
/** When it first appeared: the pull request's opening, or the Created date in the ZIP header. */
export const zipOpenedAt = (entry: Pick<ZipEntry, 'pull' | 'created'>) => entry.pull?.createdAt ?? entry.created ?? null;
/** The reference time for windows: when the index was read, or its newest record if later, so nothing listed sits in the future. */
export function zipIndexTime(index: Pick<ZipsIndex, 'observedAt' | 'meta' | 'entries'>) {
  const read = Date.parse(index.observedAt ?? index.meta.syncedAt);
  const newest = Math.max(...index.entries.map(entry => Date.parse(zipActivityAt(entry) ?? '')).filter(Number.isFinite));
  return Math.max(Number.isFinite(read) ? read : Number.NEGATIVE_INFINITY, newest);
}
export function withinDays(value: string | null | undefined, days: number, now: number) {
  const time = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(time) && Number.isFinite(now) && time <= now + DAY && now - time <= days * DAY;
}
export const isNewZip = (entry: Pick<ZipEntry, 'pull' | 'created'>, now: number) => withinDays(zipOpenedAt(entry), ZIP_NEW_DAYS, now);
const activeWithin = (entry: ZipEntry, activity: ZipActivity, now: number) => activity === 'all' || withinDays(zipActivityAt(entry), Number(activity), now);
const byActivity = (a: ZipEntry, b: ZipEntry) => (zipActivityAt(b) ?? '').localeCompare(zipActivityAt(a) ?? '');

type ZipQuery = { lane: ZipLane; status?: string; query?: string; activity?: ZipActivity; now?: number };
export function filterZips(entries: readonly ZipEntry[], { lane, status = 'all', query = '', activity = 'all', now = Number.NaN }: ZipQuery) {
  const words = tokens(query);
  return entries
    .filter(entry => zipLane(entry) === lane && (status === 'all' || entry.status === status) && activeWithin(entry, activity, now) && words.every(word => searchText(entry).includes(word)))
    // A window asks what moved, so the latest movement leads; otherwise each lane keeps its own order.
    .sort((a, b) => activity === 'all' ? compare(lane, a, b) : byActivity(a, b) || compare(lane, a, b));
}
/** Chip counts: each group counts what the other filters leave, so the numbers always match the list a click would show. */
export function zipFacets(entries: readonly ZipEntry[], { lane, status = 'all', query = '', activity = 'all', now = Number.NaN }: ZipQuery) {
  const words = tokens(query);
  const base = entries.filter(entry => zipLane(entry) === lane && words.every(word => searchText(entry).includes(word)));
  const inWindow = base.filter(entry => activeWithin(entry, activity, now));
  const withStatus = base.filter(entry => status === 'all' || entry.status === status);
  return {
    statuses: [{ id: 'all', count: inWindow.length }, ...zipStatuses(entries, lane).map(id => ({ id, count: inWindow.filter(entry => entry.status === id).length }))],
    activity: [{ id: 'all' as ZipActivity, count: withStatus.length }, ...zipActivityWindows.map(window => ({ id: window.id as ZipActivity, count: withStatus.filter(entry => activeWithin(entry, window.id, now)).length }))],
  };
}
/** Global search rows for proposals, drafts and guides; numbered ZIPs match their number too. */
export function searchZips(query: string, entries: readonly ZipEntry[] = bundledZips.entries) {
  const words = tokens(query);
  if (!words.length) return [];
  return entries.filter(entry => words.every(word => searchText(entry).includes(word))).slice(0, 12)
    .map(entry => ({ title: entry.kind === 'proposal' ? `${zipLabel(entry)}: ${entry.title}` : zipTitle(entry), kind: entry.kind === 'zip' ? 'ZIP' : entry.kind === 'draft' ? 'Draft ZIP' : entry.kind === 'guide' ? 'ZIP guide' : 'Open pull request', href: zipHref(entry.id) }));
}
export const zipReference = (number: number, entries: readonly ZipEntry[] = bundledZips.entries) => entries.find(entry => entry.kind === 'zip' && entry.number === number) ?? null;
