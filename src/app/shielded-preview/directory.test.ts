import { sourceHref } from '@/lib/shielded-preview/editorial/library';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { milestones, sources, team } from '@/lib/shielded-preview/content';
import { directoryHref, milestoneGovernanceHref, milestoneGroupItems, milestoneProject, milestoneStories, milestoneYears, personId } from '@/lib/shielded-preview/directory';
import { editorialCatalog } from '@/lib/shielded-preview/editorial/library';
import record from '@/lib/shielded-preview/governance-data/record.json';
import Directory from './directory';

describe('Directory cards and direct records', () => {
  it('opens every team card as the correct person, retains its group, and keeps the source of the profile', () => {
    expect(new Set(team.map(personId)).size).toBe(team.length);
    for (const person of team) {
      const target = new URL(directoryHref('people', person.group.toLowerCase(), `person:${personId(person)}`), 'https://portal.test');
      const markup = renderToStaticMarkup(createElement(Directory, {
        view: 'people', section: target.searchParams.get('section'), record: target.searchParams.get('record'),
        onNavigate: () => {}, onProject: () => {}, onFollow: () => {},
      }));
      expect(markup, person.name).toContain(`id="person-record-title" tabindex="-1">${person.name}</h1>`);
      expect(markup, person.name).toContain(`All ${person.group.toLowerCase()} team members`);
      expect(markup, person.name).toContain(`href="${sources.team}"`);
      expect(markup, person.name).not.toContain('Team navigation');
      expect(markup, person.name).not.toContain('Reviewed');
    }
  });

  it('says which names come from an announcement instead of the official team page', () => {
    const markup = renderToStaticMarkup(createElement(Directory, { view: 'people', section: null, record: null, onNavigate: () => {}, onProject: () => {}, onFollow: () => {} }));
    expect(markup).toContain('checked 11 Nov 2026. Aayush Giri and Wei Jie Koh come from forum announcements and are not on that page yet.');
    expect(markup).toContain('Forward Deployed Engineer');
  });

  it('shows only the records a person has', () => {
    const render = (name: string) => {
      const person = team.find(member => member.name === name)!;
      return renderToStaticMarkup(createElement(Directory, { view: 'people', section: 'all', record: `person:${personId(person)}`, onNavigate: () => {}, onProject: () => {}, onFollow: () => {} }));
    };
    const jason = render('Jason McGee Stramaglia');
    expect(jason).toContain('https://x.com/aquietinvestor');
    expect(jason).toContain('?view=about&amp;section=board&amp;record=board-jason-mcgee-stramaglia');
    expect(jason).toContain('id="person-articles"');
    expect(jason).toContain('id="person-zips"');
    expect(jason).not.toContain('id="person-about"');
    const ulrich = render('Ulrich Haböck');
    expect(ulrich).toContain('id="person-about"');
    expect(ulrich).toContain('href="?view=blog&amp;section=all&amp;record=epoch-future-proof-cryptography-for-zcash"');
    const robert = render('Robert Fegler');
    for (const id of ['person-about', 'person-code', 'person-articles', 'person-zips']) expect(robert).not.toContain(`id="${id}"`);
    expect(robert).toContain('Name, role and photo come from the official team page.');
    expect(robert).not.toContain('https://x.com/');
  });

  it('opens every milestone with its own source and the project supported by that source', () => {
    expect(new Set(milestones.map(milestone => milestone.date)).size).toBe(milestones.length);
    for (const milestone of milestones) {
      const project = milestoneProject(milestone);
      const target = new URL(directoryHref('impact', milestone.type.toLowerCase(), `milestone:${milestone.date}`), 'https://portal.test');
      const markup = renderToStaticMarkup(createElement(Directory, {
        view: 'impact', section: target.searchParams.get('section'), record: target.searchParams.get('record'),
        onNavigate: () => {}, onProject: () => {}, onFollow: () => {},
      }));
      expect(markup, milestone.name).toContain(`id="milestone-record-title" tabindex="-1">${milestone.name}</h1>`);
      expect(markup, milestone.name).toContain(`href="${sourceHref(milestone.source).replaceAll('&', '&amp;')}"`);
      expect(markup, milestone.name).toContain(`href="?view=projects&amp;project=${project.id}"`);
      if (milestone.governanceRecord) {
        const known = [...record.upgrades.map(item => `upgrade:${item.name}`), ...record.polls.map(item => `poll:${item.id}`)];
        expect(known, milestone.name).toContain(milestone.governanceRecord);
        expect(markup, milestone.name).toContain(milestoneGovernanceHref(milestone)!.replaceAll('&', '&amp;'));
      } else {
        expect(editorialCatalog.some(entry => entry.source === milestone.source && entry.projects.includes(project.id)), milestone.name).toBe(true);
      }
      expect(markup, milestone.name).toContain(milestone.recordType);
    }
  });

  it('keeps dated milestones aligned with the governance record they come from', () => {
    const nu63 = milestones.find(item => item.governanceRecord === 'upgrade:NU6.3 (Ironwood)')!;
    const upgrade = record.upgrades.find(item => item.name === 'NU6.3 (Ironwood)')!;
    expect(upgrade.time!.slice(0, 10)).toBe(nu63.date);
    expect(nu63.detail).toContain(upgrade.height!.toLocaleString('en-US'));
    expect(nu63.source).toBe(upgrade.source);
    const nu7 = milestones.find(item => item.governanceRecord === 'upgrade:NU7')!;
    const activated = record.upgrades.find(item => item.name === 'NU7')!;
    expect(activated).toMatchObject({ height: 3543405, time: '2026-11-06T02:34:02Z', checkedAt: '2026-11-06', zips: [259, 207, 214, 218, 235, 237, 2003, 2008] });
    expect(activated.time!.slice(0, 10)).toBe(nu7.date);
    expect(nu7.detail).toContain(activated.height!.toLocaleString('en-US'));
    expect(nu7.source).toBe(activated.source);
    const poll = record.polls.find(item => item.id === '2024-12-nsm-coinholder-poll')!;
    const nsm = milestones.find(item => item.governanceRecord === `poll:${poll.id}`)!;
    expect(nsm.date).toBe(poll.date);
    expect(nsm.source).toBe(poll.sources[0]);
  });

  it('groups the timeline by year, newest first, and counts each filter', () => {
    const all = milestoneYears('all');
    expect(all.map(year => year.year)).toEqual(['2026', '2025', '2024']);
    const dates = all.flatMap(year => year.entries.map(entry => entry.date));
    expect(dates).toEqual([...dates].sort().reverse());
    expect(dates).toHaveLength(milestones.length);
    expect(milestoneYears('research').map(year => year.year)).toEqual(['2026']);
    expect(milestoneYears('governance').map(year => year.year)).toEqual(['2026', '2024']);
    expect(Object.fromEntries(milestoneGroupItems.map(group => [group.id, group.count]))).toEqual({ all: 11, engineering: 5, security: 3, research: 1, governance: 2 });
  });

  it('derives the three stories from the records and quotes what comes next', () => {
    const [crosslink, ironwood, epoch] = milestoneStories();
    expect(crosslink).toMatchObject({ group: 'engineering', value: '5', period: 'Mar 2025 – Apr 2026', steps: [true, true, true, true, true, false] });
    expect(crosslink.next).toEqual({ label: 'In progress', text: 'Productionization Phase', quotedFrom: null, detail: 'Published window · Q2 2026 - Q2 2027' });
    expect(ironwood).toMatchObject({ group: 'security', value: '60', period: 'May – Jul 2026', steps: [] });
    expect(ironwood.next.text).toBe('NU6.3 activates Ironwood');
    expect(epoch).toMatchObject({ group: 'research', value: 'Phase 1', label: 'Research and Design', period: 'Oct 2026', steps: [] });
    expect(epoch.next.text).toContain('by the end of 2027');
    expect(epoch.next.quotedFrom).toBe(sources.epoch);
  });

  it('replaces the tabs on a record with a way back, and lists its workstream with the current one marked', () => {
    const render = (section: string, record: string) => renderToStaticMarkup(createElement(Directory, { view: 'impact', section, record, onNavigate: () => {}, onProject: () => {}, onFollow: () => {} }));
    const security = render('security', 'milestone:2026-05-29');
    expect(security).not.toContain('Milestones navigation');
    expect(security).toContain('All security milestones');
    expect(security).toContain('Who did what');
    expect(security).toContain('aria-current="page"');
    expect(security).toContain('NU6.3 activates Ironwood');
    expect(security).toContain('href="?view=impact&amp;section=security"');
    const nu7 = render('all', 'milestone:2026-11-06');
    expect(nu7).toContain('NU7 activates the NSM');
    expect(nu7).toContain('Coinholders polled on the NSM');
    expect(nu7).not.toContain('Who did what');
    expect(nu7).not.toContain('Ironwood guide');
    expect(nu7).not.toContain('Proposal announcement');
    const ironwood = render('all', 'milestone:2026-07-28');
    expect(ironwood).toContain('Who did what');
    expect(ironwood).toContain('Proposal announcement');
    const epoch = render('all', 'milestone:2026-10-01');
    expect(epoch).toContain('All milestones');
    expect(epoch).not.toContain('In this workstream');
    expect(epoch).not.toContain('Who did what');
    expect(render('all', 'milestone:1999-01-01')).toContain('Milestones navigation');
    expect(render('all', 'milestone:1999-01-01')).toContain('Record not found');
  });

  it('shows a visible title, the stories only on the full list, and links every entry to its record', () => {
    const render = (section: string) => renderToStaticMarkup(createElement(Directory, { view: 'impact', section, record: null, onNavigate: () => {}, onProject: () => {}, onFollow: () => {} }));
    const all = render('all');
    expect(all).toContain('>Milestones</h1>');
    expect(all).toContain('Crosslink prototype');
    for (const milestone of milestones) expect(all).toContain(`record=milestone%3A${milestone.date}`);
    const research = render('research');
    expect(research).not.toContain('Crosslink prototype');
    expect(research).toContain('Epoch introduced');
    expect(research).not.toContain('Foundation in place');
  });
});
