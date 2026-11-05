export type ProjectSection = 'overview' | 'progress' | 'resources' | 'faq' | 'development' | 'participate';

export const projectSectionLabels: Record<ProjectSection, string> = {
  overview: 'Overview', progress: 'Progress', resources: 'Research', faq: 'FAQ', development: 'Development', participate: 'Participate',
};

export function isProjectSection(value: string | null): value is ProjectSection {
  return value !== null && Object.hasOwn(projectSectionLabels, value);
}

export function projectHref(project: string | { id: string }, section: ProjectSection = 'overview', record?: string) {
  const params = new URLSearchParams({ view: 'projects', project: typeof project === 'string' ? project : project.id });
  if (section !== 'overview') params.set('section', section);
  if (record) params.set('record', record);
  return `?${params}`;
}
