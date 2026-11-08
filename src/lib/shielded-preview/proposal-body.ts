import 'server-only';
import { z } from 'zod';
import { bodyRepositories, refKey, refSource, type BodyRef } from './proposal-refs';

export type ProposalBody = { state: 'fetched' | 'unavailable'; markdown: string | null; source: string; observedAt: string | null };

const TTL = 6 * 3_600_000;
const RETRY = 5 * 60_000;
const WINDOW = 10 * 60_000;
const BUDGET = 40;
const MAX_ENTRIES = 500;
const LIMIT = 120_000;
const issueSchema = z.object({ body: z.string().nullable().optional(), pull_request: z.unknown().optional() });
let cache = new Map<string, { body: ProposalBody; until: number }>();
let budget = { start: -Infinity, used: 0 };

export function resetProposalBodies() { cache = new Map(); budget = { start: -Infinity, used: 0 }; }
const unavailable = (ref: BodyRef): ProposalBody => ({ state: 'unavailable', markdown: null, source: refSource(ref), observedAt: null });

/** At most BUDGET upstream reads per window, so a burst of visitors cannot use up the GitHub quota. */
function spend(now: number) {
  if (now - budget.start >= WINDOW) budget = { start: now, used: 0 };
  if (budget.used >= BUDGET) return false;
  budget.used += 1;
  return true;
}

async function download(ref: BodyRef, fetcher: typeof fetch): Promise<string> {
  if (ref.kind === 'issue') {
    const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'Shielded-Labs-Portal', 'X-GitHub-Api-Version': '2022-11-28' };
    // Optional server-side read token: it raises GitHub's limit from 60 to 5,000 reads an hour.
    const token = process.env.GITHUB_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetcher(`https://api.github.com/repos/${bodyRepositories[ref.repo]}/issues/${ref.number}`, { cache: 'no-store', signal: AbortSignal.timeout(8000), headers });
    if (!response.ok) throw new Error('Issue unavailable');
    const issue = issueSchema.parse(await response.json());
    if (issue.pull_request) throw new Error('Not an application issue');
    return issue.body ?? '';
  }
  const response = await fetcher(`https://forum.zcashcommunity.com/raw/${ref.number}/1`, { cache: 'no-store', signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Shielded-Labs-Portal' } });
  if (!response.ok) throw new Error('Topic unavailable');
  const text = await response.text();
  if (/^\s*<(?:!doctype|html)/i.test(text)) throw new Error('Not Markdown');
  return text;
}

/** An application's Markdown from its source, cached for six hours; a failed read keeps the last good copy. */
export async function getProposalBody(ref: BodyRef, fetcher: typeof fetch = fetch, now = Date.now()): Promise<ProposalBody> {
  const key = refKey(ref);
  const slot = cache.get(key);
  if (slot && now < slot.until) return slot.body;
  const last = slot?.body.state === 'fetched' ? slot.body : null;
  if (!spend(now)) return last ?? unavailable(ref);
  let body: ProposalBody;
  let until: number;
  try {
    body = { state: 'fetched', markdown: (await download(ref, fetcher)).slice(0, LIMIT), source: refSource(ref), observedAt: new Date(now).toISOString() };
    until = now + TTL;
  } catch {
    body = last ?? unavailable(ref);
    until = now + RETRY;
  }
  cache.delete(key);
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  cache.set(key, { body, until });
  return body;
}
