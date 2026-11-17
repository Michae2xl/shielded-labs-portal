import 'server-only';
import { parseSivHistory, SIV_MAX_AGE, ZCAP_HISTORY_URL } from './siv-history';
import type { CountRead, Read, SivSource } from './turnout';

const CACHE_MS = 60_000;

/** Read the durable, hourly history. A branch update does not require an application deployment. */
export function createSivReader(fetcher: typeof fetch = fetch, now: () => number = Date.now) {
  let cached: Read<CountRead> | undefined;
  let checked = 0;
  let pending: Promise<Read<CountRead>> | undefined;

  return (source: SivSource, closesAt: string): Promise<Read<CountRead>> => {
    if (cached && now() - checked < CACHE_MS) return Promise.resolve(cached);
    if (pending) return pending;
    pending = (async (): Promise<Read<CountRead>> => {
      try {
        const configured = process.env.ZCAP_DATA_URL?.trim() || ZCAP_HISTORY_URL;
        const url = new URL(configured);
        // Tokens for this private repository never go to another host or repository, nor through a redirect.
        if (url.origin !== 'https://raw.githubusercontent.com' || !url.pathname.startsWith('/Michae2xl/shielded-labs-portal/') || url.username || url.password || url.search || url.hash) throw new Error('Invalid ZCAP history URL');
        const token = process.env.ZCAP_DATA_TOKEN?.trim() || process.env.ZIPS_DATA_TOKEN?.trim();
        const response = await fetcher(url.href, {
          headers: { Accept: 'application/json', 'User-Agent': 'Shielded-Labs-Portal', ...(token ? { Authorization: `token ${token}` } : {}) },
          cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8_000),
        });
        if (!response.ok) throw new Error('ZCAP history unavailable');
        const text = await response.text();
        if (text.length > 250_000) throw new Error('ZCAP history too large');
        const history = parseSivHistory(JSON.parse(text), source.electionId, now());
        const last = history.observations.at(-1)!;
        if (last.method === 'manual') throw new Error('No automatic ZCAP reading yet');
        const saved = source.readings.at(-1);
        if (saved && (Date.parse(last.at) < Date.parse(saved.at) || last.ballots < saved.ballots)) throw new Error('History predates the saved ZCAP count');
        if (cached?.data && (Date.parse(last.at) < Date.parse(cached.observedAt!) || last.ballots < cached.data.value)) throw new Error('Older ZCAP history');
        const final = Date.parse(last.at) >= Date.parse(closesAt);
        return {
          state: final || now() - Date.parse(last.at) <= SIV_MAX_AGE ? 'fetched' : 'stale',
          observedAt: last.at,
          data: { value: last.ballots, points: history.observations.map((r) => ({ at: Date.parse(r.at), value: r.ballots })), eligible: null, approximate: false },
        };
      } catch {
        return cached?.data ? { ...cached, state: 'stale' } : { state: 'unavailable', observedAt: null, data: null };
      }
    })().then((read) => { cached = read; checked = now(); return read; }).finally(() => { pending = undefined; });
    return pending;
  };
}
