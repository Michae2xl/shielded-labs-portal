import { describe, expect, it } from 'vitest';
import { projects } from './content';
import { projectLastCommit, projectShortcuts, projectSignal, projectZips } from './project-summary';
import type { Repository } from './types';
import { bundledZips } from './zips/library';

const project = (id: string) => projects.find(item => item.id === id)!;
const repository = (name: string, fork: boolean, dates: string[]) => ({ name, fork, commits: dates.map(date => ({ date })) }) as unknown as Repository;

describe('Project summaries', () => {
  it('links only reviewed ZIPs, to records that exist', () => {
    expect(projectZips(project('nsm'))!.rows.map(row => [row.label, row.note])).toEqual([['ZIP 235', 'Deployed by NU7'], ['ZIP 237', 'Deployed by NU7'], ['ZIP 233', 'Not deployed by NU7'], ['ZIP 234', 'Not deployed by NU7']]);
    expect(projectZips(project('ironwood'))!.rows.map(row => row.label)).toEqual(['ZIP 258', 'ZIP 2006', 'ZIP 2005', 'ZIP 229']);
    expect(projectZips(project('fees'))!.rows.map(row => row.label)).toEqual(['ZIP 317', 'ZIP 2009']);
    expect(projectZips(project('epoch'))).toBeNull();
    expect(projectZips(project('zero'))).toBeNull();
    const ids = new Set(bundledZips.entries.map(entry => entry.id));
    for (const item of projects) for (const row of projectZips(item)?.rows ?? []) {
      expect(ids.has(row.id)).toBe(true);
      expect(new URL(row.href, 'https://portal.example').searchParams.get('record')).toBe(row.id);
    }
  });
  it('labels pull request documents as unofficial and drops them when the pull request leaves the index', () => {
    const rows = projectZips(project('crosslink'))!.rows;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(row => row.label === 'PR 1216' && row.note === 'Open pull request · unofficial preview')).toBe(true);
    expect(projectZips(project('crosslink'), bundledZips.entries.filter(entry => entry.pull?.number !== 1216))).toBeNull();
    expect(projectZips(project('nsm'), bundledZips.entries.filter(entry => entry.number !== 234))!.rows.map(row => row.label)).toEqual(['ZIP 235', 'ZIP 237', 'ZIP 233']);
  });
  it('prefers the published next step, then the latest article, then the published records', () => {
    expect(projectSignal(project('crosslink'))).toMatchObject({ label: 'Published next step', detail: 'Q2 2026 - Q2 2027', date: null });
    expect(projectSignal(project('crosslink'))!.text).toContain('deploying Crosslink on a testnet');
    expect(projectSignal(project('fees'))).toMatchObject({ label: 'Published next step', text: 'Phase 2: The Fee Estimator (z_getstandardfee)' });
    expect(projectSignal(project('nsm'))).toMatchObject({ label: 'Latest update', quotedFrom: null });
    expect(projectSignal(project('nsm'))!.date).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(projectSignal(project('zero'))).toEqual({ label: 'Published repositories', text: 'Zero Software Stack · zero-indexer', quotedFrom: null, detail: null, date: null });
    for (const item of projects) expect(projectSignal(item)).not.toBeNull();
  });
  it('reports the newest commit of linked repositories and whether it comes from a fork', () => {
    const repositories = [repository('crosslink_monolith', false, ['2026-10-01T00:00:00Z']), repository('crosslink_book', false, ['2026-10-06T00:00:00Z', '2026-01-01T00:00:00Z']), repository('zero', false, ['2026-12-01T00:00:00Z']), repository('sl-orchard', true, ['2026-04-27T00:00:00Z'])];
    expect(projectLastCommit(project('crosslink'), repositories)).toEqual({ date: '2026-10-06T00:00:00Z', fork: false });
    expect(projectLastCommit(project('ironwood'), repositories)).toEqual({ date: '2026-04-27T00:00:00Z', fork: true });
    expect(projectLastCommit(project('epoch'), repositories)).toBeNull();
    expect(projectLastCommit(project('crosslink'), [repository('crosslink_book', false, [])])).toBeNull();
  });
  it('offers shortcuts only for what the project has', () => {
    const labels = (id: string) => projectShortcuts(project(id)).map(item => item.label);
    expect(labels('crosslink')).toEqual(['Research', 'FAQ', 'ZIPs', 'Simulator', 'Code']);
    expect(labels('epoch')).toEqual(['Research']);
    expect(labels('zero')).toEqual(['Research', 'Code']);
    expect(labels('nsm')).toEqual(['Research', 'FAQ', 'ZIPs', 'Simulator', 'Code']);
    for (const item of projects) for (const shortcut of projectShortcuts(item)) {
      expect(shortcut.count === null || shortcut.count > 0).toBe(true);
      expect(new URL(shortcut.href, 'https://portal.example').searchParams.get('project')).toBe(item.id);
    }
    expect(projectShortcuts(project('nsm')).find(item => item.label === 'ZIPs')).toEqual({ label: 'ZIPs', count: 4, href: '?view=projects&project=nsm#project-zips' });
    expect(new URL(projectShortcuts(project('fees')).find(item => item.label === 'Simulator')!.href, 'https://portal.example').searchParams.get('record')).toBe('fees-simulator');
  });
});
