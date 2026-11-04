#!/usr/bin/env python3
"""Import public Shielded Labs publishing into inert, allowlisted document nodes.

Run manually after editorial review. No scripts, styles, embeds, forms, tracking,
or remote image URLs are passed to the reader. Source dates are preserved.
"""
import argparse
import hashlib
import html
import json
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src/lib/shielded-preview/editorial'
MEDIA = ROOT / 'public/shielded-preview/editorial'
ORIGIN = 'https://shieldedlabs.net/'
MEDIA_ISSUES = []
ALLOWED = set('p h2 h3 h4 h5 h6 a strong em ul ol li blockquote pre code table thead tbody tr th td figure figcaption img br hr sup sub'.split())
DROP = set('script style iframe object embed form input button select textarea svg noscript template'.split())
VOID = set('img br hr input meta link source area wbr'.split())
BLOCK = set('div section article header footer p h1 h2 h3 h4 h5 h6 ul ol li blockquote table figure pre'.split())
SHORTCODE = re.compile(r'\[/?(?:vc_|ut_|contact-form-|wpbakery)[^\]]*\]', re.I)
PROJECTS = [('crosslink', 'Crosslink'), ('epoch', 'Epoch'), ('nsm', 'NSM'), ('ironwood', 'Ironwood'), ('zero', 'Zero'), ('fees', 'Dynamic Fees')]
# Reviewed associations that cannot be recovered from the article title alone.
ARTICLE_PROJECTS = {'zcash-and-staking-economics': ['crosslink']}
PAGES = {
    'crosslink': ('crosslink-guide', 'Crosslink overview', 'Guide', ['crosslink']),
    'crosslink-faq': ('crosslink-faq', 'Crosslink FAQ', 'FAQ', ['crosslink']),
    'roadmap': ('crosslink-roadmap', 'Crosslink roadmap', 'Roadmap', ['crosslink']),
    'nsm': ('nsm-guide', 'Network Sustainability Mechanism', 'Guide & FAQ', ['nsm']),
    'fees': ('fees-guide', 'Dynamic Fees overview', 'Guide', ['fees']),
    'dynamic-fees-roadmap': ('fees-roadmap', 'Dynamic Fees roadmap', 'Roadmap', ['fees']),
    'ironwood': ('ironwood-guide', 'Ironwood overview', 'Guide', ['ironwood']),
    'zero': ('zero-guide', 'Zero overview', 'Guide', ['zero']),
    'home': ('organization', 'About Shielded Labs', 'Organization', []),
    'privacy-policy': ('privacy', 'Privacy', 'Policy', []),
}


def article_projects(slug, title):
    project_ids = [key for key, name in PROJECTS if name.lower() in title.lower()]
    if any(word in title.lower() for word in ('orchard', 'counterfeiting')):
        project_ids.append('ironwood')
    return list(dict.fromkeys(project_ids + ARTICLE_PROJECTS.get(slug, [])))


def request(url):
    with urlopen(Request(url, headers={'User-Agent': 'ShieldedPortalEditorial/1.0'}), timeout=30) as response:
        data = response.read(12_000_001)
        if len(data) > 12_000_000:
            raise ValueError('Source exceeds import size limit')
        return data, response.headers.get_content_type()


def safe_url(value, base=ORIGIN):
    value = html.unescape(value or '').strip()
    if any(ord(c) < 32 for c in value):
        return None
    url = urljoin(base, value)
    p = urlparse(url)
    if p.scheme not in ('https', 'http', 'mailto') or p.username or p.password:
        return None
    if p.scheme in ('https', 'http') and (not p.hostname or re.search(r'\s', p.netloc)):
        return None
    return url


class Tree(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = {'tag': 'root', 'children': []}
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        # WordPress page builders emit block elements inside paragraphs.
        if tag in BLOCK and self.stack[-1]['tag'] == 'p':
            self.stack.pop()
        node = {'tag': tag, 'attrs': dict(attrs), 'children': []}
        self.stack[-1]['children'].append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i]['tag'] == tag:
                self.stack = self.stack[:i]
                break

    def handle_data(self, data):
        self.stack[-1]['children'].append(data)


def plain(nodes):
    if isinstance(nodes, str):
        return nodes
    if isinstance(nodes, dict):
        return plain(nodes.get('children', []))
    return ' '.join(plain(node) for node in nodes)


def asset(url):
    parsed = urlparse(url)
    if parsed.hostname not in ('shieldedlabs.net', 'global.discourse-cdn.com'):
        return None
    digest = hashlib.sha256(url.encode()).hexdigest()[:20]
    ext = Path(parsed.path).suffix.lower()
    if ext not in ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff'):
        return None
    target = MEDIA / (digest + ('.png' if ext in ('.tif', '.tiff') else ext))
    if not target.exists():
        try:
            data, mime = request(url)
        except (HTTPError, URLError) as exc:
            MEDIA_ISSUES.append({'url': url, 'error': str(exc)})
            return None
        if not mime.startswith('image/') or mime == 'image/svg+xml':
            raise ValueError('Unsupported media: ' + url)
        if ext in ('.tif', '.tiff'):
            # macOS built-in image conversion preserves these legacy blog figures.
            import subprocess
            original = MEDIA / (digest + ext)
            original.write_bytes(data)
            subprocess.run(['sips', '-s', 'format', 'png', str(original), '--out', str(target)], check=True, capture_output=True)
            original.unlink()
        else:
            target.write_bytes(data)
    return '/shielded-preview/editorial/' + target.name


def featured_image(row):
    """Use the publisher's Open Graph artwork, not a generated placeholder."""
    for media in row.get('yoast_head_json', {}).get('og_image', []):
        url = safe_url(media.get('url'))
        local = asset(url) if url else None
        if local:
            title = html.unescape(re.sub('<[^>]*>', '', row['title']['rendered']))
            return dict(src=local, alt='Artwork for ' + title,
                        width=media.get('width', 1600), height=media.get('height', 900), source=url)
    return None


def clean(raw, base=ORIGIN, download=True):
    parser = Tree()
    parser.feed(raw)

    def walk(node):
        if isinstance(node, str):
            value = SHORTCODE.sub('', node).replace('\xa0', ' ')
            return [value] if value.strip() else []
        tag, attrs = node['tag'], node.get('attrs', {})
        if tag in DROP:
            return []
        children = [child for x in node['children'] for child in walk(x)]
        tag = {'b': 'strong', 'i': 'em', 'h1': 'h2', 'summary': 'h3'}.get(tag, tag)
        if tag not in ALLOWED:
            return children
        if tag == 'img':
            src = safe_url(attrs.get('data-src') or attrs.get('src'), base)
            src = asset(src) if src and download else None
            return [{'tag': 'img', 'src': src, 'alt': attrs.get('alt', ''), 'children': []}] if src else []
        if not children and tag not in ('br', 'hr'):
            return []
        result = {'tag': tag, 'children': children}
        if tag in ('h2', 'h3', 'h4') and attrs.get('id'):
            result['id'] = attrs['id'][:200]
        if tag == 'a':
            url = safe_url(attrs.get('href'), base)
            if not url:
                return children
            result['href'] = url
        if tag in ('td', 'th'):
            for name in ('colspan', 'rowspan'):
                if attrs.get(name, '').isdigit():
                    result[name] = min(20, int(attrs[name]))
        # Presentation headings on the old homepage contain whole paragraphs.
        if tag.startswith('h') and tag != 'hr' and len(plain(children)) > 180:
            result['tag'] = 'p'
        return [result]

    return [child for node in parser.root['children'] for child in walk(node)]


def normalize_blog(nodes):
    for node in nodes:
        if isinstance(node, str):
            continue
        if node['tag'] == 'h4':
            node['tag'] = 'p'
        if node['tag'] == 'p' and len(node['children']) == 1 and isinstance(node['children'][0], dict) and node['children'][0]['tag'] == 'strong':
            node['children'] = node['children'][0]['children']
        normalize_blog(node['children'])


def normalized(value):
    return re.sub(r'[^a-z0-9]', '', value.lower())


def base_heading_id(value):
    # Stable mdBook anchors are meaningful; generated WP builder IDs are not.
    return value and not value.startswith(('ut_', 'ut-', 'vc_'))


def prepare(nodes, title, source_title=""):
    headings, seen = [], {}
    # Drop only an initial duplicate page title, never an article section.
    if nodes and isinstance(nodes[0], dict) and nodes[0]['tag'].startswith('h') and (normalized(plain(nodes[0])) in (normalized(title), normalized(source_title), 'privacypolicy', 'about') or normalized(plain(nodes[0])).startswith(normalized(title))):
        nodes = nodes[1:]

    def visit(node):
        if isinstance(node, str):
            return
        tag = node['tag']
        if tag in ('h2', 'h3', 'h4'):
            label = re.sub(r'\s+', ' ', plain(node)).strip()
            slug = node.get('id') if base_heading_id(node.get('id')) else re.sub(r'[^a-z0-9]+', '-', label.lower()).strip('-')[:90] or 'section'
            seen[slug] = seen.get(slug, 0) + 1
            anchor = slug + (f'-{seen[slug]}' if seen[slug] > 1 else '')
            node['id'] = anchor
            headings.append({'id': anchor, 'title': label, 'level': int(tag[1])})
        for child in node.get('children', []):
            visit(child)
    for node in nodes:
        visit(node)
    return nodes, headings


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', type=Path)
    ap.add_argument('--featured-only', action='store_true', help='Add publisher artwork without reimporting article bodies')
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    MEDIA.mkdir(parents=True, exist_ok=True)
    raw = json.loads(args.input.read_text()) if args.input else {kind: json.loads(request(f'{ORIGIN}wp-json/wp/v2/{kind}?per_page=100')[0]) for kind in ('pages', 'posts', 'categories')}
    if args.featured_only:
        images = {row['slug']: featured_image(row) for row in raw['posts']}
        if not all(images.values()):
            raise ValueError('Missing publisher artwork; existing documents were not changed')
        for filename in ('documents.json', 'catalog.json'):
            docs = json.loads((OUT/filename).read_text())
            for doc in docs:
                if doc['view'] == 'blog' and doc['id'] in images:
                    doc['image'] = images[doc['id']]
            (OUT/filename).write_text(json.dumps(docs, ensure_ascii=False, indent=2)+'\n')
        print(json.dumps({'featured_images': len(images), 'issues': MEDIA_ISSUES}))
        return
    observed = datetime.now(timezone.utc).isoformat()
    categories = {row['id']: row['name'] for row in raw['categories']}
    documents = []
    for kind in ('posts', 'pages'):
        for row in raw[kind]:
            if kind == 'pages' and row['slug'] not in PAGES:
                continue
            title = html.unescape(re.sub('<[^>]*>', '', row['title']['rendered']))
            project_ids = article_projects(row['slug'], title)
            identifier, category, view = row['slug'], categories.get(row.get('categories', [0])[0], 'News'), 'blog'
            if kind == 'pages':
                identifier, title, category, project_ids = PAGES[row['slug']]
                view = 'about' if identifier in ('organization', 'privacy') else 'resources'
            nodes = clean(row['content']['rendered'], row['link'])
            # The old editor used h4/strong as paragraph styling in blog posts.
            if kind == 'posts':
                normalize_blog(nodes)
            author = {1: 'Jason McGee', 3: 'Mark Henderson', 4: 'Zooko Wilcox'}.get(row.get('author'), 'Shielded Labs') if kind == 'posts' else 'Shielded Labs'
            if nodes and plain(nodes[0]).strip().lower().startswith('by:'):
                author = re.sub(r'^by:\s*', '', plain(nodes.pop(0)), flags=re.I).strip()
            nodes, headings = prepare(nodes, title, html.unescape(re.sub('<[^>]*>', '', row['title']['rendered'])))
            text = re.sub(r'\s+', ' ', plain(nodes)).strip()
            # Short editorial leads belong in the listing, not repeated above the article.
            first_p = next((plain(n).strip() for n in nodes if isinstance(n, dict) and n['tag'] == 'p' and len(plain(n)) > 65), text)
            summary = first_p[:195].rsplit(' ', 1)[0] + '…' if len(first_p) > 195 else first_p
            resource_summaries = {
                'crosslink-guide': 'The proposed finality upgrade, its goals and the paths to participate.',
                'crosslink-faq': '23 questions about finality, staking, privacy, security and governance.',
                'crosslink-roadmap': 'Completed prototype milestones and the published production roadmap.',
                'nsm-guide': 'How the NSM works, its proposed mechanisms, ZIP references and 11 common questions.',
                'ironwood-guide': 'The original upgrade guide: supply soundness, user guidance and audit references.',
                'zero-guide': 'Infrastructure software, supported deployments and repositories.',
                'fees-guide': 'The fee mechanism initiative and its experimental resources.',
                'fees-roadmap': 'Wallet pilots, fee estimation, parameter tuning and open design questions.',
            }
            summary = resource_summaries.get(identifier, summary)
            doc = dict(id=identifier, title=title, view=view, category=category, projects=project_ids, author=author,
                       publishedAt=row['date_gmt']+'Z', updatedAt=row['modified_gmt']+'Z', observedAt=observed,
                       source=row['link'], summary=summary, minutes=max(1, round(len(text.split())/220)), headings=headings, body=nodes)
            if kind == 'posts':
                image = featured_image(row)
                if image:
                    doc['image'] = image
            if identifier == 'crosslink-faq':
                doc['notice'] = 'This FAQ describes a proposal. Its timeline and parameters reflect the source publication; follow the project overview for later milestones.'
            if identifier == 'ironwood-guide':
                doc['notice'] = 'This page preserves the July 2026 publication, including its activation timeline. The October Epoch announcement reports the later NU6.3 deployment.'
            if identifier == 'privacy':
                doc['notice'] = 'Policy published for shieldedlabs.net. The portal contact form forwards your name, email and message to Shielded Labs’ existing contact service. Interactive simulators load from their respective project hosts.'
            documents.append(doc)
    # The Epoch launch article is also its current project guide.
    epoch = next(d for d in documents if d['id'] == 'epoch-future-proof-cryptography-for-zcash')
    documents.append(dict(epoch, id='epoch-guide', title='Epoch research overview', view='resources', category='Research guide', summary='The research program for post-quantum cryptography and high-assurance Zcash implementations.'))
    # Import the complete linked engineering handbook, including its scope and
    # build/usage sections, as one searchable internal document.
    book_url = 'https://shieldedlabs.github.io/zebra-crosslink/print.html'
    book_html = request(book_url)[0].decode()
    match = re.search(r'<main[^>]*>(.*?)</main>', book_html, re.S)
    if not match:
        raise ValueError('Crosslink handbook main content not found')
    nodes, headings = prepare(clean(match.group(1), book_url), 'Crosslink engineering handbook', 'The zebra-crosslink Book')
    documents.append(dict(id='crosslink-handbook', title='Crosslink engineering handbook', view='resources', category='Technical reference',
                          projects=['crosslink'], author='Shielded Labs contributors', publishedAt=observed, updatedAt=observed, observedAt=observed, dateKind='retrieved',
                          source=book_url, summary='Scope, architecture, implementation, and build instructions from the Crosslink engineering handbook.',
                          minutes=max(1,round(len(plain(nodes).split())/220)), headings=headings, body=nodes,
                          notice='Engineering documentation retrieved from the published handbook. Prototype commands and network parameters can change.'))
    # Board portraits are structured separately instead of importing layout widgets.
    board_page = next(r for r in raw['pages'] if r['slug'] == 'board')
    tree = Tree(); tree.feed(board_page['content']['rendered'])
    board = []
    def board_walk(node):
        if isinstance(node, str): return
        if 'bklyn-team-member ' in node.get('attrs', {}).get('class', ''):
            def descendants(n):
                if isinstance(n, str): return []
                return [n] + [x for c in n['children'] for x in descendants(c)]
            ds = descendants(node)
            name = plain(next(x for x in ds if x['tag'] == 'h3')).strip()
            img = next(x for x in ds if x['tag'] == 'img')['attrs']
            href = next(x for x in ds if x['tag'] == 'a')['attrs']['href']
            board.append(dict(id=re.sub('[^a-z0-9]+','-',name.lower()),name=name,portrait=asset(img.get('data-src') or img['src']),social=safe_url(href),source=board_page['link']))
        else:
            for child in node.get('children', []): board_walk(child)
    board_walk(tree.root)
    (OUT/'documents.json').write_text(json.dumps(documents,ensure_ascii=False,indent=2)+'\n')
    (OUT/'catalog.json').write_text(json.dumps([{k:v for k,v in d.items() if k!='body'} for d in documents],ensure_ascii=False,indent=2)+'\n')
    (ROOT/'reports/shielded-preview/editorial-media-issues.json').write_text(json.dumps(MEDIA_ISSUES,indent=2)+'\n')
    (OUT/'board.json').write_text(json.dumps(board,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'documents':len(documents),'posts':sum(d['view']=='blog' for d in documents),'resources':sum(d['view']=='resources' for d in documents),'board':len(board),'headings':sum(len(d['headings']) for d in documents),'observedAt':observed}))

if __name__ == '__main__':
    main()
