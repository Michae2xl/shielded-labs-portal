import { describe, expect, it } from 'vitest';
import { governanceSections, governanceSectionSlug } from './governance-sections';
import { shareCard, shareMetadata, shareOrigin, SUBTITLE_MAX, type ShareParams } from './share';
import { bundledZips } from './zips/library';

describe('Share previews', () => {
  it('describes the portal when no page is selected', () => {
    expect(shareCard({})).toMatchObject({ title: 'Shielded Labs', subtitle: 'Projects, research and community resources', brand: true });
    expect(shareCard({}).chip).toBeUndefined();
    expect(shareMetadata({}, 'https://portal.example').title).toBe('Shielded Labs');
    expect(shareMetadata({}, 'https://portal.example').description).toBe('Shielded Labs projects, research and community resources.');
    expect(shareCard({ view: 'unknown' }).title).toBe('Shielded Labs');
  });

  it('names a project with its own line and asks for the live NSM balance', () => {
    expect(shareCard({ view: 'projects', project: 'crosslink' })).toMatchObject({ chip: 'Project', title: 'Crosslink', subtitle: 'Proof of Work + Proof of Stake with BFT finality.' });
    expect(shareCard({ view: 'projects', project: 'nsm' }).live).toBe('nsm');
    expect(shareCard({ view: 'projects', project: 'crosslink' }).live).toBeUndefined();
  });

  it('shares a document inside a project under that project', () => {
    expect(shareCard({ view: 'projects', project: 'nsm', section: 'resources', record: 'nsm-guide' })).toMatchObject({ chip: 'NSM', title: 'Network Sustainability Mechanism', subtitle: 'Guide & FAQ' });
  });

  it('uses an article’s own artwork and its byline', () => {
    const card = shareCard({ view: 'blog', section: 'all', record: 'the-network-sustainability-mechanism-nsm-activates-with-nu7' });
    expect(card).toMatchObject({ chip: 'Blog', title: 'The Network Sustainability Mechanism (NSM) Activates with NU7', subtitle: 'Jason McGee · 05 Nov 2026' });
    expect(card.image?.src).toMatch(/^\/shielded-preview\/editorial\/[a-f0-9]+\.png$/);
  });

  it('covers milestones, ZIPs, governance records, sections and people with one short line', () => {
    expect(shareCard({ view: 'impact', record: 'milestone:2026-11-06' })).toMatchObject({ chip: 'Milestone', title: 'NU7 activates the NSM', subtitle: '06 Nov 2026 · NSM' });
    expect(shareCard({ view: 'governance', section: 'zips', record: 'zip-0237' })).toMatchObject({ chip: 'ZIP', title: 'Network Sustainability Mechanism: Halving-Preserving Issuance', subtitle: 'ZIP 237 · Proposed' });
    expect(shareCard({ view: 'governance', section: 'voting', lane: 'upgrades', record: 'upgrade:NU7' })).toMatchObject({ chip: 'Network upgrade', title: 'NU7', subtitle: 'Activated at block 3,543,405 · 06 Nov 2026' });
    expect(shareCard({ view: 'governance', section: 'voting', record: 'poll:2019-07-nu3-codename-straw-poll' })).toMatchObject({ chip: 'Poll', subtitle: '02 Aug 2019' });
    expect(shareCard({ view: 'governance', section: 'proposals', lane: 'dev-fund' })).toMatchObject({ chip: 'Governance', title: 'ZCG / Dev Fund: proposals and polling' });
    expect(shareCard({ view: 'governance', section: 'zips' })).toMatchObject({ chip: 'Governance', title: 'ZIPs' });
    expect(shareCard({ view: 'people', section: 'all', record: 'person:jason-mcgee-stramaglia' })).toMatchObject({ chip: 'Team', title: 'Jason McGee Stramaglia', subtitle: 'Executive Director' });
    expect(shareCard({ view: 'governance', section: 'overview' })).toMatchObject({ title: 'Zcash Governance' });
    const pages: ShareParams[] = [{}, { view: 'projects' }, { view: 'impact' }, { view: 'activity' }, { view: 'people' }, { view: 'blog' }, { view: 'governance' }, { view: 'about' }, { view: 'impact', record: 'milestone:2026-07-28' }, { view: 'about', record: 'privacy' }, ...governanceSections.map(section => ({ view: 'governance', section: governanceSectionSlug(section) }))];
    for (const page of pages) {
      const card = shareCard(page);
      expect(card.subtitle.length, JSON.stringify(page)).toBeLessThanOrEqual(SUBTITLE_MAX);
      expect(card.subtitle, JSON.stringify(page)).not.toBe('');
      expect(card.description.length, JSON.stringify(page)).toBeLessThanOrEqual(160);
    }
  });

  it('falls back to the section when a record is unknown', () => {
    const missing = shareCard({ view: 'blog', record: 'not-real' });
    expect(missing).toMatchObject({ title: 'Blog', subtitle: 'Articles from Shielded Labs' });
    expect(missing.chip).toBeUndefined();
    expect(shareCard({ view: 'blog', record: 'nsm-guide' }).title).toBe('Blog');
  });

  it('builds absolute links for the title, description and image', () => {
    const meta = shareMetadata({ view: 'projects', project: 'nsm', q: 'ignored' }, 'https://portal.example');
    expect(meta.title).toBe('NSM · Shielded Labs');
    expect(meta.openGraph.images[0]).toMatchObject({ url: 'https://portal.example/api/shielded-preview/og?view=projects&project=nsm', width: 1200, height: 630 });
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image', images: ['https://portal.example/api/shielded-preview/og?view=projects&project=nsm'] });
    const article = shareMetadata({ view: 'blog', record: 'the-network-sustainability-mechanism-nsm-activates-with-nu7' }, 'https://portal.example');
    expect(article.openGraph.images[0].url).toMatch(/^https:\/\/portal\.example\/shielded-preview\/editorial\/[a-f0-9]+\.png$/);
    expect(meta.description.length).toBeLessThanOrEqual(160);
  });

  it('keeps a ZIP’s number in the link title, as the ZIP library lists it', () => {
    expect(shareMetadata({ view: 'governance', section: 'zips', record: 'zip-0237' }, 'https://portal.example').title).toBe('ZIP 237: Network Sustainability Mechanism: Halving-Preserving Issuance · Zcash Governance');
    const pull = bundledZips.entries.find(entry => entry.kind === 'proposal' && entry.pull);
    expect(pull).toBeDefined();
    expect(shareMetadata({ view: 'governance', section: 'zips', record: pull!.id }, 'https://portal.example').title).toBe(`PR ${pull!.pull!.number}: ${pull!.title} · Zcash Governance`);
  });

  it('names the governance portal on its own pages and Shielded Labs on the Labs pages', () => {
    const origin = 'https://portal.example';
    expect(shareMetadata({ view: 'governance' }, origin)).toMatchObject({ title: 'Zcash Governance', openGraph: { siteName: 'Zcash Governance' } });
    expect(shareMetadata({ view: 'governance', section: 'overview' }, origin).title).toBe('Zcash Governance');
    expect(shareMetadata({ view: 'governance', section: 'zips' }, origin)).toMatchObject({ title: 'ZIPs · Zcash Governance', openGraph: { siteName: 'Zcash Governance' } });
    expect(shareMetadata({ view: 'governance', section: 'voting', lane: 'upgrades', record: 'upgrade:NU7' }, origin).title).toBe('NU7 · Zcash Governance');
    expect(shareMetadata({ view: 'projects', project: 'nsm' }, origin).openGraph.siteName).toBe('Shielded Labs');
    expect(shareMetadata({ view: 'blog' }, origin)).toMatchObject({ title: 'Blog · Shielded Labs', openGraph: { siteName: 'Shielded Labs' } });
    // The image is still drawn from the same record, whichever portal shows it.
    expect(shareMetadata({ view: 'governance', section: 'zips' }, origin).openGraph.images[0].url).toBe('https://portal.example/api/shielded-preview/og?view=governance&section=zips');
  });

  it('only trusts hosts the portal is served from', () => {
    expect(shareOrigin('shielded-labs-portal-preview.up.railway.app', 'https')).toBe('https://shielded-labs-portal-preview.up.railway.app');
    expect(shareOrigin('127.0.0.1:4248', null)).toBe('http://127.0.0.1:4248');
    expect(shareOrigin('evil.example', 'https')).toBe('https://shielded-labs-portal-preview.up.railway.app');
  });
});
