#!/usr/bin/env python3
"""Refresh the bundled GitHub snapshot the portal shows before, or instead of, live data.

Uses the GitHub CLI (`gh api`), so its own login sets the rate limit. The tracked
repository list lives here; project pages map repositories in content.ts.
Commits are normalized exactly as provider.ts normalizes live responses.
"""
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / 'src/lib/shielded-preview/github-snapshot.json'
OWNER = 'ShieldedLabs'
LIMIT = 100
REPOS = ['crosslink_monolith', 'zero', 'shielded_transport_pigeon', 'crosslink_book', 'zebra-dynamic-fees', 'sl-orchard', 'nsm', 'fees-monolith', 'cargo_cosmo', 'softer_gui']
RELEASES = 'crosslink_monolith'
SHA = re.compile(r'^[0-9a-f]{40}$')
TAG = re.compile(r'^[A-Za-z0-9._-]{1,40}$')


def gh(path):
    return json.loads(subprocess.run(['gh', 'api', path], check=True, capture_output=True, text=True).stdout)


def utc(value):
    return datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def commits(repo, url, branch):
    rows = []
    for entry in gh(f'repos/{OWNER}/{repo}/commits?sha={branch}&per_page={LIMIT}'):
        sha = entry['sha'].lower()
        if not SHA.match(sha) or entry['html_url'].lower() != f'{url}/commit/{sha}'.lower():
            raise ValueError(f'Commit source does not match {repo}')
        author = entry.get('author') or None
        rows.append({
            'sha': sha, 'title': entry['commit']['message'].split('\n')[0],
            'author': entry['commit']['author'].get('name') or 'Unknown author',
            'login': author['login'] if author else None, 'avatarUrl': author.get('avatar_url') if author else None,
            'profileUrl': author.get('html_url') if author else None, 'authorType': author.get('type') if author else None,
            'date': utc(entry['commit']['author']['date']), 'url': f'{url}/commit/{sha}',
        })
    if len({row['sha'] for row in rows}) != len(rows):
        raise ValueError(f'Duplicate commits in {repo}')
    return rows


def main():
    now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    repos = []
    for name in REPOS:
        meta = gh(f'repos/{OWNER}/{name}')
        url = f'https://github.com/{OWNER}/{name}'
        repos.append({'name': name, 'branch': meta['default_branch'], 'fork': meta['fork'], 'description': meta.get('description') or '', 'url': url,
                      'language': meta.get('language'), 'commits': commits(name, url, meta['default_branch']), 'fetchedAt': now})
    release = gh(f'repos/{OWNER}/{RELEASES}/releases/latest')
    tag = release['tag_name']
    url = f'https://github.com/{OWNER}/{RELEASES}/releases/tag/{tag}'
    if not TAG.match(tag) or release['html_url'] != url:
        raise ValueError('Release source does not match its tag')
    snapshot = {'capturedAt': now, 'perRepositoryLimit': LIMIT, 'repos': repos,
                'crosslinkRelease': {'tag': tag, 'publishedAt': utc(release['published_at']), 'url': url}}
    OUT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'capturedAt': now, 'repos': {r['name']: len(r['commits']) for r in repos}, 'release': tag}))


if __name__ == '__main__':
    main()
