import 'server-only';
import { parseCsv } from '@/lib/zcg/csv';
import { HELIOS_PAGE, heliosBallotTimes, heliosUrls, heliosVoterIds } from './helios';
import { cumulative } from './series';
import { NU7_1_TURNOUT, buildSnapshot, type CountRead, type HeliosSource, type PollTurnoutConfig, type Read, type TurnoutSnapshot, type VoteChainSource } from './turnout';
import { SHARES_PER_VOTE, VOTE_CHAIN_HOSTS, parseChainSummary, voteSummaryUrl, type ChainSummary } from './vote-chain';
import { createVoteChainScanner, type GetJson } from './vote-chain-scanner';

// One reading a minute: votes arrive in bursts, Helios and the roster change slowly. A failed reading
// keeps the last good one, marked stale, and is retried sooner.
const TTL = 60_000;
const RETRY = 30_000;
const ROSTER_TTL = 3_600_000;
const LIMITS = { timeout: 5_000, maxBytes: 2_000_000 };
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
async function readSummary(getJson: GetJson, round: string): Promise<ChainSummary> {
  const errors: string[] = [];
  for (const host of VOTE_CHAIN_HOSTS) {
    try {
      return parseChainSummary(await getJson(voteSummaryUrl(host.origin, round), LIMITS), round);
    } catch (error) {
      errors.push(`${host.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(errors.join('; '));
}

export function createTurnoutProvider(fetcher: typeof fetch = fetch, now: () => number = Date.now, config: PollTurnoutConfig = NU7_1_TURNOUT) {
  const getJson = jsonReader(fetcher);
  const scanners = new Map<string, ReturnType<typeof createVoteChainScanner>>();
  const scannerFor = (round: string) => scanners.get(round) ?? scanners.set(round, createVoteChainScanner(round, getJson)).get(round)!;

  const summary = cachedRead<ChainSummary>(async (round) => ({ data: await readSummary(getJson, round) }), TTL, now);

  // Votes as cast, from the RPC. Once the RPC has answered, a failure keeps that exact count (marked stale);
  // only a round never read there falls back to the summary's revealed shares, and only to a fresh summary.
  const counted = new Set<string>();
  const chain = cachedRead<CountRead>(
    async (round) => {
      try {
        const count = await scannerFor(round)();
        counted.add(round);
        const top = Math.max(0, ...count.questions.map((q) => q.votes));
        return {
          observedAt: count.through.time,
          data: { value: top, points: count.points, eligible: null, approximate: false, questions: count.questions, unread: count.unread },
        };
      } catch (error) {
        if (counted.has(round)) throw error;
        const fallback = await summary(round);
        if (fallback.state !== 'fetched' || !fallback.data) throw error;
        const questions = fallback.data.questions.map((q) => ({ id: q.id, votes: Math.round(q.shares / SHARES_PER_VOTE) }));
        return {
          observedAt: fallback.observedAt ? Date.parse(fallback.observedAt) : undefined,
          data: { value: Math.max(0, ...questions.map((q) => q.votes)), points: [], eligible: null, approximate: true, questions, unread: 0 },
        };
      }
    },
    TTL,
    now,
  );

  const helios = cachedRead<CountRead>(
    async (election) => {
      const urls = heliosUrls(election);
      const times = heliosBallotTimes(await getJson(urls.ballots, LIMITS));
      let voters = 0;
      let after: string | undefined;
      for (let page = 0; ; page++) {
        if (page >= MAX_VOTER_PAGES) throw new Error('Voter list too long');
        const ids = heliosVoterIds(await getJson(urls.voters(after), LIMITS));
        voters += ids.length;
        if (ids.length < HELIOS_PAGE) break;
        after = ids[ids.length - 1];
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

  const readers: { [K in 'vote-chain' | 'helios']: (source: Extract<VoteChainSource | HeliosSource, { kind: K }>) => Promise<Read<CountRead>> } = {
    'vote-chain': (source) => chain(source.round),
    helios: (source) => helios(source.electionUuid),
  };

  return async function getPollTurnout(): Promise<TurnoutSnapshot> {
    const live = config.sources.filter((s): s is VoteChainSource | HeliosSource => s.kind !== 'recorded');
    const chainSource = config.sources.find((s): s is VoteChainSource => s.kind === 'vote-chain');
    const [bodyReads, rosterRead, summaryRead] = await Promise.all([
      Promise.all(live.map((source) => (source.kind === 'vote-chain' ? readers['vote-chain'](source) : readers.helios(source)))),
      config.sources.some((s) => s.kind === 'recorded' && s.electorate === 'zcap-roster') ? roster('zcap') : null,
      chainSource ? summary(chainSource.round) : null,
    ]);
    return buildSnapshot(
      config,
      {
        bodies: Object.fromEntries(live.map((source, i) => [source.id, bodyReads[i]])),
        roster: rosterRead?.data ?? null,
        chainStatus: summaryRead?.data?.status ?? null,
      },
      now(),
    );
  };
}

export const getPollTurnout = createTurnoutProvider();
