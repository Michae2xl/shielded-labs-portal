#!/usr/bin/env python3
"""Refresh the bundled copies of two ZCG records the portal reads live.

- The grants tab of the ZCG sheet, as CSV: milestones, estimated dates and recorded payments.
- The meeting-minutes topics of the "Community Grants Updates" forum category.

The portal shows these dated copies before its first live read and whenever a source refuses one,
so a restart never empties the lists. Both are saved as the sources return them; the portal's own
readers (zcg-schedule.ts, zcg-minutes.ts) do the parsing.
"""
import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

DATA = Path(__file__).resolve().parents[2] / 'src/lib/shielded-preview/governance-data'
SHEET = '1FQ28rDCyRW0TiNxrm3rgD8ai2KGUsXAjPieQmI1kKKg'
GRANTS_TAB = '803214474'
CATEGORY = 'https://forum.zcashcommunity.com/c/grants/zomg-updates/34.json'
PAGES = 40


def read(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Shielded-Labs-Portal'})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read().decode('utf-8')


def now():
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def schedule():
    csv = read(f'https://docs.google.com/spreadsheets/d/{SHEET}/export?format=csv&gid={GRANTS_TAB}')
    if csv.lstrip().startswith('<') or not csv.startswith('Project,'):
        raise SystemExit('The sheet did not return the grants table')
    (DATA / 'zcg-schedule.json').write_text(json.dumps({'observedAt': now(), 'csv': csv}, ensure_ascii=False, indent=1) + '\n')
    return csv.count('\n')


def minutes():
    topics = {}
    for number in range(PAGES):
        page = json.loads(read(f'{CATEGORY}?page={number}'))['topic_list']
        for topic in page['topics']:
            if re.search(r'meeting\s+minutes', topic['title'], re.I):
                topics[topic['id']] = {key: topic[key] for key in ('id', 'title', 'slug', 'created_at', 'posts_count')}
        if not page.get('more_topics_url'):
            break
    else:
        raise SystemExit('The category has more pages than expected')
    rows = sorted(topics.values(), key=lambda topic: topic['created_at'], reverse=True)
    if len(rows) < 100:
        raise SystemExit('Fewer minutes than the archive is known to hold')
    (DATA / 'zcg-minutes.json').write_text(json.dumps({'observedAt': now(), 'topics': rows}, ensure_ascii=False, indent=1) + '\n')
    return len(rows)


if __name__ == '__main__':
    print(f'{schedule()} sheet lines, {minutes()} meeting minutes')
