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
    expect(guide).toContain('>Crosslink feature net</h2>');
    expect(guide).toContain('Feature-net progress is not a mainnet activation.');
    expect(guide).toContain(`<strong>${releaseTag}</strong><small>Release · ${releaseDate}</small>`);
    expect(guide).toContain(`<strong>Round ${currentRound}</strong>`);
    expect(guide).toContain(`<strong>${reportedPaid} / ${allocatedZec} ZEC</strong><small>Rewards reported paid</small>`);
    expect(guide).toContain(`<strong>${communityTools.length}</strong><small>Community tools</small>`);
  });

  it('points downloads at the current release and says when the steps were written for an older one', () => {
    const release = { tag: 'v17', publishedAt: '2026-11-09T10:00:00.000Z', url: 'https://github.com/ShieldedLabs/crosslink_monolith/releases/tag/v17', state: 'live' as const };
    const guide = renderToStaticMarkup(createElement(CrosslinkParticipate, { project: crosslink, view: null, headingRef: null, onFollow: () => {}, release }));
    expect(guide).toContain('<strong>v17</strong><small>Release · 9 Nov 2026</small>');
    expect(guide).toContain('Download v17');
    expect(guide).toContain(`The current release is v17; check its notes for changes.`);
    expect(guide).toContain(`The guide summarizes the ${releaseTag} instructions.`);
    expect(render(null)).not.toContain('The current release is');
  });

  it('describes Crosslink without promoting it', () => {
    const copy = [render(null), render('tools'), render('incentives')].join(' ');
    for (const phrase of ['Help shape', 'next layer', 'Join the conversation', 'Start testing', 'Faster finality']) expect(copy).not.toContain(phrase);
    expect(crosslink.description).not.toMatch(/faster/i);
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
