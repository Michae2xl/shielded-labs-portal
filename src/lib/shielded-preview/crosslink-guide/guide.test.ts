import { existsSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import CrosslinkParticipate from '@/app/shielded-preview/crosslink-participate';
import { projects } from '../content';
import { editorialCatalog, opensInPortal } from '../editorial/library';
import { searchPortal } from '../portal-search';
import { operateSteps, referencedIssues, relatedPages, rewardDetails, steps, toolAnchor } from './guide';
import { allocatedZec, currentRound, history, paidRounds, releaseDate, releaseTag, reportedPaid, sourcesChecked } from './history';
import { categories, communityTools } from './tools';

const crosslink = projects.find(project => project.id === 'crosslink')!;
const render = (view: string | null) => renderToStaticMarkup(createElement(CrosslinkParticipate, { project: crosslink, view, headingRef: null, onFollow: () => {} }));
const text = (value: string) => renderToStaticMarkup(createElement('span', null, value)).replace(/^<span>|<\/span>$/g, '');

describe('Crosslink participation guide', () => {
  it('opens with what the feature net is running instead of decoration', () => {
    const guide = render(null);
    expect(guide).not.toContain('One network');
    expect(guide).toContain(`<strong>${releaseTag}</strong><small>Release · ${releaseDate}</small>`);
    expect(guide).toContain(`<strong>Round ${currentRound}</strong>`);
    expect(guide).toContain(`<strong>${reportedPaid} / ${allocatedZec} ZEC</strong><small>Rewards reported paid</small>`);
    expect(guide).toContain(`<strong>${communityTools.length}</strong><small>Community tools</small>`);
  });

  it('shows the whole test guide', () => {
    const guide = render(null);
    for (const step of steps) expect(guide).toContain(text(step.title));
    expect(guide).toContain('Before you start');
    expect(guide).toContain('Running a finalizer?');
    expect(guide).toContain('Using a phone?');
    expect(guide).toContain(`Sources checked ${sourcesChecked}`);
    expect(operateSteps).toHaveLength(3);
  });
  it('lists every community tool with its author and original contribution', () => {
    const tools = render('tools');
    expect(communityTools).toHaveLength(14);
    for (const tool of communityTools) {
      expect(tools).toContain(text(tool.name));
      expect(tools).toContain(text(tool.author));
      expect(tools).toContain(text(tool.note));
      expect(new URL(tool.href).protocol).toBe('https:');
      expect(new URL(tool.source).protocol).toBe('https:');
      if (tool.logo) expect(existsSync(path.join(process.cwd(), 'public', tool.logo)), tool.logo).toBe(true);
    }
    for (const category of categories.slice(1)) expect(communityTools.some(tool => tool.category === category)).toBe(true);
    expect(referencedIssues).toHaveLength(3);
    expect(new Set(communityTools.map(tool => toolAnchor(tool.name))).size).toBe(communityTools.length);
    for (const tool of communityTools) expect(tools).toContain(`id="${toolAnchor(tool.name)}"`);
  });
  it('shows the incentive pool, every round and the whole timeline', () => {
    const incentives = render('incentives');
    expect(reportedPaid).toBe(paidRounds.reduce((total, round) => total + round.earned + round.discretionary, 0));
    for (const round of paidRounds) expect(incentives).toContain(`Round ${round.round}`);
    for (const item of rewardDetails) expect(incentives).toContain(text(item.title));
    for (const event of history) expect(incentives).toContain(text(event.title));
  });
  it('connects to the portal pages about Crosslink', () => {
    for (const id of relatedPages) expect(editorialCatalog.some(entry => entry.id === id), id).toBe(true);
    expect(render(null)).toContain('Also in this portal');
    expect(opensInPortal('https://shieldedlabs.net/')).toBe(true);
    expect(opensInPortal('https://github.com/ShieldedLabs/crosslink_monolith')).toBe(false);
  });
  it('is found by portal search', () => {
    expect(searchPortal('cTAZ testing', []).some(result => result.title === 'Crosslink test guide')).toBe(true);
    expect(searchPortal('Staker Space', []).find(result => result.kind === 'Community tool')?.href).toBe(`?view=projects&project=crosslink&section=participate&record=tools#${toolAnchor('Staker Space')}`);
  });
});
