import { milestones, projects, team } from './content';
import { directoryHref, personId } from './directory';
import { editorialHref, searchEditorial } from './editorial/library';
import { projectHref } from './project-navigation';

export type PortalSearchResult = { title: string; kind: string; href: string };
type SearchNavigation = { id: string; title: string; keywords?: string };

/** Search the curated page index, not live ledgers or the GitHub commit sample. */
export function searchPortal(query: string, navigation: readonly SearchNavigation[]): PortalSearchResult[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const matches = (text: string) => tokens.every(token => text.toLowerCase().includes(token));
  return [
    ...searchEditorial(query).map(entry => ({ title: entry.title, kind: entry.view === 'blog' ? 'Article' : entry.category, href: editorialHref(entry) })),
    ...projects.filter(project => matches(`${project.name} ${project.description} ${project.category}`)).map(project => ({ title: project.name, kind: 'Project', href: projectHref(project) })),
    ...navigation.filter(item => matches(`${item.title} ${item.keywords ?? ''}`)).map(item => ({ title: item.title, kind: 'Portal', href: `?view=${item.id}` })),
    ...['Proposals', 'Voting', 'Grants', 'ZCAP', 'Insights', 'Results'].filter(matches).map(title => ({ title, kind: 'Governance', href: `?view=governance&section=${title.toLowerCase()}` })),
    ...milestones.filter(milestone => matches(`${milestone.name} ${milestone.type}`)).map(milestone => ({ title: milestone.name, kind: 'Milestone', href: directoryHref('impact', milestone.type.toLowerCase(), `milestone:${milestone.date}`) })),
    ...team.filter(person => matches(`${person.name} ${person.role}`)).map(person => ({ title: person.name, kind: person.role, href: directoryHref('people', person.group.toLowerCase(), `person:${personId(person)}`) })),
  ];
}
