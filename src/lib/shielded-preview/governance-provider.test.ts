import { afterEach, describe, expect, it, vi } from 'vitest';
import snapshot from './governance-data/snapshot.json';
vi.mock('server-only',()=>({}));
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();vi.restoreAllMocks();vi.resetModules()});
describe('Governance refresh boundaries',()=>{
 it('does not fetch when the preview is disabled',async()=>{
  vi.stubEnv('SHIELDED_LABS_PREVIEW','');const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
  const {GET}=await import('../../app/api/shielded-preview/governance/route');
  expect((await GET()).status).toBe(404);expect(fetcher).not.toHaveBeenCalled();
 });
 it('retains dated records on failure and coalesces concurrent refreshes',async()=>{
  const fetcher=vi.fn().mockRejectedValue(new Error('offline'));vi.stubGlobal('fetch',fetcher);
  const {getGovernanceData}=await import('./governance-provider');
  const [a,b]=await Promise.all([getGovernanceData(),getGovernanceData()]);expect(a).toBe(b);expect(fetcher).toHaveBeenCalledTimes(5);
  expect(a.payments.data).toEqual(snapshot.payments.data);expect(a.payments.observedAt).toBe(snapshot.payments.observedAt);expect(a.payments.error).toBe(true);
  expect(a.verification.data?.rows).toHaveLength(37);
  expect(a.proposals.data).toEqual(snapshot.proposals.data);
  expect(a.proposals.observedAt).toBe(snapshot.proposals.observedAt);
  expect(a.proposals.state).toBe('snapshot');
 });
 it('rejects truncated ledgers without replacing the complete saved observation',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({data:[],count:0,total:1088}),text:async()=>'<html>error</html>'})));
  const {getGovernanceData}=await import('./governance-provider');const data=await getGovernanceData();
  expect(data.payments.error).toBe(true);expect(data.payments.data).toHaveLength(913);expect(data.members.data).toHaveLength(202);
 });
 it('refreshes public datasets without relabeling historical proposals as current',async()=>{
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>{
   if(url===snapshot.review.url)return Response.json({proposals:snapshot.review.data});
   if(url===snapshot.grants.url)return Response.json({data:snapshot.grants.data});
   if(url===snapshot.payments.url)return Response.json({data:snapshot.payments.data,count:snapshot.payments.data.length,total:snapshot.payments.data.length});
   if(url===snapshot.verification.url)return Response.json(snapshot.verification.data);
   if(url.startsWith('https://docs.google.com/spreadsheets/'))return new Response('Name,Handle,Joined\nExample member,example,2026-01-01');
   throw new Error('Unexpected source');
  }));
  const {getGovernanceData}=await import('./governance-provider');
  const data=await getGovernanceData();
  expect(data.proposals.state).toBe('snapshot');
  expect(data.proposals.observedAt).toBe(snapshot.proposals.observedAt);
  expect(data.proposals.data).toEqual(snapshot.proposals.data);
  for(const name of ['review','grants','payments','members','verification'] as const){
   expect(data[name].state).toBe('fetched');
   expect(data[name].error).toBe(false);
  }
 });
});
