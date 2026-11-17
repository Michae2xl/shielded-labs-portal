import { participationSources as wallets } from '../governance-participation';
import { toSeries, type SeriesPoint } from './series';
import { type AnswerWeight, type CastCount, type ChainQuestion, type ChainRoundStatus, VOTE_CHAIN_HOSTS, voteSummaryUrl } from './vote-chain';
import zcapHistory from './zcap-history.json';
import { ZCAP_ELECTION_ID, ZCAP_STATUS_URL } from './siv-history';

/**
 * Turnout of an open poll while it runs, from public sources only: how many have voted in each body,
 * never how anyone voted. Percentages of the answers wait for the published results.
 *
 * Each body is one source in the record below. A source of a kind the portal already reads (the vote
 * chain, a Helios election, a count read by hand) is one more entry; a new kind of source needs its
 * reader in the provider and nothing else.
 */

/**
 * A source's chart colour, by the kind of body: 3 is the Zcash gold of the coinholder vote, 1 the ink every
 * panel shares. Each card is named, so the colour marks the kind of body, never which one; it never changes
 * when a source is added.
 */
export type Slot = 1 | 3;

export interface PreviousTurnout {
  /** The count in the last poll, or the low end when the record gives a range. */
  value: number;
  high?: number;
  /** Who could vote then, when published. */
  eligible?: number;
  /** Said after the count, e.g. "2.4M ZEC". */
  note?: string;
  source: string;
}
/** A mark shown on a body's card: an organization's logo (round) or a wallet's app icon (square). */
export interface SourceLogo {
  src: string;
  name: string;
  shape: 'round' | 'square';
  /** Where the mark leads: a wallet's own site, for anyone who wants to vote with it. */
  href?: string;
}
interface SourceBase {
  id: string;
  name: string;
  slot: Slot;
  logos: SourceLogo[];
  previous: PreviousTurnout | null;
}
/** Coinholders on Valar Group's shielded vote chain. */
export interface VoteChainSource extends SourceBase {
  kind: 'vote-chain';
  /** The vote-chain round, 64 hex characters. */
  round: string;
}
/** A panel on Helios: the server reads its ballots and voter list. */
export interface HeliosSource extends SourceBase {
  kind: 'helios';
  electionUuid: string;
}
/** A panel whose count the server cannot read: read by hand from its public page. */
export interface RecordedSource extends SourceBase {
  kind: 'recorded';
  /** Where anyone can watch the count while the poll runs. */
  liveUrl: string;
  /** Each count read there, oldest first, with the time it was read. Add a line to record a new one. */
  readings: { ballots: number; at: string }[];
  /** Who may vote, when the voting tool does not say. */
  electorate: 'zcap-roster' | null;
}
/** SIV publishes totals, not vote timestamps; the hourly collector persists its observations. */
export interface SivSource extends Omit<RecordedSource, 'kind'> {
  kind: 'siv';
  electionId: string;
}
export type TurnoutSource = VoteChainSource | HeliosSource | RecordedSource | SivSource;

export interface PollTurnoutConfig {
  round: string;
  opensAt: string;
  closesAt: string;
  previousLabel: string;
  /** The coinholder ballot's questions, by the chain's question id. */
  questions: { id: number; label: string }[];
  sources: TurnoutSource[];
}

/**
 * NU7.1 poll: polling opened on 16 Nov; the vote chain closes on 1 Dec at 02:59 UTC.
 * Sources: forum topic 58906 (timeline, post 133), topic 59366, the vote chain.
 */
export const NU7_1_TURNOUT: PollTurnoutConfig = {
  round: 'NU7.1 poll',
  opensAt: '2026-11-16T00:00:00Z',
  closesAt: '2026-12-01T02:59:00Z',
  previousLabel: 'NU7 scope, Sep 2026',
  questions: [
    { id: 1, label: 'Wind down ZCG' },
    { id: 2, label: 'Future Dev and Legal Defense Fund' },
    { id: 3, label: 'Zcash Adoption Pool' },
    { id: 4, label: "Maintain ZCG's funding" },
    { id: 5, label: '20-second blocks' },
  ],
  sources: [
    {
      kind: 'vote-chain',
      id: 'coinholders',
      name: 'Coinholders',
      slot: 3,
      // The wallets the organizers named for this round: "Participate using Vizor, ZODL, or Zkool" (topic 58906, post 133).
      logos: [
        { src: '/wallet-logos/vizor.png', name: 'Vizor', shape: 'square', href: wallets.vizor },
        { src: '/wallet-logos/zodl.png', name: 'ZODL', shape: 'square', href: wallets.zodl },
        { src: '/wallet-logos/zkool.png', name: 'Zkool', shape: 'square', href: wallets.zkool },
      ],
      round: '290ce255ee4c4d63457a55b3e72e07c579e44b6e578438a01c3eaad5c158991e',
      // Earlier cast counts and shares / 16 are not comparable to this raw share total.
      previous: null,
    },
    {
      kind: 'siv',
      id: 'zcap',
      name: 'ZCAP',
      slot: 1,
      // The Zcash Foundation runs ZCAP; its mark is the Foundation's GitHub organization image.
      logos: [{ src: '/community-logos/zcash-foundation.png', name: 'Zcash Foundation', shape: 'round' }],
      liveUrl: ZCAP_STATUS_URL,
      electionId: ZCAP_ELECTION_ID,
      // Dated fallback if the hourly history cannot be read, including on a cold start.
      readings: zcapHistory.observations,
      electorate: 'zcap-roster',
      previous: { value: 135, eligible: 198, source: 'https://forum.zcashcommunity.com/t/nu7-sentiment-polls-results/57590/4' },
    },
    {
      kind: 'helios',
      id: 'zcash-brasil',
      name: 'Zcash Brasil',
      slot: 1,
      logos: [{ src: '/community-logos/zcash-brazil.png', name: 'Zcash Brasil', shape: 'round' }],
      electionUuid: 'b2b63125-8cee-4f9c-bab5-dd8d5de0d030',
      previous: null,
    },
    {
      // "NU7.1 Sentiment Poll (ZecHub)", open 16 Nov 16:45 to 1 Dec 02:59 UTC.
      kind: 'helios',
      id: 'zechub',
      name: 'ZecHub',
      slot: 1,
      logos: [{ src: '/community-logos/zechub.png', name: 'ZecHub', shape: 'round' }],
      electionUuid: 'c197ce1b-f97a-4a88-a6b5-6eb9914d7b4c',
      previous: null,
    },
  ],
};

// ---------- What the provider reads ----------

export type ReadState = 'fetched' | 'stale' | 'unavailable';
export interface Read<T> {
  state: ReadState;
  observedAt: string | null;
  data: T | null;
}
/** One body's count as read: now, and its running total over time. */
export interface CountRead {
  value: number;
  points: { at: number; value: number }[];
  /** Who may vote, when the source says. */
  eligible: number | null;
  /** True when the count itself is an estimate (revealed shares ÷ 16). */
  approximate: boolean;
  /** Accepted shares per question, without conversion to votes or people. */
  questions?: ChainQuestion[];
}
export interface TurnoutReads {
  bodies: Record<string, Read<CountRead> | undefined>;
  roster: number | null;
  chainStatus: ChainRoundStatus | null;
  casts?: Read<CastCount>;
}

// ---------- What the route returns ----------

export type BodyState = 'live' | 'stale' | 'recorded' | 'unavailable';
export interface BodyTurnout {
  id: string;
  name: string;
  slot: Slot;
  logos: SourceLogo[];
  kind: TurnoutSource['kind'];
  unit: 'ballots' | 'shares';
  value: number | null;
  approximate: boolean;
  eligible: number | null;
  /** Said after who may vote: "eligible". */
  eligibleLabel: string | null;
  series: SeriesPoint[];
  /** snapshot: a current total without event history; recorded: observed panel totals. */
  timing: 'exact' | 'recorded' | 'approximate' | 'snapshot';
  state: BodyState;
  observedAt: string | null;
  source: { label: string; href: string };
  previous: { value: number; high: number | null; eligible: number | null; note: string | null; href: string } | null;
  /** An earlier round's running total, set on this round's clock (hours since each round's first vote); null when not recorded. */
  reference: { label: string; openedAt: string; points: SeriesPoint[] } | null;
}
export type PollPhase = 'upcoming' | 'open' | 'counting' | 'closed';
export interface TurnoutSnapshot {
  round: string;
  opensAt: string;
  closesAt: string;
  checkedAt: string;
  phase: PollPhase;
  previousLabel: string;
  casts?: Read<CastCount>;
  bodies: BodyTurnout[];
  /** Accepted coinholder shares per question, summed across answers. */
  questions: { id: number; label: string; shares: number | null; results?: AnswerWeight[] }[];
}

const STATE: Record<ReadState, BodyState> = { fetched: 'live', stale: 'stale', unavailable: 'unavailable' };

function sourceLink(source: TurnoutSource): { label: string; href: string } {
  if (source.kind === 'vote-chain') return { label: 'Vote chain API', href: voteSummaryUrl(VOTE_CHAIN_HOSTS[0].origin, source.round) };
  if (source.kind === 'helios') return { label: 'Helios', href: `https://vote.heliosvoting.org/helios/elections/${source.electionUuid}/voters/list` };
  return { label: 'SIV', href: source.liveUrl };
}

function previousOf(source: TurnoutSource): BodyTurnout['previous'] {
  const p = source.previous;
  return p ? { value: p.value, high: p.high ?? null, eligible: p.eligible ?? null, note: p.note ?? null, href: p.source } : null;
}

export function pollPhase(config: PollTurnoutConfig, status: ChainRoundStatus | null, now: number): PollPhase {
  if (status === 'finalized') return 'closed';
  if (status === 'tallying' || now >= Date.parse(config.closesAt)) return 'counting';
  return now < Date.parse(config.opensAt) ? 'upcoming' : 'open';
}

function readBody(source: Exclude<TurnoutSource, RecordedSource>, read: Read<CountRead> | undefined, opensAt: number): BodyTurnout {
  const data = read?.data ?? null;
  return {
    id: source.id,
    name: source.name,
    slot: source.slot,
    logos: source.logos,
    kind: source.kind,
    unit: source.kind === 'vote-chain' ? 'shares' : 'ballots',
    value: data?.value ?? null,
    approximate: data?.approximate ?? false,
    eligible: data?.eligible ?? null,
    eligibleLabel: data?.eligible == null ? null : 'eligible',
    // The share summary has no event times. Never relabel cast history or invent a share curve.
    series: source.kind !== 'vote-chain' && data && !data.approximate ? toSeries([{ at: opensAt, value: 0 }, ...data.points], opensAt) : [],
    timing: source.kind === 'vote-chain' ? 'snapshot' : source.kind === 'siv' ? 'recorded' : data?.approximate ? 'approximate' : 'exact',
    state: read ? STATE[read.state] : 'unavailable',
    observedAt: read?.observedAt ?? null,
    source: sourceLink(source),
    previous: previousOf(source),
    reference: null,
  };
}

function recordedBody(source: RecordedSource | SivSource, roster: number | null, opensAt: number): BodyTurnout {
  const readings = [...source.readings].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const last = readings.at(-1) ?? null;
  const eligible = source.electorate === 'zcap-roster' ? roster : null;
  return {
    id: source.id,
    name: source.name,
    slot: source.slot,
    logos: source.logos,
    kind: source.kind,
    unit: 'ballots',
    value: last?.ballots ?? null,
    approximate: false,
    eligible,
    eligibleLabel: eligible === null ? null : 'eligible',
    series: toSeries([{ at: opensAt, value: 0 }, ...readings.map((r) => ({ at: Date.parse(r.at), value: r.ballots }))], opensAt),
    timing: 'recorded',
    state: last ? 'recorded' : 'unavailable',
    observedAt: last?.at ?? null,
    source: sourceLink(source),
    previous: previousOf(source),
    reference: null,
  };
}

/** Everything the panel shows, from the record and what was read. Answer weights are available only for a published tally. */
export function buildSnapshot(config: PollTurnoutConfig, reads: TurnoutReads, now: number): TurnoutSnapshot {
  const opensAt = Date.parse(config.opensAt);
  const bodies = config.sources.map((source) => {
    const read = reads.bodies[source.id];
    if (source.kind === 'recorded' || (source.kind === 'siv' && !read?.data)) return recordedBody(source, reads.roster, opensAt);
    const body = readBody(source, read, opensAt);
    if (source.kind === 'siv' && source.electorate === 'zcap-roster') {
      body.eligible = reads.roster;
      body.eligibleLabel = reads.roster === null ? null : 'eligible';
    }
    return body;
  });
  const chain = config.sources.find((s) => s.kind === 'vote-chain');
  const chainRead = chain ? (reads.bodies[chain.id]?.data ?? null) : null;
  const questions = new Map(chainRead?.questions?.map((q) => [q.id, q]));
  return {
    round: config.round,
    opensAt: config.opensAt,
    closesAt: config.closesAt,
    checkedAt: new Date(now).toISOString(),
    phase: pollPhase(config, reads.chainStatus, now),
    previousLabel: config.previousLabel,
    casts: reads.casts,
    bodies,
    questions: config.questions.map((q) => ({
      id: q.id,
      label: q.label,
      shares: questions.get(q.id)?.shares ?? null,
      ...(reads.chainStatus === 'finalized' && questions.get(q.id)?.results ? { results: questions.get(q.id)?.results } : {}),
    })),
  };
}
