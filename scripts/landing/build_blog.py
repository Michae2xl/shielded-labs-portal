"""Build the blog of the landing proposal (public/landing) from the portal's editorial data.

The landing keeps its own copy of the blog, in the format of the portal's blog: a list with
category filters and search, and one reader page per post with its headings, project and source.

Run with the portal serving on 127.0.0.1:4248 (npm start), which provides the documents:
    python3 scripts/landing/build_blog.py
"""
from __future__ import annotations

import html
import json
import re
import shutil
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LANDING = ROOT / "public" / "landing"
IMAGES = LANDING / "assets" / "images" / "blog"
CATALOG = ROOT / "src" / "lib" / "shielded-preview" / "editorial" / "documents.json"
API = "http://127.0.0.1:4248/api/shielded-preview/editorial?id="
TEMPLATE = LANDING / "key-facts.html"
LINKED = ["the-network-sustainability-mechanism-nsm-activates-with-nu7"]
# The NU7 post keeps the address it already had on the landing.
FILES = {"the-network-sustainability-mechanism-nsm-activates-with-nu7": "nsm-activates-with-nu7.html"}
CATEGORIES = ["News", "Engineering Update", "Governance", "Security"]
PROJECTS = {
    "nsm": ("Network Sustainability Mechanism", "nsm.html"),
    "crosslink": ("Crosslink", "crosslink.html"),
    "fees": ("Dynamic Fees", "https://shieldedlabs.net/fees/"),
    "zero": ("Zero", "https://shieldedlabs.net/zero/"),
    "ironwood": ("Ironwood", "https://shieldedlabs.net/ironwood/"),
    "epoch": ("Epoch", None),
}
ARROW = '<svg class="arr" viewBox="0 0 15 10" aria-hidden="true" focusable="false"><path d="M0 5h13.5M9.5 1l4 4-4 4"></path></svg>'
BACK = '<svg class="arr arr--back" viewBox="0 0 15 10" aria-hidden="true" focusable="false"><path d="M15 5H1.5M5.5 1l-4 4 4 4"></path></svg>'
OUT = '<svg class="arr" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 9 9 3M4 3h5v5"></path></svg>'
VOID = {"br", "img", "hr"}
ALLOWED = {"p", "strong", "em", "b", "i", "a", "li", "ul", "ol", "h2", "h3", "h4", "h5", "h6", "img", "br", "hr", "code", "pre", "sup", "sub", "blockquote", "del", "table", "thead", "tbody", "tr", "th", "td", "figure", "figcaption"}


def esc(text: str) -> str:
    return html.escape(text, quote=True)


def post_file(doc_id: str) -> str:
    return FILES.get(doc_id, f"blog-{doc_id}.html")


def day(value: str) -> str:
    moment = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return f"{moment.day} {moment.strftime('%b %Y')}"


def iso_day(value: str) -> str:
    return value[:10]


def fetch(doc_id: str) -> dict:
    with urllib.request.urlopen(API + doc_id, timeout=30) as response:
        return json.load(response)


def copy_image(src: str) -> str:
    """Copy a portal image next to the landing and return its address from a landing page."""
    origin = ROOT / "public" / src.lstrip("/")
    if not origin.exists():
        raise FileNotFoundError(origin)
    IMAGES.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(origin, IMAGES / origin.name)
    return f"assets/images/blog/{origin.name}"


def local_href(href: str, ids: set[str]) -> str:
    match = re.match(r"https?://(?:www\.)?shieldedlabs\.net/([^/?#]+)/?(#.*)?$", href)
    if match and match.group(1) in ids:
        return post_file(match.group(1)) + (match.group(2) or "")
    return href


def render(nodes, ids: set[str]) -> str:
    out = []
    for node in nodes:
        if isinstance(node, str):
            out.append(esc(node))
            continue
        tag = node.get("tag")
        if tag not in ALLOWED:
            raise ValueError(f"unexpected tag {tag!r}")
        attrs = ""
        if node.get("id"):
            attrs += f' id="{esc(node["id"])}"'
        if tag == "a":
            href = local_href(node.get("href", ""), ids)
            attrs += f' href="{esc(href)}"'
            if href.startswith("http"):
                attrs += ' target="_blank" rel="noopener noreferrer"'
        if tag == "img":
            attrs += f' src="{esc(copy_image(node["src"]))}" alt="{esc(node.get("alt", ""))}" loading="lazy" decoding="async"'
        if tag in VOID:
            out.append(f"<{tag}{attrs}>")
        else:
            out.append(f"<{tag}{attrs}>{render(node.get('children', []), ids)}</{tag}>")
    return "".join(out)


def shell() -> tuple[str, str]:
    page = TEMPLATE.read_text()
    start = page.index('<main id="main">')
    end = page.index("</main>")
    return page[:start], page[end:]


def page(head: str, tail: str, title: str, description: str, main: str) -> str:
    head = re.sub(r"<title>.*?</title>", f"<title>{esc(title)}</title>", head, count=1)
    head = re.sub(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + esc(description) + m.group(2), head, count=1)
    head = head.replace('<li><a href="blog.html">Blog</a></li>', '<li><a href="blog.html" aria-current="page">Blog</a></li>', 1)
    return head + main + tail


def row(doc: dict) -> str:
    cover = ""
    if doc.get("image"):
        cover = f'<img src="{esc(copy_image(doc["image"]["src"]))}" width="{doc["image"]["width"]}" height="{doc["image"]["height"]}" alt="" loading="lazy" decoding="async">'
    words = esc(f'{doc["title"]} {doc["author"]} {doc["category"]} {doc.get("summary", "")}'.lower())
    return f"""      <li class="blog-row" data-category="{esc(doc['category'])}" data-words="{words}">
        <a class="blog-row__link" href="{post_file(doc['id'])}">
          <span class="blog-row__cover">{cover}</span>
          <span class="blog-row__text">
            <span class="blog-row__meta"><span>{esc(doc['category'])}</span><time datetime="{iso_day(doc['publishedAt'])}">{day(doc['publishedAt'])}</time></span>
            <span class="blog-row__title">{esc(doc['title'])}</span>
            <span class="blog-row__by">{esc(doc['author'])} <span aria-hidden="true">·</span> {doc['minutes']} min read</span>
          </span>
          {ARROW}
        </a>
      </li>"""


FILTER_SCRIPT = """<script>
(function () {
  var list = document.querySelector('[data-blog-list]');
  var buttons = document.querySelectorAll('[data-blog-filter]');
  var search = document.querySelector('[data-blog-search]');
  var empty = document.querySelector('[data-blog-empty]');
  if (!list) return;
  var category = 'all';
  function apply() {
    var words = (search && search.value || '').trim().toLowerCase();
    var shown = 0;
    list.querySelectorAll('.blog-row').forEach(function (row) {
      var visible = (category === 'all' || row.dataset.category === category) && (!words || row.dataset.words.indexOf(words) !== -1);
      row.hidden = !visible;
      if (visible) shown += 1;
    });
    if (empty) empty.hidden = shown > 0;
  }
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      category = button.dataset.blogFilter;
      buttons.forEach(function (other) { other.setAttribute('aria-pressed', String(other === button)); });
      apply();
    });
  });
  if (search) search.addEventListener('input', apply);
})();
</script>
"""


def index_page(head: str, tail: str, docs: list[dict]) -> str:
    filters = ['<button type="button" class="blog-filter" data-blog-filter="all" aria-pressed="true">All articles</button>']
    filters += [f'<button type="button" class="blog-filter" data-blog-filter="{esc(c)}" aria-pressed="false">{esc(c)}</button>' for c in CATEGORIES]
    main = f"""<main id="main">

<section class="section section--page-head blog-head">
  <div class="wrap">
    <h1>Blog</h1>
  </div>
</section>
<section class="section section--flush">
  <div class="wrap blog">
    <div class="blog-tools">
      <div class="blog-filters" role="group" aria-label="Category">{''.join(filters)}</div>
      <label class="blog-search"><span class="vh">Search articles</span><input type="search" placeholder="Search articles…" data-blog-search></label>
    </div>
    <ul class="blog-list" data-blog-list>
{chr(10).join(row(doc) for doc in docs)}
    </ul>
    <p class="blog-empty" data-blog-empty hidden>No articles match.</p>
  </div>
</section>
{FILTER_SCRIPT}
"""
    return page(head, tail, "Shielded Labs: blog", "Articles from Shielded Labs: news, engineering updates, governance and security.", main)


def post_page(head: str, tail: str, doc: dict, ids: set[str]) -> str:
    cover = ""
    if doc.get("image"):
        img = doc["image"]
        cover = f'<figure class="post__cover"><img src="{esc(copy_image(img["src"]))}" width="{img["width"]}" height="{img["height"]}" alt="{esc(img.get("alt", ""))}" decoding="async"></figure>'
    toc = ""
    if doc.get("headings"):
        items = "".join(f'<li><a href="#{esc(h["id"])}">{esc(h["title"])}</a></li>' for h in doc["headings"] if h.get("level", 2) == 2)
        toc = f'<div class="post-aside__block"><p class="post-aside__label">On this page</p><ol class="post-aside__toc">{items}</ol></div>'
    project = ""
    for key in doc.get("projects", []):
        name, href = PROJECTS.get(key, (key.title(), None))
        target = href or ("blog-epoch-future-proof-cryptography-for-zcash.html" if key == "epoch" else None)
        if target and target != post_file(doc["id"]):
            project += f'<a class="post-aside__link" href="{esc(target)}"><span>{esc(name)}</span>{ARROW}</a>'
        else:
            project += f'<p class="post-aside__text">{esc(name)}</p>'
    if project:
        project = f'<div class="post-aside__block"><p class="post-aside__label">Project</p>{project}</div>'
    linked = doc.get("linked") or {}
    source_label = f"Original on {linked['publisher']}" if linked.get("publisher") else "Original source"
    source = (
        '<div class="post-aside__block"><p class="post-aside__label">Source</p>'
        f'<p class="post-aside__text">Updated {day(doc["updatedAt"])}</p>'
        f'<p class="post-aside__text">Retrieved {day(doc["observedAt"])}</p>'
        f'<a class="post-aside__link" href="{esc(doc["source"])}" target="_blank" rel="noopener noreferrer"><span>{esc(source_label)}</span>{OUT}</a>'
    )
    if linked.get("also"):
        source += f'<a class="post-aside__link" href="{esc(linked["also"]["href"])}" target="_blank" rel="noopener noreferrer"><span>{esc(linked["also"]["label"])}</span>{OUT}</a>'
    source += "</div>"
    main = f"""<main id="main">

<article class="section post">
  <div class="wrap">
    <p class="post__back"><a href="blog.html">{BACK}<span>Articles</span></a></p>
    <h1 class="post__title">{esc(doc['title'])}</h1>
    <p class="post__meta"><span>{esc(doc['author'])}</span><span aria-hidden="true">·</span><time datetime="{iso_day(doc['publishedAt'])}">{day(doc['publishedAt'])}</time><span aria-hidden="true">·</span><span>{doc['minutes']} min read</span></p>
    <div class="post__grid">
      <div class="post__main">
        {cover}
        <div class="post__body">{render(doc['body'], ids)}</div>
      </div>
      <aside class="post-aside" aria-label="About this article">{toc}{project}{source}</aside>
    </div>
  </div>
</article>

"""
    summary = doc.get("summary") or doc["title"]
    return page(head, tail, f"{doc['title']} | Shielded Labs", summary, main)


def main() -> int:
    catalog = json.loads(CATALOG.read_text())
    ids = [entry["id"] for entry in catalog if entry["view"] == "blog"] + LINKED
    docs = sorted((fetch(doc_id) for doc_id in ids), key=lambda doc: doc["publishedAt"], reverse=True)
    known = {doc["id"] for doc in docs}
    head, tail = shell()
    if IMAGES.exists():
        for old in IMAGES.iterdir():
            old.unlink()
    for old in LANDING.glob("blog-*.html"):
        old.unlink()
    (LANDING / "blog.html").write_text(index_page(head, tail, docs))
    for doc in docs:
        (LANDING / post_file(doc["id"])).write_text(post_page(head, tail, doc, known))
    print(f"blog: {len(docs)} posts")
    return 0


if __name__ == "__main__":
    sys.exit(main())
