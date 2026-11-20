import { describe, expect, it } from 'vitest';
import { readCaucusTotals } from './parse';
import { electionPath } from './poll';

function page(cast: string, total: number) {
  return `<main><h3 class="title">Election <a href="${electionPath}/view">back</a></h3>
    <p><b>${cast}</b></p>Voters 1 - 50 (of ${total})&nbsp;
    <a href="?page=2">next 50</a><table class="pretty"><tr><td>1 cast vote</td></tr></table></main>`;
}

describe('Helios public participation', () => {
  it('uses the electorate across pages and the aggregate ballot count', () => {
    expect(readCaucusTotals(page('19 cast votes', 63))).toEqual({ cast: 19, eligible: 63 });
    expect(readCaucusTotals(page('1 cast vote', 63)).cast).toBe(1);
    expect(readCaucusTotals(page('0 cast votes', 63)).cast).toBe(0);
  });
  it('rejects a missing total, impossible turnout, or another election', () => {
    expect(() => readCaucusTotals(page('', 63))).toThrow();
    expect(() => readCaucusTotals(page('64 cast votes', 63))).toThrow();
    expect(() => readCaucusTotals(page('19 cast votes', 63).replace(electionPath, '/other'))).toThrow();
  });
});
