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

ALLOWED = set('p h2 h3 h4 h5 h6 a strong em ul ol li dl dt dd blockquote pre code table thead tbody tfoot tr th td figure figcaption img br hr sup sub'.split())
MATHML = set('math mrow mi mn mo msup msub msubsup mfrac msqrt mroot mtext mspace mover munder munderover mtable mtr mtd mstyle mpadded mphantom menclose semantics mmultiscripts mprescripts'.split())
MATH_ATTRS = set('display mathvariant displaystyle stretchy fence separator lspace rspace form accent accentunder width height depth voffset linethickness columnalign rowalign columnspacing rowspacing notation largeop movablelimits symmetric minsize maxsize mathsize scriptlevel'.split())
MATH_VALUE = re.compile(r'^[A-Za-z0-9 .%,+-]{0,40}$')
DROP = set('script style iframe object embed form input button select textarea svg noscript template colgroup col link meta annotation annotation-xml title head'.split())
RENAME = {'b': 'strong', 'i': 'em', 'tt': 'code', 'kbd': 'code', 'samp': 'code', 'cite': 'em', 'var': 'em', 'dfn': 'em'}
INLINE = set('p h1 h2 h3 h4 h5 h6 li dt dd td th figcaption a strong em code sup sub'.split())
VOID = set('img br hr input meta link source area wbr col'.split())
WITH_ID = set('p h2 h3 h4 h5 h6 li dt dd blockquote pre table figure a sup'.split())
ID = re.compile(r'^[A-Za-z][A-Za-z0-9_.:-]{0,199}$')
ZIP_LINK = re.compile(r'^(?:\./)?(zip-\d{4}|draft-[a-z0-9][a-z0-9-]*)(?:\.(?:rst|md|html))?(#[^#]*)?$', re.I)
RENDERED = re.compile(r'^(?:\.\./)*rendered/(.+)$')
PROTOCOL = re.compile(r'^(?:\.\./)*protocol/(.+)$')
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
    match = RENDERED.match(value)
    if match:
        return safe_url(OFFICIAL + match.group(1), OFFICIAL)
    match = PROTOCOL.match(value)
    if match:
        return safe_url(OFFICIAL + 'protocol/' + match.group(1), OFFICIAL)
    return safe_url(value, GITHUB_FILES + source_file)


def valid_id(value):
    return value if value and ID.match(value) else None


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


def clean(raw, source_file, image=lambda src: None, heading_shift=0):
    """Turn rendered HTML into allowlisted nodes.

    ``image`` maps an image source to a local public path or None.
    ``heading_shift`` lowers Markdown headings so h1 becomes h2.
    """
    parser = Tree()
    parser.feed(raw)
    parser.close()

    def text(value, context):
        if context == 'pre':
            return [value]
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
        if tag == 'pre':
            value = plain(node['children'])
            if not value.strip():
                return []
            result = {'tag': 'pre', 'children': [value.strip('\n')]}
            if valid_id(attrs.get('id')):
                result['id'] = attrs['id']
            return [result]
        if tag in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            tag = f'h{min(6, max(2, int(tag[1]) + heading_shift))}'
        tag = RENAME.get(tag, tag)
        if tag == 'aside' and 'footnote' in kind and 'footnote-list' not in kind:
            return [footnote(node)]
        if tag == 'p' and 'admonition-title' in kind:
            label = [child for x in node['children'] for child in walk(x, 'inline')]
            return [{'tag': 'p', 'children': [{'tag': 'strong', 'children': label}]}] if label else []
        if tag == 'table':
            return table(node)
        if tag == 'figure':
            return figure(node)
        child_context = 'inline' if tag in INLINE else 'block'
        children = [child for x in node['children'] for child in walk(x, child_context)]
        if child_context == 'inline':
            children = trim(children)
        if tag not in ALLOWED:
            return inherit_id(children, valid_id(attrs.get('id')))
        if tag == 'img':
            src = image(attrs.get('src', ''))
            alt = re.sub(r'\s+', ' ', attrs.get('alt', '')).strip()
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
            if not href:
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

    def footnote(node):
        label = ''
        body = []
        for child in node['children']:
            if isinstance(child, dict) and child['tag'] == 'span' and 'label' in classes(child):
                label = re.sub(r'\s+', '', plain(child))
            else:
                body.extend(walk(child, 'block'))
        paragraphs = [item for item in body if isinstance(item, dict) and item['tag'] == 'p']
        first = paragraphs[0] if paragraphs else {'tag': 'p', 'children': body}
        first['children'] = ([label + ' '] if label else []) + first['children']
        if valid_id(node['attrs'].get('id')):
            first['id'] = node['attrs']['id']
        return first if paragraphs else first

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
        if rows:
            table_node = {'tag': 'table', 'children': rows}
            if valid_id(node['attrs'].get('id')):
                table_node['id'] = node['attrs']['id']
            result.append(table_node)
        return result

    def figure(node):
        children = [child for x in node['children'] for child in walk(x, 'block')]
        if not any(isinstance(child, dict) and child['tag'] == 'img' for child in children):
            return [{'tag': 'p', 'children': child['children']} if isinstance(child, dict) and child['tag'] == 'figcaption' else child for child in children]
        return [{'tag': 'figure', 'children': children}]

    return [child for node in parser.root['children'] for child in walk(node, 'block')]


def slug(value):
    return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')[:90] or 'section'


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
            label = re.sub(r'\s+', ' ', plain(node)).strip()
            base = node.get('id') or slug(label)
            seen[base] = seen.get(base, 0) + 1
            node['id'] = base if seen[base] == 1 else f'{base}-{seen[base]}'
            if tag in ('h2', 'h3', 'h4'):
                headings.append({'id': node['id'], 'title': label, 'level': int(tag[1])})
        for child in node.get('children', []):
            visit(child)
    for node in nodes:
        visit(node)
    return nodes, headings


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
