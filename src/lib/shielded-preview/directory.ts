import { milestones, projects, team } from './content';

export type Person = typeof team[number];
export type Milestone = typeof milestones[number];
export type DirectoryView = 'impact' | 'people';

export const personId = (person: Person) => person.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
export const milestoneProject = (milestone: Milestone) => projects.find(project => project.id === (milestone.type === 'Engineering' ? 'crosslink' : milestone.type === 'Research' ? 'epoch' : 'ironwood'))!;

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
] as const;

export const teamContext: Record<string, { title: string; text: string; projects: string[] }> = {
  Leadership: { title: 'Research & strategy', text: 'Shielded Labs’ leadership supports its research, engineering and governance initiatives.', projects: ['crosslink', 'epoch', 'nsm'] },
  Engineering: { title: 'Engineering', text: 'Consensus research, protocol development and the infrastructure that supports Zcash.', projects: ['crosslink', 'zero', 'fees'] },
  Cryptography: { title: 'Epoch research', text: 'Ulrich Haböck, Luke Edwards and Suyash Bagad form the Epoch cryptography team, researching future designs and formal verification.', projects: ['epoch'] },
  Operations: { title: 'Operations', text: 'Supporting the organization and coordinating its work across the Zcash ecosystem.', projects: ['crosslink', 'epoch', 'ironwood'] },
};

export const securityAttribution = [
  { name: 'Shielded Labs', action: 'Commissioned ongoing protocol security research in April 2026.' },
  { name: 'Taylor Hornby', action: 'Discovered the Orchard flaw on May 29 and disclosed it to ZODL.' },
  { name: 'ZODL & ecosystem teams', action: 'Coordinated the emergency response. Ironwood followed through collaboration across organizations.' },
];
