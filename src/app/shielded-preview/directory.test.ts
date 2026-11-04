import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { milestones, projects, sources, team } from '@/lib/shielded-preview/content';
import { directoryHref, milestoneProject, personId, teamContext } from '@/lib/shielded-preview/directory';
import { editorialCatalog } from '@/lib/shielded-preview/editorial/library';
import Directory from './directory';

describe('Directory cards and direct records', () => {
  it('opens every team card as the correct person, retains its group, and connects existing project context', () => {
    expect(new Set(team.map(personId)).size).toBe(team.length);
    for (const person of team) {
      const target = new URL(directoryHref('people', person.group.toLowerCase(), `person:${personId(person)}`), 'https://portal.test');
      const markup = renderToStaticMarkup(createElement(Directory, {
        view: 'people', section: target.searchParams.get('section'), record: target.searchParams.get('record'),
        onNavigate: () => {}, onProject: () => {},
      }));
      expect(markup, person.name).toContain(`id="person-record-title" tabindex="-1">${person.name}</h1>`);
      expect(markup, person.name).toContain(`Back to ${person.group.toLowerCase()}`);
      expect(markup, person.name).toContain(`href="${sources.team}"`);
      for (const id of teamContext[person.group].projects) {
        expect(projects.some(project => project.id === id), person.name).toBe(true);
        expect(markup, person.name).toContain(`href="?view=projects&amp;project=${id}"`);
      }
    }
  });

  it('opens every milestone with its own source and the project supported by that source', () => {
    expect(new Set(milestones.map(milestone => milestone.date)).size).toBe(milestones.length);
    for (const milestone of milestones) {
      const project = milestoneProject(milestone);
      const target = new URL(directoryHref('impact', milestone.type.toLowerCase(), `milestone:${milestone.date}`), 'https://portal.test');
      const markup = renderToStaticMarkup(createElement(Directory, {
        view: 'impact', section: target.searchParams.get('section'), record: target.searchParams.get('record'),
        onNavigate: () => {}, onProject: () => {},
      }));
      expect(markup, milestone.name).toContain(`id="milestone-record-title" tabindex="-1">${milestone.name}</h1>`);
      expect(markup, milestone.name).toContain(`href="${milestone.source}"`);
      expect(markup, milestone.name).toContain(`href="?view=projects&amp;project=${project.id}"`);
      expect(editorialCatalog.some(entry => entry.source === milestone.source && entry.projects.includes(project.id)), milestone.name).toBe(true);
    }
  });
});
