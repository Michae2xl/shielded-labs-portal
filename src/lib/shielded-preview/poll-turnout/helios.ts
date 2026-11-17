import { z } from 'zod';

/** Panels that vote on Helios: its public JSON lists who may vote and each voter's latest ballot, with its time. */

const HELIOS_ORIGIN = 'https://vote.heliosvoting.org';
const HELIOS_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** Helios lists at most this many voters per request. */
export const HELIOS_PAGE = 500;

export function heliosUrls(electionUuid: string) {
  if (!HELIOS_UUID.test(electionUuid)) throw new Error('not a Helios election id');
  const election = `${HELIOS_ORIGIN}/helios/elections/${electionUuid}`;
  return {
    ballots: `${election}/ballots/`,
    voters: (after?: string) => `${election}/voters/?limit=${HELIOS_PAGE}${after ? `&after=${encodeURIComponent(after)}` : ''}`,
    voterList: `${election}/voters/list`,
  };
}

/** Helios writes times in UTC without a zone: "2026-11-16 11:39:21.731163". */
const heliosTime = (value: string) => Date.parse(`${value.trim().replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1')}Z`);

/** When each voter's latest ballot was cast, one time per voter; ids and hashes never leave this function. */
export function heliosBallotTimes(json: unknown): number[] {
  const ballots = z.array(z.object({ voter_uuid: z.string().min(1), cast_at: z.string().nullish() })).parse(json);
  const latest = new Map<string, number>();
  for (const ballot of ballots) {
    const at = ballot.cast_at ? heliosTime(ballot.cast_at) : Number.NaN;
    const known = latest.get(ballot.voter_uuid);
    if (known === undefined || (Number.isFinite(at) && (!Number.isFinite(known) || at > known))) latest.set(ballot.voter_uuid, at);
  }
  return [...latest.values()];
}

/** One page of the voter list, as ids only: names never leave this function. */
export const heliosVoterIds = (json: unknown) =>
  z
    .array(z.object({ uuid: z.string().min(1) }))
    .parse(json)
    .map((v) => v.uuid);
