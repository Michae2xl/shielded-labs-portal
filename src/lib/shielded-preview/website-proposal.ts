import { improvements, sources } from './content';

export type PreviewDestination = {
  title: string;
  description: string;
  view: 'projects' | 'governance' | 'activity' | 'impact' | 'people';
  section?: string;
  projectId?: string;
};

type WebsiteSuggestion = typeof improvements[number] & {
  id: string;
  menu: string;
  summary: string;
  preview: string;
  next: string;
  checks: string[];
  destinations: PreviewDestination[];
  references: { title: string; url: string }[];
};

export const websiteSuggestions: WebsiteSuggestion[] = [
  {
    ...improvements[0], id: 'project-pages', menu: 'Project pages',
    summary: 'Bring purpose, progress and evidence into one clear page for every project.',
    preview: 'Shared project pages', next: 'Review project content',
    checks: ['Each project explains its purpose, current stage and next step.', 'Milestones and repository activity link to their sources.', 'Research, implementation and network adoption remain distinct.'],
    destinations: [{ title: 'Explore project pages', description: 'Six projects, each with scope, progress and sources.', view: 'projects' }],
    references: [{ title: 'Project index', url: sources.projects }, { title: 'Published roadmap', url: sources.roadmap }],
  },
  {
    ...improvements[1], id: 'event-archive', menu: 'Event archive',
    summary: 'Keep upcoming participation separate from completed votes and their results.',
    preview: 'Dated voting records', next: 'Automate event lifecycle',
    checks: ['Events leave the upcoming list when their closing time passes.', 'An ended vote can show “awaiting results” until a source is verified.', 'The archive preserves dates, participation rules and the published outcome.'],
    destinations: [{ title: 'Voting records', description: 'Polls and participation information inside the portal.', view: 'governance', section: 'voting' }, { title: 'Published results', description: 'Inspect outcomes and the rules behind them.', view: 'governance', section: 'results' }],
    references: [{ title: 'Governance page reviewed', url: sources.governance }],
  },
  {
    ...improvements[2], id: 'epoch', menu: 'Epoch',
    summary: 'Make the cryptography initiative discoverable alongside the rest of the portfolio.',
    preview: 'In project navigation', next: 'Review for the main site',
    checks: ['Epoch appears in the project index and site navigation.', 'The project connects the announced team, research scope and updates.', 'Future targets are labeled as research goals, with a review date.'],
    destinations: [{ title: 'Epoch project', description: 'Research scope, team context and current stage.', view: 'projects', projectId: 'epoch' }, { title: 'Cryptography team', description: 'Published roles and team profiles.', view: 'people', section: 'cryptography' }],
    references: [{ title: 'Epoch announcement', url: sources.epoch }, { title: 'Published team', url: sources.team }, { title: 'Project index reviewed', url: sources.projects }],
  },
  {
    ...improvements[3], id: 'code-releases', menu: 'Code & releases',
    summary: 'Explain what changed in the code and what is ready for people to use.',
    preview: 'Sampled GitHub activity', next: 'Add release summaries',
    checks: ['A release summary identifies its version, date and source.', 'Commit samples show their coverage and last successful observation.', 'A failed refresh retains dated evidence without implying a new release.'],
    destinations: [{ title: 'Development activity', description: 'Contributors, repository filters and activity maps.', view: 'activity' }, { title: 'Documented milestones', description: 'Read project progress with dates and attribution.', view: 'impact' }],
    references: [{ title: 'Shielded Labs repositories', url: sources.github }, { title: 'Published roadmap', url: sources.roadmap }],
  },
  {
    ...improvements[4], id: 'participation', menu: 'Participation',
    summary: 'Help newcomers find the right proposal, vote, grant or community pathway.',
    preview: 'Embedded governance', next: 'Build guided entry points',
    checks: ['Each route explains who can participate, how and by when.', 'Proposals, voting rules and results can be read without leaving the portal.', 'Guidance separates consultative input, funding decisions and payments.'],
    destinations: [{ title: 'Governance portal', description: 'Proposals, voting, grants, panels and results.', view: 'governance' }, { title: 'Community directory', description: 'Find existing communities and their public channels.', view: 'people', section: 'communities' }],
    references: [{ title: 'Shielded Labs governance', url: sources.governance }, { title: 'OpenZcash methodology', url: 'https://openzcash.org/zcg/methodology' }],
  },
  {
    ...improvements[5], id: 'impact', menu: 'Impact',
    summary: 'Connect the organization’s contribution with evidence and ways to get involved.',
    preview: 'Milestones & people', next: 'Create a monthly brief',
    checks: ['Impact stories name contributors and link to primary evidence.', 'A monthly brief covers progress, open questions and next actions.', 'Participation routes and published opportunities are easy to find.'],
    destinations: [{ title: 'Attributed milestones', description: 'Research, engineering and the coordinated security response.', view: 'impact' }, { title: 'People & communities', description: 'Team profiles, related work and public participation routes.', view: 'people' }],
    references: [{ title: 'Orchard disclosure', url: sources.security }, { title: 'Published team', url: sources.team }, { title: 'Published opportunities', url: 'https://shieldedlabs.net/jobs/' }],
  },
];

export const websiteMenu = [
  { id: 'all', label: 'All suggestions' },
  ...websiteSuggestions.map(item => ({ id: item.id, label: item.menu })),
  { id: 'delivery', label: 'Delivery plan' },
];

export function websiteHref(section: string) {
  return `?${new URLSearchParams({ view: 'website', section })}`;
}

export function previewDestinationHref(destination: PreviewDestination) {
  const params = new URLSearchParams({ view: destination.view });
  if (destination.section) params.set('section', destination.section);
  if (destination.projectId) params.set('project', destination.projectId);
  return `?${params}`;
}

export const siteEntrances: PreviewDestination[] = [
  { title: 'Understand governance', description: 'Neutral process guides, proposals, panels, grants and participation.', view: 'governance' },
  { title: 'Follow the work', description: 'Projects, development, people and documented milestones.', view: 'projects' },
  { title: 'Get involved', description: 'Community routes, team context and published opportunities.', view: 'people' },
];

export const websiteResponsibilities = [
  { title: 'Portal & information architecture', detail: 'Keep navigation, records and project pages clear and connected.' },
  { title: 'Governance monitoring & verification', detail: 'Track discussions, dates and outcomes against primary sources.' },
  { title: 'Grants data & reporting', detail: 'Explain applications, decisions and recorded payments separately.' },
  { title: 'Community relationships & feedback', detail: 'Connect participants and bring recurring questions to the team.' },
  { title: 'Communications & education', detail: 'Turn technical updates into accurate articles, FAQs and explainers.' },
  { title: 'Website maintenance', detail: 'Maintain public resources and coordinate design or technical support.' },
];
