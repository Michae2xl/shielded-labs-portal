/** Public turnout observations, never ballot contents or voter identifiers. */
export const ZCAP_ELECTION_ID = '1794682180496';
export const ZCAP_STATUS_URL = `https://siv.org/election/${ZCAP_ELECTION_ID}`;
export const ZCAP_COUNT_URL = `https://siv.org/api/election/${ZCAP_ELECTION_ID}/num-votes`;
export const ZCAP_HISTORY_URL = 'https://raw.githubusercontent.com/Michae2xl/shielded-labs-portal/turnout-data/zcap.json';
export const SIV_MAX_AGE = 2 * 3_600_000;

export interface SivObservation {
  at: string;
  ballots: number;
  method: 'manual' | 'api' | 'browser';
}
export interface SivHistory {
  version: 1;
  electionId: string;
  observations: SivObservation[];
}

const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a JSON object');
  return value as Record<string, unknown>;
};
const count = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Invalid SIV count');
  return value;
};

/** This is the exact field SIV displays as “Total votes cast”. Do not add the other counters. */
export function parseSivCount(value: unknown): number {
  const data = object(value);
  count(data.num_invalidated_votes);
  count(data.num_pending_votes);
  return count(data.num_votes);
}

export function parseSivHistory(value: unknown, electionId = ZCAP_ELECTION_ID, now = Date.now()): SivHistory {
  const data = object(value);
  if (data.version !== 1 || data.electionId !== electionId || !Array.isArray(data.observations) || !data.observations.length || data.observations.length > 2_000) {
    throw new Error('Invalid SIV history');
  }
  let lastAt = 0;
  let lastCount = 0;
  const observations = data.observations.map((value): SivObservation => {
    const row = object(value);
    const at = typeof row.at === 'string' && row.at.endsWith('Z') ? Date.parse(row.at) : NaN;
    const ballots = count(row.ballots);
    if (!Number.isFinite(at) || at <= lastAt || at > now + 300_000 || ballots < lastCount) throw new Error('Out-of-order SIV observation');
    if (row.method !== 'manual' && row.method !== 'api' && row.method !== 'browser') throw new Error('Invalid SIV observation method');
    lastAt = at;
    lastCount = ballots;
    return { at: new Date(at).toISOString(), ballots, method: row.method };
  });
  return { version: 1, electionId, observations };
}

/** Replace this hour's automated sample on retries; totals are observations, never increments. */
export function recordSivCount(history: SivHistory, ballots: number, at: string, method: 'api' | 'browser'): SivHistory {
  const now = Date.parse(at);
  const valid = parseSivHistory(history, ZCAP_ELECTION_ID, now);
  count(ballots);
  const last = valid.observations.at(-1)!;
  if (now < Date.parse(last.at) || ballots < last.ballots) throw new Error('SIV count or observation time moved backwards; review the source');
  const observations = [...valid.observations];
  const reading = { at: new Date(now).toISOString(), ballots, method };
  if (last.at === reading.at || (last.method !== 'manual' && last.at.slice(0, 13) === reading.at.slice(0, 13))) observations[observations.length - 1] = reading;
  else observations.push(reading);
  return parseSivHistory({ ...valid, observations }, ZCAP_ELECTION_ID, now);
}
