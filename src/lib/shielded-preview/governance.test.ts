import { describe, expect, it } from 'vitest';
import snapshot from './governance-data/snapshot.json';
import { grantSchema, paymentSchema, proposalSchema, reviewSchema, memberSchema, verificationSchema } from './governance-types';
import { paymentsForGrant, paymentTotals, roundOutcome, roundApplication, resultInsights } from './governance-metrics';
import { comparisons, questionResult, formatVoteShare } from './comparisons';

describe('Governance evidence and monetary boundaries',()=>{
 it('validates every saved observation against its source contract',()=>{
  expect(proposalSchema.array().parse(snapshot.proposals.data)).toHaveLength(753);
  expect(reviewSchema.array().parse(snapshot.review.data)).toHaveLength(24);
  expect(grantSchema.array().parse(snapshot.grants.data)).toHaveLength(218);
  expect(paymentSchema.array().parse(snapshot.payments.data)).toHaveLength(913);
  expect(memberSchema.array().parse(snapshot.members.data)).toHaveLength(202);
  expect(verificationSchema.parse(snapshot.verification.data).rows).toHaveLength(37);
 });
 it('matches milestones by exact grant and program, excluding another program with the same name',()=>{
  const grant=grantSchema.parse(snapshot.grants.data[0]);
  const row=paymentSchema.parse(snapshot.payments.data[0]);
  const rows=[{...row,project:grant.grant,sourceSheet:'grants_disbursed'},{...row,project:grant.grant,sourceSheet:'coinholder_grants'},{...row,project:grant.grant+' extended',sourceSheet:'grants_disbursed'}];
  expect(paymentsForGrant({...grant,program:'zcg_regular'},rows)).toEqual([rows[0]]);
 });
 it('counts only paid entries, preserves missing USD and uses cents for aggregation',()=>{
  const row=paymentSchema.parse(snapshot.payments.data[0]);
  const totals=paymentTotals([{...row,isPaid:true,amountUsd:.1,zec:.00000001},{...row,isPaid:true,amountUsd:.2,zec:.00000002},{...row,isPaid:false,amountUsd:100000,zec:50},{...row,isPaid:true,amountUsd:null,zec:null}]);
  expect(totals).toEqual({count:3,usd:.3,zec:.00000003,missingUsd:1,missingZec:1});
 });
 it('includes abstention for quorum but requires a strict majority over both reject options',()=>{
  expect(roundOutcome(210000,210000,0,0)).toBe('Rejected');
  expect(roundOutcome(200000,100000,100001,100000)).toBe('Rejected');
  expect(roundOutcome(200000,100000,0,120000)).toBe('Funded');
  expect(roundOutcome(200000,100000,0,119999)).toBe('Rejected');
 });
 it('joins all Q3 ballots by application ID and never adds question weight',()=>{
  const rows=verificationSchema.parse(snapshot.verification.data).rows;
  expect(rows.every(r=>!!roundApplication(r.id))).toBe(true);
  expect(rows.every(r=>roundOutcome(r.accept,r.reject,r.lower,r.abstain)===r.rule)).toBe(true);
  expect(resultInsights(rows)).toMatchObject({funded:17,rejected:20,highestWeight:Math.max(...rows.map(r=>r.total))});
 });
 it('keeps member votes separate from ZEC, and changes only the selected denominator',()=>{
  const round=comparisons.rounds[0];const q=round.questions[0];
  for(const body of round.bodies){const all=questionResult(q,body.id,false);const excluded=questionResult(q,body.id,true);expect(all.total).toBe(excluded.total);expect(BigInt(excluded.denominator!)).toBeLessThanOrEqual(BigInt(all.denominator!));}
  const missing=questionResult({...q,weights:{...q.weights,[round.bodies[0].id]:q.options.map(()=>null)}},round.bodies[0].id,false);
  expect(missing.total).toBeNull();expect(missing.options.every(o=>o.percent===null)).toBe(true);
  expect(formatVoteShare(100,'9999','10000')).toBe('>99.9%');expect(formatVoteShare(0,'1','10000')).toBe('<0.1%');
 });
});
