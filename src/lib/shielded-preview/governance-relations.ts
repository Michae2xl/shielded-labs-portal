import type { GrantRecord } from './governance-types';

/** A title match is a related record, not evidence that a particular application was funded. */
export function grantsWithSameTitle(proposal: { title: string; program: string }, grants: GrantRecord[]) {
  const program = proposal.program === 'zcg' ? 'zcg_regular' : proposal.program;
  return grants.filter(grant => grant.program === program && grant.grant.toLowerCase() === proposal.title.toLowerCase());
}
