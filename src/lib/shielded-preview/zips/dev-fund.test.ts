import { describe, expect, it } from 'vitest';
import { bundledZips } from './library';
import { statementPreview, proposalCoverage, proposalsBySignals, proposalAims, relatedXDiscussion, proposalStructure, independentPositions, proposalGroup, copyExplorerParams, explorerState, fundProposals, fundRelations, fundStatements, matchingProposals, outsidePollRound, pollRound, proposalStatements } from './dev-fund';

describe('Dev Fund evidence boundaries', () => {
  it('keeps withdrawn and closed proposals out of the default set, but searchable in history', () => {
    expect(matchingProposals('', false).map(p => p.id)).not.toContain('nsm-stream');
    expect(matchingProposals('taper', false)).toEqual([]);
    expect(matchingProposals('taper', true)[0].stage).toBe('Withdrawn');
    expect(matchingProposals('1414', true)[0].stage).toBe('Withdrawn');
  });
  it('pins every open draft to the reviewed document and its recorded owners', () => {
    for (const p of fundProposals.filter(p => p.stage === 'Open draft')) {
      const entry = bundledZips.entries.find(e => e.id === p.record)!;
      expect(entry).toBeDefined();
      expect(entry.pull?.headSha).toBe(p.revision);
      expect(p.source).toContain(`/blob/${p.revision}/`);
      expect(p.authors.map(name => name.replace(/ \(.+\)$/, ''))).toEqual(entry.owners.map(name => name.replace(/ \(.+\)$/, '')));
    }
  });
  it('records a pull request the editors merged as a draft in the ZIPs repository, not as an open pull request or an approval', () => {
    const lockbox = fundProposals.find(p => p.id === 'lockbox')!;
    const entry = bundledZips.entries.find(e => e.id === lockbox.record)!;
    expect(lockbox.stage).toBe('Merged draft');
    expect(entry).toMatchObject({ kind: 'draft', status: 'Draft', pullRequest: 'https://github.com/zcash/zips/pull/1428' });
    expect(entry.pull).toBeUndefined();
    expect(lockbox.source).toContain(`/blob/${lockbox.revision}/`);
    expect(lockbox.merged).toEqual({ on: '2026-11-11', source: 'https://github.com/zcash/zips/pull/1428' });
    expect(lockbox.authors.map(name => name.replace(/ \(.+\)$/, ''))).toEqual(entry.owners.map(name => name.replace(/ \(.+\)$/, '')));
    expect(proposalStructure(lockbox)).toBe('Proposed change');
  });
  it('requires identifiable, dated sources for statements and does not count co-authorship as independent support', () => {
    for (const item of fundStatements) {
      expect(fundProposals.some(p => p.id === item.proposal)).toBe(true);
      expect(item.url).toMatch(/^https:\/\/(forum\.zcashcommunity\.com\/t\/\d+\/\d+|x\.com\/\w+\/status\/\d+)$/);
      expect(Number.isFinite(Date.parse(item.date))).toBe(true);
      expect(item.context.length).toBeGreaterThan(20);
    }
    expect(proposalStatements('lockbox').find(s => s.person === 'ebfull')?.author).toBe(true);
    expect(proposalStatements('wind-down').length).toBeGreaterThan(0);
    expect(fundProposals.find(p => p.id === 'no-change')?.stage).toBe('Baseline');
  });
  it('keeps complementary decisions distinct from alternatives', () => {
    expect(fundRelations.find(r => r.from === 'wind-down' && r.to === 'nsm-stream')?.label).toContain('withdrawn draft');
    for (const r of fundRelations) {
      expect(fundProposals.some(p => p.id === r.from)).toBe(true);
      expect(fundProposals.some(p => p.id === r.to)).toBe(true);
      expect(r.source).toMatch(/^https:\/\//);
    }
  });
});
describe('ZIP explorer navigation', () => {
  it('normalizes malformed links, duplicate selections and the comparison limit', () => {
    const state = explorerState(new URLSearchParams('layout=invalid&focus=missing&compare=zap,zap,missing,lockbox,wind-down,taper'));
    expect(state.layout).toBe('list');
    expect(state.focus).toBe('lockbox');
    expect(state.compared).toEqual(['zap', 'lockbox', 'wind-down']);
    expect(explorerState(new URLSearchParams('compare=')).compared).toEqual([]);
  });
  it('retains selected map and comparison state when opening and returning from a document', () => {
    const current = new URLSearchParams('section=zips&topic=dev-fund&layout=map&focus=zap&compare=zap,wind-down&dq=pool&past=1');
    const document = new URLSearchParams('section=zips&record=pr-1431-draft-dairaemma-governance-zap');
    copyExplorerParams(current, document);
    const back = new URLSearchParams('section=zips');
    copyExplorerParams(document, back);
    expect(explorerState(back)).toEqual(explorerState(current));
    const other = new URLSearchParams('section=voting');
    copyExplorerParams(current, other);
    expect(other.toString()).toBe('section=voting');
  });
  it('returns legacy document links to the library', () => {
    const back = new URLSearchParams('section=zips');
    copyExplorerParams(new URLSearchParams('section=zips&record=zip-1016'), back);
    expect(explorerState(back).topic).toBe('library');
  });
});

describe('Evidence bars and expanded landscape', () => {
  it('counts accounts once across sources and excludes every author statement', () => {
    const positions = independentPositions('lockbox');
    expect(positions.length).toBeGreaterThan(7);
    expect(positions.some(p => p.person === 'ebfull')).toBe(false);
    expect(new Set(positions.map(p => p.person)).size).toBe(positions.length);
    expect(independentPositions('lockbox', 'X').map(p => p.person)).toEqual(expect.arrayContaining(['naval', 'BarrySilbert', 'jswihart', 'inthepixels', 'tyler', 'unklealex22']));
    expect(positions.some(p => p.person === 'zooko')).toBe(false);
    expect(positions.find(p => p.person === 'tyler')?.url).toContain('2116209929518494040');
    expect(relatedXDiscussion.url).toContain('/tyler/status/');
    expect(proposalStructure(fundProposals.find(p => p.id === 'no-change')!)).toBe('Current rules reference');
    expect(proposalStructure(fundProposals.find(p => p.id === 'nsm-stream')!)).toBe('Historical proposal');
    expect(proposalStructure(fundProposals.find(p => p.id === 'lockbox')!)).toBe('Proposed change');
    expect(independentPositions('lockbox', 'Forum').length).toBeGreaterThan(3);
    expect(independentPositions('coin-quorum')).toEqual([]);
  });
  it('includes historical records by default and keeps topic filters distinct', () => {
    expect(fundProposals).toHaveLength(17);
    expect(explorerState(new URLSearchParams()).past).toBe(true);
    expect(explorerState(new URLSearchParams('past=0')).past).toBe(false);
    expect(explorerState(new URLSearchParams()).panel).toBe('network');
    expect(matchingProposals('',true,'Voting').every(p => proposalGroup(p) === 'Voting')).toBe(true);
    expect(matchingProposals('1455',true)[0].id).toBe('coinholder-elections');
    expect(matchingProposals('1421',false)).toEqual([]);
  });
});


describe('Beginner-friendly filters', () => {
  it('preserves legacy history links while supporting a history-only selection', () => {
    expect(explorerState(new URLSearchParams('past=0')).status).toBe('current');
    const historical = explorerState(new URLSearchParams('past=0&status=historical'));
    expect(historical.past).toBe(true);
    expect(matchingProposals('',historical.past,'all',historical.status).map(p=>p.id)).toEqual(['nsm-stream','taper','miner-original']);
    expect(matchingProposals('1414',false,'all','current')).toEqual([]);
    expect(matchingProposals('1414',true,'all','historical')).toHaveLength(1);
    expect(matchingProposals('',true,'Voting','historical').map(p=>p.id)).toEqual(['miner-original']);
    expect(explorerState(new URLSearchParams('status=invalid')).status).toBe('all');
  });
  it('retains status and source filters on document return and honors old map links', () => {
    const current = new URLSearchParams('section=zips&status=historical&group=Voting&panel=signals&channel=X');
    const back = new URLSearchParams('section=zips');
    copyExplorerParams(current,back);
    expect(explorerState(back)).toEqual(explorerState(current));
    expect(explorerState(back).panel).toBe('signals');
  });
});


describe('Inclusive community evidence', () => {
  it('includes ordinary accounts, excludes contributors and keeps experience separate', () => {
    const positions = independentPositions('zap');
    for (const person of ['zecretary','CR8','arya2','CryptoEpoch','Hayri','pacu','paulbrigner']) {
      expect(positions.some(p => p.person === person && p.kind === 'Support')).toBe(true);
    }
    expect(positions.some(p => p.person === 'emersonian')).toBe(false);
    expect(positions.some(p => p.kind === 'Discussion')).toBe(false);
    expect(positions.some(p => p.person === 'Zeceggwatcher' && p.kind === 'Opposition')).toBe(true);
    expect(proposalStatements('zap').filter(p=>p.kind==='Discussion')).toHaveLength(2);
    expect(new Set(positions.map(p=>p.person.toLowerCase())).size).toBe(positions.length);
    expect(independentPositions('zap','X').map(p=>p.kind)).toEqual(expect.arrayContaining(['Support','Concern','Opposition']));
    expect(independentPositions('zap','X').some(p=>p.person==='rollergirlVi')).toBe(false);
  });
  it('preserves revised-text provenance rather than implying every response addresses the pinned PR', () => {
    for (const n of [285,294]) {
      const item = fundStatements.find(p=>p.id===`zap-forum-${n}`)!;
      expect(item.versionSource).toContain('ad90f2e5b7318338ac9490702c3b0f653a5643a8');
      expect(item.context).toContain('not the pinned PR');
    }
  });
  it('offers a source-backed stated aim for every record and distinct neutral positions elsewhere', () => {
    for (const p of fundProposals) expect(proposalAims[p.id]?.length).toBeGreaterThan(20);
    expect(independentPositions('town-square').map(p=>p.kind)).toEqual(expect.arrayContaining(['Support','Concern','Opposition']));
    expect(independentPositions('member-grants')[0].kind).toBe('Support');
  });
});

describe('Public position ordering', () => {
  it('ranks recorded positions first for each source without mutating the proposal list', () => {
    const input = [...fundProposals];
    for (const channel of ['all', 'Forum', 'X']) {
      const sorted = proposalsBySignals(input, channel);
      const counts = sorted.map(p => independentPositions(p.id, channel).length);
      expect(counts).toEqual([...counts].sort((a,b) => b-a));
      expect(sorted.map(p => p.id).sort()).toEqual(input.map(p => p.id).sort());
    }
    expect(input).toEqual(fundProposals);
    expect(proposalsBySignals(input)[0].id).toBe('lockbox');
    expect(proposalsBySignals(input, 'X')[0].id).toBe('lockbox');
  });
  it('preserves topic and search filters when ranking', () => {
    const input = matchingProposals('', false, 'Governance');
    expect(proposalsBySignals(input).every(p => proposalGroup(p) === 'Governance')).toBe(true);
    expect(proposalsBySignals([])).toEqual([]);
  });
});

it('records review coverage for every proposal without turning missing statements into opposition', () => {
  expect(Object.keys(proposalCoverage).sort()).toEqual(fundProposals.map(p=>p.id).sort());
  expect(independentPositions('seven-seats')).toEqual([]);
  expect(proposalCoverage['seven-seats'].forum).toContain('only the author');
  expect(proposalStatements('lock-weighted').length).toBeGreaterThan(0);
  expect(independentPositions('wind-down').map(p=>p.kind)).toEqual(expect.arrayContaining(['Support','Concern','Opposition']));
  for (const p of fundProposals) {
    for (const channel of ['all','Forum','X']) {
      const positions = independentPositions(p.id,channel);
      expect(new Set(positions.map(p=>p.person.toLowerCase())).size).toBe(positions.length);
      expect(positions.every(p=>!p.author && p.kind!=='Discussion')).toBe(true);
    }
  }

});

it('marks as outside the November poll exactly the open drafts whose pull request opened after the deadline', () => {
  const opened = (record: string | undefined) => bundledZips.entries.find(entry => entry.id === record)?.pull?.createdAt ?? null;
  const drafts = fundProposals.filter(proposal => proposal.stage === 'Open draft');
  const late = drafts.filter(proposal => { const at = opened(proposal.record); return at !== null && Date.parse(at) > Date.parse(pollRound.deadline); });
  expect(late.map(proposal => proposal.id).sort()).toEqual([...pollRound.late].sort());
  expect(fundProposals.filter(outsidePollRound).map(proposal => proposal.pr).sort()).toEqual([1449, 1450, 1451, 1452, 1453, 1454, 1455]);
  // The decision is the organizers' own post; nothing is marked as included.
  expect(pollRound.source).toBe('https://forum.zcashcommunity.com/t/58906/39');
  expect(outsidePollRound(fundProposals.find(proposal => proposal.id === 'lockbox')!)).toBe(false);
  expect(outsidePollRound(fundProposals.find(proposal => proposal.id === 'no-change')!)).toBe(false);
});

describe('A short preview of the statements', () => {
  it('takes every stance in turn, so six statements are not a one-sided sample', () => {
    const statements = proposalStatements('lockbox');
    const preview = statementPreview(statements, 6);
    expect(preview.size).toBe(6);
    const shown = statements.filter(item => preview.has(item.id));
    const stances = [...new Set(statements.map(item => item.kind))];
    for (const stance of stances) expect(shown.some(item => item.kind === stance), stance).toBe(true);
    const counts = stances.map(stance => shown.filter(item => item.kind === stance).length);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });
  it('shows everything when there is no more than the preview holds', () => {
    const few = proposalStatements('lockbox').slice(0, 4);
    expect(statementPreview(few, 6)).toEqual(new Set(few.map(item => item.id)));
    expect(statementPreview([], 6).size).toBe(0);
  });
});

describe('Wind-down draft as its author revised it on 10 Nov 2026', () => {
  const draft = fundProposals.find(proposal => proposal.id === 'wind-down')!;
  it('describes the revision the pull request now points to', () => {
    expect(draft.revision).toBe('0f0e440bcdc52152d16046463ca04cbcbfec22bc');
    expect(draft.source).toContain(draft.revision);
    expect(`${draft.summary} ${draft.stream} ${draft.treasury}`).toContain('Lockbox');
    expect(`${draft.summary} ${draft.treasury}`).not.toMatch(/funds (go )?to the NSM/);
    expect(draft.revised).toMatchObject({ on: '2026-11-10' });
    expect(draft.revised!.source).toContain('/58515/145');
  });
  it('ties the earlier statements to the revision they were about', () => {
    const earlier = proposalStatements('wind-down').filter(item => item.date < '2026-11-10');
    expect(earlier.length).toBeGreaterThan(0);
    for (const item of earlier) expect(item.versionSource, item.id).toContain('425f849ff7008b55cfc7a4441215d51167535ab6');
  });
  it('links it to the Lockbox it now pays into', () => {
    expect(fundRelations.find(relation => relation.from === 'lockbox' && relation.to === 'wind-down')?.label).toContain('Lockbox');
  });
});

describe('ZAP draft as its owners revised it on 11 Nov 2026', () => {
  const draft = fundProposals.find(proposal => proposal.id === 'zap')!;
  const compare = 'https://github.com/zcash/zips/compare/ad90f2e5b7318338ac9490702c3b0f653a5643a8...28d7618d21971c747c4db3680755d816110acaf1';
  it('describes the revision the pull request now points to, with both recorded owners', () => {
    expect(draft.revision).toBe('28d7618d21971c747c4db3680755d816110acaf1');
    expect(draft.source).toContain(draft.revision);
    expect(draft.authors).toEqual(['Daira-Emma Hopwood', 'Violet Rollergirl']);
  });
  it('says what changed and points at the comparison of the two revisions', () => {
    expect(draft.revised).toMatchObject({ on: '2026-11-11', source: compare });
    expect(draft.revised!.text).toMatch(/further disbursement/);
    expect(draft.revised!.text).toMatch(/development/);
    expect(draft.revised!.text).toMatch(/earlier versions/);
  });
  it('keeps the owner added by the revision out of the independent positions on that draft', () => {
    const own = proposalStatements('zap').filter(item => item.person === 'rollergirlVi');
    expect(own.length).toBeGreaterThan(0);
    for (const item of own) { expect(item.author, item.id).toBe(true); expect(item.context, item.id).toMatch(/owner/); }
    expect(independentPositions('zap').some(item => item.person === 'rollergirlVi')).toBe(false);
    // Elsewhere the same account is disclosed as an owner of a competing draft.
    expect(fundStatements.find(item => item.id === 'lockbox-x-2118166418625876370')!.context).toMatch(/owner of the ZAP draft/);
  });
  it('still ties the responses to the 5 Nov text to that text, not to the pinned revision', () => {
    for (const n of [285, 294]) expect(fundStatements.find(item => item.id === `zap-forum-${n}`)!.versionSource).not.toContain(draft.revision);
  });
});
