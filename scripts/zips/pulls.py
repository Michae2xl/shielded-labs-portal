"""Open pull requests of zcash/zips rendered as unofficial previews.

The sync job lists the open pull requests with the GitHub API and saves the
response. This module reads that file, fetches each pull request head with
git, renders the ZIP documents the pull request adds or changes, and labels
every record with the pull request it came from. Anyone can open a pull
request, so the text is third-party content: it passes through the same
allowlist as the merged documents and is shown as a preview, never as a ZIP.
"""
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

PULL_LIMIT = 150
FILES_PER_PULL = 20
SOURCE_LIMIT = 1_000_000
FILE_NAME_LIMIT = 200
REPOSITORY = 'https://github.com/zcash/zips'
PULL_URL = re.compile(r'^https://github\.com/zcash/zips/pull/(\d+)$')
SHA = re.compile(r'^[0-9a-f]{40}$')


def iso_utc(value):
    parsed = datetime.fromisoformat(str(value).strip().replace('Z', '+00:00'))
    return parsed.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')


def git(root, *args, strip=True):
    result = subprocess.run(['git', '-C', str(root), *args], capture_output=True, encoding='utf-8', check=False)
    if result.returncode != 0:
        return ''
    return result.stdout.strip() if strip else result.stdout


def normalize_pull(raw):
    """Keep only the fields the portal shows, from one open pull request of the API response."""
    try:
        number = int(raw['number'])
        url = str(raw['html_url'])
        sha = str(raw['head']['sha'])
        created, updated = iso_utc(raw['created_at']), iso_utc(raw['updated_at'])
    except (KeyError, TypeError, ValueError):
        return None
    match = PULL_URL.match(url)
    if raw.get('state', 'open') != 'open' or not match or int(match.group(1)) != number or not SHA.match(sha):
        return None
    return {
        'number': number,
        'title': re.sub(r'\s+', ' ', str(raw.get('title') or '')).strip()[:300] or f'Pull request {number}',
        'author': str((raw.get('user') or {}).get('login') or 'unknown')[:100],
        'draft': bool(raw.get('draft')),
        'url': url,
        'headSha': sha,
        'createdAt': created,
        'updatedAt': updated,
    }


def load_pulls(path):
    """Read the saved API response: one page, or the list of pages that ``gh api --paginate --slurp`` writes."""
    data = json.loads(Path(path).read_text(encoding='utf-8'))
    pages = data if data and isinstance(data[0], list) else [data]
    pulls = [pull for page in pages for pull in (normalize_pull(raw) for raw in page) if pull]
    pulls.sort(key=lambda pull: (pull['updatedAt'], pull['number']), reverse=True)
    return pulls[:PULL_LIMIT]


def fetch_pull_heads(root, pulls):
    refspecs = [f'+refs/pull/{pull["number"]}/head:refs/remotes/pr/{pull["number"]}' for pull in pulls]
    if refspecs:
        subprocess.run(['git', '-C', str(root), 'fetch', '--quiet', '--filter=blob:none', 'origin', *refspecs], capture_output=True, text=True, check=False)


def changed_zip_files(root, head):
    """ZIP sources the pull request adds, changes or renames, relative to the main branch."""
    base = git(root, 'merge-base', 'origin/main', head) or git(root, 'merge-base', 'HEAD', head)
    if not base:
        return []
    names = git(root, 'diff', '--name-only', '--diff-filter=AMR', base, head, '--', 'zips').splitlines()
    # Guides and the template are process documents, not proposals; their edits are not previewed.
    return [name[5:] for name in names if name.startswith('zips/') and name.endswith(('.rst', '.md')) and '/' not in name[5:] and not name[5:].startswith(('zip-guide', 'zip-template')) and len(name) <= FILE_NAME_LIMIT][:FILES_PER_PULL]


def pull_identifier(number, name):
    slug = re.sub(r'[^a-z0-9]+', '-', Path(name).stem.lower()).strip('-')[:90] or 'document'
    return f'pr-{number}-{slug}'


def import_pulls(source_root, pulls, render, image):
    """Render every changed ZIP source of every open pull request.

    ``render(text, path, image)`` returns the (record, document) pair used for
    merged documents; the pull request details are layered on top of it.
    """
    source_root = Path(source_root)
    fetch_pull_heads(source_root, pulls)
    entries, documents, failures, rendered = [], [], [], 0
    for pull in pulls:
        number, head = pull['number'], pull['headSha']
        if git(source_root, 'cat-file', '-t', head) != 'commit':
            failures.append({'pull': number, 'error': 'Head commit not available'})
            continue
        files = changed_zip_files(source_root, head)
        for name in files:
            try:
                text = git(source_root, 'show', f'{head}:zips/{name}', strip=False)
                if not text.strip():
                    failures.append({'pull': number, 'file': name, 'error': 'Empty or unreadable source'})
                    continue
                if len(text.encode('utf-8')) > SOURCE_LIMIT:
                    failures.append({'pull': number, 'file': name, 'error': 'Source exceeds the import size limit'})
                    continue
                record, document = render(text, Path(name), image)
            except Exception as error:  # noqa: BLE001 - one broken proposal must not stop the sync
                failures.append({'pull': number, 'file': name, 'error': str(error)[:200]})
                continue
            existing = (source_root / 'zips' / name).is_file()
            details = {
                'id': pull_identifier(number, name),
                'kind': 'proposal',
                'updatedAt': pull['updatedAt'],
                'source': f'{REPOSITORY}/blob/{head}/zips/{name}',
                'official': pull['url'],
                'base': Path(name).stem.lower() if existing else None,
                'pull': dict(pull, change='update' if existing else 'new', file=name, files=files),
            }
            entries.append(dict(record, **details))
            documents.append(dict(document, **details))
            rendered += 1
    return entries, documents, {'listed': len(pulls), 'rendered': rendered, 'failures': failures}
