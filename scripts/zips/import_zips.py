#!/usr/bin/env python3
"""Import Zcash Improvement Proposals into inert, allowlisted document nodes.

Source: a checkout of https://github.com/zcash/zips (MIT licensed). The portal
shows the rendered text with attribution and a link to the repository, which
remains the canonical text. Run by the scheduled sync job and, manually, to
refresh the bundled snapshot:

    python3 scripts/zips/import_zips.py --source ../zips [--pulls pulls.json]

Requires docutils (reStructuredText, MathML) and markdown-it-py; see requirements.txt.
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
from sanitize import DETAILS_CLOSE, DETAILS_OPEN, LINE_BREAK, clean, collect_ids, plain, prepare, summary  # noqa: E402
from pulls import import_pulls, load_pulls  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = ROOT / 'src/lib/shielded-preview/zips'
DEFAULT_PUBLIC = ROOT / 'public/shielded-preview/zips'
REPOSITORY = 'https://github.com/zcash/zips'
OFFICIAL = 'https://zips.z.cash/'
SOURCE_LIMIT = 1_000_000
IMAGE_LIMIT = 4_000_000
STATUSES = ['Draft', 'Proposed', 'Active', 'Implemented', 'Final', 'Withdrawn', 'Rejected', 'Obsolete', 'Reserved', 'Deferred', 'Superseded']
HEADER_KEY = re.compile(r'^([A-Z][A-Za-z-]*):(?:\s*(.*))?$')
DATE = re.compile(r'\d{4}-\d{2}-\d{2}')
URL = re.compile(r'https?://[^\s<>]+')
PNG = b'\x89PNG\r\n\x1a\n'
RST_SETTINGS = dict(raw_enabled=False, file_insertion_enabled=False, report_level=5, halt_level=5, math_output='MathML',
                    initial_header_level=2, embed_stylesheet=False, stylesheet_path='', syntax_highlight='none',
                    smart_quotes=False, doctitle_xform=False, sectsubtitle_xform=False, input_encoding='utf-8')


def heading_id(value):
    """Heading ids of the multimarkdown build at zips.z.cash, which the documents' own links use."""
    return re.sub(r'[^a-z0-9_.:-]', '', value.lower()) or 'section'


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
    (re.compile(r'[“”"⦂]'), lambda m: '\\text{%s}' % m.group(0)), (re.compile('‐'), '-'), (re.compile('•'), r'\\bullet '), (re.compile('×'), r'\\times '),
]


def portable_formula(tex):
    for pattern, replacement in FORMULA_SUBSTITUTIONS:
        tex = pattern.sub(replacement, tex)
    return tex
ESCAPED_DOLLAR = ''
RST_DETAILS_OPEN = re.compile(r'^([ \t]*)\.\. raw:: html[ \t]*\n[ \t]*\n\1[ \t]+<details>[ \t]*\n\1[ \t]+<summary>([^<\n]*)</summary>[ \t]*\n', re.M)
RST_DETAILS_CLOSE = re.compile(r'^([ \t]*)\.\. raw:: html[ \t]*\n[ \t]*\n\1[ \t]+</details>[ \t]*\n', re.M)
UNCONVERTED = re.compile(r'>\\[A-Za-z]')
TRAILING_BREAK = re.compile(r'(?:\s*\\\\)+\s*$')
LATEX_SPAN = re.compile(r'\$(?!\$)([^$\n]*\\[A-Za-z][^$\n]*)\$(?![\d$])')
RST_BREAK = re.compile(r'^\.\. \|br\| raw:: html[ \t]*\n[ \t]*\n[ \t]+<br\s*/?>[ \t]*\n', re.M)
UNDEFINED_FOOTNOTE = re.compile(r'[ \t]*\[\^[\w.-]+\]_?')
HEADING_LABEL = re.compile(r'\s*\[([A-Za-z0-9_.:-]+)\]\s*$')
RECORD_PREFIX = '?view=governance&section=zips&record='
RECORD_LINK = re.compile(r'^\?view=governance&section=zips&record=([^#&]+)(#.*)?$')


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
        'title': (' '.join(meta.get('Title', [])).strip() or stem)[:300],
        'status': status,
        'statusDetail': status_raw[:400] if status_raw != status else None,
        'category': 'Not recorded' if not category or category.startswith('{') else category[:120],
        'owners': [name[:120] for name in (contact_name(value) for value in meta.get('Owners', [])) if name][:40],
        'created': created,
        'license': ' '.join(meta.get('License', [])).strip()[:200] or None,
        'discussionsTo': first_url(meta.get('Discussions-To')),
        'pullRequest': first_url(meta.get('Pull-Request')),
        'kind': 'zip' if number is not None else 'guide' if stem.startswith(('zip-guide', 'zip-template')) else 'draft',
        'format': path.suffix[1:],
        'source': f'{REPOSITORY}/blob/main/zips/{path.name}',
        'official': f'{OFFICIAL}{stem}',
    }


def rst_details(text):
    """Keep the collapsible blocks of reStructuredText sources.

    Raw HTML stays disabled, so the exact directives that open and close one become
    marker paragraphs; the sanitizer builds the block from them.
    """
    text = RST_DETAILS_OPEN.sub(lambda m: f'{m.group(1)}{DETAILS_OPEN}{m.group(2).strip()}\n', text)
    return RST_DETAILS_CLOSE.sub(lambda m: f'{m.group(1)}{DETAILS_CLOSE}\n', text)


def rst_breaks(text):
    """Keep the ``|br|`` substitution of reStructuredText sources with raw HTML disabled.

    The marker keeps the width of the original, so grid tables stay aligned.
    """
    if not RST_BREAK.search(text):
        return text
    return RST_BREAK.sub('', text).replace('|br|', LINE_BREAK + '   ')


def dollar_role(match):
    """A role needs a boundary on each side; an escaped space gives it one next to a letter or digit."""
    source, start, end = match.string, match.start(), match.end()
    before = '\\ ' if start and source[start - 1].isalnum() else ''
    after = '\\ ' if end < len(source) and source[end].isalnum() else ''
    return f'{before}:math:`{match.group(1).strip()}`{after}'


def rst_math(text):
    """Convert the repository's ``$...$`` extension into the standard math role."""
    out = []
    for line in text.splitlines():
        line = line.replace('\\$', ESCAPED_DOLLAR)
        line = re.sub(r'\$([^$]+)\$', dollar_role, line)
        line = re.sub(r':math:`([^`]+)`', lambda m: ':math:`%s`' % portable_formula(m.group(1)), line)
        out.append(line.replace(ESCAPED_DOLLAR, '$'))
    return '\n'.join(out) + '\n'


def render_rst(text):
    from docutils.core import publish_parts
    settings = dict(RST_SETTINGS, warning_stream=io.StringIO())
    return publish_parts(rst_math(rst_breaks(rst_details(text))), writer='html5', settings_overrides=settings)['body']


def mathml(latex, block):
    from docutils.utils.math import MathError
    from docutils.utils.math.latex2mathml import tex2mathml
    # A line break at the very end of a formula has no row to end, and the converter rejects it.
    tex = TRAILING_BREAK.sub('', portable_formula(latex))
    try:
        return tex2mathml(tex, as_block=block)
    except (MathError, ValueError, IndexError, AttributeError):
        pass
    # Environments such as array and commands such as \\choose need the second converter;
    # a command it does not know comes out as visible source, which is no better than code.
    try:
        from latex2mathml.converter import convert
        converted = convert(tex, display='block' if block else 'inline')
    except Exception:  # noqa: BLE001 - one formula must not stop the document
        return '<code>' + html.escape(latex) + '</code>'
    return '<code>' + html.escape(latex) + '</code>' if UNCONVERTED.search(converted) else converted


def heading_labels(state):
    """``## Title [label]`` names the heading's anchor; the label is not part of the title."""
    items = state.tokens
    for index, item in enumerate(items):
        if item.type != 'heading_open':
            continue
        inline = items[index + 1]
        last = inline.children[-1] if inline.children else None
        match = HEADING_LABEL.search(last.content) if last is not None and last.type == 'text' else None
        if match:
            last.content = last.content[:match.start()]
            inline.content = HEADING_LABEL.sub('', inline.content)
            item.attrSet('id', match.group(1))


def undefined_footnotes(state):
    """A footnote marker with no definition stays out of the text, as on the site; the parser keeps real ones apart."""
    for item in state.tokens:
        if item.type == 'inline':
            for child in item.children or []:
                if child.type == 'text':
                    child.content = UNDEFINED_FOOTNOTE.sub('', child.content)


def latex_span(state, silent):
    """A dollar span holding a LaTeX command is a formula, even with a space before its closing dollar."""
    match = LATEX_SPAN.match(state.src, state.pos) if state.src[state.pos] == '$' else None
    if not match:
        return False
    if not silent:
        item = state.push('math_inline', 'math', 0)
        item.markup = '$'
        item.content = match.group(1).strip()
    state.pos = match.end()
    return True


def markdown_parser():
    """CommonMark with the extensions the ZIPs use.

    Nested lists at any indent, code inside quotes and lists, and Markdown between raw
    HTML tags all follow the rules of the site build, and formulas are read by the parser,
    so they are recognised wherever text is and never inside code.
    """
    from markdown_it import MarkdownIt
    from mdit_py_plugins.anchors import anchors_plugin
    from mdit_py_plugins.deflist import deflist_plugin
    from mdit_py_plugins.dollarmath import dollarmath_plugin
    from mdit_py_plugins.footnote import footnote_plugin
    parser = MarkdownIt('commonmark', {'html': True, 'typographer': True}).enable(['table', 'smartquotes'])
    parser.use(footnote_plugin).use(deflist_plugin)
    # The usual rule for dollars: a formula hugs its delimiters and no digit follows it, so prices stay text.
    parser.use(dollarmath_plugin, allow_labels=False, allow_space=False, allow_digits=False, double_inline=True, renderer=lambda tex, options: mathml(tex, options.get('display_mode', False)))
    parser.inline.ruler.before('math_inline', 'latex_span', latex_span)
    parser.use(anchors_plugin, max_level=6, slug_func=heading_id)
    parser.core.ruler.after('anchor', 'heading_labels', heading_labels)
    parser.core.ruler.after('heading_labels', 'undefined_footnotes', undefined_footnotes)
    # The site shows plain numbers for citations, not bracketed ones.
    parser.add_render_rule('footnote_caption', lambda self, items, idx, options, env: str(items[idx].meta['id'] + 1))
    return parser


def render_markdown(text):
    return markdown_parser().render(text)


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


def render_document(text, path, image, diagrams=True):
    """Render one ZIP source (merged file or pull request head) into its index record and document."""
    meta = parse_header(text)
    if 'Title' not in meta or 'Status' not in meta:
        raise ValueError(f'{path.name} has no ZIP header')
    record = entry(meta, path)
    portable = portable_math(text)
    rendered = render_rst(portable) if path.suffix == '.rst' else render_markdown(portable)
    nodes, headings = prepare(clean(rendered, path.name, image, heading_shift=1 if path.suffix == '.md' else 0, diagrams=diagrams, formula=mathml))
    record.update({
        'updatedAt': None,
        'summary': summary(nodes),
        'words': len(plain(nodes).split()),
        'digest': hashlib.sha256(text.encode('utf-8')).hexdigest(),
    })
    return record, dict(record, headings=headings, body=nodes)


def build_document(path, source_root, image, dates):
    text = path.read_text(encoding='utf-8')
    if len(text.encode('utf-8')) > SOURCE_LIMIT:
        raise ValueError(f'{path.name} exceeds the import size limit')
    record, document = render_document(text, path, image)
    updated = {'updatedAt': dates.get(f'zips/{path.name}')}
    return dict(record, **updated), dict(document, **updated)


def link_documents(documents):
    """Point links between documents at records that exist.

    Merged documents link only to merged documents, so no pull request can take over their
    links. A preview may also link to other previews, preferring its own pull request, since
    both are already labelled unofficial. A link with no record keeps its words but stops
    being a link, and a fragment the target does not have is dropped.
    """
    by_id = {document['id']: document for document in documents}
    anchors = {document['id']: collect_ids(document['body']) for document in documents}
    previews = {}
    for document in documents:
        if document.get('pull'):
            previews.setdefault(Path(document['pull']['file']).stem.lower(), []).append(document)

    def target(record, source):
        if record in by_id:
            return record
        if not source.get('pull'):
            return None
        candidates = previews.get(record, [])
        same = [item for item in candidates if item['pull']['number'] == source['pull']['number']]
        return (same or candidates or [{}])[0].get('id')

    def walk(items, source):
        result = []
        for node in items:
            if isinstance(node, str):
                result.append(node)
                continue
            children = walk(node.get('children', []), source)
            match = RECORD_LINK.match(node.get('href', '')) if node['tag'] == 'a' else None
            if not match:
                result.append(dict(node, children=children))
                continue
            record = target(match.group(1), source)
            if not record:
                result.extend(children)
                continue
            fragment = match.group(2) or ''
            if fragment and fragment[1:] not in anchors[record]:
                fragment = ''
            result.append(dict(node, children=children, href=f'{RECORD_PREFIX}{record}{fragment}'))
        return result
    return [dict(document, body=walk(document['body'], document)) for document in documents]


def write_json(path, value, compact=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(value, ensure_ascii=False, separators=(',', ':')) if compact else json.dumps(value, ensure_ascii=False, indent=2)
    path.write_text(text + '\n', encoding='utf-8')


def run(source_root, out, public, limit=None, pulls=None, log=print):
    source_root = source_root.resolve()
    files = sorted(path for path in (source_root / 'zips').iterdir() if path.suffix in ('.rst', '.md'))
    if limit:
        files = files[:limit]
    if not files:
        raise ValueError('No ZIP sources found; pass --source with a zcash/zips checkout')
    rendered_at = datetime.now(timezone.utc).isoformat()
    dates = file_dates(source_root)
    image = image_copier(source_root, public)
    index, failures, documents = [], [], []
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
        documents.append(document)
    pull_summary = None
    if pulls:
        proposals, proposal_documents, pull_summary = import_pulls(source_root, load_pulls(pulls), lambda text, path, copy: render_document(text, path, copy, diagrams=False), image)
        index.extend(proposals)
        documents.extend(proposal_documents)
    for document in link_documents(documents):
        try:
            write_json(documents_dir / f'{document["id"]}.json', document, compact=True)
        except ValueError as error:  # one document that cannot be stored must not stop the sync
            failures.append({'file': document['id'], 'error': str(error)[:200]})
            index = [item for item in index if item['id'] != document['id']]
            continue
        written.add(f'{document["id"]}.json')
    for stale in documents_dir.glob('*.json'):
        if stale.name not in written:
            stale.unlink()
    index.sort(key=lambda item: (('zip', 'draft', 'guide', 'proposal').index(item['kind']), -(item['pull']['number']) if item['kind'] == 'proposal' else 0, item['number'] or 0, item['id']))
    commit = git(source_root, 'rev-parse', 'HEAD')
    committed = git(source_root, 'log', '-1', '--format=%cI')
    meta = {
        'syncedAt': rendered_at,
        'upstream': {'repository': REPOSITORY, 'branch': 'main', 'commit': commit or None,
                     'committedAt': iso_utc(committed) if committed else None},
        'counts': {'documents': len(index), 'zips': sum(item['kind'] == 'zip' for item in index),
                   'drafts': sum(item['kind'] == 'draft' for item in index), 'guides': sum(item['kind'] == 'guide' for item in index),
                   'proposals': sum(item['kind'] == 'proposal' for item in index), 'images': len(image.copied)},
        'failures': failures,
        'pulls': pull_summary,
        'license': 'MIT',
        'generator': 'scripts/zips/import_zips.py',
    }
    write_json(out / 'index.json', index)
    write_json(out / 'meta.json', meta)
    log(json.dumps({'documents': len(index), 'failures': failures, 'images': len(image.copied), 'pulls': pull_summary, 'commit': commit[:12] if commit else None}))
    return index, meta


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--source', type=Path, required=True, help='Path to a zcash/zips checkout')
    parser.add_argument('--out', type=Path, default=DEFAULT_OUT, help='Output directory for index.json, meta.json and documents/')
    parser.add_argument('--public', type=Path, default=DEFAULT_PUBLIC, help='Output directory for copied PNG figures')
    parser.add_argument('--limit', type=int, help='Import only the first N files (debugging)')
    parser.add_argument('--pulls', type=Path, help='Saved GitHub API response listing the open pull requests to render as previews')
    args = parser.parse_args()
    run(args.source, args.out, args.public, args.limit, args.pulls)


if __name__ == '__main__':
    main()
