import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { activityHref, readActivityLocation } from '@/lib/shielded-preview/development-navigation';
import type { PortalData } from '@/lib/shielded-preview/types';
import DevelopmentRecord, { ActivityLink } from './development-record';

const sha = 'a'.repeat(40);
const data: PortalData = {
  checkedAt: '2026-11-01T12:00:00Z', grants: [], grantsState: 'unavailable', grantsFetchedAt: null,
  repos: [{ name: 'example-fork', branch: 'main', fork: true, description: '', url: 'https://github.com/ShieldedLabs/example-fork', language: 'Rust', fetchedAt: '2026-11-01T12:00:00Z', commits: [{ sha, title: 'A fork change', author: 'Example', login: 'example', date: '2026-10-31T12:00:00Z', url: `https://github.com/ShieldedLabs/example-fork/commit/${sha}` }] }],
};

describe('Activity record context', () => {
  it.each([`commit:${sha}`, 'repo:example-fork'])('retains inferred fork context in child links from a direct %s record', record => {
    const location = { ...readActivityLocation(new URLSearchParams()), record };
    const markup = renderToStaticMarkup(createElement(DevelopmentRecord, { data, location, onOpen: () => {}, onBack: () => {}, onExplore: () => {} }));
    const href = activityHref({ ...location, includeForks: true, record: 'person:github:example' });
    expect(markup).toContain(`href="${href.replaceAll('&', '&amp;')}"`);
  });

  it('uses the link context for ordinary clicks, matching its new-tab URL', () => {
    const location = { ...readActivityLocation(new URLSearchParams()), includeForks: true, period: 84 as const, query: 'verify' };
    const onOpen = vi.fn();
    const link = ActivityLink({ location, record: 'person:github:example', onOpen, children: 'Example' });
    const preventDefault = vi.fn();
    link.props.onClick({ button: 0, preventDefault });
    expect(onOpen).toHaveBeenCalledWith('person:github:example', location);
    expect(preventDefault).toHaveBeenCalledOnce();
  });
});
