import 'server-only';
import { z } from 'zod';
import { parseCsv } from '@/lib/zcg/csv';
import snapshot from './governance-data/snapshot.json';
import savedCoinholder from './governance-data/coinholder-issues.json';
import { coinholderSnapshotSource } from './coinholder-proposals';
import { fetchCoinholderProposals } from './coinholder-provider';
import { emptyTreasurySource, parseBalanceTab, treasuryCsvUrl, treasuryPrice, treasurySheetUrl, treasuryTabs } from './treasury';
import { liveZecPrice } from './zec-price';
import savedSchedule from './governance-data/zcg-schedule.json';
import savedMinutes from './governance-data/zcg-minutes.json';
import { parseSchedule, scheduleCsvUrl, scheduleSnapshotSource } from './zcg-schedule';
import { mergeMinutes, minutesFeedUrl, minutesFromTopics, minutesSnapshotSource } from './zcg-minutes';
import { reviewSchema, paymentSchema, grantSchema, memberSchema, verificationSchema, type GovernanceData, type Source } from './governance-types';

const TTL=300_000;
const seed={...snapshot,coinholder:coinholderSnapshotSource(savedCoinholder),treasury:emptyTreasurySource,schedule:scheduleSnapshotSource(savedSchedule),minutes:minutesSnapshotSource(savedMinutes)} as unknown as GovernanceData;
let cache:GovernanceData|undefined;
let refreshedAt=0;
let pending:Promise<GovernanceData>|undefined;
async function read(url:string){
 const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(8000),headers:{Accept:'application/json','User-Agent':'Shielded-Labs-Portal'}});
 if(!response.ok)throw new Error('Source unavailable');
 return response;
}
async function update<T>(old:Source<T>, fetcher:()=>Promise<T>,state:'fetched'|'mirror'='fetched'):Promise<Source<T>>{
 try{const data=await fetcher();return {...old,data,...(Array.isArray(data)?{total:data.length}:{}),state,observedAt:new Date().toISOString(),error:false};}
 catch{return {...old,state:old.observedAt?'snapshot':'unavailable',error:true};}
}

async function refresh():Promise<GovernanceData>{
 const old=cache??seed;
 // Historical proposals stay a dated snapshot until an independent published history API is available.
 const proposals = { ...seed.proposals, state: 'snapshot' as const };
 const [review,grants,payments,members,verification,coinholder,treasury,schedule,minutes]=await Promise.all([
  update(old.review,async()=>reviewSchema.array().parse((await (await read(old.review.url)).json()).proposals)),
  update(old.grants,async()=>grantSchema.array().parse((await (await read(old.grants.url)).json()).data)),
  update(old.payments,async()=>{
   const response=z.object({data:paymentSchema.array(),count:z.number(),total:z.number()}).parse(await (await read(old.payments.url)).json());
   // Never publish a truncated payment sample as a complete grant ledger.
   if(response.total>response.data.length)throw new Error('Incomplete ledger');
   return response.data.filter(p=>['grants_disbursed','coinholder_grants'].includes(p.sourceSheet));
  }),
  update(old.members,async()=>{
   const raw=await(await read('https://docs.google.com/spreadsheets/d/1pg_zSzigrxjdF-1oLz9WDzscglL2_1vzK4jTRNcXiCQ/export?format=csv&gid=0')).text();
   if(/^\s*</.test(raw))throw new Error('Invalid roster');
   const rows=parseCsv(raw).slice(1).filter(r=>r[0]?.trim()).map(r=>({name:r[0].trim(),handle:r[1]?.trim()??'',joined:r[2]?.trim()??''}));
   if(!rows.length)throw new Error('Empty roster');
   return memberSchema.array().parse(rows);
  }),
  update(old.verification,async()=>verificationSchema.parse(await(await read(old.verification.url)).json())),
  update(old.coinholder,fetchCoinholderProposals),
  // ZCG's treasury sheet: its own holdings and the coinholder fund, each tab dated by the block it reports,
  // valued at the live ZEC price, or at the sheet's own price when the feed has never answered.
  update(old.treasury??emptyTreasurySource,async()=>{
   const tab=async(gid:string)=>parseBalanceTab(await(await read(treasuryCsvUrl(gid))).text(),treasurySheetUrl(gid));
   const [zcg,coinholder,live]=await Promise.all([tab(treasuryTabs.zcg),tab(treasuryTabs.coinholder),liveZecPrice()]);
   return {zcg,coinholder,price:treasuryPrice(live,zcg)};
  }),
  // The grants tab of the same sheet: open milestones, their estimates and whether a payment is recorded.
  update(old.schedule??seed.schedule,async()=>parseSchedule(await(await read(scheduleCsvUrl)).text())),
  // Only the first page of the forum category is read; what it brings is added to the archive already held.
  update(old.minutes??seed.minutes,async()=>mergeMinutes((old.minutes??seed.minutes).data??[],minutesFromTopics(await(await read(minutesFeedUrl)).json()))),
 ]);
 return {checkedAt:new Date().toISOString(),proposals,review,grants,payments,members,verification,coinholder,treasury,schedule,minutes};
}
export async function getGovernanceData(){
 if(cache&&Date.now()-refreshedAt<TTL)return cache;
 if(!pending)pending=refresh().then(data=>{cache=data;refreshedAt=Date.now();return data}).finally(()=>{pending=undefined});
 return pending;
}
