import { describe, expect, it } from 'vitest';
import { bundledZips, filterZips, laneForRecord, searchZips, zipHref, zipLabel, zipRecordId, zipReference, zipStatuses, zipSummary, zipTitle } from './library';
import { zipEntrySchema, zipMetaSchema } from './types';

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
  it('offers global search rows with the record destination', () => {
    expect(searchZips('  Hierarchical  ')).toContainEqual({ title: 'ZIP 32: Shielded Hierarchical Deterministic Wallets', kind: 'ZIP', href: '?view=governance&section=zips&record=zip-0032' });
    expect(searchZips('')).toEqual([]);
    expect(searchZips('zip').length).toBeLessThanOrEqual(12);
  });
});
