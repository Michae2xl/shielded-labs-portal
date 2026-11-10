#!/usr/bin/env python3
"""Refresh the bundled copy of the FPF Coinholder applications.

The portal reads these issues live and without a login. This dated copy is what it shows
before the first read and whenever GitHub refuses one, so a restart never empties the list.
Uses the GitHub CLI (`gh api`), so its own login sets the rate limit. Keeps only the
fields coinholderIssueSchema reads.
"""
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / 'src/lib/shielded-preview/governance-data/coinholder-issues.json'
REPO = 'Financial-Privacy-Foundation/ZcashCoinholderGrantsProgram'
PAGES = 10


def page(number):
    path = f'repos/{REPO}/issues?state=all&per_page=100&sort=created&direction=desc&page={number}'
    return json.loads(subprocess.run(['gh', 'api', path], check=True, capture_output=True, text=True).stdout)


def trim(issue):
    row = {key: issue[key] for key in ('number', 'title', 'state', 'created_at', 'updated_at')}
    row['body'] = issue.get('body')
    row['labels'] = [label['name'] if isinstance(label, dict) else label for label in issue['labels']]
    row['user'] = {'login': issue['user']['login']} if issue.get('user') else None
    if 'pull_request' in issue:
        row['pull_request'] = True
    return row


def main():
    issues = []
    for number in range(1, PAGES + 1):
        batch = page(number)
        issues.extend(trim(issue) for issue in batch)
        if len(batch) < 100:
            break
    else:
        raise SystemExit('Incomplete Coinholder listing')
    if not issues:
        raise SystemExit('No issues returned')
    observed = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    OUT.write_text(json.dumps({'observedAt': observed, 'issues': issues}, ensure_ascii=False, indent=1) + '\n')
    print(f'{len(issues)} issues saved, observed {observed}')


if __name__ == '__main__':
    main()
