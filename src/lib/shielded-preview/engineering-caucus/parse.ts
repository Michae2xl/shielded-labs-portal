import { parse } from 'node-html-parser';
import { electionPath } from './poll';

export function readCaucusTotals(html: string) {
  const page = parse(html);
  if (page.querySelector('h3.title a')?.getAttribute('href') !== electionPath + '/view') {
    throw new Error('Unexpected Helios election');
  }

  const castLabel = page.querySelectorAll('p > b').map(el => el.text.trim())
    .find(label => /^\d+ cast votes?$/i.test(label));
  // Helios prints the electorate size beside its pagination, outside the voter table.
  const roster = page.querySelector('table.pretty');
  const pagination = roster?.parentNode?.childNodes
    .filter(node => node.nodeType === 3).map(node => node.text).join(' ');
  const total = pagination?.match(/\bVoters\s+\d+\s*-\s*\d+\s*\(of\s+(\d+)\)/i);
  if (!castLabel || !total) throw new Error('Missing Helios totals');
  const cast = Number.parseInt(castLabel, 10);
  const eligible = Number(total[1]);
  if (!Number.isSafeInteger(cast) || !Number.isSafeInteger(eligible) || eligible < 1 || cast > eligible) {
    throw new Error('Inconsistent Helios totals');
  }
  return { cast, eligible };
}
