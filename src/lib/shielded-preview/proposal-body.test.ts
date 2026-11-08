import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import snapshot from './governance-data/snapshot.json';
import { zcgGroups } from './application-groups';
import { applicationFields, emptyCoinholderSource } from './coinholder-proposals';
import type { GovernanceData } from './governance-types';
import { getProposalBody, resetProposalBodies } from './proposal-body';
import { allowedRefs, bodyQuery, refFromQuery, refFromUrl, refKey } from './proposal-refs';

const data = { ...snapshot, coinholder: emptyCoinholderSource } as unknown as GovernanceData;
const ok = (body: string) => vi.fn(async () => new Response(JSON.stringify({ body }), { status: 200 }));

describe('Proposal bodies', () => {
  afterEach(() => resetProposalBodies());

  it('accepts only ZCG and FPF issues and forum topics', () => {
    expect(refFromUrl('https://github.com/ZcashCommunityGrants/zcashcommunitygrants/issues/544')).toEqual({ kind: 'issue', repo: 'zcg', number: 544 });
    expect(refFromUrl('https://github.com/Financial-Privacy-Foundation/ZcashCoinholderGrantsProgram/issues/94')).toEqual({ kind: 'issue', repo: 'fpf', number: 94 });
    expect(refFromUrl('https://forum.zcashcommunity.com/t/grant-application-x/58446')).toEqual({ kind: 'topic', number: 58446 });
    expect(refFromUrl('https://forum.zcashcommunity.com/t/grant-application-x/58446/3')).toEqual({ kind: 'topic', number: 58446 });
    for (const url of ['https://github.com/other/repo/issues/1', 'https://github.com/ZcashCommunityGrants/zcashcommunitygrants/pull/5', 'https://zcashgrants.org/gallery/1', 'https://forum.zcashcommunity.com.evil.test/t/x/1', null, 'not a url']) expect(refFromUrl(url)).toBeNull();
    expect(refFromQuery(new URLSearchParams('repo=zcg&issue=544'))).toEqual({ kind: 'issue', repo: 'zcg', number: 544 });
    expect(refFromQuery(new URLSearchParams('repo=other&issue=1'))).toBeNull();
    expect(refFromQuery(new URLSearchParams('repo=zcg&issue=12a'))).toBeNull();
    expect(refFromQuery(new URLSearchParams(bodyQuery({ kind: 'topic', number: 58446 })))).toEqual({ kind: 'topic', number: 58446 });
  });

  it('allows only applications the portal already lists', () => {
    const allowed = allowedRefs(data);
    expect(allowed.has('zcg:511')).toBe(true);
    expect(allowed.has('topic:58446')).toBe(true);
    expect(allowed.has(refKey(refFromUrl(data.review.data[0].url)!))).toBe(true);
    expect(allowed.has(refKey({ kind: 'issue', repo: 'zcg', number: 999999 }))).toBe(false);
  });

  it('reads an issue once, then serves the cache and keeps the last copy when the source fails', async () => {
    const ref = { kind: 'issue', repo: 'zcg', number: 544 } as const;
    const fetcher = ok('### Project Summary\nA tool.');
    expect(await getProposalBody(ref, fetcher, 0)).toMatchObject({ state: 'fetched', markdown: '### Project Summary\nA tool.', source: 'https://github.com/ZcashCommunityGrants/zcashcommunitygrants/issues/544' });
    await getProposalBody(ref, fetcher, 1000);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const failing = vi.fn(async () => new Response('rate limited', { status: 403 }));
    expect((await getProposalBody(ref, failing, 7 * 3600_000)).state).toBe('fetched');
    expect(failing).toHaveBeenCalledTimes(1);
    expect(await getProposalBody({ kind: 'topic', number: 1 }, failing, 7 * 3600_000)).toMatchObject({ state: 'unavailable', markdown: null });
  });

  it('reads a forum mirror as Markdown, refuses an HTML page and caps upstream reads', async () => {
    const page = vi.fn(async () => new Response('<!DOCTYPE html><html></html>', { status: 200 }));
    expect((await getProposalBody({ kind: 'topic', number: 2 }, page, 0)).state).toBe('unavailable');
    const raw = vi.fn(async () => new Response('## Project Summary\nMirror.', { status: 200 }));
    expect(await getProposalBody({ kind: 'topic', number: 3 }, raw, 0)).toMatchObject({ state: 'fetched', markdown: '## Project Summary\nMirror.', source: 'https://forum.zcashcommunity.com/t/3' });
    resetProposalBodies();
    const many = ok('x');
    for (let topic = 10; topic < 60; topic++) await getProposalBody({ kind: 'topic', number: topic }, many, 0);
    expect(many.mock.calls.length).toBeLessThanOrEqual(40);
  });

  it('groups a ZCG application form into the record sections', () => {
    const fields = applicationFields('### Terms and Conditions\n- [X] I agree\n### Organization Name\nAcme\n### Requested Grant Amount (USD)\n100\n### Project Summary\nA tool.\n### Proposed Problem\nX\n### Project Lead\nAda\n### Compensation Costs (USD)\n100\n### Milestone Details\nMilestone: 1\n### Success Metrics\nUsers\n### Supporting Documents\nhttps://a.example');
    const groups = zcgGroups(fields);
    expect(groups.summary?.heading).toBe('Project Summary');
    expect(groups.sections.map(group => [group.id, group.fields.map(field => field.heading)])).toEqual([
      ['application', ['Proposed Problem', 'Supporting Documents']], ['team', ['Project Lead']], ['funding', ['Compensation Costs (USD)']],
      ['milestones', ['Milestone Details']], ['risks', ['Success Metrics']],
    ]);
  });
});
