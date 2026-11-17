import { NU7_1_TURNOUT, type SourceLogo } from './turnout';

const ORGANIZERS_THREAD = 'https://forum.zcashcommunity.com/t/zcg-and-the-dev-fund-timeline-for-proposals-and-polling/58906';

/**
 * How each group takes part in the NU7.1 poll, in the words of whoever runs its ballot. Read on 17 Nov 2026:
 * the organizers' post (topic 58906, post 133), the Zcash Foundation's ZCAP post (topic 59366), the vote
 * chain's record of the round and the two Helios elections.
 */
export const NU7_1_PARTICIPATION = {
  // The vote chain's round and both Helios elections carry these instructions.
  guidance: [
    'Consider each proposal on its own: you may support more than one, even proposals that conflict, if you would accept either outcome.',
    'If more than one gets broad support, a runoff poll may follow.',
  ],
  closes: '1 Dec, 02:59 UTC',
  questions: ORGANIZERS_THREAD,
  coinholders: {
    // "Participate using Vizor, ZODL, or Zkool. If you're using Zkool, use this URL: …" (post 133).
    zkoolSetup: `${ORGANIZERS_THREAD}/133`,
    // That URL, as posted. On 17 Nov the file it serves hashed to the sha256 the URL names.
    zkoolSettings:
      'https://voting.valargroup.dev/pins/prod/28fc9b631091ae8bc2f8635d8930489238ce144174cbd15a03efb0530b301ebe/v2-static-voting-config.json?checksum=sha256:28fc9b631091ae8bc2f8635d8930489238ce144174cbd15a03efb0530b301ebe',
    // The round's snapshot_height on the vote chain; the block's time from the Zcash chain.
    snapshot: {
      height: 3_578_540,
      at: '2026-11-16T08:02:34Z',
      source: 'https://prod.vote-chain-primary.valargroup.org/shielded-vote/v1/round/290ce255ee4c4d63457a55b3e72e07c579e44b6e578438a01c3eaad5c158991e',
    },
  },
  zcap: {
    subject: 'ZCAP NU7.1 Poll',
    sender: 'election@siv.org',
    help: 'zcap-poll-help@zfnd.org',
    post: 'https://forum.zcashcommunity.com/t/zcap-poll-now-open-nu7-1/59366',
  },
  // Registration is closed in both elections: only members on each panel's list vote.
  panels: [
    { id: 'zcash-brasil', ballot: 'https://vote.heliosvoting.org/helios/elections/b2b63125-8cee-4f9c-bab5-dd8d5de0d030/view' },
    { id: 'zechub', ballot: 'https://vote.heliosvoting.org/helios/elections/c197ce1b-f97a-4a88-a6b5-6eb9914d7b4c/view' },
  ],
} as const;

/** A body's name and marks, as the turnout panel shows them, so both say who it is the same way. */
export function bodyMarks(id: string): { name: string; logos: SourceLogo[] } {
  const source = NU7_1_TURNOUT.sources.find((candidate) => candidate.id === id);
  if (!source) throw new Error(`No turnout source named ${id}`);
  return { name: source.name, logos: source.logos };
}
