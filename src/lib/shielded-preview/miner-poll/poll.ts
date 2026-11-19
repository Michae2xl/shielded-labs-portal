export const minerPoll = {
  start: 3_591_200,
  end: 3_629_650,
  confirmations: 100,
  tally: 'https://miner-poll.zfnd.org/',
  definition: 'https://hackmd.io/@upbqdn/nu7-1-miner-poll',
  announcement: 'https://forum.zcashcommunity.com/t/miner-sentiment-poll-pilot-nu7-1/59465',
  builder: 'https://upbqdn.github.io/miner-poll/',
} as const;

export const eligibleBlocks = minerPoll.end - minerPoll.start + 1;
export interface MinerQuestion {
  id: number;
  support: number;
  oppose: number;
  abstain: number;
}

export interface MinerReading {
  updatedAt: string;
  height: number;
  tallied: number;
  withBallot: number;
  phase: 'upcoming' | 'counting' | 'confirming' | 'final';
  questions: MinerQuestion[] | null;
}
