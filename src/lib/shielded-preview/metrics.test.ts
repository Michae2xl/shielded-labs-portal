import { describe, expect, it } from 'vitest';
import { activityDays, observedCommits } from './metrics';
import type { Repository } from './types';

const repo = (name: string, fork: boolean, sha: string, date = '2026-10-25T23:00:00Z'): Repository => ({ name, fork, branch: 'main', description: '', url: 'https://github.com/ShieldedLabs/'+name, language: 'Rust', fetchedAt: '2026-10-25T23:30:00Z', commits: [{ sha, title: 'A public change', author: 'Contributor', login: null, date, url: 'https://github.com/ShieldedLabs/'+name+'/commit/'+sha }] });

describe('Shielded preview evidence boundaries', () => {
  it('excludes inherited fork history and deduplicates identical commits across repositories', () => {
    const result = observedCommits([repo('core-a', false, 'same'), repo('core-b', false, 'same'), repo('upstream-fork', true, 'upstream')]);
    expect(result.map(c => c.sha)).toEqual(['same']);
  });
  it('bins observed commits in UTC, retaining zero days without manufacturing activity', () => {
    const result = activityDays([repo('core', false, 'a'), repo('older', false, 'b', '2026-10-23T23:59:59Z'), repo('fork', true, 'c')], '2026-10-25T23:30:00Z', 3);
    expect(result).toEqual([{ day: '2026-10-23', count: 1 }, { day: '2026-10-24', count: 0 }, { day: '2026-10-25', count: 1 }]);
  });
});
