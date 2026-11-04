import 'server-only';
import { coinholderIssueSchema, coinholderRepository, allCoinholderProposals, type CoinholderIssue } from './coinholder-proposals';

export async function fetchCoinholderProposals(fetcher: typeof fetch = fetch) {
  const issues: CoinholderIssue[] = [];
  // A partial response must never replace a complete observation or imply zero proposals.
  for (let page = 1; page <= 10; page++) {
    const params = new URLSearchParams({ state: 'all', per_page: '100', sort: 'created', direction: 'desc', page: String(page) });
    const response = await fetcher(`https://api.github.com/repos/${coinholderRepository}/issues?${params}`, {
      cache: 'no-store', signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Shielded-Labs-Portal' },
    });
    if (!response.ok) throw new Error('Coinholder source unavailable');
    const batch = coinholderIssueSchema.array().parse(await response.json());
    issues.push(...batch);
    if (batch.length < 100) return allCoinholderProposals(issues);
  }
  throw new Error('Incomplete Coinholder listing');
}
