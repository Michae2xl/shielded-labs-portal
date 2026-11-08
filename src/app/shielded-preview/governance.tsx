'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { leavingLink, sourceHref } from '@/lib/shielded-preview/editorial/library';
import snapshot from '@/lib/shielded-preview/governance-data/snapshot.json';
import record from '@/lib/shielded-preview/governance-data/record.json';
import { comparisons } from '@/lib/shielded-preview/comparisons';
import { ROUND_PROPOSALS } from '@/lib/zcg/coinholder-round';
import { paymentsForGrant, paymentTotals, roundApplication } from '@/lib/shielded-preview/governance-metrics';
import { grantsWithSameTitle } from '@/lib/shielded-preview/governance-relations';
import { participationGuideId } from '@/lib/shielded-preview/governance-participation';
import { devFundLane } from '@/lib/shielded-preview/governance-dev-fund';
import { emptyCoinholderSource } from '@/lib/shielded-preview/coinholder-proposals';
import { coinholderRounds } from '@/lib/shielded-preview/coinholder-rounds';
import type { GovernanceData, Source, VoteResult } from '@/lib/shielded-preview/governance-types';
import GovernanceRecord from './governance-record';
import GovernanceNavigation, { type GovernanceSection } from './governance-navigation';
import { governanceSectionFromSlug, governanceSectionSlug } from '@/lib/shielded-preview/governance-sections';
import { isZipLane, laneForRecord, zipReference } from '@/lib/shielded-preview/zips/library';
import GovernanceProcess from './governance-process';
import GovernanceZips from './governance-zips';
import GovernanceOverview from './governance-overview';
import GovernanceProgramGuide from './governance-program-guide';
import CoinholderProposalRecord from './coinholder-proposal-record';
import GovernanceInsights from './governance-insights';
import GovernanceZcap from './governance-zcap';
import GovernanceTransparency from './governance-transparency';
import GovernanceReferences, { GovernanceReferenceProvider } from './governance-references';
import { GrantsCollection, Link, ProposalsCollection, ResultsCollection, VotingCollection, type ProposalListItem } from './governance-collections';
import g from './governance.module.css';

type Section = GovernanceSection;
const recordLane=(section:Section,id:string|null)=>section==='ZIPs'?laneForRecord(id):section==='Voting'?(id?.startsWith('poll:')?'archive':id?.startsWith('upgrade:')?'upgrades':'current'):section==='ZCAP'?(id?.startsWith('member:')?'members':'comparison'):section==='Insights'?'decisions':id?.startsWith('election:')?'elections':id?.startsWith('history:')?'history':section==='Proposals'&&(id?.startsWith('coinholder:')||id?.startsWith('q3:')||id?.startsWith('proposal:'))?'coinholder':id?.startsWith('q3:')||section==='Results'?'q3':'review';
type ListingState={lane:string;filter:string;search:string;page:number;basis:'include'|'exclude';round:string};
function listingParams(section:Section,id:string|null,state:ListingState){
 const params=new URLSearchParams({view:'governance',section:governanceSectionSlug(section)});
 if(id)params.set('record',id);
 if((section==='Voting'||section==='Proposals'||section==='Results'||section==='Insights'||section==='ZCAP'||section==='ZIPs')&&state.lane!==recordLane(section,null))params.set('lane',state.lane);
 if(state.filter!=='all')params.set('filter',state.filter);
 if(state.search)params.set('q',state.search);
 if(state.page>1)params.set('page',String(state.page));
 if(section==='ZCAP'&&state.lane!=='members'&&state.basis==='exclude')params.set('basis','exclude');
 if(section==='Proposals'&&(state.lane==='coinholder'||state.lane==='q3')&&state.round!=='all')params.set('round',state.round);
 return params;
}
const dollars=(n:number|null)=>n===null?'Not recorded':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(n);
const number=(n:number)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:3}).format(n);
const date=(s:string|null)=>s?new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(s)):'Not recorded';
const label=(s:string)=>s.replaceAll('_',' ').replace(/^\w/,c=>c.toUpperCase());
const polls=[...record.polls].filter(p=>p.kind!=='test').sort((a,b)=>(b.date??'').localeCompare(a.date??''));
const elections=[...record.elections].sort((a,b)=>(b.date??b.month??'').localeCompare(a.date??a.month??''));
function Arrow(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>}
function SourceLink({url,children}:{url:string|null;children:ReactNode}){const target=url?sourceHref(url):null;return url&&target&&/^https:\/\//.test(url)?<a className={g.sourceLink} href={target} {...leavingLink(target)}>{children}{/^https:\/\/(www\.)?openzcash\.org(?:\/|$)/i.test(url)&&!(typeof children==='string'&&/openzcash/i.test(children))?' · OpenZcash':''}<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d={target.startsWith('?')?'M4 12h16m-6-6 6 6-6 6':'M6 18 18 6M6 6h12v12'}/></svg></a>:null}
function State({children}:{children:ReactNode}){return <span className={g.state}>{children}</span>}
function SourceNote({source,name}:{source:Source<unknown>;name:string}){return <div className={g.sourceNote}><strong>{name}</strong><span>{source.state==='unavailable'?'Source unavailable':source.state==='mirror'?'Published record':source.state==='fetched'?'Retrieved':'Saved record'}{source.observedAt?` · ${date(source.observedAt)}`:''}{source.error?' · Refresh unavailable':''}</span><SourceLink url={source.url}>Source</SourceLink></div>}
function Stat({value,name,note}:{value:ReactNode;name:string;note?:string}){return <div><span>{name}</span><strong>{value}</strong>{note&&<small>{note}</small>}</div>}
function Tally({row}:{row:VoteResult}){return <div className={g.tally}>{[['Accept',row.accept],['Reject',row.reject],['Reject at a lower amount',row.lower],['Abstain',row.abstain]].map(([name,value])=><div key={String(name)}><div><span>{name}</span><strong>{number(Number(value))} ZEC</strong></div><div className={g.track}><span style={{width:`${row.total>0?Number(value)/row.total*100:0}%`}}/></div></div>)}</div>}
type ProposalView=ProposalListItem & {program:string};
export function ProposalGrantLinks({proposal,source,onNavigate}:{proposal:Pick<ProposalView,'title'|'program'>;source:GovernanceData['grants'];onNavigate:(section:'Grants',id:string)=>void}){
 const grants=grantsWithSameTitle(proposal,source.data);
 if(!grants.length)return null;
 return <div className={g.relatedRecords}><h3>Grants with the same title</h3><p className={g.recordNote}>These records share the title and program. The ledger does not identify the application, so this does not confirm funding for this request.</p>{grants.map(grant=><button key={`${grant.program}|${grant.grant}`} className={g.secondary} onClick={()=>onNavigate('Grants',`${grant.program}|${grant.grant}`)}>Open grant record<Arrow/></button>)}<SourceLink url={source.url}>Grant ledger source</SourceLink></div>;
}
export default function Governance(){
 const [data,setData]=useState({...snapshot,coinholder:emptyCoinholderSource} as unknown as GovernanceData);const [section,setSection]=useState<Section>('Overview');const [selected,setSelected]=useState<string|null>(null);
 const [search,setSearch]=useState('');const [filter,setFilter]=useState('all');const [lane,setLane]=useState('review');const [page,setPage]=useState(1);const [busy,setBusy]=useState(false);const [failed,setFailed]=useState(false);const active=useRef(false);const heading=useRef<HTMLHeadingElement>(null);
 const [basis,setBasis]=useState<'include'|'exclude'>('include');
 const [round,setRound]=useState('all');
 const refresh=useCallback(async()=>{if(active.current)return;active.current=true;setBusy(true);try{const r=await fetch('/api/shielded-preview/governance',{signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error();setData(await r.json());setFailed(false)}catch{setFailed(true)}finally{active.current=false;setBusy(false)}},[]);
 useEffect(()=>{const read=()=>{
  const p=new URLSearchParams(location.search);const next=governanceSectionFromSlug(p.get('section'))??'Overview';
  const lanes=next==='ZIPs'?['zips','drafts','guides','proposals']:next==='Voting'?['current','archive','upgrades',devFundLane]:next==='Proposals'?['review','history','coinholder','q3',devFundLane]:next==='Results'?['q3','elections']:next==='Insights'?['decisions','payments','outcomes','panels']:next==='ZCAP'?['comparison','members']:[];
  const nextPage=Number(p.get('page')??1);
  const nextLane=lanes.includes(p.get('lane')??'')?p.get('lane')!:next==='Voting'&&p.get('filter')==='upgrades'?'upgrades':recordLane(next,p.get('record'));
  setSection(next);setLane(next==='Proposals'&&nextLane==='q3'?'coinholder':nextLane);setSelected(p.get('record'));
  setRound(coinholderRounds.some(item=>item.id===p.get('round'))?p.get('round')!:'all');
  setBasis(p.get('basis')==='exclude'?'exclude':'include');
  setSearch(p.get('q')??'');setFilter(p.get('filter')??'all');setPage(Number.isSafeInteger(nextPage)&&nextPage>0?nextPage:1);
 };const start=setTimeout(()=>{read();void refresh()},0);window.addEventListener('popstate',read);window.addEventListener('shielded:navigate',read);const timer=setInterval(()=>{if(!document.hidden)void refresh()},300000);return()=>{clearTimeout(start);clearInterval(timer);window.removeEventListener('popstate',read);window.removeEventListener('shielded:navigate',read)}},[refresh]);
 useEffect(()=>{heading.current?.focus({preventScroll:true})},[section,selected]);

 function go(next:Section,id:string|null=null,overrides:Partial<ListingState>={}){
  const keep=next===section&&(id!==null||selected!==null);
  const state:ListingState={lane:keep?lane:recordLane(next,id),filter:keep?filter:'all',search:keep?search:'',page:keep?page:1,basis:keep?basis:'include',round:keep?round:'all',...overrides};
  if(next==='Voting'&&id===null&&selected?.startsWith('upgrade:'))state.lane='upgrades';
  if(next==='ZIPs'&&id)state.lane=laneForRecord(id);
  setSection(next);setSelected(id);setLane(state.lane);setSearch(state.search);setFilter(state.filter);setPage(state.page);setBasis(state.basis);setRound(state.round);
  history.pushState(null,'',`?${listingParams(next,id,state)}`);window.dispatchEvent(new Event('shielded:navigate'));window.scrollTo({top:0,behavior:'instant'});
 }
 function rememberListing(overrides:Partial<ListingState>){
  const current=new URLSearchParams(location.search);
  const state:ListingState={lane:current.get('lane')??recordLane(section,selected),filter:current.get('filter')??'all',search:current.get('q')??'',page:Number(current.get('page')??1),basis:current.get('basis')==='exclude'?'exclude':'include',round:current.get('round')??'all',...overrides};
  history.replaceState(null,'',`?${listingParams(section,selected,state)}`);
 }
 function find(value:string){setSearch(value);setPage(1);rememberListing({search:value,page:1})}
 function chooseFilter(value:string){setFilter(value);setPage(1);rememberListing({filter:value,page:1})}
 function chooseLane(value:string){setLane(value);setFilter('all');setSearch('');setPage(1);setRound('all');rememberListing({lane:value,filter:'all',search:'',page:1,round:'all'})}
 function chooseRound(value:string){setRound(value);setPage(1);rememberListing({round:value,page:1})}
 function chooseBasis(value:'include'|'exclude'){setBasis(value);rememberListing({basis:value})}
 function choosePage(value:number){setPage(value);rememberListing({page:value})}
 const collectionControls={search,onSearch:find,filter,onFilter:chooseFilter,page,onPage:choosePage,onNavigate:go};
 const verification=data.verification.data;const results=verification?.rows??[];
 const review:ProposalView[]=data.review.data.map(p=>({id:`review:${p.number}`,title:p.title,program:'zcg',applicant:p.applicant,amount:p.amount,status:'under_review',summary:p.summary,submitted:p.createdAt,decided:null,url:p.url,sourceUrl:data.review.url,origin:'Published OpenZcash review queue'}));
 const historyProposals:ProposalView[]=data.proposals.data.map(p=>({id:`history:${p.id}`,title:p.title,program:p.program,applicant:p.applicant,amount:p.requestedUsd,status:p.status,summary:p.summary,submitted:p.submitted,decided:p.decided,url:p.applicationUrl??p.forumUrl,sourceUrl:p.sourceUrl,origin:'OpenZcash ZCG decision archive'}));
 const roundProposals:ProposalView[]=ROUND_PROPOSALS.map(p=>{const id=p.githubUrl.split('/').pop()!;const result=results.find(r=>r.id===id);return {id:`q3:${id}`,title:p.project,program:'coinholder',applicant:p.org,amount:p.requestedUsdCents/100,status:result?.published??'Result unavailable',summary:p.summary,submitted:'2026-08-14',decided:result?'2026-09-29':null,url:p.githubUrl,sourceUrl:p.threadUrl,origin:'Q3 2026 · archived application summary',roundId:id}});
 const proposal=[...review,...historyProposals,...roundProposals].find(p=>p.id===selected);
 const proposalSource=proposal?.id.startsWith('history:')?data.proposals:proposal?.id.startsWith('review:')?data.review:data.verification;
 const grant=data.grants.data.find(p=>`${p.program}|${p.grant}`===selected);
 const vote=results.find(r=>`q3:${r.id}`===selected);
 const poll=polls.find(p=>`poll:${p.id}`===selected);
 const election=elections.find(e=>`election:${e.id}`===selected);
 const upgrade=record.upgrades.find(u=>`upgrade:${u.name}`===selected);
 const grantRows=grant?paymentsForGrant(grant,data.payments.data):[];
 const grantPaid=paymentTotals(grantRows);
 const programGuide=section==='Voting'&&selected===participationGuideId;
 const coinholderSource=data.coinholder??emptyCoinholderSource;
 const coinholderProposal=coinholderSource.data?.find(row=>`coinholder:${row.number}`===selected||`proposal:${row.round}:${row.number}`===selected);
 const loadingCoinholder=(section==='Voting'||section==='Proposals')&&(selected?.startsWith('proposal:')||selected?.startsWith('coinholder:'))&&coinholderSource.data===null;
 const title=programGuide?'Program guide':selected?(section==='Proposals'?coinholderProposal?.title??proposal?.title:section==='Grants'?grant?.grant:section==='Results'?vote?.title??election?.label:section==='Voting'?coinholderProposal?.title??poll?.name??upgrade?.name:undefined):undefined;


 return <GovernanceReferenceProvider checkedAt={data.checkedAt} checkedLabel={date(data.checkedAt)} busy={busy} failed={failed} onRefresh={()=>void refresh()} catalog={<>
  <p>Each source keeps its own observation date. A source update may be newer than the records it contains.</p>
  <div className={g.sourceCatalog}><SourceNote name="FPF Coinholder application history" source={coinholderSource}/><SourceNote name="ZCG decision archive" source={data.proposals}/><SourceNote name="ZCG review queue" source={data.review}/><SourceNote name="Grants" source={data.grants}/><SourceNote name="Grant payments" source={data.payments}/><SourceNote name="ZCAP roster" source={data.members}/><SourceNote name="Q3 results" source={data.verification}/></div>
  <p>Poll archive reviewed {date(record.checkedAt)}; NU7 comparison reviewed {date(comparisons.checkedAt)}. Sources refresh every five minutes. Unavailable sources retain their last dated record.</p>
  <div className={g.sourceGuides}><SourceLink url="https://zcashcommunitygrants.org/selection/">ZCG review process</SourceLink><SourceLink url="https://zfnd.org/zcash-community-advisory-panel/">ZCAP role and membership</SourceLink></div>
 </>}><div className={g.governance}>
  <GovernanceNavigation value={section} onChange={value=>go(value)}/>
  {!selected&&section!=='How it works'&&<h1 ref={heading} tabIndex={-1} className={g.srOnly}>Governance · {section}</h1>}

  {section==='How it works'&&<GovernanceProcess onBack={()=>go('Overview')} onNavigate={go}/>}
  {section==='ZIPs'&&<GovernanceZips selected={selected} lane={isZipLane(lane)?lane:'zips'} filter={filter} search={search} page={page} onNavigate={go} onSearch={find} onFilter={chooseFilter} onPage={choosePage} onLane={chooseLane}/>}

  {!selected&&section==='Overview'&&<GovernanceOverview data={data} pollCount={polls.length} onNavigate={go}/>}

  {!selected&&section==='Proposals'&&<ProposalsCollection {...collectionControls} datasets={{review,history:historyProposals}} coinholderSource={coinholderSource} lane={lane} onLane={chooseLane} round={round} onRound={chooseRound} busy={busy} source={lane==='history'?data.proposals:data.review}/>}
  {selected&&section==='Proposals'&&coinholderProposal&&<CoinholderProposalRecord proposal={coinholderProposal} source={coinholderSource} backLabel="All Coinholder proposals" onBack={()=>go('Proposals')} related={coinholderProposal.rounds.includes('q3-2026')&&<button className={g.secondary} onClick={()=>go('Results',`q3:${coinholderProposal.number}`)}>Ballot & result<Arrow/></button>}/>}
  {selected&&section==='Proposals'&&proposal&&<GovernanceRecord
   title={proposal.title} context={proposal.roundId?'Coinholder grants · Q3 2026':'Zcash Community Grants'} subtitle={proposal.applicant}
   metrics={<><Stat name="Recorded status" value={label(proposal.status)}/><Stat name="Requested amount" value={dollars(proposal.amount)}/><Stat name={proposal.roundId?'Review announcement':'Submitted'} value={date(proposal.submitted)}/></>}
   sections={[{label:'Summary',id:'governance-summary'}]} backLabel="All proposals" onBack={()=>go('Proposals')}
   sources={<><p>Requested amounts are not payments. The source status does not certify delivery.</p><SourceLink url={proposal.url}>Original application</SourceLink>{proposal.sourceUrl!==proposalSource.url&&proposal.sourceUrl!==proposal.url&&<SourceLink url={proposal.sourceUrl}>Source record</SourceLink>}<SourceNote name={proposal.origin} source={proposalSource}/></>}
  >
   <section id="governance-summary"><h2>Application summary</h2><p>{proposal.summary||'A summary is unavailable. See the original application under Sources.'}</p><dl className={g.facts}><div><dt>Recorded decision</dt><dd>{date(proposal.decided)}</dd></div></dl>
   {proposal.roundId&&<div className={g.relatedRecords}><h3>Related records</h3><button className={g.secondary} onClick={()=>go('Results',`q3:${proposal.roundId}`)}>Ballot & result<Arrow/></button></div>}
   <ProposalGrantLinks proposal={proposal} source={data.grants} onNavigate={go}/>
   </section>
  </GovernanceRecord>}

  {!selected&&section==='Grants'&&<GrantsCollection {...collectionControls} source={data.grants}/>}
  {selected&&section==='Grants'&&grant&&<GovernanceRecord
   title={grant.grant} context={grant.program==='coinholder'?'Coinholder grants':'Zcash Community Grants'} subtitle={grant.grantee}
   metrics={<><Stat name="Recorded status" value={label(grant.status)}/><Stat name="Recorded budget" value={dollars(grant.usd)}/><Stat name="Milestones marked paid" value={`${grant.milestonesPaid} / ${grant.milestones}`}/></>}
   sections={[{label:'Payments',id:'governance-payments'},{label:'Milestones',id:'governance-milestones'}]} backLabel="All grants" onBack={()=>go('Grants')}
   sources={<><p>USD is the recorded budget value, not a current ZEC conversion. “Paid” is a ledger status, not independent on-chain verification or proof of delivery.</p><SourceNote name="Grant totals" source={data.grants}/><SourceNote name="Milestone records" source={data.payments}/></>}
  >
   <section id="governance-payments"><h2>Recorded payments</h2><dl className={g.facts}><div><dt>Budget value of paid entries</dt><dd>{dollars(grantPaid.usd)}</dd></div><div><dt>Recorded paid ZEC</dt><dd>{number(grantPaid.zec)} ZEC{grantPaid.missingZec>0?` · ${grantPaid.missingZec} paid rows lack ZEC values`:null}</dd></div><div><dt>Category</dt><dd>{grant.category||'Not recorded'}</dd></div></dl></section>
   <section id="governance-milestones"><h2>Milestones</h2><div className={g.milestoneList}>{grantRows.map(p=><article key={p.id} className={g.milestone}><div className={g.milestoneHeading}><h3>{p.milestone?(/^\d+$/.test(p.milestone)?`Milestone ${p.milestone}`:p.milestone):label(p.type)||'Ledger entry'}</h3><State>{p.isPaid?'Paid':'Not marked paid'}</State></div><dl className={g.paymentFigures}><div><dt>Recorded date</dt><dd>{date(p.paidOutDate||null)}</dd></div><div><dt>USD budget</dt><dd>{dollars(p.amountUsd)}</dd></div><div><dt>ZEC</dt><dd>{p.zec===null?'Not recorded':number(p.zec)}</dd></div></dl><SourceLink url={p.sourceUrl}>Source row</SourceLink></article>)}</div>
   <p className={g.recordNote}>{grantRows.length} matching rows, linked by exact grant name and program.{grantRows.length!==grant.milestones?' Coverage differs between the two source observations; totals have not been forced to reconcile.':''}{grantPaid.missingUsd?` ${grantPaid.missingUsd} paid entries lack a USD value.`:''}</p></section>
  </GovernanceRecord>}

  {!selected&&section==='Voting'&&<VotingCollection {...collectionControls} source={coinholderSource} lane={lane} onLane={chooseLane} busy={busy}/>}
  {selected&&section==='Voting'&&coinholderProposal&&<CoinholderProposalRecord proposal={coinholderProposal} source={coinholderSource} onBack={()=>go('Voting',null,{lane:'current'})}/>}
  {loadingCoinholder&&<section className={g.empty} role="status"><h1>{busy?'Loading proposal…':'Proposal source unavailable'}</h1><p>{busy?'Retrieving the FPF application.':'Try refreshing the data or return to the proposals.'}</p><button className={g.secondary} onClick={()=>go(section)}>Back to proposals</button></section>}
  {programGuide&&<GovernanceProgramGuide onBack={()=>go('Overview')} onNavigate={go}/>}
  {selected&&section==='Voting'&&poll&&<GovernanceRecord
   title={poll.name} context={poll.kind==='sentiment'?'Advisory poll':'Coin-weighted poll'} subtitle={poll.scope==='fund'?'Funding decisions':'Protocol & funding model'}
   metrics={<><Stat name="Recorded status" value={poll.informal?'Informal':label(poll.status)}/><Stat name="Recorded date" value={date(poll.date)}/><Stat name="Highest question weight" value={poll.totalZec===null?'Not recorded':`${number(poll.totalZec)} ZEC`}/></>}
   sections={[{label:'Outcome',id:'governance-outcome'},{label:'Voting rules',id:'governance-rules'}]} backLabel="All votes" onBack={()=>go('Voting')}
   sources={<><p>Archive review: {date(record.checkedAt)}. Source outcomes do not independently establish payment or deployment.</p>{poll.sources.map((url,i)=><SourceLink key={url} url={url}>Reference {i+1}</SourceLink>)}</>}
  >
   <section id="governance-outcome"><h2>Recorded outcome</h2><p>{poll.outcome??'An outcome is unavailable in the source archive.'}</p>{poll.id==='2026-09-nu7-scope-coinholder-vote'&&<button className={g.secondary} onClick={()=>go('ZCAP')}>Compare with ZCAP<Arrow/></button>}{poll.id==='2026-09-cdrgp-q3-round'&&<button className={g.secondary} onClick={()=>go('Results')}>All 37 proposal results<Arrow/></button>}</section>
   <section id="governance-rules"><h2>Voting rules & scope</h2><p>{poll.quorum??'No threshold recorded here. Consult the published process for this poll.'}</p><p className={g.recordNote}>ZEC weight is not a count of voters. Weights across questions must not be added.</p></section>
  </GovernanceRecord>}
  {selected&&section==='Voting'&&upgrade&&<GovernanceRecord
   title={upgrade.name} context="Network upgrade" subtitle="Protocol decision record"
   metrics={<><Stat name="Recorded stage" value={upgrade.height?'Activated':'Protocol work'}/><Stat name="Activation block" value={upgrade.height?number(upgrade.height):'Not recorded'}/><Stat name="Activation date" value={date(upgrade.time)}/></>}
   sections={[{label:'Decision process',id:'governance-process'}]} backLabel="All votes" onBack={()=>go('Voting')}
   sources={<><p>Compiled OpenZcash record reviewed {date('checkedAt' in upgrade && upgrade.checkedAt ? upgrade.checkedAt : record.checkedAt)}. A poll result is distinct from a release or mainnet activation.</p><SourceLink url={upgrade.source}>Protocol reference</SourceLink></>}
  ><section id="governance-process"><h2>Decision process</h2><p>{upgrade.governance}</p><dl className={g.facts}><div><dt>ZIP references</dt><dd>{upgrade.zips.length?upgrade.zips.map((zip,i)=>{const reference=zipReference(Number(zip));return <span key={zip}>{i>0?', ':''}{reference?<Link section="ZIPs" id={reference.id} onNavigate={go}>ZIP {zip}</Link>:`ZIP ${zip}`}</span>}):'Not recorded'}</dd></div></dl></section></GovernanceRecord>}

  {section==='ZCAP'&&<GovernanceZcap source={data.members} selected={selected} lane={lane} filter={filter} search={search} page={page} basis={basis} onNavigate={go} onSearch={find} onFilter={chooseFilter} onPage={choosePage} onBasis={chooseBasis}/>}

  {!selected&&section==='Results'&&<ResultsCollection {...collectionControls} source={data.verification} lane={lane} onLane={chooseLane}/>}
  {selected&&section==='Results'&&vote&&<GovernanceRecord
   title={vote.title} context={`Coinholder grants · Q3 2026 · Ballot #${vote.ballot}`} subtitle={vote.applicant}
   metrics={<><Stat name="Published outcome" value={vote.published}/><Stat name="Weight on this proposal" value={`${number(vote.total)} ZEC`}/><Stat name="Quorum" value={vote.quorumMet?'Met':'Not met'}/></>}
   sections={[{label:'Ballot',id:'governance-ballot'},{label:'Decision rule',id:'governance-rules'},{label:'Application',id:'governance-application'}]} backLabel="All results" onBack={()=>go('Results')}
   sources={<><p>“Funded” is the voting outcome. Payment records are shown separately under Grants.</p><SourceNote name="Q3 results" source={data.verification}/><p>Vote-chain checks are reported by OpenZcash, not independently repeated here.{verification?.chain?.fetchedAt?` Chain observation: ${date(verification.chain.fetchedAt)}.`:''}</p>{verification?.sources.slice(0,3).map(source=><SourceLink key={source.href} url={source.href}>{source.label}</SourceLink>)}<SourceLink url={vote.noteUrl}>Correction reference</SourceLink></>}
  >
   <section id="governance-ballot"><h2>Ballot breakdown</h2><Tally row={vote}/><p className={g.recordNote}>Values show ZEC voting weight, not individual voters.</p></section>
   <section id="governance-rules"><h2>Decision rule</h2><p>{verification?.rule.text}</p><div className={g.checkRows}><span>Rule calculation<strong>{vote.rule}</strong></span><span>OpenZcash comparison with vote chain<strong>{vote.matchesChain===null?'Not checked':vote.matchesChain?'Matches':'Mismatch'}</strong></span></div>{vote.note&&<p className={g.recordNote}>{vote.note}</p>}</section>
   <section id="governance-application"><h2>Application</h2><p>{roundApplication(vote.id)?.summary??'No archived summary available.'}</p><dl className={g.facts}><div><dt>Requested amount</dt><dd>{dollars(roundApplication(vote.id)?roundApplication(vote.id)!.requestedUsdCents/100:null)}</dd></div></dl><button className={g.secondary} onClick={()=>go('Proposals',`q3:${vote.id}`)}>Application record<Arrow/></button></section>
  </GovernanceRecord>}
  {selected&&section==='Results'&&election&&<GovernanceRecord
   title={election.label} context="ZCG committee election" subtitle="Published election outcome"
   metrics={<><Stat name="Recorded date" value={election.date?date(election.date):election.month}/><Stat name="Ballots" value={election.ballots??'Not recorded'}/><Stat name="Seats" value={election.seats}/></>}
   sections={[{label:'Elected members',id:'governance-elected'}]} backLabel="All results" onBack={()=>go('Results')}
   sources={<><p>Archive review: {date(record.checkedAt)}. The recorded outcome applies to this election.</p>{election.sources.map((url,i)=><SourceLink key={url} url={url}>Election reference {i+1}</SourceLink>)}</>}
  ><section id="governance-elected"><h2>Elected members</h2><div className={g.checkRows}>{election.elected.map(p=><span key={p.name}>{p.name}<strong>{p.approvals??'Not recorded'} approvals</strong></span>)}</div><p className={g.recordNote}>Approval voting can support multiple candidates. Candidate approvals are not added to infer unique voters.</p></section></GovernanceRecord>}

  {!selected&&section==='Insights'&&<GovernanceInsights data={data} lane={lane} onLane={chooseLane} onNavigate={go}/>}
  {section==='Transparency'&&<GovernanceTransparency data={data}/>}
  {selected&&!title&&!loadingCoinholder&&section!=='ZCAP'&&section!=='ZIPs'&&section!=='How it works'&&section!=='Transparency'&&<section className={g.empty}><h1 ref={heading} tabIndex={-1}>Record not found</h1><p>This record is unavailable.</p><button className={g.secondary} onClick={()=>go(section)}>Back to {section.toLowerCase()}</button></section>}
  {!selected&&section==='Overview'&&<div className={g.overviewReferences}><GovernanceReferences/></div>}

 </div></GovernanceReferenceProvider>;
}
