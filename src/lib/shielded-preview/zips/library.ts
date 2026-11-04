import index from './index.json';
import meta from './meta.json';
import type { ZipEntry, ZipMeta, ZipsIndex } from './types';

export const zipLanes = [
  { id: 'zips', name: 'Numbered ZIPs', kind: 'zip' },
  { id: 'drafts', name: 'Unnumbered drafts', kind: 'draft' },
  { id: 'guides', name: 'Writing guides', kind: 'guide' },
] as const;
export type ZipLane = typeof zipLanes[number]['id'];
export const zipStatusOrder = ['Draft', 'Proposed', 'Active', 'Implemented', 'Final', 'Withdrawn', 'Rejected', 'Obsolete', 'Reserved'];
export const zipsRepository = 'https://github.com/zcash/zips';

/** The snapshot bundled with the build; a configured sync branch can replace it at runtime. */
export const bundledZips: ZipsIndex = { state: 'snapshot', observedAt: (meta as ZipMeta).syncedAt, error: false, meta: meta as ZipMeta, entries: index as ZipEntry[] };

export const zipRecordId = (number: number) => `zip-${String(number).padStart(4, '0')}`;
export const zipHref = (id: string, fragment = '') => `?view=governance&section=zips&record=${id}${fragment}`;
export const zipLane = (entry: Pick<ZipEntry, 'kind'>): ZipLane => entry.kind === 'zip' ? 'zips' : entry.kind === 'draft' ? 'drafts' : 'guides';
export const isZipLane = (value: string | null | undefined): value is ZipLane => zipLanes.some(lane => lane.id === value);
export function laneForRecord(id: string | null, entries: readonly ZipEntry[] = bundledZips.entries): ZipLane {
  const entry = id ? entries.find(item => item.id === id) : undefined;
  return entry ? zipLane(entry) : 'zips';
}
export const zipLabel = (entry: Pick<ZipEntry, 'number' | 'kind'>) => entry.number === null ? (entry.kind === 'guide' ? 'Guide' : 'Draft') : `ZIP ${entry.number}`;
export const zipTitle = (entry: Pick<ZipEntry, 'number' | 'title'>) => entry.number === null ? entry.title : `ZIP ${entry.number}: ${entry.title}`;
export const zipSummary = (entry: Pick<ZipEntry, 'summary' | 'status'>) => entry.summary || (entry.status === 'Reserved' ? 'Reserved number. No proposal text has been published.' : 'The source document has no abstract.');
const statusRank = (status: string) => { const rank = zipStatusOrder.indexOf(status); return rank === -1 ? zipStatusOrder.length : rank; };

/** Statuses present in a lane, in lifecycle order rather than alphabetically. */
export function zipStatuses(entries: readonly ZipEntry[], lane: ZipLane) {
  return [...new Set(entries.filter(entry => zipLane(entry) === lane).map(entry => entry.status))]
    .sort((a, b) => statusRank(a) - statusRank(b) || a.localeCompare(b));
}
const searchText = (entry: ZipEntry) => `${entry.number === null ? zipLabel(entry) : `zip ${entry.number} zip-${entry.number}`} ${entry.title} ${entry.owners.join(' ')} ${entry.category} ${entry.status}`.toLowerCase();
const tokens = (query: string) => query.trim().toLowerCase().split(/\s+/).filter(Boolean);
function compare(lane: ZipLane, a: ZipEntry, b: ZipEntry) {
  if (lane === 'zips') return (a.number ?? 0) - (b.number ?? 0);
  if (lane === 'drafts') return (b.created ?? '').localeCompare(a.created ?? '') || a.title.localeCompare(b.title);
  return a.title.localeCompare(b.title);
}
export function filterZips(entries: readonly ZipEntry[], { lane, status = 'all', query = '' }: { lane: ZipLane; status?: string; query?: string }) {
  const words = tokens(query);
  return entries
    .filter(entry => zipLane(entry) === lane && (status === 'all' || entry.status === status) && words.every(word => searchText(entry).includes(word)))
    .sort((a, b) => compare(lane, a, b));
}
/** Global search rows for proposals, drafts and guides; numbered ZIPs match their number too. */
export function searchZips(query: string, entries: readonly ZipEntry[] = bundledZips.entries) {
  const words = tokens(query);
  if (!words.length) return [];
  return entries.filter(entry => words.every(word => searchText(entry).includes(word))).slice(0, 12)
    .map(entry => ({ title: zipTitle(entry), kind: entry.kind === 'zip' ? 'ZIP' : entry.kind === 'draft' ? 'Draft ZIP' : 'ZIP guide', href: zipHref(entry.id) }));
}
export const zipReference = (number: number, entries: readonly ZipEntry[] = bundledZips.entries) => entries.find(entry => entry.number === number) ?? null;
