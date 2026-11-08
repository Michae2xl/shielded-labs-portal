import { ROUND_PROPOSALS } from '@/lib/zcg/coinholder-round';
import type { GovernanceData } from './governance-types';

/** The GitHub repositories whose application issues the portal may read. */
export const bodyRepositories = { zcg: 'ZcashCommunityGrants/zcashcommunitygrants', fpf: 'Financial-Privacy-Foundation/ZcashCoinholderGrantsProgram' } as const;
export type BodyRepository = keyof typeof bodyRepositories;
export type BodyRef = { kind: 'issue'; repo: BodyRepository; number: number } | { kind: 'topic'; number: number };

const repositories = Object.keys(bodyRepositories) as BodyRepository[];
export const refKey = (ref: BodyRef) => ref.kind === 'issue' ? `${ref.repo}:${ref.number}` : `topic:${ref.number}`;
export const refSource = (ref: BodyRef) => ref.kind === 'issue' ? `https://github.com/${bodyRepositories[ref.repo]}/issues/${ref.number}` : `https://forum.zcashcommunity.com/t/${ref.number}`;
export const bodyQuery = (ref: BodyRef) => ref.kind === 'issue' ? `repo=${ref.repo}&issue=${ref.number}` : `topic=${ref.number}`;

/** A ZCG or FPF application issue, or a forum topic, from a public link; any other link gives no reference. */
export function refFromUrl(value: string | null | undefined): BodyRef | null {
  let url: URL;
  try { url = new URL(value ?? ''); } catch { return null; }
  if (url.protocol !== 'https:') return null;
  if (url.hostname === 'github.com') {
    const match = url.pathname.match(/^\/([^/]+\/[^/]+)\/issues\/(\d{1,6})\/?$/);
    const repo = match ? repositories.find(key => bodyRepositories[key].toLowerCase() === match[1].toLowerCase()) : undefined;
    return match && repo ? { kind: 'issue', repo, number: Number(match[2]) } : null;
  }
  if (url.hostname === 'forum.zcashcommunity.com') {
    const match = url.pathname.match(/^\/t\/(?:[^/]+\/)?(\d{1,7})(?:\/\d+)?\/?$/);
    return match ? { kind: 'topic', number: Number(match[1]) } : null;
  }
  return null;
}

/** The body route's query: a known repository and an issue number, or a topic number. */
export function refFromQuery(params: URLSearchParams): BodyRef | null {
  const repo = params.get('repo');
  const issue = params.get('issue');
  const topic = params.get('topic');
  if (repo !== null || issue !== null) return repositories.includes(repo as BodyRepository) && /^\d{1,6}$/.test(issue ?? '') ? { kind: 'issue', repo: repo as BodyRepository, number: Number(issue) } : null;
  return topic !== null && /^\d{1,7}$/.test(topic) ? { kind: 'topic', number: Number(topic) } : null;
}

/** Only applications the portal already lists can be read, so the route cannot be used to fetch arbitrary issues. */
export function allowedRefs(data: GovernanceData): Set<string> {
  const keys = new Set<string>();
  const add = (url: string | null | undefined) => { const ref = refFromUrl(url); if (ref) keys.add(refKey(ref)); };
  for (const row of data.review.data) add(row.url);
  for (const row of data.proposals.data) { add(row.applicationUrl); add(row.forumUrl); }
  for (const row of data.coinholder.data ?? []) add(row.url);
  for (const row of ROUND_PROPOSALS) add(row.githubUrl);
  return keys;
}
