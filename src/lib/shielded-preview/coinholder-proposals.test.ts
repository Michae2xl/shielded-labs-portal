import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProposalsCollection, VotingCollection } from '@/app/shielded-preview/governance-collections';
import CoinholderProposalRecord from '@/app/shielded-preview/coinholder-proposal-record';
import { allCoinholderProposals, applicationFields, coinholderTotals, currentCoinholderProposals, emptyCoinholderSource, readyForVoteLabel, requestedCents, type CoinholderIssue } from './coinholder-proposals';
import { coinholderRoundLabel } from './coinholder-rounds';
import { fetchCoinholderProposals } from './coinholder-provider';

vi.mock('server-only', () => ({}));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.resetModules(); });
const issue: CoinholderIssue = { number: 70, title: 'Retroactive Grant Application - Example project', state: 'open', created_at: '2026-10-30T16:43:16Z', updated_at: '2026-10-30T21:28:18Z', labels: [{ name: readyForVoteLabel }], user: { login: 'applicant' },
  body: '### Organization or Individual Name\n\nExample team\n\n### Requested Grant Amount (USD)\n\n$50,000\n\n### Category\n\nIntegration\n\n### Project Summary\n\nCompleted work.\n\n### Total Budget (USD)\n\n$150,000' };

describe('Current Coinholder intake', () => {
  it('keeps only open, ready applications from the current round and deduplicates issues', () => {
    const rejected: CoinholderIssue[] = [
      { ...issue, number: 1, created_at: '2026-10-29T23:59:59Z' },
      { ...issue, number: 2, created_at: '2027-01-01T00:00:00Z' },
      { ...issue, number: 3, state: 'closed' }, { ...issue, number: 4, labels: ['Ready for vote'] },
      { ...issue, number: 5, labels: [readyForVoteLabel, 'Withdrawn'] },
      { ...issue, number: 6, labels: [readyForVoteLabel, 'Approved by Coinholders'] },
      { ...issue, number: 7, pull_request: { url: 'https://example.com' } },
    ];
    const latest = { ...issue, number: 71, created_at: '2026-10-31T18:01:09Z' };
    expect(currentCoinholderProposals([...rejected, issue, issue, latest]).map(row => row.number)).toEqual([71, 70]);
  });
  it('uses only the explicit requested amount, without substituting the project budget', () => {
    expect(requestedCents('US$ 1,250.50')).toBe(125050);
    expect(requestedCents('$150,000 USD')).toBe(15000000);
    for (const value of ['About $50,000', '$0 in costs', '50 ZEC', '$1.234', '$1,25', '-5']) expect(requestedCents(value)).toBeNull();
    const [row] = currentCoinholderProposals([{ ...issue, body: issue.body!.replace('$50,000', 'Not specified') }]);
    expect(row.requestedUsdCents).toBeNull();
    expect(coinholderTotals([row, ...currentCoinholderProposals([issue])])).toEqual({ requestedUsdCents: 5000000, missingAmounts: 1 });
  });
  it('retains application sections and safe evidence links without importing markup or consent checkboxes', () => {
    const fields = applicationFields('## Terms and Conditions\n- [x] I agree\n### Proof of completion\n[Release](https://example.com/release)\n<script>bad</script>\n[Unsafe](javascript:alert)\n### Category\n_No response_');
    expect(fields).toHaveLength(1);
    expect(fields[0].heading).toBe('Proof of completion');
    expect(fields[0].links).toEqual([{ label: 'Release', url: 'https://example.com/release' }]);
    expect(fields[0].text).not.toContain('<script>');
    expect(fields[0].text).not.toContain('I agree');
  });
  it('preserves plain evidence URLs, autolinks and an explicit no-conflict disclosure', () => {
    const previous = 'https://github.com/Financial-Privacy-Foundation/ZcashCoinholderGrantsProgram/issues/19';
    const fields = applicationFields(`### Previous Funding Details\nEarlier grant (${previous}).\n### Proof of completion\n<https://example.com/release>\n### Conflict of Interest Disclosure\nNone.`);
    expect(fields[0].links).toEqual([{ label: previous, url: previous }]);
    expect(fields[1].links).toEqual([{ label: 'https://example.com/release', url: 'https://example.com/release' }]);
    expect(fields[1].text).toBe('https://example.com/release');
    expect(fields[2]).toMatchObject({ heading: 'Conflict of Interest Disclosure', text: 'None.' });
    const [proof] = applicationFields('### Proof\nhttps://example.com/~team?x=1&y=2\nhttps://user:password@example.com/private');
    expect(proof.links).toEqual([{ label: 'https://example.com/~team?x=1&y=2', url: 'https://example.com/~team?x=1&y=2' }]);
  });
  it('reads headings written in bold or code as plain headings', () => {
    expect(applicationFields('### **Project Summary**\nA tool.\n## `Budget`\n100').map(field => field.heading)).toEqual(['Project Summary', 'Budget']);
  });
  it('keeps each field as Markdown, without comments, for the record to render', () => {
    const [budget] = applicationFields('### Budget Breakdown\n<!-- template hint -->\n- Compensation:\n  - $(USD): 1500\n  - Justification: [log](https://example.com/log)\n- Total $(USD): 1500');
    expect(budget.markdown).toBe('- Compensation:\n  - $(USD): 1500\n  - Justification: [log](https://example.com/log)\n- Total $(USD): 1500');
    expect(budget.text).toContain('Justification: log');
  });
  it('trims prose punctuation around bare URLs without duplicating Markdown or autolink evidence', () => {
    const previous = 'https://github.com/Financial-Privacy-Foundation/ZcashCoinholderGrantsProgram/issues/19';
    const balanced = 'https://example.com/release_(final)';
    const [field] = applicationFields(`### Previous Funding Details\nIssue #19 (${previous}): $45,000.\n[Q1 grant](${previous})\n<${previous}>\nRelease (${balanced}): shipped.`);
    expect(field.links).toEqual([{ label: 'Q1 grant', url: previous }, { label: balanced, url: balanced }]);
  });
});

describe('FPF source completeness and refresh', () => {
  it('reads every page before publishing a complete listing', async () => {
    const batch = Array.from({ length: 100 }, (_, index) => ({ ...issue, number: index + 100 }));
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json(batch)).mockResolvedValueOnce(Response.json([issue]));
    expect(await fetchCoinholderProposals(fetcher)).toHaveLength(101);
    const url = new URL(fetcher.mock.calls[1][0]);
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('state')).toBe('all');
    expect(url.searchParams.has('labels')).toBe(false);
  });
  it('rejects a partial listing and invalid source payloads', async () => {
    const batch = Array.from({ length: 100 }, (_, index) => ({ ...issue, number: index + 100 }));
    await expect(fetchCoinholderProposals(vi.fn().mockResolvedValueOnce(Response.json(batch)).mockRejectedValueOnce(new Error('offline')))).rejects.toThrow('offline');
    await expect(fetchCoinholderProposals(vi.fn().mockResolvedValue(Response.json({ message: 'Rate limit' })))).rejects.toThrow();
  });
  it('preserves the last complete observation on failure instead of inventing an empty round', async () => {
    let clock = Date.now();
    vi.spyOn(Date, 'now').mockImplementation(() => clock);
    const fetcher = vi.fn(async (url: string) => {
      if (url.startsWith('https://api.github.com/repos/Financial-Privacy-Foundation/')) return Response.json([issue]);
      throw new Error('offline');
    });
    vi.stubGlobal('fetch', fetcher);
    const { getGovernanceData } = await import('./governance-provider');
    const first = await getGovernanceData();
    expect(first.coinholder.data).toHaveLength(1);
    expect(first.coinholder.state).toBe('fetched');
    clock += 300001;
    fetcher.mockRejectedValue(new Error('offline'));
    const failed = await getGovernanceData();
    expect(failed.coinholder.data).toEqual(first.coinholder.data);
    expect(failed.coinholder.observedAt).toBe(first.coinholder.observedAt);
    expect(failed.coinholder.state).toBe('snapshot');
    expect(failed.coinholder.error).toBe(true);
  });
});

describe('Current proposal collection', () => {
  const render = (data: ReturnType<typeof currentCoinholderProposals> | null, search = '', filter = 'all') => renderToStaticMarkup(createElement(VotingCollection, {
    source: { ...emptyCoinholderSource, data }, lane: 'current', onLane: vi.fn(), busy: false,
    search, onSearch: vi.fn(), filter, onFilter: vi.fn(), page: 1, onPage: vi.fn(), onNavigate: vi.fn(),
  }));
  it('links to the internal round-specific record and keeps list filters in the URL', () => {
    const markup = render(currentCoinholderProposals([issue]), 'Example', 'Integration');
    expect(markup).toContain('record=proposal%3Aq4-2026%3A70');
    expect(markup).toContain('lane=current');
    expect(markup).toContain('q=Example');
    expect(markup).toContain('filter=Integration');
    expect(markup).toContain('$50,000');
    expect(markup).not.toContain('$150,000');
    expect(markup).not.toContain('Q3 2026');
    expect(render(currentCoinholderProposals([issue]), 'absent')).toContain('No matching records');
  });
  it('distinguishes zero eligible proposals from a source that could not be read', () => {
    expect(render([])).toContain('No eligible applications yet');
    expect(render(null)).toContain('Current proposals unavailable');
    expect(render(null)).not.toContain('$0');
  });
  it('keeps historical, closed and incomplete applications out of the current eligible total', () => {
    const all = allCoinholderProposals([issue, { ...issue, number: 74, title: 'New pending application', labels: [] },
      { ...issue, number: 68, state: 'closed' }, { ...issue, number: 19, created_at: '2026-02-10T00:00:00Z', state: 'closed', labels: ['Approved by Coinholders'] }]);
    const markup = render(all);
    expect(all).toHaveLength(4);
    expect(markup).toContain('<dt>Proposals</dt><dd>1</dd>');
    expect(markup).toContain('$50,000');
    expect(markup).not.toContain('record=proposal%3Aq4-2026%3A74');
    expect(markup).not.toContain('record=proposal%3Aq1-2026%3A19');
  });
});

describe('Complete Coinholder application history', () => {
  const historical = { ...issue, number: 2, created_at: '2025-09-13T00:00:00Z', state: 'closed' as const,
    labels: ['Approved by Coinholders', 'Vetoed'] };
  const carried = { ...issue, number: 24, created_at: '2026-04-13T00:00:00Z', state: 'closed' as const, labels: ['Rejected by Coinholders'] };
  const render = (data: ReturnType<typeof allCoinholderProposals> | null, round = 'all', search = '', filter = 'all') => renderToStaticMarkup(createElement(ProposalsCollection, {
    datasets: { review: [], history: [] }, coinholderSource: { ...emptyCoinholderSource, data },
    source: emptyCoinholderSource, lane: 'q3', onLane: vi.fn(), round, onRound: vi.fn(), busy: false,
    search, onSearch: vi.fn(), filter, onFilter: vi.fn(), page: 1, onPage: vi.fn(), onNavigate: vi.fn(),
  }));
  it('includes submitted, historical and closed application issues, excluding support issues and PRs', () => {
    const rows = allCoinholderProposals([issue, historical, carried, carried,
      { ...issue, number: 74, labels: [] }, { ...issue, number: 65, body: null, labels: [], state: 'closed', created_at: '2026-08-15T00:00:00Z' },
      { ...issue, number: 73, title: 'Need access to the forum', body: 'Please help.' },
      { ...issue, number: 75, pull_request: {} },
    ]);
    expect(rows.map(row => row.number).sort((a,b) => a-b)).toEqual([2, 24, 65, 70, 74]);
    expect(rows.find(row => row.number === 2)).toMatchObject({ status: 'Vetoed', rounds: ['q4-2025'] });
    expect(rows.find(row => row.number === 74)).toMatchObject({ status: 'Submitted', readyForCurrentVote: false });
    expect(rows.find(row => row.number === 65)).toMatchObject({ status: 'Closed', rounds: ['unassigned'], requestedUsdCents: null });
  });
  it('tracks Q2 carry-forwards under both filters while counting the application once', () => {
    const rows = allCoinholderProposals([carried, carried, issue]);
    expect(rows).toHaveLength(2);
    expect(rows.find(row => row.number === 24)?.rounds).toEqual(['q3-2026', 'q2-2026']);
    expect(coinholderRoundLabel(rows.find(row => row.number === 24)!.rounds)).toBe('Q2 → Q3 2026');
    for (const round of ['q2-2026', 'q3-2026']) {
      const markup = render(rows, round);
      expect(markup).toContain('record=coinholder%3A24');
      expect(markup).toContain(`round=${round}`);
      expect(markup).not.toContain('record=coinholder%3A70');
    }
  });
  it('opens all rounds from a legacy Q3 listing and carries filters into stable internal records', () => {
    const rows = allCoinholderProposals([historical, carried, issue]);
    const all = render(rows);
    for (const number of [2,24,70]) expect(all).toContain(`record=coinholder%3A${number}`);
    expect(all).toContain('Coinholder</span>');
    expect(all).not.toContain('Coinholder · Q3 2026');
    const filtered = render(rows, 'q4-2025', 'Example', 'Vetoed');
    expect(filtered).toContain('lane=coinholder');
    expect(filtered).toContain('round=q4-2025');
    expect(filtered).toContain('filter=Vetoed');
    expect(filtered).toContain('q=Example');
    expect(filtered).not.toContain('record=coinholder%3A24');
    expect(render(null)).toContain('Application history unavailable');
    expect(render(null)).not.toContain('0 records');
  });
  it('shows the historical round and source status on the full application record', () => {
    const [proposal] = allCoinholderProposals([historical]);
    const html = renderToStaticMarkup(createElement(CoinholderProposalRecord, { proposal, source: { ...emptyCoinholderSource, data: [proposal] }, onBack: vi.fn(), backLabel: 'All Coinholder proposals' }));
    expect(html).toContain('Coinholder grants · Q4 2025');
    expect(html).toContain('<strong>Vetoed</strong>');
    expect(html).toContain('13 Sept 2025');
    expect(html).toContain('All Coinholder proposals');
    expect(html).not.toContain('Q4 2026');
  });
  it('reads explicit amounts from older form variants without using their total project budgets', () => {
    for (const [heading, value, cents] of [
      ['Requested Grant Amount', '$28,000\n\nExplanation of completed work.', 2800000],
      ['Requested Grant Amount (USD)', '$461,000.00\n\n---', 46100000],
      ['Requested Grant Amount (USD)', "$22'600", 2260000],
    ] as const) {
      const [row] = allCoinholderProposals([{ ...historical, body: `## ${heading}\n${value}\n## Total Budget\n$900,000` }]);
      expect(row.requestedUsdCents).toBe(cents);
    }
  });
});
