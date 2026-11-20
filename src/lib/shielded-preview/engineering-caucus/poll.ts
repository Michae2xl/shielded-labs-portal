export const electionPath = '/helios/elections/ada93733-ac84-4add-b6d7-cee7bc6109a5';
export const ballotCenter = 'https://vote.heliosvoting.org' + electionPath + '/voters/list';

export interface CaucusReading {
  cast: number;
  eligible: number;
  checkedAt: string;
}
