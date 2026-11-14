import { describe, expect, it } from 'vitest';
import { governanceProcess, type ProcessBlock } from './governance-process';

const section = (id: string) => governanceProcess.sections.find(item => item.id === id)!;
const tables = (id: string) => section(id).blocks.filter((block): block is Extract<ProcessBlock, { kind: 'table' }> => block.kind === 'table');
const lists = (id: string) => section(id).blocks.filter((block): block is Extract<ProcessBlock, { kind: 'list' }> => block.kind === 'list');

/** ZIP 0 is the source for what the ZIP editors do: https://zips.z.cash/zip-0000, read on 14 Nov 2026. */
describe('How it works: the ZIP editors and the ZIP lifecycle, as ZIP 0 has them', () => {
  const [, does, cannot] = tables('who-does-what')[0].rows.find(row => row[0] === 'ZIP editors')!.map(String);

  it('says the editors review content as well as format, may reject on the listed grounds and approve changes of status', () => {
    expect(does).toContain('content and format');
    expect(does).toContain('may reject');
    expect(does).toContain('grounds listed in ZIP 0');
    expect(does).toContain('every change of status except');
    expect(does).not.toContain('form and clarity');
  });

  it('limits them where ZIP 0 does: a refusal needs a ground and an explanation, an override needs a public rationale, and they activate nothing', () => {
    expect(cannot).not.toContain('whether a proposal is good');
    expect(cannot).toContain('explanation');
    expect(cannot).toContain('public rationale');
    expect(cannot).toContain('activate');
  });

  it('says under the table who the editors are tied to and what is not their primary responsibility', () => {
    const notes = section('who-does-what').blocks.filter((block): block is Extract<ProcessBlock, { kind: 'p' }> => block.kind === 'p').map(block => block.text);
    const note = notes.find(text => text.startsWith('ZIP 0 names the current ZIP editors'));
    expect(note).toBeDefined();
    for (const part of ['Shielded Labs among them', 'conflicts of interest', 'not their primary responsibility']) expect(note, part).toContain(part);
  });

  it('names every status of ZIP 0 in the lifecycle, and Rejected as a status, not as the refusal of a draft', () => {
    const lifecycle = lists('what-a-zip-is')[0].items.find(item => item.title === 'Lifecycle:')!.text;
    for (const status of ['Draft', 'Proposed', 'Implemented', 'Final', 'Active', 'Withdrawn', 'Rejected', 'Obsolete', 'Reserved']) expect(lifecycle, status).toContain(status);
    expect(lifecycle).toContain('Rejected marks a ZIP with no progress for a year');
  });

  it('gives the test ZIP 0 sets for leaving Draft, apart from the polls', () => {
    const step = lists('what-a-zip-is')[0].items.find(item => item.title === 'From Draft to Proposed:')!.text;
    for (const part of ['rough consensus on the forums', 'consensus among the ZIP editors', 'independent security review', 'Proposed is not activation']) expect(step, part).toContain(part);
    const stages = lists('from-idea-to-activation')[0].items;
    expect(stages).toHaveLength(7);
    expect(stages[4].text, 'the stage about reading the polls').not.toContain('Proposed');
  });

  it('places the editor review on the path from idea to activation, with what owners may do', () => {
    const draft = lists('from-idea-to-activation')[0].items[1].text;
    for (const part of ['ZIP editors typically review', 'owners may decline', 'by consensus they may reject']) expect(draft, part).toContain(part);
  });

  it('keeps ZIP 0 among the sources of the guide', () => {
    expect(governanceProcess.sources.map(source => source.href)).toContain('https://zips.z.cash/zip-0000');
  });
});
