import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { findUpcomingUpgrade } from '@/lib/shielded-preview/upcoming-upgrades';
import UpcomingUpgradeSections from './upcoming-upgrade-sections';

const html = (id: string) => renderToStaticMarkup(createElement(UpcomingUpgradeSections, { upgrade: findUpcomingUpgrade(id)!, onNavigate: () => {} }));

describe('An upgrade under discussion, as a record', () => {
  it('lists each proposed change with who put it forward, and links drafts to the ZIP library', () => {
    const page = html('upgrade:NU8');
    expect(page).toContain('Tachyon shielded pool');
    expect(page).toContain('href="?view=governance&amp;section=zips&amp;record=zip-0248"');
    expect(page).toContain('href="https://forum.zcashcommunity.com/t/59124"');
    expect(page).toContain('No ZIP identified');
  });
  it('separates the author’s list from what others raised, and says that nothing is decided', () => {
    const page = html('upgrade:NU8');
    expect(page.indexOf('Also raised')).toBeGreaterThan(page.indexOf('Consensus branch ID updates'));
    expect(page.indexOf('10-second block target spacing')).toBeGreaterThan(page.indexOf('Also raised'));
    expect(page).toContain('Nothing.');
    expect(page).toContain('record=upgrade%3ANU7&amp;lane=upgrades');
  });
  it('shows the views with author and date, and leaves the section out when there are none', () => {
    const page = html('upgrade:NU8');
    expect(page).toContain('str4d');
    expect(page).toContain('dateTime="2026-11-09"');
    expect(page).toContain('href="https://forum.zcashcommunity.com/t/59124/3"');
    expect(html('upgrade:NU7.1')).not.toContain('Views in the discussion');
  });
  it('sends NU7.1 readers to the polling page and states the disclosure', () => {
    const page = html('upgrade:NU7.1');
    expect(page).toContain('section=voting&amp;lane=dev-fund');
    expect(page).toContain('Shielded Labs is one of the organizations');
  });
});
