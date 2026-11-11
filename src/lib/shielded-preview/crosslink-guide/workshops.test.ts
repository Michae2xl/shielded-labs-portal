import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import CrosslinkParticipate from '@/app/shielded-preview/crosslink-participate';
import { projects } from '../content';
import { searchPortal } from '../portal-search';
import { crosslinkVideoCount, earlierSetupVideos, milestoneVideos, workshopChannel, workshops, workshopsChecked } from './workshops';

const crosslink = projects.find(project => project.id === 'crosslink')!;
const render = (view: string | null) => renderToStaticMarkup(createElement(CrosslinkParticipate, { project: crosslink, view, headingRef: null, onFollow: () => {} }));
const text = (value: string) => renderToStaticMarkup(createElement('span', null, value)).replace(/^<span>|<\/span>$/g, '');
const youtube = /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/;

describe('Crosslink videos', () => {
  it('records each workshop with its recording, the post that published it and the post that announced it', () => {
    expect(workshops).toHaveLength(9);
    for (const item of workshops) {
      expect(item.recording).toMatch(youtube);
      expect(item.published).toMatch(/^https:\/\/forum\.zcashcommunity\.com\/t\/\d+\/\d+$/);
      expect(item.announcement).toMatch(/^https:\/\/forum\.zcashcommunity\.com\/t\/\d+\/\d+$/);
      expect(Number.isFinite(Date.parse(item.date))).toBe(true);
      expect(['Discord', 'Zoom']).toContain(item.venue);
    }
  });
  it('lists every group newest first, without repeating a video', () => {
    const dates = workshops.map(item => item.date);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(dates[0]).toBe('2026-10-01');
    for (const group of [milestoneVideos, earlierSetupVideos]) {
      const published = group.map(item => item.published);
      expect(published).toEqual([...published].sort().reverse());
      for (const item of group) expect(item.url).toMatch(youtube);
    }
    const all = [...workshops.map(item => item.recording), ...milestoneVideos.map(item => item.url), ...earlierSetupVideos.map(item => item.url)];
    expect(new Set(all).size).toBe(all.length);
    expect(crosslinkVideoCount).toBe(20);
  });
  it('shows every recording in its own tab of the test guide, with the venue and the date the sources were checked', () => {
    const page = render('videos');
    for (const item of workshops) {
      expect(page).toContain(text(item.title));
      expect(page).toContain(`href="${item.recording}"`);
      expect(page).toContain(`href="${item.announcement}"`);
    }
    expect(page).toContain('Held on Zoom');
    expect(page).toContain(workshopsChecked);
    expect(page).toContain(`href="${workshopChannel}"`);
    expect(render(null)).not.toContain('Workshop recordings');
  });
  it('keeps milestone videos apart, and says that the setup videos are for earlier releases', () => {
    const page = render('videos');
    for (const item of [...milestoneVideos, ...earlierSetupVideos]) {
      expect(page).toContain(text(item.title));
      expect(page).toContain(`href="${item.url}"`);
    }
    expect(page.indexOf('Milestone videos')).toBeGreaterThan(page.indexOf('Workshop recordings'));
    expect(page.indexOf('Setup videos for earlier releases')).toBeGreaterThan(page.indexOf('Milestone videos'));
    expect(page).toContain('For the current release, follow the testing guide.');
  });
  it('offers the tab from the guide menu and from portal search', () => {
    expect(render(null)).toContain('Videos');
    expect(searchPortal('workshop recording', []).find(result => result.title === 'Crosslink videos and workshop recordings')?.href).toBe('?view=projects&project=crosslink&section=participate&record=videos');
  });
});
