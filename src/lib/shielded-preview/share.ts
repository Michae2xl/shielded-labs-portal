import { milestones, projects, team } from './content';
import { personId } from './directory';
import { editorialCatalog } from './editorial/library';
import type { EditorialEntry } from './editorial/types';
import { devFundLane, devFundTimeline } from './governance-dev-fund';
import record from './governance-data/record.json';
import { governanceSectionFromSlug, type GovernanceSection } from './governance-sections';
import { bundledZips, proposalChange, zipLabel, zipSummary, zipTitle } from './zips/library';
import { findUpcomingUpgrade } from './upcoming-upgrades';

/**
 * What a shared link shows, from the same records the portal renders: a chip and one short line
 * for the image, and a fuller description for the link text.
 */
export type ShareParams = Partial<Record<'view' | 'project' | 'section' | 'record' | 'lane' | 'q', string>>;
export type ShareImage = { src: string; width: number; height: number; alt: string };
// `linkTitle` names the page in the link text when the image shows its identifier elsewhere, as a ZIP's number.
export type ShareCard = { chip?: string; title: string; linkTitle?: string; subtitle: string; description: string; image?: ShareImage; live?: 'nsm'; brand?: true };

export const SUBTITLE_MAX = 72;
const DESCRIPTION_MAX = 160;
const PUBLIC_ORIGIN = 'https://shielded-labs-portal-preview.up.railway.app';
const TRUSTED_HOST = /^(?:(?:127\.0\.0\.1|localhost)(?::\d+)?|[a-z0-9-]+\.up\.railway\.app|(?:[a-z0-9-]+\.)*shieldedlabs\.net)$/i;
const SITE: ShareCard = { title: 'Shielded Labs', subtitle: 'Projects, research and community resources', description: 'Shielded Labs projects, research and community resources.', brand: true };
// The governance portal signs its own pages; its front page carries the name alone.
const GOVERNANCE_SITE = 'Zcash Governance';
const SECTIONS: Record<string, ShareCard> = {
  projects: { title: 'Projects', subtitle: 'Shielded Labs projects and their progress', description: 'Shielded Labs projects, their progress and published references.' },
  impact: { title: 'Milestones', subtitle: 'Dated milestones, each with its source', description: 'Dated milestones from Shielded Labs projects, each with its source.' },
  activity: { title: 'Code activity', subtitle: 'Recent commits across Shielded Labs repositories', description: 'Recent commits across Shielded Labs repositories.' },
  people: { title: 'Team', subtitle: 'The people behind Shielded Labs', description: 'The people behind Shielded Labs and their public work.' },
  blog: { title: 'Blog', subtitle: 'Articles from Shielded Labs', description: 'Articles from Shielded Labs.' },
  governance: { title: GOVERNANCE_SITE, subtitle: 'Proposals, grants, polls, upgrades and ZIPs', description: 'Zcash proposals, grants, polls, network upgrades and ZIPs.' },
  about: { title: 'About', subtitle: 'Organization, board, careers and contact', description: 'About Shielded Labs.' },
};
const GOVERNANCE_SECTIONS: Record<Exclude<GovernanceSection, 'Overview'>, string> = {
  'How it works': 'How Zcash governance decisions are made',
  Proposals: 'ZCG and coinholder proposals',
  Grants: 'Zcash Community Grants records',
  Voting: 'Polls and network upgrades',
  Results: 'Poll and election results',
  ZCAP: 'The Zcash Community Advisory Panel',
  ZIPs: 'Zcash Improvement Proposals',
  Insights: 'Trends across the governance record',
  Transparency: 'How this portal separates facts from positions',
};
const day = (date: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
export const clip = (text: string, max: number) => text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
const line = (...parts: (string | null | undefined)[]) => clip([...new Set(parts.filter((part): part is string => Boolean(part)))].join(' · '), SUBTITLE_MAX);

function editorialCard(id: string, view: EditorialEntry['view'], chip: string, subtitle: (entry: EditorialEntry) => string): ShareCard | null {
  const entry = editorialCatalog.find(item => item.id === id && item.view === view);
  if (!entry) return null;
  const image = entry.image ? { image: { src: entry.image.src, width: entry.image.width, height: entry.image.height, alt: entry.image.alt } } : {};
  return { chip, title: entry.title, subtitle: line(subtitle(entry)), description: clip(entry.summary, DESCRIPTION_MAX), ...image };
}

function governanceCard(params: ShareParams): ShareCard | null {
  const id = params.record ?? '';
  const zip = bundledZips.entries.find(entry => entry.id === id);
  if (zip) {
    const chip = zip.kind === 'zip' ? 'ZIP' : zip.kind === 'proposal' ? 'ZIP pull request' : zip.kind === 'guide' ? 'ZIP guide' : 'ZIP draft';
    return { chip, title: zip.title, linkTitle: zip.kind === 'proposal' ? `${zipLabel(zip)}: ${zip.title}` : zipTitle(zip), subtitle: line(zipLabel(zip), zip.kind === 'proposal' ? proposalChange(zip) : zip.status), description: clip(zipSummary(zip), DESCRIPTION_MAX) };
  }
  const upgrade = record.upgrades.find(item => `upgrade:${item.name}` === id);
  if (upgrade) {
    const activated = upgrade.height && upgrade.time ? `Activated at block ${upgrade.height.toLocaleString('en-US')}` : null;
    return { chip: 'Network upgrade', title: upgrade.name, subtitle: activated ? line(activated, day(upgrade.time)) : line(upgrade.governance), description: clip(upgrade.governance, DESCRIPTION_MAX) };
  }
  const upcoming = findUpcomingUpgrade(id);
  if (upcoming) return { chip: 'Network upgrade', title: upcoming.name, subtitle: line(upcoming.stage, `${upcoming.fact.name}: ${upcoming.fact.value}`), description: clip(upcoming.summary, DESCRIPTION_MAX) };
  const poll = record.polls.find(item => `poll:${item.id}` === id);
  if (poll) return { chip: 'Poll', title: poll.name, subtitle: line(day(poll.date)), description: clip(poll.outcome ?? poll.status ?? 'Zcash community poll.', DESCRIPTION_MAX) };
  if (params.lane === devFundLane) return { chip: 'Governance', title: devFundTimeline.title, subtitle: 'Published calendar for proposals and polling', description: 'The published calendar for proposals, poll questions and polling.' };
  const section = governanceSectionFromSlug(params.section);
  if (!section || section === 'Overview') return null;
  return { chip: 'Governance', title: section, subtitle: GOVERNANCE_SECTIONS[section], description: `${GOVERNANCE_SECTIONS[section]}, from the Zcash governance record.` };
}

function projectCard(params: ShareParams): ShareCard | null {
  const project = projects.find(item => item.id === params.project);
  if (!project) return null;
  if (params.record) return editorialCard(params.record, 'resources', project.name, entry => entry.category);
  return { chip: 'Project', title: project.name, subtitle: line(project.description), description: clip(project.purpose, DESCRIPTION_MAX), ...(project.id === 'nsm' ? { live: 'nsm' as const } : {}) };
}

function recordCard(view: string, params: ShareParams): ShareCard | null {
  if (view === 'projects') return projectCard(params);
  if (view === 'impact') {
    const milestone = milestones.find(item => `milestone:${item.date}` === params.record);
    const project = projects.find(item => item.id === milestone?.project);
    return milestone ? { chip: 'Milestone', title: milestone.name, subtitle: line(day(milestone.date), project?.name), description: clip(milestone.detail, DESCRIPTION_MAX) } : null;
  }
  if (view === 'people') {
    const person = team.find(item => `person:${personId(item)}` === params.record);
    return person ? { chip: 'Team', title: person.name, subtitle: line(person.role), description: clip(`${person.name}, ${person.role} at Shielded Labs.`, DESCRIPTION_MAX) } : null;
  }
  if (!params.record) return view === 'governance' ? governanceCard(params) : null;
  if (view === 'blog') return editorialCard(params.record, 'blog', 'Blog', entry => line(entry.author, day(entry.publishedAt)));
  if (view === 'about') return editorialCard(params.record, 'about', 'About', entry => entry.category);
  if (view === 'governance') return governanceCard(params);
  return null;
}

export function shareCard(params: ShareParams): ShareCard {
  const view = params.view ?? 'overview';
  const section = SECTIONS[view];
  if (!section) return SITE;
  return recordCard(view, params) ?? section;
}

/** Absolute links need the host the portal answered on; anything else falls back to the public preview. */
export function shareOrigin(host: string | null, protocol: string | null) {
  if (!host || !TRUSTED_HOST.test(host)) return PUBLIC_ORIGIN;
  const local = /^(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(host);
  return `${protocol === 'http' || protocol === 'https' ? protocol : local ? 'http' : 'https'}://${host}`;
}

/** The origin a request was answered on, read from the headers the proxy forwards. */
export function requestOrigin(request: { get(name: string): string | null }) {
  const first = (name: string) => request.get(name)?.split(',')[0].trim() ?? null;
  return shareOrigin(first('x-forwarded-host') ?? first('host'), first('x-forwarded-proto'));
}

export function shareMetadata(params: ShareParams, origin: string) {
  const card = shareCard(params);
  const site = params.view === 'governance' ? GOVERNANCE_SITE : SITE.title;
  const title = card.brand || card.title === site ? card.title : `${card.linkTitle ?? card.title} · ${site}`;
  const query = new URLSearchParams((['view', 'project', 'section', 'record', 'lane'] as const).flatMap(key => params[key] ? [[key, params[key]!]] : []));
  const image = card.image
    ? { url: new URL(card.image.src, origin).href, width: card.image.width, height: card.image.height, alt: card.image.alt }
    : { url: `${origin}/api/shielded-preview/og${query.size ? `?${query}` : ''}`, width: 1200, height: 630, alt: title };
  return {
    title,
    description: card.description,
    openGraph: { title, description: card.description, siteName: site, type: 'website' as const, images: [image] },
    twitter: { card: 'summary_large_image' as const, title, description: card.description, images: [image.url] },
  };
}
