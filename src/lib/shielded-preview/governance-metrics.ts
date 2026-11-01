import { ROUND_PROPOSALS } from '@/lib/zcg/coinholder-round';
import type { GrantRecord, Payment, VoteResult } from './governance-types';
export function paymentsForGrant(grant: GrantRecord, payments: Payment[]) {
  const sheet = grant.program === 'coinholder' ? 'coinholder_grants' : 'grants_disbursed';
  return payments.filter(p=>p.project===grant.grant && p.sourceSheet===sheet);
}
export function paymentTotals(payments: Payment[]) {
  const paid = payments.filter(p=>p.isPaid);
  return {count:paid.length,usd:paid.reduce((sum,p)=>sum+Math.round((p.amountUsd??0)*100),0)/100,zec:paid.reduce((sum,p)=>sum+Math.round((p.zec??0)*1e8),0)/1e8,missingUsd:paid.filter(p=>p.amountUsd===null).length,missingZec:paid.filter(p=>p.zec===null).length};
}
export function roundApplication(id: string) {
  return ROUND_PROPOSALS.find(p=>p.githubUrl.split('/').pop()===id);
}
export function roundOutcome(accept:number,reject:number,lower:number,abstain:number) {
  const total=accept+reject+lower+abstain;
  return total>=420000 && accept>reject+lower ? 'Funded' : 'Rejected';
}
export function resultInsights(rows: VoteResult[]) {
  return {funded:rows.filter(r=>r.published==='Funded').length,rejected:rows.filter(r=>r.published==='Rejected').length,highestWeight:Math.max(0,...rows.map(r=>r.total)),requestedForFunded:rows.filter(r=>r.published==='Funded').reduce((sum,r)=>sum+(roundApplication(r.id)?.requestedUsdCents??0),0)/100};
}
