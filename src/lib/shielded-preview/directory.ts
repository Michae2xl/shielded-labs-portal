import { milestones, projects, team, type Milestone } from './content';
import { projectPublications, publicationQuote } from './project-publications';

export type { Milestone };
export type Person = typeof team[number];
export type DirectoryView = 'impact' | 'people';

export const personId = (person: Person) => person.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
export const milestoneProject = (milestone: Pick<Milestone, 'project'>) => projects.find(project => project.id === milestone.project)!;

export function directoryHref(view: DirectoryView, section: string, record?: string) {
  const params = new URLSearchParams({ view, section });
  if (record) params.set('record', record);
  return `?${params}`;
}

export const peopleGroups = [
  { id: 'all', label: 'Team' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'cryptography', label: 'Cryptography' },
  { id: 'operations', label: 'Operations' },
] as const;

export const milestoneGroups = [
  { id: 'all', label: 'All milestones' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'security', label: 'Security' },
  { id: 'research', label: 'Research' },
  { id: 'governance', label: 'Governance' },
] as const;

const inGroup = (milestone: Milestone, group: string) => group === 'all' || milestone.type.toLowerCase() === group;
export const milestoneGroupItems = milestoneGroups.map(group => ({ ...group, count: milestones.filter(milestone => inGroup(milestone, group.id)).length }));

/** Newest first, grouped by calendar year, so a filter never leaves an empty year behind. */
export function milestoneYears(group: string, items: readonly Milestone[] = milestones) {
  const years = new Map<string, Milestone[]>();
  for (const milestone of [...items].filter(item => inGroup(item, group)).sort((a, b) => b.date.localeCompare(a.date))) {
    const year = milestone.date.slice(0, 4);
    years.set(year, [...(years.get(year) ?? []), milestone]);
  }
  return [...years].map(([year, entries]) => ({ year, entries }));
}

/** Where a milestone's own record lives in the governance archive, when it has one. */
export function milestoneGovernanceHref(milestone: Pick<Milestone, 'governanceRecord'>) {
  if (!milestone.governanceRecord) return null;
  const lane = milestone.governanceRecord.startsWith('upgrade:') ? 'upgrades' : 'archive';
  return `?${new URLSearchParams({ view: 'governance', section: 'voting', record: milestone.governanceRecord, lane })}`;
}

const monthYear = (date: string) => new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
const month = (date: string) => new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(new Date(date));
function period(first: string, last: string) {
  if (first === last) return monthYear(first);
  return first.slice(0, 4) === last.slice(0, 4) ? `${month(first)} – ${monthYear(last)}` : `${monthYear(first)} – ${monthYear(last)}`;
}
const daysBetween = (first: string, last: string) => Math.round((Date.parse(last) - Date.parse(first)) / 86_400_000);
const ofProject = (id: string) => milestones.filter(milestone => milestone.project === id).sort((a, b) => a.date.localeCompare(b.date));

export type MilestoneStory = {
  id: string; group: string; title: string; value: string; label: string; period: string; steps: boolean[];
  next: { label: string; text: string; quotedFrom: string | null; detail: string | null };
};

/** Three workstreams told as one story each, with counts derived from the records and source wording for what follows. */
export function milestoneStories(): MilestoneStory[] {
  const crosslink = ofProject('crosslink');
  const ironwood = ofProject('ironwood');
  const epoch = ofProject('epoch');
  const roadmap = projectPublications.crosslink;
  const research = projectPublications.epoch;
  const [phase, phaseName] = research.progress.text.split(': ');
  return [
    {
      id: 'crosslink', group: 'engineering', title: 'Crosslink prototype', value: String(crosslink.length), label: 'milestones completed',
      period: period(crosslink[0].date, crosslink.at(-1)!.date), steps: [...crosslink.map(() => true), false],
      next: { label: 'In progress', text: roadmap.progress.text, quotedFrom: null, detail: roadmap.next.window ? `Published window · ${roadmap.next.window}` : null },
    },
    {
      id: 'ironwood', group: 'security', title: 'Orchard to Ironwood', value: String(daysBetween(ironwood[0].date, ironwood.at(-1)!.date)), label: 'days from discovery to NU6.3 activation',
      period: period(ironwood[0].date, ironwood.at(-1)!.date), steps: [] as boolean[],
      next: { label: 'Latest', text: ironwood.at(-1)!.name, quotedFrom: null, detail: null },
    },
    {
      id: 'epoch', group: 'research', title: 'Epoch research', value: phase, label: phaseName,
      period: period(epoch[0].date, epoch.at(-1)!.date), steps: [] as boolean[],
      next: { label: 'Published target', text: publicationQuote(research.next) ?? '', quotedFrom: research.next.source, detail: null },
    },
  ];
}

export const teamContext: Record<string, { title: string; text: string; projects: string[] }> = {
  Leadership: { title: 'Research & strategy', text: 'Shielded Labs’ leadership supports its research, engineering and governance initiatives.', projects: ['crosslink', 'epoch', 'nsm'] },
  Engineering: { title: 'Engineering', text: 'Consensus research, protocol development and the infrastructure that supports Zcash.', projects: ['crosslink', 'zero', 'fees'] },
  Cryptography: { title: 'Epoch research', text: 'Ulrich Haböck, Luke Edwards and Suyash Bagad form the Epoch cryptography team, researching future designs and formal verification.', projects: ['epoch'] },
  Operations: { title: 'Operations', text: 'Supporting the organization and coordinating its work across the Zcash ecosystem.', projects: ['crosslink', 'epoch', 'ironwood'] },
};

export const upgradeAttribution = [
  { name: 'Project Tachyon, Valar Group and ZODL', action: 'Helped define Ironwood’s architecture, implemented the new consensus rules and carried out the formal verification work.' },
  { name: 'Zcash Foundation', action: 'Implemented Ironwood in Zebra and supported the ecosystem-wide transition from zcashd to Zebra.' },
];

export const securityAttribution = [
  { name: 'Shielded Labs', action: 'Commissioned ongoing protocol security research in April 2026.' },
  { name: 'Taylor Hornby', action: 'Discovered the Orchard flaw on May 29 and disclosed it to ZODL.' },
  { name: 'ZODL & ecosystem teams', action: 'Coordinated the emergency response. Ironwood followed through collaboration across organizations.' },
];
