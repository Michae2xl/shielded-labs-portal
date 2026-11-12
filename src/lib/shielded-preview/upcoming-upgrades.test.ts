import { describe, expect, it } from 'vitest';
import record from './governance-data/record.json';
import { bundledZips } from './zips/library';
import { shareCard } from './share';
import { findUpcomingUpgrade, upcomingUpgradeId, upcomingUpgrades } from './upcoming-upgrades';

const source = /^https:\/\/(forum\.zcashcommunity\.com\/t\/\d+(\/\d+)?|github\.com\/[\w.-]+\/zips\/pull\/\d+)$/;

describe('Upgrades under discussion', () => {
  it('lists only upgrades that have not activated, newest first, so an activated one has to move to the record', () => {
    const activated = record.upgrades.map(upgrade => upgrade.name);
    for (const upgrade of upcomingUpgrades) expect(activated).not.toContain(upgrade.name);
    expect(upcomingUpgrades.map(upgrade => upgrade.name)).toEqual(['NU8', 'NU7.1']);
  });
  it('says for each one that nothing is decided, and when its sources were read', () => {
    for (const upgrade of upcomingUpgrades) {
      expect(upgrade.stage).toBe('Under discussion');
      expect(upgrade.decided).toMatch(/^Nothing/);
      expect(Number.isFinite(Date.parse(upgrade.checkedAt))).toBe(true);
      expect(upgrade.sources.length).toBeGreaterThan(0);
      for (const item of upgrade.sources) expect(item.url).toMatch(source);
    }
  });
  it('attributes every proposed change to a named source and links each specification held in the ZIP library', () => {
    for (const upgrade of upcomingUpgrades) {
      expect(new Set(upgrade.candidates.map(candidate => candidate.id)).size).toBe(upgrade.candidates.length);
      for (const candidate of upgrade.candidates) {
        expect(candidate.source).toMatch(source);
        expect(candidate.proposedBy.length).toBeGreaterThan(5);
        expect(candidate.summary.length).toBeGreaterThan(20);
        expect(candidate.documents.length).toBeGreaterThan(0);
        for (const document of candidate.documents) {
          if (document.record) expect(bundledZips.entries.some(entry => entry.id === document.record)).toBe(true);
          if (document.url) expect(document.url).toMatch(/^https:\/\//);
        }
      }
    }
  });
  it('keeps the NU8 list as its author posted it: seven changes, with the rest marked as raised by others', () => {
    const nu8 = findUpcomingUpgrade('upgrade:NU8')!;
    expect(nu8.candidates.filter(candidate => candidate.standing === 'listed')).toHaveLength(7);
    expect(nu8.candidates.filter(candidate => candidate.standing === 'raised').map(candidate => candidate.id)).toEqual(['block-10s', 'zip-68-203']);
  });
  it('ties NU7.1 to the draft poll: the ZCG / Dev Fund outcome and the 20-second block spacing', () => {
    const nu71 = findUpcomingUpgrade('upgrade:NU7.1')!;
    expect(nu71.candidates.filter(candidate => candidate.standing === 'listed').map(candidate => candidate.id)).toEqual(['dev-fund', 'block-20s']);
    expect(nu71.candidates.find(candidate => candidate.id === 'block-20s')!.documents[0].record).toBe('pr-1437-draft-valargroup-20-second-block-target-spacing');
    expect(nu71.candidates.find(candidate => candidate.id === 'dev-fund')!.documents[0].portal).toBe('dev-fund');
  });
  it('reports views as dated posts by named people, never the editor', () => {
    for (const upgrade of upcomingUpgrades) for (const view of upgrade.views) {
      expect(view.url).toMatch(/^https:\/\/forum\.zcashcommunity\.com\/t\/\d+\/\d+$/);
      expect(Number.isFinite(Date.parse(view.date))).toBe(true);
      expect(view.who).not.toMatch(/Michae2xl/i);
    }
  });
  it('carries both sides of the exchange on how often upgrades should come', () => {
    const views = findUpcomingUpgrade('upgrade:NU8')!.views;
    expect(views.find(view => view.who === 'dismad')?.url).toBe('https://forum.zcashcommunity.com/t/59124/16');
    expect(views.find(view => view.who === 'seernet')).toMatchObject({ date: '2026-11-11', url: 'https://forum.zcashcommunity.com/t/59124/17' });
  });
  it('discloses where Shielded Labs is a party to what is being discussed', () => {
    expect(findUpcomingUpgrade('upgrade:NU7.1')!.disclosure).toMatch(/Shielded Labs is one of the organizations/);
    expect(findUpcomingUpgrade('upgrade:NU8')!.disclosure).toMatch(/Shielded Labs staff/);
  });
  it('resolves by record id, and its share card says the upgrade is still under discussion', () => {
    expect(upcomingUpgradeId(upcomingUpgrades[0])).toBe('upgrade:NU8');
    expect(findUpcomingUpgrade('upgrade:NU7')).toBeNull();
    expect(findUpcomingUpgrade(null)).toBeNull();
    expect(shareCard({ view: 'governance', section: 'voting', lane: 'upgrades', record: 'upgrade:NU8' })).toMatchObject({ chip: 'Network upgrade', title: 'NU8', subtitle: 'Under discussion · Target proposed: Late Jan 2027' });
  });
});
