import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { team } from './content';
import type { Person } from './directory';
import { personProfile } from './team-profiles';
import type { Repository } from './types';

const documents = JSON.parse(readFileSync(path.join(process.cwd(), 'src/lib/shielded-preview/editorial/documents.json'), 'utf8')) as { id: string; body: unknown }[];
const text = (node: unknown): string => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join('') : text((node as { children?: unknown } | null)?.children ?? '');
const person = (name: string) => team.find(member => member.name === name) as Person;
const repository = (commits: Record<string, unknown>[]) => ({ name: 'crosslink_monolith', fork: false, fetchedAt: '2026-11-05T00:00:00Z', commits } as unknown as Repository);
const commit = (sha: string, author: string, login: string | null, date = '2026-11-01T10:00:00Z') => ({ sha, author, login, date, title: 'Change', url: 'https://example.org' });

describe('Team profiles', () => {
  it('link the accounts listed on the official team page, and invent none', () => {
    const official: Record<string, string | null> = {
      'Jason McGee Stramaglia': 'aquietinvestor', 'Zooko Wilcox': 'zooko', 'Nate Wilcox': 'nate_zec', 'Mark Henderson': 'shieldedmark', 'Sam Smith': 'SamHsmith2', 'Andrew Reece': 'azmreece',
      'Phillip Trudeau-Tavara': null, 'Shoaib Ahmed': 'sufialhussaini', 'Ulrich Haböck': 'UHaboeck', 'Luke Edwards': null, 'Suyash Bagad': 'BagadSuyash', 'Robert Fegler': null,
    };
    expect(Object.keys(official).sort()).toEqual(team.map(member => member.name).sort());
    for (const member of team) {
      const x = personProfile(member).accounts.find(account => account.label === 'X');
      expect(x?.href ?? null, member.name).toBe(official[member.name] ? `https://x.com/${official[member.name]}` : null);
    }
  });
  it('quote biographies word for word from the Epoch announcement', () => {
    const announcement = text(documents.find(document => document.id === 'epoch-future-proof-cryptography-for-zcash')!.body);
    const withBio = team.filter(member => personProfile(member).bio);
    expect(withBio.map(member => member.name).sort()).toEqual(['Luke Edwards', 'Suyash Bagad', 'Ulrich Haböck']);
    for (const member of withBio) expect(announcement, member.name).toContain(personProfile(member).bio!.text);
  });
  it('list only articles and merged ZIPs the person is named on', () => {
    const jason = personProfile(person('Jason McGee Stramaglia'));
    expect(jason.articles.total).toBeGreaterThan(5);
    expect(jason.articles.latest).toHaveLength(5);
    expect(jason.articles.latest.map(article => article.date)).toEqual([...jason.articles.latest.map(article => article.date)].sort().reverse());
    expect(jason.zips.map(zip => zip.id)).toContain('zip-1015');
    expect(jason.zips.every(zip => !zip.id.startsWith('pr-'))).toBe(true);
    expect(personProfile(person('Nate Wilcox')).zips).toEqual([]);
  });
  it('list the latest commits by account and by author name, leaving out merges and other people', () => {
    const repos = [repository([
      commit('a', 'Sam H. Smith', null, '2026-11-01T10:00:00Z'),
      commit('b', 'Sam H. Smith', 'SamHSmith', '2026-11-03T10:00:00Z'),
      commit('c', 'Someone Else', 'other', '2026-11-04T10:00:00Z'),
      { ...commit('d', 'Sam H. Smith', null, '2026-11-02T10:00:00Z'), title: 'Merge pull request #1 from somewhere' },
      commit('e', 'Sam H. Smith', null, '2026-10-20T10:00:00Z'),
      commit('f', 'Sam H. Smith', null, '2026-01-01T10:00:00Z'),
    ])];
    const activity = personProfile(person('Sam Smith'), repos, '2026-11-05T00:00:00Z').activity!;
    expect(activity.latest.map(item => item.sha)).toEqual(['b', 'a', 'e']);
    expect(activity.latest[0]).toMatchObject({ repositories: 'Crosslink', href: '?view=activity&record=commit%3Ab' });
    expect(activity.href).toBe('?view=activity&q=Sam+H.+Smith');
    expect(personProfile(person('Robert Fegler'), repos, '2026-11-05T00:00:00Z').activity).toBeNull();
  });
  it('open Code activity on a period that lists the commits, and offer no link when none does', () => {
    const profile = (date: string) => personProfile(person('Sam Smith'), [repository([commit('a', 'Sam H. Smith', null, date)])], '2026-11-05T00:00:00Z').activity!;
    expect(profile('2026-09-01T10:00:00Z').href).toBe('?view=activity&period=84&q=Sam+H.+Smith');
    expect(profile('2026-01-01T10:00:00Z').href).toBeNull();
    expect(profile('2026-01-01T10:00:00Z').latest).toHaveLength(1);
  });
  it('leave a person with no published records with nothing invented', () => {
    const robert = personProfile(person('Robert Fegler'));
    expect(robert.accounts).toEqual([]);
    expect(robert.bio).toBeNull();
    expect(robert.articles.total).toBe(0);
    expect(robert.zips).toEqual([]);
    expect(robert.activity).toBeNull();
  });
});
