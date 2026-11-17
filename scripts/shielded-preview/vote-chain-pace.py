#!/usr/bin/env python3
"""The coinholder vote's pace in an earlier round, for comparison with the open one.

Reads every vote cast in a finished vote-chain round from the chain's public RPC (one pass: the round is
closed and never changes), places each vote at its block time, and writes, hour by hour since the round
was created, its votes a question: every vote cast, divided by the round's number of questions. (A lone vote
names its question inside the transaction, but older rounds used another message layout, so the total is the
reliable count.) Run once per earlier round:

    python3 scripts/shielded-preview/vote-chain-pace.py
"""
from __future__ import annotations

import datetime as dt
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src/lib/shielded-preview/poll-turnout/nu7-scope-pace.json'
RPC = 'https://prod.explorer-rpc.valargroup.org'
ROUND = '16eef7ebc77e0e04fb1c7329abfcc390f4a0c002964671ebb360914a3e5a3f11'  # NU7 scope poll, Sep 2026
OPEN_ROUND = '290ce255ee4c4d63457a55b3e72e07c579e44b6e578438a01c3eaad5c158991e'  # NU7.1 poll, Nov 2026
EVENTS = ('delegate_and_cast_vote_batch', 'cast_vote_batch', 'cast_vote')
HOUR = 3600


def get(path: str, **params) -> dict:
    url = f'{RPC}{path}?{urllib.parse.urlencode(params)}' if params else f'{RPC}{path}'
    for attempt in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'portal-pace'}), timeout=120) as r:
                return json.load(r)
        except Exception:
            if attempt == 4:
                raise
            time.sleep(3 * (attempt + 1))
    raise RuntimeError('unreachable')


def search(event: str, round_id: str):
    page = 1
    while True:
        result = get('/tx_search', query=f'"{event}.vote_round_id=\'{round_id}\'"', page=page, per_page=50, order_by='"asc"')['result']
        yield from result['txs']
        if page * 50 >= int(result['total_count']) or not result['txs']:
            return
        page += 1


def block_time(height: int) -> float:
    stamp = get('/header', height=height)['result']['header']['time']
    return dt.datetime.fromisoformat(stamp[:26].rstrip('Z') + '+00:00').timestamp()


def question_count(round_id: str) -> int:
    url = f'https://prod.vote-chain-primary.valargroup.org/shielded-vote/v1/round/{round_id}'
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'portal-pace'}), timeout=60) as r:
        return len(json.load(r)['round']['proposals'])


def created(round_id: str) -> tuple[int, float]:
    tx = next(search('create_voting_session', round_id))
    height = int(tx['height'])
    return height, block_time(height)


def main() -> None:
    created_height, opened = created(ROUND)
    casts: list[tuple[int, int]] = []
    for event in EVENTS:
        for tx in search(event, ROUND):
            if tx['tx_result'].get('code'):
                continue
            for e in tx['tx_result']['events']:
                if e['type'] != event:
                    continue
                attrs = {a['key']: a['value'] for a in e['attributes']}
                if attrs.get('vote_round_id') != ROUND:
                    continue
                count = 1 if event == 'cast_vote' else len([x for x in attrs.get('proposal_ids', '').split(',') if x])
                casts.extend((int(tx['height']), 0) for _ in range(count))
    heights = sorted({h for h, _ in casts})
    # Block times from anchors about every 20,000 blocks, placed linearly between them.
    marks = sorted(set([created_height, heights[0], heights[-1], *range(heights[0], heights[-1], 20_000)]))
    anchors = {h: block_time(h) for h in marks}
    keys = sorted(anchors)

    def at(height: int) -> float:
        for lo, hi in zip(keys, keys[1:]):
            if lo <= height <= hi:
                return anchors[lo] + (anchors[hi] - anchors[lo]) * (height - lo) / (hi - lo)
        return anchors[keys[-1]]

    questions = question_count(ROUND)
    times = sorted(at(h) for h, _ in casts)
    hours = int((times[-1] - opened) // HOUR) + 1
    running, i, hourly = 0, 0, []
    for hour in range(hours + 1):
        while i < len(times) and times[i] <= opened + hour * HOUR:
            running += 1
            i += 1
        hourly.append(round(running / questions))
    open_height, open_time = created(OPEN_ROUND)
    record = {
        'round': ROUND,
        'label': 'NU7 scope poll, Sep 2026',
        'source': f'{RPC}/tx_search (cast_vote events of round {ROUND[:12]}…)',
        'openedAt': dt.datetime.fromtimestamp(opened, dt.timezone.utc).isoformat().replace('+00:00', 'Z'),
        'questions': questions,
        'votesCast': len(casts),
        'firstVoteAt': dt.datetime.fromtimestamp(times[0], dt.timezone.utc).isoformat().replace('+00:00', 'Z'),
        'hourly': hourly,
        'openRound': {'round': OPEN_ROUND, 'openedAt': dt.datetime.fromtimestamp(open_time, dt.timezone.utc).isoformat().replace('+00:00', 'Z'), 'height': open_height},
        'readAt': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z'),
    }
    OUT.write_text(json.dumps(record, indent=1) + '\n')
    print(f'{len(casts)} votes over {questions} questions, {len(hourly)} hours, opened {record["openedAt"]}, first vote {record["firstVoteAt"]}')


if __name__ == '__main__':
    main()
