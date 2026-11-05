"""Allowlisted document nodes for rendered Zcash Improvement Proposals.

Rendered HTML from the zcash/zips repository is third-party content. Only known
tags and attributes reach the portal reader; scripts, styles, embeds, raw HTML
and remote images never do. The output uses the same inert node shape as the
imported editorial documents, plus MathML nodes for formulas.
"""
import html
import re
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

ALLOWED = set('p h2 h3 h4 h5 h6 a strong em ul ol li dl dt dd blockquote pre code table thead tbody tfoot tr th td figure figcaption img br hr sup sub details summary'.split())
MATHML = set('math mrow mi mn mo msup msub msubsup mfrac msqrt mroot mtext mspace mover munder munderover mtable mtr mtd mstyle mpadded mphantom menclose semantics mmultiscripts mprescripts'.split())
MATH_ATTRS = set('display mathvariant displaystyle stretchy fence separator lspace rspace form accent accentunder width height depth voffset linethickness columnalign rowalign columnspacing rowspacing notation largeop movablelimits symmetric minsize maxsize mathsize scriptlevel'.split())
MATH_VALUE = re.compile(r'^[A-Za-z0-9 .%,+-]{0,40}$')
DROP = set('script style iframe object embed form input button select textarea svg noscript template colgroup col link meta annotation annotation-xml title head'.split())
RENAME = {'b': 'strong', 'i': 'em', 'tt': 'code', 'kbd': 'code', 'samp': 'code', 'cite': 'em', 'var': 'em', 'dfn': 'em'}
INLINE = set('p h1 h2 h3 h4 h5 h6 li dt dd td th figcaption summary a strong em code sup sub'.split())
VOID = set('img br hr input meta link source area wbr col'.split())
PHRASING = set('a strong em code sup sub'.split())
RESERVED_IDS = {'zip-document', 'zip-sources', 'zip-sources-title'}
WITH_ID = set('p h2 h3 h4 h5 h6 ul ol dl li dt dd blockquote pre table figure a sup'.split())
ID = re.compile(r'^[A-Za-z0-9][A-Za-z0-9_.:-]{0,199}$')
ZIP_LINK = re.compile(r'^(?:\./)?(zip-\d{4}|draft-[a-z0-9][a-z0-9-]*)(?:\.(?:rst|md|html))?(#[^#]*)?$', re.I)
OFFICIAL_ZIP = re.compile(r'^(?:https://zips\.z\.cash/|(?:\.\./)*rendered/)(zip-\d{4}|draft-[a-z0-9][a-z0-9-]*)(?:\.(?:html|rst|md))?(#[^#]*)?$', re.I)
REPOSITORY_ZIP = re.compile(r'^https://github\.com/zcash/zips/blob/[^/]+/zips/(zip-\d{4}|draft-[a-z0-9][a-z0-9-]*)\.(?:rst|md)(#[^#]*)?$', re.I)
RENDERED = re.compile(r'^(?:\.\./)*rendered/(.+)$')
PROTOCOL = re.compile(r'^(?:\.\./)*protocol/(.+)$')
BLOCKS = set('p h2 h3 h4 h5 h6 ul ol dl table blockquote pre figure hr details aside'.split())
DETAILS_OPEN, DETAILS_CLOSE, LINE_BREAK = '\ue010', '\ue011', '\ue012'
BOX_MARKER = 'boxmarker'
WARNINGS = {'warning', 'caution', 'danger', 'error', 'attention'}
OFFICIAL = 'https://zips.z.cash/'
GITHUB_FILES = 'https://github.com/zcash/zips/blob/main/zips/'


class Tree(HTMLParser):
    """Build a plain tree; the walker below decides what survives."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = {'tag': 'root', 'attrs': {}, 'children': []}
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = {'tag': tag.lower(), 'attrs': {k.lower(): (v or '') for k, v in attrs}, 'children': []}
        self.stack[-1]['children'].append(node)
        if node['tag'] not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag.lower() not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        tag = tag.lower()
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i]['tag'] == tag:
                self.stack = self.stack[:i]
                return

    def handle_data(self, data):
        self.stack[-1]['children'].append(data)


def plain(nodes):
    if isinstance(nodes, str):
        return nodes
    if isinstance(nodes, dict):
        return plain(nodes.get('children', []))
    return ''.join(plain(node) for node in nodes)


def classes(node):
    return set((node.get('attrs', {}).get('class') or '').split())


def safe_url(value, base):
    value = html.unescape(value or '').strip()
    if any(ord(c) < 32 for c in value):
        return None
    url = urljoin(base, value)
    parsed = urlparse(url)
    if parsed.scheme not in ('https', 'http', 'mailto') or parsed.username or parsed.password:
        return None
    if parsed.scheme != 'mailto' and (not parsed.hostname or re.search(r'\s', parsed.netloc)):
        return None
    return url


def record_href(document_id, fragment=''):
    return f'?view=governance&section=zips&record={document_id}{fragment}'


def resolve_link(value, source_file):
    """Map repository-relative links to portal records or the official site."""
    value = html.unescape(value or '').strip()
    if any(ord(c) < 32 for c in value):
        return None
    if value.startswith('#'):
        return value if ID.match(value[1:]) else None
    match = ZIP_LINK.match(value)
    if match:
        fragment = match.group(2) or ''
        return record_href(match.group(1).lower(), fragment if ID.match(fragment[1:]) else '')
    match = OFFICIAL_ZIP.match(value) or REPOSITORY_ZIP.match(value)
    if match:
        fragment = match.group(2) or ''
        return record_href(match.group(1).lower(), fragment if ID.match(fragment[1:]) else '')
    match = RENDERED.match(value)
    if match:
        return safe_url(OFFICIAL + match.group(1), OFFICIAL)
    match = PROTOCOL.match(value)
    if match:
        return safe_url(OFFICIAL + 'protocol/' + match.group(1), OFFICIAL)
    return safe_url(value, GITHUB_FILES + source_file)


def valid_id(value):
    # Ids the record page uses itself stay out of third-party text.
    return value if value and ID.match(value) and value not in RESERVED_IDS else None


def math_attrs(attrs):
    return {k: v for k, v in attrs.items() if k in MATH_ATTRS and MATH_VALUE.match(v)}


def inherit_id(nodes, identifier):
    """Keep anchors from flattened wrappers on their first block child."""
    if not identifier:
        return nodes
    for node in nodes:
        if isinstance(node, dict) and node['tag'] in WITH_ID:
            if not node.get('id'):
                node['id'] = identifier
            return nodes
    return nodes


def split_paragraph(children, identifier=None):
    """A paragraph cannot hold blocks: inline runs stay paragraphs and blocks sit between them."""
    result, run = [], []

    def flush():
        nonlocal run
        if any(isinstance(item, dict) or item.strip() for item in run):
            result.append({'tag': 'p', 'children': run})
        run = []
    for child in children:
        if isinstance(child, dict) and child['tag'] in BLOCKS:
            flush()
            result.append(child)
        else:
            run.append(child)
    flush()
    return inherit_id(result, identifier)


def box(kind, children):
    """A note or warning: the label comes first, then the text it marks."""
    label = 'Warning' if kind == 'warning' else 'Note'
    return {'tag': 'aside', 'attrs': {'kind': kind}, 'children': [{'tag': 'p', 'children': [{'tag': 'strong', 'children': [label]}]}, *children]}


def marker_text(node):
    return plain(node).strip() if isinstance(node, dict) and node['tag'] == 'p' else ''


def nest_blocks(nodes):
    """Build what the sources only announce with markers.

    A marker paragraph opens or closes a collapsible block, and an empty note or
    warning div boxes the paragraph after it. Markers that do not pair are dropped
    and their content stays in place.
    """
    root, stack, pending = [], [], None
    current = root
    for node in nodes:
        if isinstance(node, dict):
            node = dict(node, children=nest_blocks(node['children']))
        mark = marker_text(node)
        if mark.startswith(DETAILS_OPEN):
            block = {'tag': 'details', 'children': [{'tag': 'summary', 'children': [mark[1:].strip() or 'Details']}]}
            current.append(block)
            stack.append(current)
            current = block['children']
        elif mark.startswith(DETAILS_CLOSE):
            if stack:
                current = stack.pop()
        elif isinstance(node, dict) and node['tag'] == BOX_MARKER:
            pending = node['kind']
        elif pending and isinstance(node, dict) and node['tag'] == 'p':
            current.append(box(pending, [node]))
            pending = None
        else:
            current.append(node)
    while stack:
        parent = stack.pop()
        block = parent.pop()
        parent.extend(block['children'][1:])
    return root


def clean(raw, source_file, image=lambda src: None, heading_shift=0, diagrams=True, formula=None):
    """Turn rendered HTML into allowlisted nodes.

    ``image`` maps an image source to a local public path or None.
    ``heading_shift`` lowers Markdown headings so h1 becomes h2.
    ``diagrams`` marks Mermaid code blocks so the reader can draw them; without it they stay code.
    ``formula`` converts LaTeX the first renderer left as source: (latex, block) to MathML.
    """
    parser = Tree()
    # A lone surrogate from a character reference cannot be stored as UTF-8.
    parser.feed(raw.encode('utf-8', 'ignore').decode('utf-8'))
    parser.close()

    def text(value, context):
        if context == 'pre':
            return [value]
        if LINE_BREAK in value and context != 'math':
            parts = []
            for index, piece in enumerate(value.split(LINE_BREAK)):
                if index:
                    parts.append({'tag': 'br', 'children': []})
                parts.extend(text(piece, context))
            return parts
        if context == 'math':
            value = value.strip()
            return [value] if value else []
        collapsed = re.sub(r'\s+', ' ', value.replace('\xa0', ' '))
        if context == 'block':
            return [collapsed] if collapsed.strip() else []
        return [collapsed] if collapsed else []

    def walk(node, context):
        if isinstance(node, str):
            return text(node, context)
        tag, attrs = node['tag'], node['attrs']
        kind = classes(node)
        if tag in DROP or 'system-message' in kind or 'system-messages' in kind or 'problematic' in kind:
            return []
        if tag in MATHML or tag == 'math':
            if tag != 'math' and context != 'math':
                return []
            children = [child for x in node['children'] for child in walk(x, 'math')]
            result = {'tag': tag, 'children': children}
            kept = math_attrs(attrs)
            if kept:
                result['attrs'] = kept
            return [result]
        if context == 'math':
            return [child for x in node['children'] for child in walk(x, 'math')]
        if tag in ('pre', 'code') and 'math' in kind and formula:
            converted = Tree()
            converted.feed(formula(plain(node['children']), tag == 'pre'))
            converted.close()
            return [child for x in converted.root['children'] for child in walk(x, context)]
        if tag == 'pre':
            value = plain(node['children'])
            if not value.strip():
                return []
            result = {'tag': 'pre', 'children': [value.strip('\n')]}
            if valid_id(attrs.get('id')):
                result['id'] = attrs['id']
            if diagrams and any(isinstance(child, dict) and 'language-mermaid' in classes(child) for child in node['children']):
                result['attrs'] = {'lang': 'mermaid'}
            return [result]
        if tag in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            tag = f'h{min(6, max(2, int(tag[1]) + heading_shift))}'
        tag = RENAME.get(tag, tag)
        if tag == 'aside' and 'footnote' in kind and 'footnote-list' not in kind:
            return footnote(node)
        if tag == 'aside' and 'footnote-list' in kind:
            return footnote_list(node)
        if tag == 'a' and (kind & {'footnote-reference', 'brackets'} or attrs.get('role') == 'doc-noteref'):
            target = resolve_link(attrs.get('href'), source_file)
            label = re.sub(r'[\[\]\s]', '', plain(node))
            if target and label:
                link = {'tag': 'a', 'children': [label], 'href': target}
                if valid_id(attrs.get('id')):
                    link['id'] = attrs['id']
                return [{'tag': 'sup', 'children': [link]}]
        if tag == 'aside' and 'admonition' in kind:
            body = [child for x in node['children'] if not (isinstance(x, dict) and 'admonition-title' in classes(x)) for child in walk(x, 'block')]
            return [box('warning' if kind & WARNINGS else 'note', body)] if body else []
        if tag == 'div' and kind & (WARNINGS | {'note'}) and not plain(node).strip():
            return [{'tag': BOX_MARKER, 'kind': 'warning' if kind & WARNINGS else 'note', 'children': []}]
        if tag == 'table':
            return table(node)
        if tag == 'figure':
            return figure(node)
        child_context = 'inline' if tag in INLINE or tag == 'span' else 'block'
        children = [child for x in node['children'] for child in walk(x, child_context)]
        if child_context == 'inline' and tag not in PHRASING and tag != 'span':
            children = trim(children)
        if tag == 'blockquote' and source_file.endswith('.rst') and len(children) == 1 and isinstance(children[0], dict) and children[0]['tag'] in ('ul', 'ol', 'dl'):
            # In reStructuredText an indented list only means indentation, not a quotation.
            return children
        if tag == 'span' and valid_id(attrs.get('id')):
            # Inline link targets: the only spans that survive, and only for their anchor.
            return [{'tag': 'span', 'id': attrs['id'], 'children': children}]
        if tag == 'a' and not attrs.get('href') and valid_id(attrs.get('id')):
            return [{'tag': 'span', 'id': attrs['id'], 'children': children}]
        if tag == 'p' and children and all((isinstance(child, dict) and child['tag'] == 'br') or (isinstance(child, str) and not child.strip()) for child in children):
            return []
        if tag == 'p' and len(children) == 1 and isinstance(children[0], dict) and children[0]['tag'] == 'img':
            # A figure on its own line: the site shows its description as the caption.
            alt = children[0].get('alt')
            return [{'tag': 'figure', 'children': [children[0], *([{'tag': 'figcaption', 'children': [alt]}] if alt else [])]}]
        if tag == 'p' and any(isinstance(child, dict) and child['tag'] in BLOCKS for child in children):
            return split_paragraph(children, valid_id(attrs.get('id')))
        if tag not in ALLOWED:
            return inherit_id(children, valid_id(attrs.get('id')))
        if tag == 'img':
            src = image(attrs.get('src', ''))
            alt = re.sub(r'\s+', ' ', attrs.get('alt', '')).strip()[:500]
            # docutils repeats the file path as alt text when the source gives none.
            if re.search(r'[/\\]|\.(?:png|svg|jpe?g|gif)$', alt, re.I):
                alt = ''
            return [{'tag': 'img', 'src': src, 'alt': alt, 'children': []}] if src else []
        if not children and tag not in ('br', 'hr', 'td', 'th'):
            return []
        result = {'tag': tag, 'children': children}
        if tag in WITH_ID and valid_id(attrs.get('id')):
            result['id'] = attrs['id']
        if tag == 'a':
            href = resolve_link(attrs.get('href'), source_file)
            if not href or len(href) > 2000:
                return children
            result['href'] = href
        if tag in ('td', 'th'):
            for name in ('colspan', 'rowspan'):
                if attrs.get(name, '').isdigit():
                    result[name] = min(20, int(attrs[name]))
        if tag == 'ol' and attrs.get('start', '').isdigit():
            result['start'] = int(attrs['start'])
        return [result]

    def trim(children):
        while children and isinstance(children[0], str) and not children[0].strip():
            children = children[1:]
        while children and isinstance(children[-1], str) and not children[-1].strip():
            children = children[:-1]
        if children and isinstance(children[0], str):
            children[0] = children[0].lstrip()
        if children and isinstance(children[-1], str):
            children[-1] = children[-1].rstrip()
        return children

    def footnote_parts(node):
        label = ''
        body = []
        for child in node['children']:
            if isinstance(child, dict) and child['tag'] == 'span' and 'label' in classes(child):
                label = re.sub(r'\s+', '', plain(child))
            elif isinstance(child, dict) and child['tag'] == 'span' and 'backrefs' in classes(child):
                continue
            else:
                body.extend(walk(child, 'block'))
        return label, body

    def footnote_list(node):
        """Footnotes numbered in order become a list, so their numbers line up like the Markdown ones."""
        notes = [child for child in node['children'] if isinstance(child, dict)]
        parts = [footnote_parts(note) for note in notes if 'footnote' in classes(note)]
        numbers = [re.sub(r'[\[\]]', '', label) for label, _ in parts]
        first = int(numbers[0]) if numbers and numbers[0].isdigit() else None
        if first is None or len(parts) != len(notes) or numbers != [str(first + index) for index in range(len(numbers))]:
            return [child for x in node['children'] for child in walk(x, 'block')]
        items = []
        for note, (_, body) in zip(notes, parts):
            item = {'tag': 'li', 'children': body}
            if valid_id(note['attrs'].get('id')):
                item['id'] = note['attrs']['id']
            items.append(item)
        return [{'tag': 'ol', 'children': items, **({'start': first} if first != 1 else {})}]

    def footnote(node):
        label, body = footnote_parts(node)
        # The label joins the first paragraph; a footnote that opens with a list gets its own line.
        if not (body and isinstance(body[0], dict) and body[0]['tag'] == 'p'):
            body = [{'tag': 'p', 'children': []}] + body
        body[0]['children'] = ([label + ' '] if label else []) + body[0]['children']
        if valid_id(node['attrs'].get('id')):
            body[0]['id'] = node['attrs']['id']
        return body

    def table(node):
        caption = []
        rows = []
        for child in node['children']:
            if isinstance(child, dict) and child['tag'] == 'caption':
                caption = trim([item for x in child['children'] for item in walk(x, 'inline')])
            else:
                rows.extend(walk(child, 'block'))
        result = []
        if caption:
            result.append({'tag': 'p', 'children': [{'tag': 'strong', 'children': caption}]})
        # Rows written directly under a table belong to an implicit body; stray text has no place in it.
        grouped = []
        for row in (item for item in rows if isinstance(item, dict)):
            if row['tag'] == 'tr':
                if not (grouped and grouped[-1].get('implicit')):
                    grouped.append({'tag': 'tbody', 'children': [], 'implicit': True})
                grouped[-1]['children'].append(row)
            else:
                grouped.append(row)
        rows = [{key: value for key, value in row.items() if key != 'implicit'} for row in grouped]
        if rows:
            table_node = {'tag': 'table', 'children': rows}
            if valid_id(node['attrs'].get('id')):
                table_node['id'] = node['attrs']['id']
            result.append(table_node)
        return result

    def figure(node):
        children = [child for x in node['children'] for child in walk(x, 'block')]
        if not any(isinstance(child, dict) and child['tag'] == 'img' for child in children):
            result = []
            for child in children:
                if isinstance(child, dict) and child['tag'] == 'figcaption':
                    result.extend(split_paragraph(child['children']))
                else:
                    result.append(child)
            return result
        return [{'tag': 'figure', 'children': children}]

    return nest_blocks([child for node in parser.root['children'] for child in walk(node, 'block')])


def slug(value):
    return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')[:90] or 'section'


def collect_ids(nodes):
    found = set()
    for node in nodes:
        if isinstance(node, dict):
            if node.get('id'):
                found.add(node['id'])
            found |= collect_ids(node.get('children', []))
    return found


def drop_dead_anchors(nodes):
    """A link to an anchor the document does not have keeps its words but stops being a link.

    A footnote that nothing cites has a back-reference to nowhere; that arrow goes entirely.
    """
    ids = collect_ids(nodes)

    def walk(items):
        result = []
        for node in items:
            if isinstance(node, str):
                result.append(node)
                continue
            children = walk(node.get('children', []))
            href = node.get('href', '')
            if node['tag'] == 'a' and href.startswith('#') and href[1:] not in ids:
                if plain(children).strip(' \n\ufe0e') != '\u21a9':
                    result.extend(children)
                continue
            result.append(dict(node, children=children))
        return result
    return walk(nodes)


def prepare(nodes):
    """Drop the metadata header, give headings unique ids and collect the outline."""
    if nodes and isinstance(nodes[0], dict) and nodes[0]['tag'] == 'pre' and plain(nodes[0]).lstrip().startswith('ZIP:'):
        nodes = nodes[1:]
    headings, seen = [], {}

    def visit(node):
        if isinstance(node, str):
            return
        tag = node['tag']
        if tag in ('h2', 'h3', 'h4', 'h5', 'h6'):
            label = re.sub(r'\s+', ' ', plain(node)).strip()[:300]
            base = node.get('id') or slug(label)
            if base in RESERVED_IDS:
                base = f'section-{base}'
            seen[base] = seen.get(base, 0) + 1
            node['id'] = base if seen[base] == 1 else f'{base}-{seen[base]}'
            if tag in ('h2', 'h3', 'h4') and len(headings) < 500:
                headings.append({'id': node['id'], 'title': label, 'level': int(tag[1])})
        for child in node.get('children', []):
            visit(child)
    for node in nodes:
        visit(node)
    return drop_dead_anchors(nodes), headings


def summary(nodes, limit=240):
    """Prefer the Abstract paragraph; otherwise the first paragraph."""
    chosen = None
    after_abstract = False
    for node in nodes:
        if isinstance(node, str):
            continue
        if node['tag'].startswith('h'):
            after_abstract = plain(node).strip().lower() == 'abstract'
            continue
        if node['tag'] == 'p':
            value = re.sub(r'\s+', ' ', plain(node)).strip()
            if not value:
                continue
            if after_abstract:
                chosen = value
                break
            if chosen is None:
                chosen = value
    if not chosen:
        return ''
    return chosen[:limit].rsplit(' ', 1)[0] + '…' if len(chosen) > limit else chosen
