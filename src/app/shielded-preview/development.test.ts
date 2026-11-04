import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ActivityLocation } from '@/lib/shielded-preview/development-navigation';
import type { PortalData } from '@/lib/shielded-preview/types';
import Development from './development';

const input = vi.hoisted(() => ({ location: {} as Partial<ActivityLocation> }));
vi.mock('react', async importOriginal => {
  const react = await importOriginal<typeof import('react')>();
  return { ...react, useState: (initial: unknown) => {
    const value = typeof initial === 'function' ? initial() : initial;
    return react.useState(value && typeof value === 'object' && 'includeForks' in value ? { ...value, ...input.location } : value);
  } };
});

const data: PortalData = {
  checkedAt: '2026-11-01T12:00:00Z', grants: [], grantsState: 'unavailable', grantsFetchedAt: null,
  repos: [{ name: 'zero', branch: 'main', fork: false, description: '', url: 'https://github.com/ShieldedLabs/zero', language: 'Rust', state: 'live', fetchedAt: '2026-11-01T12:00:00Z', commits: [{ sha: 'a'.repeat(40), title: 'Verify a new block', author: 'Example', login: 'example', date: '2026-10-31T12:00:00Z', url: `https://github.com/ShieldedLabs/zero/commit/${'a'.repeat(40)}` }] }],
};
const render = (failed = false) => renderToStaticMarkup(createElement(Development, { data, busy: false, failed, onRefresh: () => {} }));
afterEach(() => { input.location = {}; });

describe('Activity selection and retained observations', () => {
  it('keeps an expired or invalid selected cell empty instead of expanding to every commit', () => {
    for (const selected of ['days|zero|2025-01-01', 'not-a-cell']) {
      input.location = { selected };
      const markup = render();
      expect(markup).toContain('The selected cell is not available in this period');
      expect(markup).not.toContain('Verify a new block');
      expect(markup).toContain('Reset filters');
    }
  });

  it('retains a valid cell selection and shows only its commits', () => {
    input.location = { selected: 'days|zero|2026-10-31' };
    expect(render()).toContain('Verify a new block');
  });

  it('makes unknown saved repository and contributor filters visible and recoverable', () => {
    input.location = { repo: 'missing-repo', contributor: 'github:missing-person' };
    const markup = render();
    expect(markup).toContain('missing-repo · unavailable in this sample');
    expect(markup).toContain('github:missing-person · unavailable in this sample');
    expect(markup).toContain('No repositories match this selection.');
    expect(markup).not.toContain('Verify a new block');
  });

  it('reports a failed refresh even when the retained observations were previously live', () => {
    const markup = render(true);
    expect(markup).toContain('Refresh unavailable · retained observations');
    expect(markup).not.toContain('1/1 sources refreshed');
    expect(markup).toContain('Verify a new block');
  });
});
