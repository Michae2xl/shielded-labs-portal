import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSivCount, parseSivHistory, recordSivCount, ZCAP_COUNT_URL, ZCAP_STATUS_URL } from '../../src/lib/shielded-preview/poll-turnout/siv-history.ts';

export async function readApi(fetcher = fetch) {
  const response = await fetcher(ZCAP_COUNT_URL, {
    headers: { Accept: 'application/json', 'User-Agent': 'Shielded-Labs-ZCAP-Turnout' },
    signal: AbortSignal.timeout(20_000), redirect: 'error',
  });
  if (!response.ok) throw new Error(`SIV returned HTTP ${response.status}`);
  const text = await response.text();
  if (text.length > 16_000) throw new Error('SIV response too large');
  return parseSivCount(JSON.parse(text));
}

/** A normal browser read of the public counter. No credentials, challenge solving, or ballot inspection. */
async function readBrowser() {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(ZCAP_STATUS_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.getByRole('heading', { name: 'ZCAP NU7.1 Poll (November 2026)', exact: true }).waitFor({ timeout: 45_000 });
    const badge = page.getByText(/^Total votes cast:\s*\d+$/);
    await badge.waitFor({ timeout: 45_000 });
    const match = (await badge.innerText()).match(/^Total votes cast:\s*(\d+)$/);
    if (!match) throw new Error('SIV public counter unavailable');
    return parseSivCount({ num_votes: Number(match[1]), num_pending_votes: 0, num_invalidated_votes: 0 });
  } finally {
    await browser.close();
  }
}

export async function collect(history, { api = readApi, browser = readBrowser, now = () => new Date().toISOString() } = {}) {
  let ballots;
  let method = 'api';
  try { ballots = await api(); }
  catch {
    ballots = await browser();
    method = 'browser';
  }
  return recordSivCount(history, ballots, now(), method);
}

async function main() {
  const output = resolve(process.argv[2] || 'build/zcap.json');
  const initial = new URL('../../src/lib/shielded-preview/poll-turnout/zcap-history.json', import.meta.url);
  let contents;
  try { contents = await readFile(output, 'utf8'); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    contents = await readFile(initial, 'utf8');
  }
  const previous = parseSivHistory(JSON.parse(contents));
  const last = previous.observations.at(-1);
  // Capture the first successful reading after closing, then leave the archive alone.
  if (Date.parse(last.at) >= Date.parse('2026-12-01T02:59:00Z') && last.method !== 'manual') {
    console.log('Final ZCAP turnout already recorded.');
    return;
  }
  const next = await collect(previous);
  await mkdir(dirname(output), { recursive: true });
  const temporary = `${output}.tmp`;
  await writeFile(temporary, JSON.stringify(next, null, 2) + '\n');
  await rename(temporary, output);
  const current = next.observations.at(-1);
  console.log(`ZCAP: ${current.ballots} total (${current.ballots - last.ballots} new), checked ${current.at} via ${current.method}.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(`ZCAP sync failed; previous history preserved: ${error.message}`); process.exitCode = 1; });
}
