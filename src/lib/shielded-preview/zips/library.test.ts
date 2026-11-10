import { describe, expect, it } from 'vitest';
import { bundledZips, filterZips, isNewZip, isZipActivity, laneForRecord, proposalChange, searchZips, withinDays, zipFacets, zipHref, zipIndexTime, zipLabel, zipRecordId, zipReference, zipStatuses, zipSummary, zipTitle } from './library';
import { zipEntrySchema, zipMetaSchema, type ZipEntry } from './types';

describe('Bundled ZIP snapshot', () => {
  it('validates every bundled entry and the sync metadata', () => {
    expect(zipEntrySchema.array().parse(bundledZips.entries)).toHaveLength(bundledZips.entries.length);
    expect(zipMetaSchema.parse(bundledZips.meta).counts.documents).toBe(bundledZips.entries.length);
    expect(new Set(bundledZips.entries.map(entry => entry.id)).size).toBe(bundledZips.entries.length);
    expect(bundledZips.state).toBe('snapshot');
  });
  it('lists numbered proposals in number order with lifecycle-ordered statuses', () => {
    const zips = filterZips(bundledZips.entries, { lane: 'zips' });
    expect(zips.every(entry => entry.number !== null)).toBe(true);
    expect(zips.map(entry => entry.number)).toEqual([...zips.map(entry => entry.number!)].sort((a, b) => a - b));
    const statuses = zipStatuses(bundledZips.entries, 'zips');
    expect(statuses.indexOf('Draft')).toBeLessThan(statuses.indexOf('Final'));
    expect(statuses.indexOf('Final')).toBeLessThan(statuses.indexOf('Reserved'));
  });
  it('filters by status and by number, title or owner words', () => {
    expect(filterZips(bundledZips.entries, { lane: 'zips', status: 'Reserved' }).every(entry => entry.status === 'Reserved')).toBe(true);
    expect(filterZips(bundledZips.entries, { lane: 'zips', query: 'zip 32' })[0].id).toBe('zip-0032');
    expect(filterZips(bundledZips.entries, { lane: 'zips', query: 'hierarchical deterministic' }).map(entry => entry.id)).toContain('zip-0032');
    expect(filterZips(bundledZips.entries, { lane: 'drafts' }).every(entry => entry.kind === 'draft')).toBe(true);
    expect(filterZips(bundledZips.entries, { lane: 'guides' }).map(entry => entry.id)).toContain('zip-guide');
    expect(filterZips(bundledZips.entries, { lane: 'zips', query: 'no-such-proposal-anywhere' })).toEqual([]);
  });
  it('builds record links, labels and lanes from the entry alone', () => {
    const zip32 = zipReference(32)!;
    expect(zipRecordId(32)).toBe('zip-0032');
    expect(zipHref('zip-0032', '#abstract')).toBe('?view=governance&section=zips&record=zip-0032#abstract');
    expect(zipLabel(zip32)).toBe('ZIP 32');
    expect(zipTitle(zip32)).toBe('ZIP 32: Shielded Hierarchical Deterministic Wallets');
    expect(laneForRecord('zip-0032')).toBe('zips');
    expect(laneForRecord('zip-guide')).toBe('guides');
    expect(laneForRecord('unknown')).toBe('zips');
    expect(zipReference(999999)).toBeNull();
    expect(zipSummary({ summary: '', status: 'Reserved' })).toContain('Reserved');
    expect(zipSummary({ summary: 'Abstract text', status: 'Final' })).toBe('Abstract text');
  });
  it('lists open pull requests as labelled previews, newest activity first', () => {
    const proposals = filterZips(bundledZips.entries, { lane: 'proposals' });
    expect(proposals.length).toBeGreaterThan(10);
    expect(proposals.every(entry => entry.kind === 'proposal' && entry.pull && entry.official === entry.pull.url)).toBe(true);
    expect(proposals.map(entry => entry.pull!.updatedAt)).toEqual([...proposals.map(entry => entry.pull!.updatedAt)].sort().reverse());
    expect(proposals.filter(entry => entry.pull!.change === 'update').every(entry => entry.base !== null)).toBe(true);
    const update = proposals.find(entry => entry.pull!.change === 'update' && entry.number !== null)!;
    expect(update.base).toBe(`zip-${String(update.number).padStart(4, '0')}`);
    expect(proposalChange(update)).toBe(`Updates ZIP ${update.number}`);
    expect(proposalChange({ pull: { change: 'update' } as ZipEntry['pull'], base: 'zip-guide', number: null })).toBe('Updates a writing guide');
    expect(proposalChange(proposals.find(entry => entry.pull!.change === 'new')!)).toBe('New ZIP');
    expect(zipLabel(update)).toBe(`PR ${update.pull!.number}`);
    expect(laneForRecord(update.id)).toBe('proposals');
    expect(zipReference(update.number!)?.kind).toBe('zip');
    expect(searchZips(`pr ${update.pull!.number}`).some(row => row.href === zipHref(update.id) && row.kind === 'Open pull request')).toBe(true);
    expect(filterZips(bundledZips.entries, { lane: 'zips' }).some(entry => entry.kind === 'proposal')).toBe(false);
  });
  it('offers global search rows with the record destination', () => {
    expect(searchZips('  Hierarchical  ')).toContainEqual({ title: 'ZIP 32: Shielded Hierarchical Deterministic Wallets', kind: 'ZIP', href: '?view=governance&section=zips&record=zip-0032' });
    expect(searchZips('')).toEqual([]);
    expect(searchZips('zip').length).toBeLessThanOrEqual(12);
  });

  it('filters by activity window, counts each chip against the other filters and marks what opened this week', () => {
    const base = bundledZips.entries.find(entry => entry.kind === 'proposal')!;
    const pr = (number: number, opened: string, updated: string, status = 'Draft'): ZipEntry => ({ ...base, id: `pr-${number}`, status, pull: { ...base.pull!, number, createdAt: opened, updatedAt: updated } });
    const rows = [pr(3, '2026-01-01T00:00:00Z', '2026-03-01T00:00:00Z'), pr(2, '2026-09-01T00:00:00Z', '2026-10-20T00:00:00Z', 'Active'), pr(1, '2026-11-08T00:00:00Z', '2026-11-09T00:00:00Z')];
    const now = Date.parse('2026-11-09T12:00:00Z');
    expect(filterZips(rows, { lane: 'proposals', activity: '7', now }).map(entry => entry.id)).toEqual(['pr-1']);
    // A window lists the latest movement first.
    expect(filterZips(rows, { lane: 'proposals', activity: '30', now }).map(entry => entry.id)).toEqual(['pr-1', 'pr-2']);
    expect(filterZips(rows, { lane: 'proposals', now }).map(entry => entry.id)).toEqual(['pr-1', 'pr-2', 'pr-3']);
    const counts = (list: { id: string; count: number }[]) => Object.fromEntries(list.map(item => [item.id, item.count]));
    expect(counts(zipFacets(rows, { lane: 'proposals', now }).activity)).toEqual({ all: 3, 7: 1, 30: 2, 90: 2 });
    expect(zipFacets(rows, { lane: 'proposals', now }).statuses).toEqual([{ id: 'all', count: 3 }, { id: 'Draft', count: 2 }, { id: 'Active', count: 1 }]);
    expect(counts(zipFacets(rows, { lane: 'proposals', activity: '30', now }).statuses)).toEqual({ all: 2, Draft: 1, Active: 1 });
    expect(counts(zipFacets(rows, { lane: 'proposals', status: 'Draft', now }).activity)).toEqual({ all: 2, 7: 1, 30: 1, 90: 1 });
    expect(rows.map(entry => isNewZip(entry, now))).toEqual([false, false, true]);
    expect([withinDays(null, 7, now), withinDays('2026-11-20T00:00:00Z', 7, now), withinDays('not a date', 7, now)]).toEqual([false, false, false]);
    expect([isZipActivity('30'), isZipActivity('all'), isZipActivity('5'), isZipActivity(null)]).toEqual([true, true, false, false]);
    // Windows count back from when the index was read, or from its newest record when that is later; never the viewer's clock.
    const newest = Math.max(...bundledZips.entries.map(entry => Date.parse(entry.pull?.updatedAt ?? entry.updatedAt ?? '')).filter(Number.isFinite));
    expect(zipIndexTime(bundledZips)).toBe(Math.max(Date.parse(bundledZips.meta.syncedAt), newest));
    expect(zipIndexTime({ ...bundledZips, entries: rows, observedAt: '2026-11-10T00:00:00Z' })).toBe(Date.parse('2026-11-10T00:00:00Z'));
    expect(zipIndexTime({ ...bundledZips, entries: rows, observedAt: '2026-11-01T00:00:00Z' })).toBe(Date.parse('2026-11-09T00:00:00Z'));
  });
});
