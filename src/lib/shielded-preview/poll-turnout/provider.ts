import 'server-only';
import { parseCsv } from '@/lib/zcg/csv';
import { HELIOS_PAGE, heliosBallotTimes, heliosUrls, heliosVoterIds } from './helios';
import { cumulative } from './series';
import { NU7_1_TURNOUT, buildSnapshot, type CountRead, type HeliosSource, type PollTurnoutConfig, type Read, type SivSource, type TurnoutSnapshot, type VoteChainSource } from './turnout';
import { createSivReader } from './siv-provider';
import { VOTE_CHAIN_HOSTS, parseChainSummary, readFinalWeights, voteSummaryUrl, type ChainSummary } from './vote-chain';
import { castCheckpoint, createVoteChainScanner, type GetJson } from './vote-chain-scanner';

// One reading a minute: votes arrive in bursts, Helios and the roster change slowly. A failed reading
// keeps the last good one, marked stale, and is retried sooner.
const TTL = 60_000;
const RETRY = 30_000;
const ROSTER_TTL = 3_600_000;
const LIMITS = { timeout: 5_000, maxBytes: 2_000_000 };
const HELIOS_LIMITS = { ...LIMITS, timeout: 15_000 };
const MAX_VOTER_PAGES = 20;
const ROSTER_CSV = 'https://docs.google.com/spreadsheets/d/1pg_zSzigrxjdF-1oLz9WDzscglL2_1vzK4jTRNcXiCQ/export?format=csv&gid=0';

function jsonReader(fetcher: typeof fetch): GetJson {
  return async (url, limits) => {
    const response = await fetcher(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(limits.timeout),
      headers: { Accept: 'application/json', 'User-Agent': 'Shielded-Labs-Portal' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.text();
    if (body.length > limits.maxBytes) throw new Error('Response too large');
    return JSON.parse(body);
  };
}

/** A cached reading per key: fresh for a while, the last good data kept and marked stale on failure. */
function cachedRead<T>(load: (key: string) => Promise<{ data: T; observedAt?: number }>, ttl: number, now: () => number) {
  const cache = new Map<string, { read: Read<T>; expires: number }>();
  const pending = new Map<string, Promise<Read<T>>>();
  return (key: string): Promise<Read<T>> => {
    const hit = cache.get(key);
    if (hit && now() < hit.expires) return Promise.resolve(hit.read);
    const running = pending.get(key);
    if (running) return running;
    const request = load(key)
      .then((loaded): Read<T> => ({ state: 'fetched', observedAt: new Date(loaded.observedAt ?? now()).toISOString(), data: loaded.data }))
      .catch((): Read<T> => (hit?.read.data != null ? { ...hit.read, state: 'stale' } : { state: 'unavailable', observedAt: null, data: null }))
      .then((read) => {
        cache.set(key, { read, expires: now() + (read.state === 'fetched' ? ttl : RETRY) });
        return read;
      })
      .finally(() => pending.delete(key));
    pending.set(key, request);
    return request;
  };
}

/** The vote chain's summary from Valar Group, or from the Zcash Foundation mirror when Valar fails. */
async function readSummary(getJson: GetJson, round: string, questionIds: number[]): Promise<ChainSummary> {
  const errors: string[] = [];
  let finalized: ChainSummary | undefined;
  for (const host of VOTE_CHAIN_HOSTS) {
    try {
      const raw = await getJson(voteSummaryUrl(host.origin, round), LIMITS);
      const summary = parseChainSummary(raw, round);
      if (summary.questions.length !== questionIds.length || summary.questions.some((q) => !questionIds.includes(q.id))) throw new Error('Incomplete question roster');
      if (summary.status === 'finalized') {
        finalized = summary;
        const tally = await getJson(`${host.origin}/shielded-vote/v1/tally-results/${round}`, LIMITS);
        const weights = readFinalWeights(raw, tally, round);
        return { ...summary, questions: summary.questions.map((q) => ({ ...q, results: weights.get(q.id) })) };
      }
      if (!finalized) return summary;
    } catch (error) {
      errors.push(`${host.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (finalized) return finalized;
  throw new Error(errors.join('; '));
}

export function createTurnoutProvider(fetcher: typeof fetch = fetch, now: () => number = Date.now, config: PollTurnoutConfig = NU7_1_TURNOUT) {
  const getJson = jsonReader(fetcher);
  const siv = createSivReader(fetcher, now);
  const summary = cachedRead<ChainSummary>(async (round) => ({ data: await readSummary(getJson, round, config.questions.map((q) => q.id)) }), TTL, now);

  const coinholders = config.sources.find((s): s is VoteChainSource => s.kind === 'vote-chain');
  const scan = coinholders && createVoteChainScanner(coinholders.round, config.questions.map((q) => q.id), getJson, now);
  const casts = scan && cachedRead(scan, TTL, now);

  // The same summary supplies the total and every question. Counts are accepted shares, as on
  // Zakura, not cast transactions or shares / 16. The summary has no historical timestamps.
  async function chain(round: string): Promise<Read<CountRead>> {
    const read = await summary(round);
    return {
      state: read.state,
      observedAt: read.observedAt,
      data: read.data ? { value: read.data.totalShares, questions: read.data.questions, points: [], eligible: null, approximate: false } : null,
    };
  }

  const helios = cachedRead<CountRead>(
    async (election) => {
      const urls = heliosUrls(election);
      const [ballots, firstPage] = await Promise.all([
        getJson(urls.ballots, HELIOS_LIMITS),
        getJson(urls.voters(), HELIOS_LIMITS),
      ]);
      const times = heliosBallotTimes(ballots);
      let ids = heliosVoterIds(firstPage);
      let voters = ids.length;
      for (let page = 1; ids.length === HELIOS_PAGE; page++) {
        if (page >= MAX_VOTER_PAGES) throw new Error('Voter list too long');
        ids = heliosVoterIds(await getJson(urls.voters(ids[ids.length - 1]), HELIOS_LIMITS));
        voters += ids.length;
      }
      if (times.length > voters) throw new Error('More ballots than voters');
      return { data: { value: times.length, points: cumulative(times.filter(Number.isFinite)), eligible: voters, approximate: false } };
    },
    TTL,
    now,
  );

  const roster = cachedRead<number>(
    async () => {
      const response = await fetcher(ROSTER_CSV, { cache: 'no-store', signal: AbortSignal.timeout(8_000), headers: { 'User-Agent': 'Shielded-Labs-Portal' } });
      if (!response.ok) throw new Error('Roster unavailable');
      const raw = await response.text();
      if (/^\s*</.test(raw)) throw new Error('Invalid roster');
      const members = parseCsv(raw)
        .slice(1)
        .filter((row) => row[0]?.trim()).length;
      if (!members) throw new Error('Empty roster');
      return { data: members };
    },
    ROSTER_TTL,
    now,
  );

  const readers: { [K in 'vote-chain' | 'helios' | 'siv']: (source: Extract<VoteChainSource | HeliosSource | SivSource, { kind: K }>) => Promise<Read<CountRead>> } = {
    'vote-chain': (source) => chain(source.round),
    helios: (source) => helios(source.electionUuid),
    siv: (source) => siv(source, config.closesAt),
  };

  return async function getPollTurnout(): Promise<TurnoutSnapshot> {
    const live = config.sources.filter((s): s is VoteChainSource | HeliosSource | SivSource => s.kind !== 'recorded');
    const [bodyReads, rosterRead, summaryRead, castRead] = await Promise.all([
      Promise.all(live.map((source) => (source.kind === 'vote-chain' ? readers['vote-chain'](source) : source.kind === 'helios' ? readers.helios(source) : readers.siv(source)))),
      config.sources.some((s) => (s.kind === 'recorded' || s.kind === 'siv') && s.electorate === 'zcap-roster') ? roster('zcap') : null,
      coinholders ? summary(coinholders.round) : null,
      coinholders && casts ? casts(coinholders.round) : null,
    ]);
    const seed = coinholders && castCheckpoint(coinholders.round, now());
    const castReading = castRead?.data || !seed ? castRead : { state: 'stale' as const, data: seed.count, observedAt: new Date(seed.time).toISOString() };
    return buildSnapshot(
      config,
      {
        bodies: Object.fromEntries(live.map((source, i) => [source.id, bodyReads[i]])),
        roster: rosterRead?.data ?? null,
        chainStatus: summaryRead?.data?.status ?? null,
        casts: castReading ?? undefined,
      },
      now(),
    );
  };
}

export const getPollTurnout = createTurnoutProvider();
