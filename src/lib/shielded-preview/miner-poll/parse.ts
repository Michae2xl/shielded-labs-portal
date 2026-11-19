import { parse, type HTMLElement } from 'node-html-parser';
import { eligibleBlocks, minerPoll, type MinerQuestion, type MinerReading } from './poll';

const integer = (text: string | undefined) => {
  if (!text || !/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(text.trim())) return NaN;
  return Number(text.replaceAll(',', ''));
};

// Only accept named options with explicit block counts, associated with a numbered question.
// A different layout can still supply verified summary totals and a link to the official results.
function readQuestions(main: HTMLElement, withBallot: number): MinerQuestion[] | null {
  const questions = new Map<number, MinerQuestion>();
  let id: number | null = null;
  for (const el of main.querySelectorAll('h2, h3, .legend')) {
    if (!el.classList.contains('legend')) {
      const match = /^\s*(?:Question\s+|Q)([1-5])\b/i.exec(el.text);
      id = match ? Number(match[1]) : null;
      continue;
    }
    if (!id || questions.has(id)) return null;
    const values = new Map<string, number>();
    for (const item of el.children) {
      const match = /^(Support|Oppose|Abstain)\s*[:·–-]?\s*([\d,]+)(?:\s+blocks?)?(?:\s*\([\d.]+%\))?$/i.exec(item.text.trim());
      if (!match) continue;
      const key = match[1].toLowerCase();
      if (values.has(key)) return null;
      values.set(key, integer(match[2]));
    }
    const support = values.get('support');
    const oppose = values.get('oppose');
    const abstain = values.get('abstain');
    if (support == null || oppose == null || abstain == null || !(support + oppose + abstain <= withBallot)) return null;
    questions.set(id, { id, support, oppose, abstain });
    id = null;
  }
  return questions.size === 5 ? [...questions.values()].sort((a, b) => a.id - b.id) : null;
}

export function parseMinerTally(html: string): MinerReading {
  const main = parse(html).querySelector('main');
  if (!main || main.querySelector('h1')?.text.trim() !== 'NU7.1 miner poll' || main.querySelector('.demo')) {
    throw new Error('Expected the official NU7.1 tally');
  }

  const tiles = new Map(main.querySelectorAll('.tiles h3').map(heading => [
    heading.text.trim(), heading.nextElementSibling?.text.trim(),
  ]));
  const stamp = /Updated\s+(\d{4}-\d\d-\d\d)\s+(\d\d:\d\d) UTC, at Mainnet block ([\d,]+)\./i.exec(main.querySelector('footer')?.text ?? '');
  const height = integer(stamp?.[3]);
  const tallied = integer(tiles.get('Blocks tallied'));
  const withBallot = integer(tiles.get('Blocks with a ballot'));
  const available = Math.max(0, Math.min(height, minerPoll.end) - minerPoll.start + 1);
  if (!stamp || !Number.isSafeInteger(height) || !Number.isSafeInteger(tallied) || !Number.isSafeInteger(withBallot)
      || tallied > available || withBallot > tallied) {
    throw new Error('Incomplete or inconsistent miner tally');
  }
  const updatedAt = new Date(stamp[1] + 'T' + stamp[2] + ':00Z').toISOString();
  const final = /^final(?:ized)?$/i.test(tiles.get('Status') ?? '')
    && tallied === eligibleBlocks && height >= minerPoll.end + minerPoll.confirmations - 1;
  const phase = height < minerPoll.start ? 'upcoming' : final ? 'final' : tallied === eligibleBlocks ? 'confirming' : 'counting';
  return { updatedAt, height, tallied, withBallot, phase, questions: tallied > 0 ? readQuestions(main, withBallot) : null };
}
