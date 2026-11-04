'use client';

import { useRef, type ReactNode } from 'react';
import { comparisons, questionResult, formatVoteShare, formatVotingWeight } from '@/lib/shielded-preview/comparisons';
import type { Member, Source } from '@/lib/shielded-preview/governance-types';
import GovernanceRecord from './governance-record';
import { Arrow, Empty, Link, Pager, Search, SourceInfo, type CollectionNavigate } from './governance-collections';
import c from './governance-collections.module.css';
import s from './governance-zcap.module.css';
import GovernanceReferences from './governance-references';
import ContextNotice from './context-notice';

const round = comparisons.rounds[0];
const roundMonth = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(round.resultDate));
const questionPrompts: Record<string, string> = {
  issuance: 'Which issuance schedule should Zcash use?',
  reissuance: 'When should reissuance begin?',
  sprout: 'When should Sprout be retired?',
  blocks: 'Should Zcash use shorter block intervals?',
  readiness: 'Should NU7 ship ready features or wait for its full scope?',
};
const memberId = (member: Member) => `member:${JSON.stringify([member.name, member.handle])}`;
const initials = (name: string) => name.replace(/\([^)]*\)/g, '').trim().split(/\s+/).slice(0, 2).map(part => [...part][0]).join('').toUpperCase();
const publicHandle = (handle: string) => /^[A-Za-z0-9_.-]+$/.test(handle) ? `@${handle}` : handle;
const date = (value: string | null) => value ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)) : 'Not recorded';
const pageSize = 12;

function Stat({ name, children }: { name: string; children: ReactNode }) { return <div><span>{name}</span><strong>{children}</strong></div>; }
function Initials({ name }: { name: string }) { return <span className={s.avatar} aria-hidden="true">{initials(name)}</span>; }
function ViewIcon({ members = false }: { members?: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{members ? <><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2"/></> : <><path d="M4 4h16v16H4zM12 4v16M7 9h2m-2 6h2m6-6h2m-2 6h2"/></>}</svg>;
}

type Props = {
  source: Source<Member[]>; selected: string | null; lane: string; filter: string;
  search: string; page: number; basis: 'include' | 'exclude';
  onNavigate: CollectionNavigate; onSearch: (value: string) => void;
  onFilter: (value: string) => void; onPage: (value: number) => void;
  onBasis: (value: 'include' | 'exclude') => void;
};

export default function GovernanceZcap({ source, selected, lane, filter, search, page, basis, onNavigate, onSearch, onFilter, onPage, onBasis }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const member = source.data.find(member => memberId(member) === selected);
  const isMembers = lane === 'members' || selected?.startsWith('member:');
  const question = round.questions.find(question => question.id === filter) ?? round.questions[0];
  const totals = round.bodies.map(body => ({ body, result: questionResult(question, body.id, basis === 'exclude') }));
  const query = search.trim().toLocaleLowerCase('en');
  const members = source.data.filter(member => `${member.name} ${member.handle}`.toLocaleLowerCase('en').includes(query))
    .sort((a, b) => (filter === 'name-desc' ? -1 : 1) * a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true }));
  const currentPage = Math.max(1, Math.min(page, Math.ceil(members.length / pageSize)));
  const displayed = members.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function navigateView(id: string) {
    if (id === 'members') onNavigate('ZCAP', null, { lane: 'members' });
    else onNavigate('ZCAP', null, { lane: 'comparison', filter: id, search: '', page: 1, basis });
  }
  function changePage(value: number) {
    onPage(value);
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  return <div className={`${c.collection} ${s.zcap}`}>
    <nav className={s.viewNav} aria-label="ZCAP sections">
      <button type="button" aria-current={!isMembers ? 'page' : undefined} onClick={() => navigateView(question.id)}><ViewIcon/><span>Vote comparison</span></button>
      <button type="button" aria-current={isMembers ? 'page' : undefined} onClick={() => navigateView('members')}><ViewIcon members/><span>Members</span></button>
    </nav>
    {selected ? member ? <GovernanceRecord
      idPrefix="zcap" title={member.name} context="Zcash Community Advisory Panel" subtitle={member.handle ? `Public handle · ${publicHandle(member.handle)}` : 'No public handle listed'}
      portrait={<Initials name={member.name}/>}
      metrics={<><Stat name="Roster record">Publicly listed</Stat><Stat name="Joined">{member.joined || 'Not recorded'}</Stat><Stat name="Roster date">{date(source.observedAt)}</Stat></>}
      sections={[{ label: 'Participation', id: 'zcap-participation' }]} backLabel="All members" onBack={() => onNavigate('ZCAP', null, { lane: 'members' })}
      sources={<><p>The public roster supplies the name, handle and joined label. Inclusion here does not establish eligibility for every historical or future poll.</p><SourceInfo source={source} name="Public ZCAP roster"/></>}
    >
      <section id="zcap-participation"><h2>Participation & public votes</h2><p>ZCAP polls gather advisory input from eligible panel members. The published results show panel totals; this portal does not attribute an individual ballot to this person.</p><div className={s.related}><Link section="ZCAP" selection={{ lane: 'comparison', filter: 'issuance', search: '', page: 1 }} onNavigate={onNavigate}>Explore the NU7 results<Arrow/></Link><Link section="Voting" selection={{ lane: 'archive' }} onNavigate={onNavigate}>Browse the voting archive<Arrow/></Link></div></section>
    </GovernanceRecord> : <section className={s.missing}><h1>Member record unavailable</h1><p>This member is unavailable in the saved roster.</p><Link section="ZCAP" selection={{ lane: 'members' }} onNavigate={onNavigate}>Browse all members<Arrow/></Link></section> : <div className={c.layout}>
      <div className={isMembers ? s.memberDirectory : s.comparisonWorkspace}>
        {!isMembers && <aside className={s.questionNavigation} aria-label="NU7 ballot navigation">
          <header className={s.questionNavHeading}><h2 className={c.srOnly}>Ballot questions</h2><span>NU7 · {roundMonth}</span></header>
          <nav className={s.questionList} aria-label="NU7 ballot questions">{round.questions.map((item, index) => <button key={item.id} type="button" aria-current={item.id === question.id ? 'page' : undefined} aria-controls="zcap-comparison" aria-label={`Question ${index + 1}: ${item.title}`} onClick={() => navigateView(item.id)}>
            <span className={s.questionNumber}>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong><Arrow/>
          </button>)}</nav>
          <label className={s.mobileQuestion}><span className={c.srOnly}>Choose a question</span><select aria-label="NU7 ballot question" value={question.id} onChange={event => navigateView(event.target.value)}>{round.questions.map((item, index) => <option key={item.id} value={item.id}>{index + 1}. {item.title}</option>)}</select></label>
          <Link section="Voting" id="poll:2026-09-nu7-scope-coinholder-vote" onNavigate={onNavigate} className={s.pollLink}>Poll details & rules<Arrow/></Link>
        </aside>}

        <section className={isMembers ? s.memberPanel : s.votePanel} aria-labelledby="zcap-heading">
          {isMembers ? <>
            <h2 id="zcap-heading" className={c.srOnly} ref={heading} tabIndex={-1}>ZCAP member directory</h2>
            <div className={s.directoryToolbar}><Search name="Search ZCAP members" value={search} onChange={onSearch}/><select aria-label="Sort members" value={filter === 'name-desc' ? 'name-desc' : 'all'} onChange={event => onFilter(event.target.value)}><option value="all">Name A–Z</option><option value="name-desc">Name Z–A</option></select></div>
            <div className={s.directoryColumns} aria-hidden="true">{[0, 1].map(column => <div key={column}><span>Member</span><span>Joined</span><span/></div>)}</div>
            <ul className={s.members} aria-label="ZCAP members">{displayed.map(member => <li key={memberId(member)}>
              <Link section="ZCAP" id={memberId(member)} selection={{ lane: 'members', filter, search, page: currentPage }} onNavigate={onNavigate} className={s.memberRow}>
                <div className={s.memberIdentity}><Initials name={member.name}/><div><h3>{member.name}</h3>{member.handle && <p>{publicHandle(member.handle)}</p>}</div></div>
                <span className={s.joined}><span>Joined </span>{member.joined || 'Not recorded'}</span><Arrow/>
              </Link>
            </li>)}</ul>
            {!members.length && <Empty onReset={() => { onSearch(''); onFilter('all'); }}/>}<div className={s.directoryPager}><Pager page={currentPage} total={members.length} onPage={changePage}/></div>
          </> : <>
            <header className={s.comparisonHeader}>
              <h2 id="zcap-heading" ref={heading} tabIndex={-1}>{questionPrompts[question.id] ?? question.title}</h2>
              <div className={s.basis} role="group" aria-label="Percentage basis"><button aria-pressed={basis === 'include'} onClick={() => onBasis('include')}>All responses</button><button aria-pressed={basis === 'exclude'} onClick={() => onBasis('exclude')}>Exclude abstentions</button></div>
            </header>
            <div className={s.comparison} id="zcap-comparison">
              <div className={`${s.voteHeader} ${s.voteGrid}`}><div className={s.responseHeading}><span>Response</span></div>{totals.map(({ body, result }) => <div className={s.bodyTotal} key={body.id}>
                <h3>{body.name}</h3><strong data-long={formatVotingWeight(result.denominator, body.decimals).length > 10 || undefined}>{formatVotingWeight(result.denominator, body.decimals)}</strong><span>{body.unit === 'votes' ? 'member ballots' : 'ZEC voting weight'}</span>
              </div>)}</div>
              <div role="list" aria-label="Responses by voting body">{question.options.map((option, index) => <div className={`${s.voteGrid} ${s.voteRow}`} key={option.id} role="listitem">
                <div className={s.option}><h3>{option.label}</h3>{option.abstention && basis === 'exclude' && <span>Excluded from percentages</span>}</div>
                {totals.map(({ body, result }) => {
                  const item = result.options[index];
                  return <div className={s.voteValue} key={body.id} data-excluded={!item.included || undefined}><span className={s.bodyName}>{body.name}</span><strong>{formatVoteShare(item.percent, item.weight, result.denominator)}</strong><span className={s.bar} aria-hidden="true"><span style={{ width: `${item.percent ?? 0}%` }}/></span><span className={s.raw}>{formatVotingWeight(item.weight, body.decimals)} {body.unit}</span></div>;
                })}
              </div>)}</div>
            </div>
          </>}
        </section>
      </div>

      <ContextNotice>{isMembers ? 'The joined field preserves the source label. It does not determine eligibility for a specific poll.' : 'Each group uses its own percentage base. These advisory responses do not establish protocol activation.'}</ContextNotice>
      <GovernanceReferences key={isMembers ? 'members' : question.id}><aside className={c.aside} aria-label={isMembers ? 'Roster context and sources' : 'Voting context and sources'}>
        {isMembers ? <><SourceInfo source={source} name="Public ZCAP roster"/><div className={c.related}><Link section="ZCAP" selection={{ filter: 'issuance', lane: 'comparison', search: '', page: 1 }} onNavigate={onNavigate}>Compare panel responses<Arrow/></Link><Link section="Voting" selection={{ lane: 'archive' }} onNavigate={onNavigate}>Voting archive<Arrow/></Link></div></> : <>
          <div><h3>Voting basis</h3><dl className={c.definitions}><div><dt>ZCAP</dt><dd>One eligible member, one ballot. Questions may be skipped.</dd></div><div><dt>Coinholders</dt><dd>ZEC voting weight, not a count of people.</dd></div></dl>
          <p className={s.note}>Labels are shortened; original ballots are linked alongside.</p>
          <details className={s.method}><summary>Participation & scope</summary><p>{round.bodies[0].participation}</p><p>{round.bodies[1].participation}</p><p>{round.note}</p></details></div>
          <div><div className={s.sources}><span>Published tallies · reviewed {date(comparisons.checkedAt)}</span>{round.bodies.map(body => <a key={body.id} href={body.sourceUrl} target="_blank" rel="noopener noreferrer">{body.name} source<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></a>)}</div>
          <div className={c.related}><Link section="Voting" id="poll:2026-09-nu7-scope-coinholder-vote" onNavigate={onNavigate}>Poll details & rules<Arrow/></Link><Link section="ZCAP" selection={{ lane: 'members' }} onNavigate={onNavigate}>Browse panel members<Arrow/></Link></div></div>
        </>}
      </aside></GovernanceReferences>
    </div>}
  </div>;
}
