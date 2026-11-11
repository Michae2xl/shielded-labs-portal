import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { GrantRecord, Source } from '@/lib/shielded-preview/governance-types';
import { searchPortal } from '@/lib/shielded-preview/portal-search';
import type { MeetingMinutes } from '@/lib/shielded-preview/zcg-minutes';
import type { ScheduledPayment } from '@/lib/shielded-preview/zcg-schedule';
import { ZcgMinutesCollection, ZcgScheduleCollection } from './governance-zcg';

const grant = (name: string): GrantRecord => ({ grant: name, grantee: 'Team', category: 'Community', program: 'zcg_regular', status: 'open', milestones: 3, milestonesPaid: 1, usd: 1000, zec: 1, firstPaid: '2026-01-01', lastPaid: '2026-02-01' });
const grants: Source<GrantRecord[]> = { data: [grant('Known grant')], state: 'fetched', observedAt: '2026-11-11T06:00:00Z', url: 'https://openzcash.org/api/zcg/data/grants' };
const controls = {
  search: '', onSearch: () => {}, filter: 'all', onFilter: () => {}, page: 1, onPage: () => {}, onNavigate: () => {},
  grants, lanes: [{ id: 'schedule', name: 'Scheduled', count: 2 }, { id: 'minutes', name: 'Minutes', count: 3 }], onLane: () => {}, onLedger: () => {}, busy: false,
};
const render = (element: ReactElement) => renderToStaticMarkup(element).replaceAll('<!-- -->', '');

const payment = (row: number, project: string, milestone: string, usd: number, estimate: string | null, condition: string | null = null): ScheduledPayment => ({ row, project, grantee: 'Team', category: 'Community', milestone, usd, estimate, condition });
const schedule = (data: ScheduledPayment[] | null): Source<ScheduledPayment[] | null> => ({ data, state: data ? 'fetched' : 'unavailable', observedAt: data ? '2026-11-11T06:00:00Z' : null, url: 'https://docs.google.com/spreadsheets/d/x/edit#gid=1' });
const rows = [payment(10, 'Known grant', '2', 1500.5, '2026-11-20'), payment(11, 'Unlisted grant', 'Startup Funding', 250, '2027-01-05'), payment(12, 'Known grant', '1', 900, '2026-10-01'), payment(13, 'Known grant', '3', 26000, null, 'TBD'), payment(14, 'Known grant', '4', 57200, '2025-08-18')];

describe('ZCG scheduled payments', () => {
  it('shows upcoming payments first, with what is scheduled in all, the months and the day the sheet was read', () => {
    const html = render(createElement(ZcgScheduleCollection, { ...controls, source: schedule(rows) }));
    // Scheduled: the two still ahead and the one past its estimate this year. The 2025 estimate and the undated one stay out.
    expect(html).toContain('Scheduled payments</dt><dd>3</dd>');
    expect(html).toContain('Scheduled · USD</dt><dd>$2,650.50</dd>');
    expect(html).toContain('Upcoming · USD</dt><dd>$1,750.50</dd>');
    expect(html).toContain('Upcoming · 2</option>');
    expect(html).toContain('Past estimate · 1</option>');
    expect(html).toContain('Earlier years · 1</option>');
    expect(html).toContain('Sheet read');
    expect(html).toContain('Milestone 2');
    expect(html).toContain('Startup Funding');
    expect(html).toContain('20 Nov 2026');
    expect(html).not.toContain('01 Oct 2026');
    expect(html).toContain('Nov 2026');
    expect(html).toContain('1 payment');
  });
  it('opens the grant record when the portal has one, and the row of the sheet when it does not', () => {
    const html = render(createElement(ZcgScheduleCollection, { ...controls, source: schedule(rows) }));
    expect(html).toContain('href="?view=governance&amp;section=grants&amp;record=zcg_regular%7CKnown+grant&amp;lane=schedule"');
    expect(html).toContain('&amp;range=A11"');
  });
  it('lists what is past its estimate or has no date when that part is chosen, in the words of the sheet', () => {
    const past = render(createElement(ZcgScheduleCollection, { ...controls, filter: 'past', source: schedule(rows) }));
    expect(past).toContain('01 Oct 2026');
    expect(past).not.toContain('20 Nov 2026');
    expect(past).toContain('1 payment · $900.00');
    const earlier = render(createElement(ZcgScheduleCollection, { ...controls, filter: 'earlier', source: schedule(rows) }));
    expect(earlier).toContain('18 Aug 2025');
    expect(earlier).toContain('1 payment · $57,200.00');
    const undated = render(createElement(ZcgScheduleCollection, { ...controls, filter: 'undated', source: schedule(rows) }));
    expect(undated).toContain('TBD');
    expect(undated).toContain('$26,000.00');
  });
  it('says that the schedule is unavailable instead of showing an empty one', () => {
    const html = render(createElement(ZcgScheduleCollection, { ...controls, source: schedule(null) }));
    expect(html).toContain('Schedule unavailable');
    expect(html).not.toContain('Scheduled payments</dt>');
  });
});

describe('ZCG meeting minutes', () => {
  const minute = (id: number, meeting: string, replies = 2): MeetingMinutes => ({ id, title: `Zcash Community Grants Meeting Minutes ${meeting}`, url: `https://forum.zcashcommunity.com/t/minutes/${id}`, posted: `${meeting}T12:00:00.000Z`, meeting, replies });
  const minutes = (data: MeetingMinutes[] | null): Source<MeetingMinutes[] | null> => ({ data, state: data ? 'fetched' : 'unavailable', observedAt: data ? '2026-11-11T06:00:00Z' : null, url: 'https://forum.zcashcommunity.com/c/grants/zomg-updates/34' });
  const all = [minute(3, '2026-10-23'), minute(2, '2026-10-12', 0), minute(1, '2025-12-15')];

  it('lists each meeting by its day and links the minutes on the forum, without summarising them', () => {
    const html = render(createElement(ZcgMinutesCollection, { ...controls, source: minutes(all) }));
    expect(html).toContain('Minutes published</dt><dd>3</dd>');
    expect(html).toContain('23 October 2026');
    expect(html).toContain('href="https://forum.zcashcommunity.com/t/minutes/3"');
    expect(html).toContain('title="Zcash Community Grants Meeting Minutes 2026-10-23"');
    expect(html).toContain('does not summarise or interpret');
  });
  it('filters by year, and says when the archive could not be read', () => {
    const year = render(createElement(ZcgMinutesCollection, { ...controls, filter: '2025', source: minutes(all) }));
    expect(year).toContain('15 December 2025');
    expect(year).not.toContain('23 October 2026');
    expect(render(createElement(ZcgMinutesCollection, { ...controls, source: minutes(null) }))).toContain('Minutes unavailable');
  });
  it('are found by portal search, and so is the schedule', () => {
    expect(searchPortal('meeting minutes', []).find(result => result.title === 'ZCG meeting minutes')?.href).toBe('?view=governance&section=grants&lane=minutes');
    expect(searchPortal('scheduled payments', []).find(result => result.title === 'ZCG scheduled payments')?.href).toBe('?view=governance&section=grants&lane=schedule');
  });
});
