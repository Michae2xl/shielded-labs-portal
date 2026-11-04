import { z } from 'zod';
import { participationRound } from './governance-participation';
import { recordedCoinholderRounds } from './coinholder-rounds';
import type { Source } from './governance-types';

// Read applications directly from the FPF, keeping current eligibility separate from history.
export const coinholderRepository = 'Financial-Privacy-Foundation/ZcashCoinholderGrantsProgram';
export const readyForVoteLabel = 'Ready For Vote - All Steps Completed';
export const coinholderIntake = {
  id: 'q4-2026',
  startsAt: participationRound.phases[0].startsAt,
  endsAt: '2027-01-01T00:00:00Z',
};
export const coinholderIssuesUrl = `https://github.com/${coinholderRepository}/issues`;
export const coinholderProposalsHref = '?view=governance&section=voting';
export const coinholderIssueSchema = z.object({
  number: z.number().int().positive(), title: z.string(), state: z.enum(['open', 'closed']),
  created_at: z.iso.datetime(), updated_at: z.iso.datetime(), body: z.string().nullable().optional(),
  labels: z.array(z.union([z.string(), z.object({ name: z.string() })])),
  user: z.object({ login: z.string() }).nullable().optional(), pull_request: z.unknown().optional(),
});
export type CoinholderIssue = z.infer<typeof coinholderIssueSchema>;
export type ApplicationField = { heading: string; text: string; links: { label: string; url: string }[] };
export type CoinholderProposal = {
  number: number; round: string; title: string; applicant: string; category: string | null;
  requestedUsdCents: number | null; summary: string; createdAt: string; updatedAt: string;
  url: string; fields: ApplicationField[]; rounds: string[]; status: string;
  readyForCurrentVote: boolean;
};
export const emptyCoinholderSource: Source<CoinholderProposal[] | null> = {
  data: null, state: 'unavailable', observedAt: null, url: coinholderIssuesUrl,
};

export function requestedCents(value: string | undefined): number | null {
  const match = value?.trim().match(/^(?:US\$|\$|USD\s+)?\s*(\d{1,3}(?:,\d{3})+|\d{1,3}(?:['’]\d{3})+|\d+)(?:\.(\d{1,2}))?\s*(?:USD)?$/i);
  if (!match) return null;
  const cents = Number(match[1].replace(/[,‘’']/g, '')) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

export function applicationFields(body: string): ApplicationField[] {
  const fields: ApplicationField[] = [];
  let heading = '';
  let lines: string[] = [];
  const flush = () => {
    const markdown = lines.join('\n').replace(/<!--[\s\S]*?-->/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '');
    const links = new Map<string, string>();
    const addLink = (value: string, label: string) => {
      try {
        const url = new URL(value);
        if (url.protocol === 'https:' && !url.username && !url.password && !links.has(url.href)) links.set(url.href, label);
      } catch { /* Ignore malformed source links. */ }
    };
    for (const match of markdown.matchAll(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g)) {
      addLink(match[2], match[1].replace(/[*`]/g, ''));
    }
    const unformatted = markdown.replace(/<(https:\/\/[^\s<>]+)>/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, '');
    const text = unformatted
      .replace(/^```[^\n]*$/gm, '').replace(/^#{1,6}\s+/gm, '').replace(/[*`~]/g, '').replace(/\n{3,}/g, '\n\n').trim();
    for (const match of unformatted.matchAll(/https:\/\/[^\s<>"`*]+/g)) {
      let url = match[0];
      let previous = '';
      while (url !== previous) {
        previous = url;
        url = url.replace(/[.,;:!?]+$/, '');
        for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
          while (url.endsWith(close) && url.split(close).length > url.split(open).length) url = url.slice(0, -1);
        }
      }
      addLink(url, url);
    }
    if (text && !/^_*no response\.?_*$/i.test(text) && !/^(terms and conditions|community forum posting|application owners)/i.test(heading)) {
      fields.push({ heading: heading || 'Application', text, links: [...links].map(([url, label]) => ({ label, url })) });
    }
    lines = [];
  };
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^#{2,3}\s+(.+?)\s*#*$/);
    if (match) { flush(); heading = match[1]; } else lines.push(line);
  }
  flush();
  return fields;
}

export function allCoinholderProposals(issues: CoinholderIssue[]): CoinholderProposal[] {
  const proposals = new Map<number, CoinholderProposal>();
  for (const issue of issues) {
    const labels = issue.labels.map(label => typeof label === 'string' ? label : label.name);
    const created = Date.parse(issue.created_at);
    const inCurrentIntake = created >= Date.parse(coinholderIntake.startsAt) && created < Date.parse(coinholderIntake.endsAt);
    const fields = applicationFields(issue.body ?? '');
    const field = (name: string) => fields.find(item => item.heading.toLowerCase() === name.toLowerCase())?.text;
    // Support issues and PRs are not applications. Keep genuine incomplete and closed applications.
    if (issue.pull_request || !Number.isFinite(created) || !(/retroactive grant application/i.test(issue.title) ||
      fields.some(item => /^requested grant amount/i.test(item.heading)) && fields.some(item => /^(organization or individual name|project summary|project description)$/i.test(item.heading)))) continue;
    const has = (pattern: RegExp) => labels.some(label => pattern.test(label));
    const status = has(/veto/i) ? 'Vetoed' : has(/withdrawn|cancelled/i) ? 'Withdrawn' :
      has(/rejected by coinholders/i) ? 'Rejected' : has(/approved by coinholders/i) ? 'Approved' :
      has(/submitted past deadline/i) ? 'Past deadline' : issue.state === 'closed' ? 'Closed' :
      labels.includes(readyForVoteLabel) ? 'Steps completed' : 'Submitted';
    const readyForCurrentVote = inCurrentIntake && issue.state === 'open' && labels.includes(readyForVoteLabel) &&
      !has(/approved by coinholders|rejected by coinholders|funds disbursed|withdrawn|cancelled|veto/i);
    const rounds = inCurrentIntake ? [coinholderIntake.id] : recordedCoinholderRounds(issue.number);
    const requested = field('Requested Grant Amount (USD)') ?? field('Requested Grant Amount');
    proposals.set(issue.number, {
      number: issue.number, round: rounds[0], rounds, status, readyForCurrentVote,
      title: issue.title.replace(/^\s*Retroactive Grant Application\s*[-–—:]\s*/i, '').trim() || issue.title,
      applicant: field('Organization or Individual Name') ?? issue.user?.login ?? 'Not recorded',
      category: field('Category') ?? null,
      // Older forms append explanations or a Markdown divider after the scalar amount.
      requestedUsdCents: requestedCents(requested?.split(/\n\s*\n/)[0]),
      summary: field('Project Summary') ?? field('Project Description') ?? '',
      createdAt: issue.created_at, updatedAt: issue.updated_at,
      url: `${coinholderIssuesUrl}/${issue.number}`, fields,
    });
  }
  return [...proposals.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.number - a.number);
}

export function currentCoinholderProposals(issues: CoinholderIssue[]): CoinholderProposal[] {
  return allCoinholderProposals(issues).filter(row => row.readyForCurrentVote);
}

export function coinholderTotals(proposals: CoinholderProposal[]) {
  return { requestedUsdCents: proposals.reduce((sum, row) => sum + (row.requestedUsdCents ?? 0), 0),
    missingAmounts: proposals.filter(row => row.requestedUsdCents === null).length };
}
