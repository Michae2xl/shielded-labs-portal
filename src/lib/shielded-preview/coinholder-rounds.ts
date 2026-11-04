import { ROUND_PROPOSALS } from '../zcg/coinholder-round';

// Round membership comes from published application lists, not the creation quarter.
// Q2 applications were carried into Q3. Program/admin poll questions are not applications.
export const coinholderRounds = [
  { id: 'q4-2026', label: 'Q4 2026', source: 'https://github.com/Financial-Privacy-Foundation/ZcashCoinholderGrantsProgram' },
  { id: 'q3-2026', label: 'Q3 2026', source: 'https://forum.zcashcommunity.com/t/30-day-review-period-coinholder-directed-retroactive-grants-program-q3/57056' },
  { id: 'q2-2026', label: 'Q2 2026 · carried to Q3', source: 'https://forum.zcashcommunity.com/t/coinholder-directed-retroactive-grants-program-q2-2026-30-day-review-period-now-open-postponed-to-q3/55701/3' },
  { id: 'q1-2026', label: 'Q1 2026', source: 'https://forum.zcashcommunity.com/t/polling-closed-coinholder-directed-grants-program-q1-round/55048' },
  { id: 'q4-2025', label: 'Q4 2025', source: 'https://forum.zcashcommunity.com/t/coinholder-directed-retroactive-grants-program-results-nov-2025/53487' },
  { id: 'unassigned', label: 'Round not recorded', source: null },
] as const;

const q3Issues = new Set(ROUND_PROPOSALS.map(row => Number(row.githubUrl.split('/').pop())));
const carriedIssues = new Set([24, 25, 28, 29, 30, 31, 32, 33, 34]);
const q1Issues = new Set([18, 19, 20, 21, 22, 23]);
const firstRoundIssues = new Set([1, 2, 3, 4, 5, 6, 7, 9]);

export function recordedCoinholderRounds(number: number): string[] {
  if (carriedIssues.has(number)) return ['q3-2026', 'q2-2026'];
  if (q3Issues.has(number)) return ['q3-2026'];
  if (q1Issues.has(number)) return ['q1-2026'];
  if (firstRoundIssues.has(number)) return ['q4-2025'];
  return ['unassigned'];
}

export function coinholderRoundLabel(rounds: string[]): string {
  if (rounds.includes('q2-2026') && rounds.includes('q3-2026')) return 'Q2 → Q3 2026';
  return coinholderRounds.find(round => round.id === rounds[0])?.label ?? 'Round not recorded';
}
