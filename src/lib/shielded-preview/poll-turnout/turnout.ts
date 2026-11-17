import { toSeries, type SeriesPoint } from './series';
import { SHARES_PER_VOTE, type ChainRoundStatus } from './vote-chain';

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
export type TurnoutSource = VoteChainSource | HeliosSource | RecordedSource;

export interface PollTurnoutConfig {
  round: string;
  opensAt: string;
  closesAt: string;
  previousLabel: string;
  /** The coinholder ballot's questions, by the chain's question id. */
  questions: { id: number; label: string }[];
  sources: TurnoutSource[];
}

const sharesToVotes = (shares: number) => Math.round(shares / SHARES_PER_VOTE);

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
        { src: '/wallet-logos/vizor.png', name: 'Vizor', shape: 'square' },
        { src: '/wallet-logos/zodl.png', name: 'ZODL', shape: 'square' },
        { src: '/wallet-logos/zkool.png', name: 'Zkool', shape: 'square' },
      ],
      round: '290ce255ee4c4d63457a55b3e72e07c579e44b6e578438a01c3eaad5c158991e',
      // NU7 scope poll: 20,642 to 21,190 shares a question, 16 shares a vote.
      previous: {
        value: sharesToVotes(20_642),
        high: sharesToVotes(21_190),
        note: '2.4M ZEC',
        source: 'https://zvote.zfnd.org/shielded-vote/v1/vote-summary/16eef7ebc77e0e04fb1c7329abfcc390f4a0c002964671ebb360914a3e5a3f11',
      },
    },
    {
      kind: 'recorded',
      id: 'zcap',
      name: 'ZCAP',
      slot: 1,
      // The Zcash Foundation runs ZCAP; its mark is the Foundation's GitHub organization image.
      logos: [{ src: '/community-logos/zcash-foundation.png', name: 'Zcash Foundation', shape: 'round' }],
      liveUrl: 'https://siv.org/election/1794682180496',
      // SIV's status page answers only a browser, so each count is read there by hand.
      readings: [
        { ballots: 24, at: '2026-11-16T23:16:00Z' },
        { ballots: 29, at: '2026-11-17T01:04:00Z' },
      ],
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
  /** Votes per question, for the vote chain. */
  questions?: { id: number; votes: number }[];
  /** Lone votes whose question could not be read. */
  unread?: number;
}
export interface TurnoutReads {
  bodies: Record<string, Read<CountRead> | undefined>;
  roster: number | null;
  chainStatus: ChainRoundStatus | null;
}

// ---------- What the route returns ----------

export type BodyState = 'live' | 'stale' | 'recorded' | 'unavailable';
export interface BodyTurnout {
  id: string;
  name: string;
  slot: Slot;
  logos: SourceLogo[];
  kind: TurnoutSource['kind'];
  unit: 'ballots' | 'votes';
  value: number | null;
  approximate: boolean;
  eligible: number | null;
  /** Said after who may vote: "eligible". */
  eligibleLabel: string | null;
  series: SeriesPoint[];
  /** exact: each vote's own time; recorded: counts read by hand; approximate: shares ÷ 16, no times. */
  timing: 'exact' | 'recorded' | 'approximate';
  state: BodyState;
  observedAt: string | null;
  source: { label: string; href: string };
  previous: { value: number; high: number | null; eligible: number | null; note: string | null; href: string } | null;
}
export type PollPhase = 'upcoming' | 'open' | 'counting' | 'closed';
export interface TurnoutSnapshot {
  round: string;
  opensAt: string;
  closesAt: string;
  checkedAt: string;
  phase: PollPhase;
  previousLabel: string;
  bodies: BodyTurnout[];
  /** Coinholder votes per question: turnout only, never an answer. */
  questions: { id: number; label: string; votes: number | null; approximate: boolean }[];
  /** Lone coinholder votes whose question could not be read: counted nowhere above. */
  unreadVotes: number;
}

const STATE: Record<ReadState, BodyState> = { fetched: 'live', stale: 'stale', unavailable: 'unavailable' };

function sourceLink(source: TurnoutSource): { label: string; href: string } {
  if (source.kind === 'vote-chain') return { label: 'Vote chain', href: 'https://prod.explorer.valargroup.org/zvote-1' };
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
    unit: source.kind === 'vote-chain' ? 'votes' : 'ballots',
    value: data?.value ?? null,
    approximate: data?.approximate ?? false,
    eligible: data?.eligible ?? null,
    eligibleLabel: data?.eligible == null ? null : 'eligible',
    // A running total starts at zero when polls open; an estimate from shares has no times to draw.
    series: data && !data.approximate ? toSeries([{ at: opensAt, value: 0 }, ...data.points], opensAt) : [],
    timing: data?.approximate ? 'approximate' : 'exact',
    state: read ? STATE[read.state] : 'unavailable',
    observedAt: read?.observedAt ?? null,
    source: sourceLink(source),
    previous: previousOf(source),
  };
}

function recordedBody(source: RecordedSource, roster: number | null, opensAt: number): BodyTurnout {
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
  };
}

/** Everything the panel shows, from the record and what was read. Counts only, never a leaning. */
export function buildSnapshot(config: PollTurnoutConfig, reads: TurnoutReads, now: number): TurnoutSnapshot {
  const opensAt = Date.parse(config.opensAt);
  const bodies = config.sources.map((source) =>
    source.kind === 'recorded' ? recordedBody(source, reads.roster, opensAt) : readBody(source, reads.bodies[source.id], opensAt),
  );
  const chain = config.sources.find((s) => s.kind === 'vote-chain');
  const chainRead = chain ? (reads.bodies[chain.id]?.data ?? null) : null;
  const votes = new Map(chainRead?.questions?.map((q) => [q.id, q.votes]));
  return {
    round: config.round,
    opensAt: config.opensAt,
    closesAt: config.closesAt,
    checkedAt: new Date(now).toISOString(),
    phase: pollPhase(config, reads.chainStatus, now),
    previousLabel: config.previousLabel,
    bodies,
    questions: config.questions.map((q) => ({
      id: q.id,
      label: q.label,
      votes: chainRead ? (votes.get(q.id) ?? 0) : null,
      approximate: chainRead?.approximate ?? false,
    })),
    unreadVotes: chainRead?.unread ?? 0,
  };
}
