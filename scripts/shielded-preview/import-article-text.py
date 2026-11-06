#!/usr/bin/env python3
"""Turn article text pasted by hand into the same inert nodes as imported posts.

For articles published away from shieldedlabs.net. Each file in
editorial/article-text/ is named after the article's id in linked-articles.ts, and
its text replaces the summary on the article page. The paste goes through the
importer's sanitizer, so no script, style or remote image reaches the reader.
Only counts are printed.
"""
import argparse
import html
import importlib.util
import json
import re
from pathlib import Path

spec = importlib.util.spec_from_file_location('import_editorial', Path(__file__).with_name('import-editorial.py'))
editorial = importlib.util.module_from_spec(spec)
spec.loader.exec_module(editorial)

SOURCE = editorial.OUT / 'article-text'
TARGET = editorial.OUT / 'article-text.json'
NOTE = re.compile(r'<!--.*?-->', re.S)
RULE = re.compile(r'^(?:-{3,}|_{3,}|\*{3,})$')
MARKED_TITLE = re.compile(r'^(#{1,6})\s+(.+?)\s*#*$')
BOLD_LINE = re.compile(r'^(?:\*\*|__)(.+?)(?:\*\*|__)$')
BULLET = re.compile(r'^[-*]\s+')
NUMBER = re.compile(r'^\d+[.)]\s+')
LINK = re.compile(r'\[([^\]]+)\]\(((?:[^()\s"]|\([^()\s"]*\))+)\)')
TITLE_LIMIT = 80


def emphasis(text):
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'(?<![\w*])\*(?![\s*])(.+?)(?<![\s*])\*(?![\w*])', r'<em>\1</em>', text)
    return re.sub(r'(?<!\w)_(?![\s_])(.+?)(?<![\s_])_(?!\w)', r'<em>\1</em>', text)


def inline(value):
    # Everything pasted is text; only the marks below become elements.
    text = LINK.sub(lambda m: f'<a href="{m[2]}">{m[1]}</a>', html.escape(value, quote=False))
    # An address can hold marks of its own, so emphasis stays out of the tags.
    return ''.join(part if part.startswith('<a ') else emphasis(part) for part in re.split(r'(<a href="[^"]*">)', text))


def is_title(line):
    return len(line) <= TITLE_LIMIT and not LINK.search(line) and line[-1] not in '.!?:;,'


def block_html(block):
    lines = [line.strip() for line in block.splitlines() if line.strip()]
    joined = ' '.join(lines)
    if len(lines) == 1:
        if RULE.match(joined):
            return '<hr>'
        marked = MARKED_TITLE.match(joined)
        if marked:
            tag = 'h3' if len(marked[1]) > 2 else 'h2'
            return f'<{tag}>{inline(marked[2])}</{tag}>'
        bold = BOLD_LINE.match(joined)
        if is_title(bold[1] if bold else joined):
            return f'<h2>{inline(bold[1] if bold else joined)}</h2>'
    for pattern, tag in ((BULLET, 'ul'), (NUMBER, 'ol')):
        if all(pattern.match(line) for line in lines):
            return f'<{tag}>' + ''.join(f'<li>{inline(pattern.sub("", line))}</li>' for line in lines) + f'</{tag}>'
    if all(line.startswith('>') for line in lines):
        return '<blockquote><p>' + inline(' '.join(line.lstrip('> ') for line in lines)) + '</p></blockquote>'
    return f'<p>{inline(joined)}</p>'


def convert(raw, article_id):
    text = NOTE.sub('', raw).replace('\r\n', '\n').replace('\xa0', ' ')
    # A paste from a web page often has one paragraph per line and no blank lines.
    separator = r'\n\s*\n' if re.search(r'\n\s*\n', text.strip()) else r'\n'
    blocks = [block for block in re.split(separator, text) if block.strip()]
    if not blocks:
        return None
    nodes = editorial.clean(''.join(block_html(block) for block in blocks), download=False)
    # A heading repeating the article's title goes; the id is that title in slug form.
    nodes, headings = editorial.prepare(nodes, article_id)
    words = re.sub(r'\s+', ' ', editorial.plain(nodes)).split()
    return {'body': nodes, 'headings': headings, 'minutes': max(1, round(len(words) / 220))}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--source', type=Path, default=SOURCE)
    ap.add_argument('--target', type=Path, default=TARGET)
    args = ap.parse_args()
    entries = {file.stem: convert(file.read_text(encoding='utf-8'), file.stem) for file in sorted(args.source.glob('*.md'))}
    entries = {key: value for key, value in entries.items() if value}
    args.target.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: {'blocks': len(value['body']), 'headings': len(value['headings']), 'minutes': value['minutes']} for key, value in entries.items()}))


if __name__ == '__main__':
    main()
