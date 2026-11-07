#!/usr/bin/env python3
"""List what changed at the sources the portal copies by hand.

Read-only: prints a Markdown checklist, empty when nothing needs review, and
never edits the repository. The Source watch workflow files it as an issue.
"""
import argparse
import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
LIB = ROOT / 'src/lib/shielded-preview'
SITE = 'https://shieldedlabs.net/wp-json/wp/v2'
FORUM = 'https://forum.zcashcommunity.com'
RELEASE = 'https://api.github.com/repos/ShieldedLabs/crosslink_monolith/releases/latest'
# Threads whose new posts can change what the portal states.
THREADS = {
    58906: 'ZCG and the Dev Fund: Timeline for Proposals and Polling',
    42703: 'Network Sustainability Mechanism (NSM)',
    55210: 'Crosslink incentivized feature net',
}
# Forum accounts confirmed for Shielded Labs team members (team-profiles.ts).
ACCOUNTS = ['aquietinvestor']
MAX_AGE_DAYS = {'record': 45, 'zips': 7}


def get(url):
    with urlopen(Request(url, headers={'User-Agent': 'Shielded-Labs-Portal', 'Accept': 'application/json'}), timeout=30) as response:
        return json.load(response)


def site_changes(catalog, rows, team_reviewed):
    """`rows` maps 'posts' and 'pages' to WordPress rows (link, slug, title, date_gmt, modified_gmt)."""
    known = {entry['source'].rstrip('/'): entry for entry in catalog}
    items = []
    for kind in ('posts', 'pages'):
        for row in rows[kind]:
            entry = known.get(row['link'].rstrip('/'))
            title = re.sub(r'<[^>]+>', '', row['title']['rendered']).strip()
            if entry is None and kind == 'posts':
                items.append(f"New post [{title}]({row['link']}) from {row['date_gmt'][:10]}: run `python3 scripts/shielded-preview/import-editorial.py`.")
            elif entry is not None and row['modified_gmt'] + 'Z' > entry['updatedAt']:
                items.append(f"[{title}]({row['link']}) changed on {row['modified_gmt'][:10]} (portal copy from {entry['updatedAt'][:10]}): run `python3 scripts/shielded-preview/import-editorial.py --only {entry['id']}`.")
            elif entry is None and row['slug'] == 'team' and row['modified_gmt'][:10] > team_reviewed:
                items.append(f"[Team page]({row['link']}) changed on {row['modified_gmt'][:10]} (reviewed {team_reviewed}): check `team-profiles.ts` and the team in `content.ts`.")
    return items


def forum_changes(threads, actions, since):
    """`threads`: (topic id, title, last_posted_at, highest post number); `actions`: forum user actions."""
    items = [f"New posts in [{title}]({FORUM}/t/{topic}/{last_post}) since {since[:16].replace('T', ' ')} UTC."
             for topic, title, last_posted, last_post in threads if last_posted and last_posted >= since]
    items += [f"@{action['username']} posted in [{action['title']}]({FORUM}/t/{action['slug']}/{action['topic_id']}/{action['post_number']}) on {action['created_at'][:10]}."
              for action in actions if action['created_at'] >= since and action['topic_id'] not in THREADS]
    return items


def release_changes(latest, summarized):
    if latest == summarized:
        return []
    return [f"Crosslink {latest} is the latest release; the participation guide summarizes {summarized}. Review `crosslink-guide/` and update `releaseTag`."]


def dated_reminders(now, dev_fund, record_checked, zips_synced):
    items = []
    declaration = re.search(r'export const devFundPublished[^\n]*', dev_fund)
    deadlines = dict(re.findall(r"id: '(proposals|polling)'[^}\n]*?endsAt: '([^']+)'", dev_fund))
    stamp = now.isoformat().replace('+00:00', 'Z')
    if declaration and 'questions: null' in declaration.group(0) and 'proposals' in deadlines and stamp > deadlines['proposals']:
        items.append('The Dev Fund poll questions follow the proposal deadline: fill `devFundPublished.questions` in `governance-dev-fund.ts` once they are published.')
    if declaration and 'results: null' in declaration.group(0) and 'polling' in deadlines and stamp > deadlines['polling']:
        items.append('Dev Fund polling has closed: fill `devFundPublished.results` once the results are published.')
    if (now.date() - datetime.fromisoformat(record_checked).date()).days > MAX_AGE_DAYS['record']:
        items.append(f'The polls and upgrades record was last checked on {record_checked}: review `governance-data/record.json`.')
    synced = datetime.fromisoformat(zips_synced.replace('Z', '+00:00'))
    if (now - synced).days > MAX_AGE_DAYS['zips']:
        items.append(f'The bundled ZIP snapshot is from {zips_synced[:10]}: run `npm run import:zips`, or set `ZIPS_DATA_URL` and `ZIPS_DATA_TOKEN` so the portal reads the synced branch.')
    return items


def render(sections, failures):
    lines = []
    for title, items in sections:
        if items:
            lines += [f'### {title}', *[f'- [ ] {item}' for item in items], '']
    if failures:
        lines += ['### Sources not reached', *[f'- {failure}' for failure in failures], '']
    return '\n'.join(lines).strip()


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--days', type=float, default=1.1, help='How far back to look for forum posts')
    ap.add_argument('--out', type=Path, help='Also write the report to this file')
    args = ap.parse_args()
    now = datetime.now(timezone.utc)
    since = (now - timedelta(days=args.days)).isoformat().replace('+00:00', 'Z')
    sections, failures = [], []

    def section(title, read):
        try:
            sections.append((title, read()))
        except Exception as error:  # A source that cannot be read is reported, not fatal.
            failures.append(f'{title}: {type(error).__name__}')

    catalog = json.loads((LIB / 'editorial/catalog.json').read_text(encoding='utf-8'))
    team_reviewed = re.search(r"TEAM_REVIEWED = '([^']+)'", (LIB / 'content.ts').read_text(encoding='utf-8')).group(1)
    fields = '_fields=link,slug,title,date_gmt,modified_gmt'
    section('shieldedlabs.net', lambda: site_changes(catalog, {kind: get(f'{SITE}/{kind}?per_page=100&{fields}') for kind in ('posts', 'pages')}, team_reviewed))

    def forum():
        threads = []
        for topic, title in THREADS.items():
            data = get(f'{FORUM}/t/{topic}.json')
            threads.append((topic, title, data.get('last_posted_at'), data.get('highest_post_number')))
        actions = [action for account in ACCOUNTS for action in get(f'{FORUM}/user_actions.json?username={account}&filter=4,5&limit=20').get('user_actions', [])]
        return forum_changes(threads, actions, since)
    section('Forum', forum)

    summarized = re.search(r'export const releaseTag = "([^"]+)"', (LIB / 'crosslink-guide/history.ts').read_text(encoding='utf-8')).group(1)
    section('Crosslink', lambda: release_changes(get(RELEASE)['tag_name'], summarized))

    record_checked = json.loads((LIB / 'governance-data/record.json').read_text(encoding='utf-8'))['checkedAt']
    zips_synced = json.loads((LIB / 'zips/meta.json').read_text(encoding='utf-8'))['syncedAt']
    section('Dated content', lambda: dated_reminders(now, (LIB / 'governance-dev-fund.ts').read_text(encoding='utf-8'), record_checked, zips_synced))

    report = render(sections, failures)
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(report + ('\n' if report else ''), encoding='utf-8')
    print(report or 'No source changes to review.')


if __name__ == '__main__':
    main()
