#!/usr/bin/env python3
"""Import Zcash Improvement Proposals into inert, allowlisted document nodes.

Source: a checkout of https://github.com/zcash/zips (MIT licensed). The portal
shows the rendered text with attribution and a link to the repository, which
remains the canonical text. Run by the scheduled sync job and, manually, to
refresh the bundled snapshot:

    python3 scripts/zips/import_zips.py --source ../zips

Requires docutils (reStructuredText, MathML) and Markdown; see requirements.txt.
"""
import argparse
import hashlib
import html
import io
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sanitize import clean, plain, prepare, summary  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = ROOT / 'src/lib/shielded-preview/zips'
DEFAULT_PUBLIC = ROOT / 'public/shielded-preview/zips'
REPOSITORY = 'https://github.com/zcash/zips'
OFFICIAL = 'https://zips.z.cash/'
SOURCE_LIMIT = 1_000_000
IMAGE_LIMIT = 2_000_000
STATUSES = ['Draft', 'Proposed', 'Active', 'Implemented', 'Final', 'Withdrawn', 'Rejected', 'Obsolete', 'Reserved', 'Deferred', 'Superseded']
HEADER_KEY = re.compile(r'^([A-Z][A-Za-z-]*):(?:\s*(.*))?$')
DATE = re.compile(r'\d{4}-\d{2}-\d{2}')
URL = re.compile(r'https?://[^\s<>]+')
PNG = b'\x89PNG\r\n\x1a\n'
RST_SETTINGS = dict(raw_enabled=False, file_insertion_enabled=False, report_level=5, halt_level=5, math_output='MathML',
                    initial_header_level=2, embed_stylesheet=False, stylesheet_path='', syntax_highlight='none',
                    smart_quotes=False, doctitle_xform=False, sectsubtitle_xform=False, input_encoding='utf-8')
MD_EXTENSIONS = ['extra', 'toc', 'sane_lists']
# docutils converts LaTeX to MathML itself and knows no text-mode or sizing commands; the
# repository's sources use a few of them for the KaTeX build. Map them to equivalents first.
MATH_SUBSTITUTIONS = [
    (re.compile(r'\\textsf\{'), r'\\mathsf{'), (re.compile(r'\\texttt\{'), r'\\mathtt{'), (re.compile(r'\\textit\{'), r'\\mathit{'),
    (re.compile(r'\\textbf\{'), r'\\mathbf{'), (re.compile(r'\\textsc\{'), r'\\mathrm{'), (re.compile(r'\\hphantom\{'), r'\\phantom{'),
    (re.compile(r'\\kern\s*-?[0-9.]+\s*(?:em|ex|pt|mu)'), ''), (re.compile(r'\\mathrel\{((?:[^{}]|\{[^{}]*\})*)\}'), r'\1'),
    (re.compile(r'\\(?:tiny|scriptsize|footnotesize|small|normalsize|large|Large|LARGE|huge|Huge)\b\s*'), ''),
    (re.compile(r'\\[bB]igg?(?=\s*[(){}\[\]|\\.<>])'), ''),
]


def portable_math(text):
    for pattern, replacement in MATH_SUBSTITUTIONS:
        text = pattern.sub(replacement, text)
    return text


# Inside a formula only: characters docutils rejects outside text mode, and spacing-class wrappers.
FORMULA_SUBSTITUTIONS = [
    (re.compile(r'\\mathbin\{((?:[^{}]|\{[^{}]*\})*)\}'), r'\1'), (re.compile(r'\\mathstrut'), ''), (re.compile(r'\\LaTeX\b'), r'\\text{LaTeX}'),
    (re.compile(r'[“”"⦂]'), lambda m: '\\text{%s}' % m.group(0)), (re.compile('‐'), '-'), (re.compile('•'), r'\\bullet '),
]


def portable_formula(tex):
    for pattern, replacement in FORMULA_SUBSTITUTIONS:
        tex = pattern.sub(replacement, tex)
    return tex
ESCAPED_DOLLAR = ''
MATH_OPEN, MATH_CLOSE = '', ''


def parse_header(text):
    """Read the metadata block that opens every ZIP (rst literal block or Markdown code block)."""
    lines = text.splitlines()
    i = 0
    while i < len(lines) and not lines[i].strip():
        i += 1
    block = []
    if i < len(lines) and lines[i].strip() == '::':
        i += 1
        while i < len(lines) and not lines[i].strip():
            i += 1
        indent = len(lines[i]) - len(lines[i].lstrip()) if i < len(lines) else 0
        while i < len(lines) and lines[i].strip() and lines[i].startswith(' ' * max(indent, 1)):
            block.append(lines[i][indent:])
            i += 1
    elif i < len(lines) and lines[i].startswith('```'):
        i += 1
        while i < len(lines) and not lines[i].startswith('```'):
            block.append(lines[i])
            i += 1
    else:
        while i < len(lines) and lines[i].startswith('    '):
            block.append(lines[i][4:])
            i += 1
    meta, key = {}, None
    for line in block:
        match = HEADER_KEY.match(line)
        if match and not line.startswith(' '):
            key = match.group(1)
            value = (match.group(2) or '').strip()
            meta[key] = [value] if value else []
        elif key and line.strip():
            meta[key].append(line.strip())
    return meta


def latest_status(value):
    """A revised ZIP lists one status per revision; the last one is current."""
    found = [(match.start(), match.group(0)) for status in STATUSES for match in re.finditer(r'\b' + status + r'\b', value)]
    return max(found)[1] if found else 'Unknown'


def contact_name(value):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]*>|\([^)]*@[^)]*\)', '', value)).strip(' ,')


def first_url(values):
    for value in values or []:
        match = URL.search(value)
        if match:
            url = match.group(0).rstrip('>.,)')
            if url.startswith('https://'):
                return url
    return None


def entry(meta, path):
    """Index entry from the header; fields keep source wording where it matters."""
    zip_value = ' '.join(meta.get('ZIP', [])).strip()
    number = int(zip_value) if re.fullmatch(r'\d+', zip_value) else None
    status_raw = ' '.join(meta.get('Status', [])).strip() or 'Unknown'
    status = latest_status(status_raw)
    category = ' '.join(meta.get('Category', [])).strip()
    created = next((match.group(0) for value in meta.get('Created', []) for match in [DATE.search(value)] if match), None)
    stem = path.stem.lower()
    return {
        'id': stem,
        'number': number,
        'title': ' '.join(meta.get('Title', [])).strip() or stem,
        'status': status,
        'statusDetail': status_raw if status_raw != status else None,
        'category': 'Not recorded' if not category or category.startswith('{') else category,
        'owners': [name for name in (contact_name(value) for value in meta.get('Owners', [])) if name],
        'created': created,
        'license': ' '.join(meta.get('License', [])).strip() or None,
        'discussionsTo': first_url(meta.get('Discussions-To')),
        'pullRequest': first_url(meta.get('Pull-Request')),
        'kind': 'zip' if number is not None else 'guide' if stem.startswith(('zip-guide', 'zip-template')) else 'draft',
        'format': path.suffix[1:],
        'source': f'{REPOSITORY}/blob/main/zips/{path.name}',
        'official': f'{OFFICIAL}{stem}',
    }


def rst_math(text):
    """Convert the repository's ``$...$`` extension into the standard math role."""
    out = []
    for line in text.splitlines():
        line = line.replace('\\$', ESCAPED_DOLLAR)
        line = re.sub(r'\$([^$]+)\$', lambda m: ':math:`%s`' % m.group(1), line)
        line = re.sub(r':math:`([^`]+)`', lambda m: ':math:`%s`' % portable_formula(m.group(1)), line)
        out.append(line.replace(ESCAPED_DOLLAR, '$'))
    return '\n'.join(out) + '\n'


def render_rst(text):
    from docutils.core import publish_parts
    settings = dict(RST_SETTINGS, warning_stream=io.StringIO())
    return publish_parts(rst_math(text), writer='html5', settings_overrides=settings)['body']


def protect_math(text):
    """Replace ``$...$`` spans outside code with tokens so Markdown leaves them alone."""
    maths = []

    def token(latex, block):
        maths.append((latex.strip(), block))
        return f'{MATH_OPEN}{len(maths) - 1}{MATH_CLOSE}'
    out, fenced = [], False
    for line in text.splitlines():
        if line.lstrip().startswith('```') or line.lstrip().startswith('~~~'):
            fenced = not fenced
        if fenced or line.startswith('    '):
            out.append(line)
            continue
        parts = line.split('`')
        for index in range(0, len(parts), 2):
            part = parts[index].replace('\\$', ESCAPED_DOLLAR)
            part = re.sub(r'\$\$([^$]+)\$\$', lambda m: token(m.group(1), True), part)
            part = re.sub(r'\$([^$]+)\$', lambda m: token(m.group(1), False), part)
            parts[index] = part
        out.append('`'.join(parts))
    return '\n'.join(out) + '\n', maths


def mathml(latex, block):
    from docutils.utils.math import MathError
    from docutils.utils.math.latex2mathml import tex2mathml
    try:
        return tex2mathml(portable_formula(latex), as_block=block)
    except (MathError, ValueError, IndexError):
        return '<code>' + html.escape(latex) + '</code>'


def render_markdown(text):
    import markdown
    protected, maths = protect_math(text)
    rendered = markdown.markdown(protected, extensions=MD_EXTENSIONS, output_format='html5')
    rendered = re.sub(f'{MATH_OPEN}(\\d+){MATH_CLOSE}', lambda m: mathml(*maths[int(m.group(1))]), rendered)
    return rendered.replace(ESCAPED_DOLLAR, '$')


def image_copier(source_root, public):
    """Copy the repository's PNG figures (static/assets/images) only; everything else is dropped."""
    copied = {}

    def copy(src):
        match = re.match(r'^(?:\.\./)*rendered/assets/images/([A-Za-z0-9][A-Za-z0-9._-]*\.png)$', html.unescape(src or '').strip())
        if not match:
            return None
        name = match.group(1)
        if name in copied:
            return copied[name]
        origin = next((candidate for candidate in (source_root / 'static/assets/images' / name, source_root / 'rendered/assets/images' / name) if candidate.is_file()), None)
        if origin is None or origin.stat().st_size > IMAGE_LIMIT:
            return None
        data = origin.read_bytes()
        if not data.startswith(PNG):
            return None
        public.mkdir(parents=True, exist_ok=True)
        target = public / name
        if not target.exists() or target.read_bytes() != data:
            target.write_bytes(data)
        copied[name] = '/shielded-preview/zips/' + name
        return copied[name]
    copy.copied = copied
    return copy


def git(source_root, *args):
    result = subprocess.run(['git', '-C', str(source_root), *args], capture_output=True, text=True, check=False)
    return result.stdout.strip() if result.returncode == 0 else ''


def iso_utc(value):
    """Normalize git dates (which may end in Z) to UTC ISO strings; Python 3.9 rejects a bare Z."""
    parsed = datetime.fromisoformat(value.strip().replace('Z', '+00:00'))
    return parsed.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')


def file_dates(source_root):
    """Latest commit date per file from one history pass."""
    dates, current = {}, None
    for line in git(source_root, 'log', '--format=%x00%cI', '--name-only', '--', 'zips').splitlines():
        if line.startswith('\x00'):
            current = line[1:]
        elif line.strip() and current and line.strip() not in dates:
            dates[line.strip()] = iso_utc(current)
    return dates


def build_document(path, source_root, image, dates):
    text = path.read_text(encoding='utf-8')
    if len(text.encode('utf-8')) > SOURCE_LIMIT:
        raise ValueError(f'{path.name} exceeds the import size limit')
    meta = parse_header(text)
    if 'Title' not in meta or 'Status' not in meta:
        raise ValueError(f'{path.name} has no ZIP header')
    record = entry(meta, path)
    portable = portable_math(text)
    rendered = render_rst(portable) if path.suffix == '.rst' else render_markdown(portable)
    nodes, headings = prepare(clean(rendered, path.name, image, heading_shift=1 if path.suffix == '.md' else 0))
    words = len(plain(nodes).split())
    record.update({
        'updatedAt': dates.get(f'zips/{path.name}'),
        'summary': summary(nodes),
        'words': words,
        'digest': hashlib.sha256(text.encode('utf-8')).hexdigest(),
    })
    return record, dict(record, headings=headings, body=nodes)


def write_json(path, value, compact=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(value, ensure_ascii=False, separators=(',', ':')) if compact else json.dumps(value, ensure_ascii=False, indent=2)
    path.write_text(text + '\n', encoding='utf-8')


def run(source_root, out, public, limit=None, log=print):
    source_root = source_root.resolve()
    files = sorted(path for path in (source_root / 'zips').iterdir() if path.suffix in ('.rst', '.md'))
    if limit:
        files = files[:limit]
    if not files:
        raise ValueError('No ZIP sources found; pass --source with a zcash/zips checkout')
    rendered_at = datetime.now(timezone.utc).isoformat()
    dates = file_dates(source_root)
    image = image_copier(source_root, public)
    index, failures = [], []
    documents_dir = out / 'documents'
    documents_dir.mkdir(parents=True, exist_ok=True)
    written = set()
    for path in files:
        try:
            record, document = build_document(path, source_root, image, dates)
        except Exception as error:  # noqa: BLE001 - one broken source must not stop the sync
            failures.append({'file': path.name, 'error': str(error)[:200]})
            continue
        index.append(record)
        write_json(documents_dir / f'{record["id"]}.json', document, compact=True)
        written.add(f'{record["id"]}.json')
    for stale in documents_dir.glob('*.json'):
        if stale.name not in written:
            stale.unlink()
    index.sort(key=lambda item: (('zip', 'draft', 'guide').index(item['kind']), item['number'] or 0, item['id']))
    commit = git(source_root, 'rev-parse', 'HEAD')
    committed = git(source_root, 'log', '-1', '--format=%cI')
    meta = {
        'syncedAt': rendered_at,
        'upstream': {'repository': REPOSITORY, 'branch': 'main', 'commit': commit or None,
                     'committedAt': iso_utc(committed) if committed else None},
        'counts': {'documents': len(index), 'zips': sum(item['kind'] == 'zip' for item in index),
                   'drafts': sum(item['kind'] == 'draft' for item in index), 'guides': sum(item['kind'] == 'guide' for item in index), 'images': len(image.copied)},
        'failures': failures,
        'license': 'MIT',
        'generator': 'scripts/zips/import_zips.py',
    }
    write_json(out / 'index.json', index)
    write_json(out / 'meta.json', meta)
    log(json.dumps({'documents': len(index), 'failures': failures, 'images': len(image.copied), 'commit': commit[:12] if commit else None}))
    return index, meta


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--source', type=Path, required=True, help='Path to a zcash/zips checkout')
    parser.add_argument('--out', type=Path, default=DEFAULT_OUT, help='Output directory for index.json, meta.json and documents/')
    parser.add_argument('--public', type=Path, default=DEFAULT_PUBLIC, help='Output directory for copied PNG figures')
    parser.add_argument('--limit', type=int, help='Import only the first N files (debugging)')
    args = parser.parse_args()
    run(args.source, args.out, args.public, args.limit)


if __name__ == '__main__':
    main()
