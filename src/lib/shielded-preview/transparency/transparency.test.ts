import { describe, expect, it } from 'vitest';
import { projects } from '../content';
import { bundledZips } from '../zips/library';
import { debateHref, debates, debatesForProject, debatesForZip, filterSides, voiceCounts } from './debates';
import { disclosedDocuments, involvementFacets, matchesFacet, shieldedLabsOwner, zipDisclosure } from './involvement';
import { ageLabel, DAY, freshness, MINUTE } from './thermometer';
import { evidenceKinds, pointKind, sourceType } from './evidence';
import { commentRows, directionCounts, filterRows, paginate, sortRows } from './comments';
import { voteShares } from './debates';
import record from '../governance-data/record.json';

const zip = (id: string) => bundledZips.entries.find(entry => entry.id === id)!;

describe('Transparency', () => {
  it('discloses only what the ZIP header, the team page and the project pages show', () => {
    expect(zipDisclosure(zip('zip-0235'))).toMatchObject({ people: ['Jason McGee', 'Zooko Wilcox', 'Mark Henderson'], namedInHeader: false, projects: [{ id: 'nsm' }] });
    expect(zipDisclosure(zip('zip-0237'))).toMatchObject({ people: [], projects: [{ id: 'nsm' }] });
    expect(zipDisclosure(zip('zip-1014'))).toMatchObject({ people: ['Zooko Wilcox'], created: '2019-11-10' });
    expect(zipDisclosure(zip('pr-1428-draft-mcgee-future-dev-legal-defense-fund'))).toMatchObject({ namedInHeader: true });
    expect(zipDisclosure(zip('zip-0032'))).toBeNull();
    expect(shieldedLabsOwner('Zooko Wilcox (Shielded Labs)')).toBe('Zooko Wilcox');
    expect(shieldedLabsOwner('Sean Bowe (Tachyon Group)')).toBeNull();
    expect(shieldedLabsOwner('Nate')).toBeNull();
  });

  it('keeps every debate balanced, dated and linked to its sources', () => {
    for (const debate of debates) {
      expect(debate.sides.length).toBeGreaterThanOrEqual(2);
      expect(debate.sides.some(side => side.points.every(point => !point.shieldedLabs)), debate.id).toBe(true);
      for (const side of debate.sides) {
        expect(side.points.length).toBeGreaterThanOrEqual(2);
        expect(side.points.length).toBeLessThanOrEqual(15);
        expect(side.short.length).toBeGreaterThan(0);
        for (const point of side.points) {
          expect(point.url).toMatch(/^https:\/\//);
          expect(point.text.split(/\s+/).length).toBeLessThanOrEqual(32);
          expect(Number.isNaN(Date.parse(point.date))).toBe(false);
          expect(point.date <= debate.verifiedOn).toBe(true);
        }
      }
      for (const id of debate.projects) expect(projects.some(project => project.id === id)).toBe(true);
      const points = debate.sides.flatMap(side => side.points);
      expect(new Set(points.map(point => `${point.url} ${point.text}`)).size, debate.id).toBe(points.length);
      const perAuthor = points.reduce((counts, point) => counts.set(point.author, (counts.get(point.author) ?? 0) + 1), new Map<string, number>());
      expect(Math.max(...perAuthor.values()), debate.id).toBeLessThanOrEqual(3);
      for (const id of debate.zips.filter(item => !item.endsWith('-'))) expect(bundledZips.entries.some(entry => entry.id === id)).toBe(true);
    }
  });

  it('finds the debates a ZIP or a project belongs to', () => {
    expect(debatesForZip('zip-0235').map(debate => debate.id)).toEqual(['nsm']);
    expect(debatesForZip('pr-1216-zip-crosslink').map(debate => debate.id)).toEqual(['crosslink']);
    expect(debatesForZip('zip-0032')).toEqual([]);
    expect(debatesForProject('crosslink').map(debate => debate.id)).toEqual(['crosslink']);
    expect(debateHref({ id: 'nsm' })).toBe('?view=governance&section=transparency#debate-nsm');
  });

  it('rates how current a source is against its own cadence', () => {
    const now = Date.parse('2026-11-07T12:00:00Z');
    expect(freshness('2026-11-07T11:59:00Z', MINUTE, now)).toBe('fresh');
    expect(freshness('2026-11-07T11:55:00Z', MINUTE, now)).toBe('aging');
    expect(freshness('2026-11-07T11:00:00Z', MINUTE, now)).toBe('stale');
    expect(freshness(null, DAY, now)).toBe('unknown');
    expect(ageLabel('2026-11-07T11:30:00Z', now)).toBe('30 min ago');
    expect(ageLabel('2026-11-04T12:00:00Z', now)).toBe('3 days ago');
  });

  it('marks every point by who is speaking and names its source type', () => {
    expect(evidenceKinds.map(item => item.kind)).toEqual(['fact', 'record', 'position', 'community', 'press']);
    expect(pointKind({ shieldedLabs: true })).toBe('position');
    expect(pointKind({ via: 'Reported by AMBCrypto' })).toBe('press');
    expect(pointKind({})).toBe('community');
    expect(sourceType('https://forum.zcashcommunity.com/t/x/1/2')).toBe('Forum post');
    expect(sourceType('https://github.com/zcash/zips/pull/1428')).toBe('ZIP pull request');
    expect(sourceType('https://zips.z.cash/zip-0237')).toBe('ZIP text');
    expect(sourceType('https://ambcrypto.com/article/')).toBe('ambcrypto.com');
    for (const debate of debates) for (const side of debate.sides) for (const point of side.points) expect(sourceType(point.url)).not.toBe('Source');
  });

  it('counts and filters each debate by who is speaking, keeping every side', () => {
    for (const debate of debates) {
      const total = debate.sides.reduce((sum, side) => sum + side.points.length, 0);
      const counts = voiceCounts(debate);
      expect(counts[0]).toEqual({ voice: 'all', count: total });
      expect(counts.slice(1).reduce((sum, item) => sum + item.count, 0)).toBe(total);
      expect(counts.every(item => item.count > 0)).toBe(true);
      expect(filterSides(debate, 'all').map(row => row.points)).toEqual(debate.sides.map(side => side.points));
      for (const { voice, count } of counts.slice(1)) {
        const sides = filterSides(debate, voice);
        expect(sides.map(row => row.side)).toEqual(debate.sides);
        expect(sides.flatMap(row => row.points).every(point => pointKind(point) === voice)).toBe(true);
        expect(sides.flatMap(row => row.points)).toHaveLength(count);
      }
    }
    const byId = (id: string) => debates.find(debate => debate.id === id)!;
    expect(voiceCounts(byId('crosslink')).map(item => item.voice)).toEqual(['all', 'position', 'community', 'press']);
    expect(voiceCounts(byId('nsm')).map(item => item.voice)).not.toContain('press');
  });

  it('lists the documents tied to Shielded Labs, newest first, with filters that add up', () => {
    const rows = disclosedDocuments(bundledZips.entries);
    const created = rows.map(row => row.disclosure.created ?? '');
    expect(rows.length).toBeGreaterThan(0);
    expect(created).toEqual([...created].sort().reverse());
    const facets = involvementFacets(rows);
    expect(facets[0]).toMatchObject({ facet: 'all', count: rows.length });
    for (const { facet, count } of facets) expect(rows.filter(row => matchesFacet(row, facet))).toHaveLength(count);
    const row = (id: string) => rows.find(item => item.entry.id === id)!;
    expect(row('zip-0235').debates).toEqual(['nsm']);
    expect(matchesFacet(row('zip-0235'), 'debated')).toBe(true);
    expect(matchesFacet(row('zip-0237'), 'owners')).toBe(false);
    expect(matchesFacet(row('zip-0237'), 'listed')).toBe(true);
    expect(rows.some(item => item.entry.id === 'zip-0032')).toBe(false);
  });

  it('pages, sorts and filters the comments table', () => {
    const nsm = debates.find(debate => debate.id === 'nsm')!;
    const rows = commentRows(nsm);
    expect(rows).toHaveLength(nsm.sides.reduce((sum, side) => sum + side.points.length, 0));
    const newest = sortRows(rows, 'newest');
    expect(newest.map(row => row.date)).toEqual([...rows.map(row => row.date)].sort().reverse());
    expect(sortRows(rows, 'oldest').map(row => row.date)).toEqual([...rows.map(row => row.date)].sort());
    const first = paginate(newest, 1, 4);
    expect(first).toMatchObject({ page: 1, from: 1, to: 4, total: rows.length, pages: Math.ceil(rows.length / 4) });
    expect(first.rows).toEqual(newest.slice(0, 4));
    expect(paginate(newest, 99, 4).page).toBe(first.pages);
    expect(paginate(newest, 0, 4).page).toBe(1);
    expect(paginate([], 3, 4)).toMatchObject({ rows: [], page: 1, pages: 1, from: 0, to: 0, total: 0 });
    const side = nsm.sides[0];
    expect(filterRows(rows, 'all', side.label).every(row => row.side === side)).toBe(true);
    expect(filterRows(rows, 'position', null).every(row => row.shieldedLabs)).toBe(true);
    const counts = directionCounts(nsm, 'all');
    expect(counts.map(item => item.side)).toEqual(nsm.sides);
    expect(counts.reduce((sum, item) => sum + item.count, 0)).toBe(rows.length);
    expect(directionCounts(nsm, 'position').reduce((sum, item) => sum + item.count, 0)).toBe(rows.filter(row => row.shieldedLabs).length);
  });

  it('reports measured votes exactly as published', () => {
    for (const debate of debates) for (const id of debate.polls) expect(record.polls.some(poll => poll.id === id), id).toBe(true);
    const vote = debates.find(debate => debate.id === 'nsm')!.vote!;
    const poll = record.polls.find(item => item.id === vote.pollId)!;
    expect(debates.find(debate => debate.id === 'nsm')!.polls).toContain(vote.pollId);
    expect(Math.abs(vote.options.reduce((sum, option) => sum + option.zec, 0) - (poll.totalZec ?? 0))).toBeLessThan(1);
    const shares = voteShares(vote);
    expect(shares.reduce((sum, option) => sum + option.share, 0)).toBeCloseTo(1, 9);
    expect(shares.find(option => option.label === 'Preserve halvings')!.share).toBeGreaterThan(0.98);
    expect(debates.find(debate => debate.id === 'crosslink')!.vote).toBeUndefined();
  });
});
