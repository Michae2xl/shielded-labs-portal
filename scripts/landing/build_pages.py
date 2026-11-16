"""Build the landing's copies of the pages of the live site (shieldedlabs.net).

The text and links stay as on the live site; only the layout changes, to the pattern of the landing:
a centered title with a short rule, then the content in a centered column. Images are copied next to
the landing, embeds become plain links, and links to pages the landing has stay on the landing.

    python3 scripts/landing/build_pages.py
"""
from __future__ import annotations

import html
import re
import sys
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LANDING = ROOT / "public" / "landing"
IMAGES = LANDING / "assets" / "images" / "site"
TEMPLATE = LANDING / "key-facts.html"
SITE = "https://shieldedlabs.net/"
UA = {"User-Agent": "Mozilla/5.0 (landing build)"}

# path on the live site -> (file on the landing, title, menu item marked current)
PAGES = {
    "projects/": ("projects.html", "Projects", "projects"),
    "fees/": ("fees.html", "Dynamic Fees", "projects"),
    "zero/": ("zero.html", "Zero", "projects"),
    "ironwood/": ("ironwood.html", "Ironwood", "projects"),
    "roadmap/": ("roadmap.html", "Roadmap", "projects"),
    "crosslink-faq/": ("crosslink-faq.html", "Crosslink FAQ", "projects"),
    "jobs/": ("jobs.html", "Jobs", "jobs"),
    "job/cryptographer/": ("jobs-cryptographer.html", "Cryptographer", "jobs"),
    "privacy-policy/": ("privacy-policy.html", "Privacy Policy", None),
}
# Pages the landing already has, by their path on the live site.
LOCAL = {"": "index.html", "nsm/": "nsm.html", "crosslink/": "crosslink.html", "team/": "team.html", "board/": "board.html",
         "governance/": "governance.html", "blog/": "blog.html", "contact/": "contact.html"}
ALLOWED = {"h2", "h3", "h4", "h5", "h6", "p", "ul", "ol", "li", "a", "strong", "em", "b", "i", "img", "del", "s",
           "blockquote", "table", "thead", "tbody", "tr", "th", "td", "br", "hr", "code", "pre", "sup", "sub"}
BLOCK = {"h2", "h3", "h4", "h5", "h6", "p", "ul", "ol", "blockquote", "table", "pre", "hr"}
VOID = {"img", "br", "hr"}
SKIP = {"script", "style", "noscript", "form", "svg", "button"}


def local(href: str) -> str:
    match = re.match(r"https?://(?:www\.)?shieldedlabs\.net/(.*)$", href)
    if not match:
        return href
    path, _, frag = match.group(1).partition("#")
    path = path if not path or path.endswith("/") else path + "/"
    target = None
    if path in PAGES:
        target = PAGES[path][0]
    elif path in LOCAL:
        target = LOCAL[path]
    elif re.fullmatch(r"[a-z0-9-]+/", path) and (LANDING / f"blog-{path[:-1]}.html").exists():
        target = f"blog-{path[:-1]}.html"
    if target is None:
        return href
    return target + (f"#{frag}" if frag else "")


def image(src: str) -> str:
    name = re.sub(r"[^A-Za-z0-9._-]", "-", src.rsplit("/", 1)[-1].split("?")[0])
    IMAGES.mkdir(parents=True, exist_ok=True)
    target = IMAGES / name
    if not target.exists():
        with urllib.request.urlopen(urllib.request.Request(src, headers=UA), timeout=60) as response:
            target.write_bytes(response.read())
    return f"assets/images/site/{name}"


class Clean(HTMLParser):
    """Keeps the text and the plain structure of a WordPress page, nothing of its layout."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.out: list[str] = []
        self.open: list[str] = []
        self.skip = 0
        self.implicit = False

    def _close_implicit(self) -> None:
        if self.implicit:
            self.out.append("</p>")
            self.implicit = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in SKIP:
            self.skip += 1
            return
        if self.skip:
            return
        if tag == "h1":
            tag = "h2"
        if tag == "iframe" and a.get("src"):
            self._close_implicit()
            src = a["src"].split("?")[0]
            self.out.append(f'<p><a href="{html.escape(src)}" target="_blank" rel="noopener noreferrer">Watch the video</a></p>')
            return
        if tag in ("div", "section", "article", "figure"):
            self._close_implicit()
            return
        if tag not in ALLOWED:
            return
        if tag == "p" and "p" in self.open:
            return
        if tag in BLOCK or tag == "li":
            self._close_implicit()
        attrs_out = ""
        if tag == "a":
            href = a.get("href") or ""
            if not href:
                return
            href = local(href)
            attrs_out = f' href="{html.escape(href)}"'
            if href.startswith("http"):
                attrs_out += ' target="_blank" rel="noopener noreferrer"'
        if tag == "img":
            src = a.get("data-src") or a.get("src") or ""
            if not src.startswith("http"):
                return
            if not self.open and not self.implicit:
                self.out.append("<p>")
                self.implicit = True
            self.out.append(f'<img src="{image(src)}" alt="{html.escape(a.get("alt", ""))}" loading="lazy" decoding="async">')
            return
        if tag in VOID:
            self.out.append(f"<{tag}>")
            return
        self.out.append(f"<{tag}{attrs_out}>")
        self.open.append(tag)

    def handle_endtag(self, tag):
        if tag in SKIP:
            self.skip = max(0, self.skip - 1)
            return
        if self.skip:
            return
        if tag == "h1":
            tag = "h2"
        if tag in ("div", "section", "article", "figure"):
            self._close_implicit()
            return
        if tag in self.open:
            while self.open:
                top = self.open.pop()
                self.out.append(f"</{top}>")
                if top == tag:
                    break

    def handle_data(self, data):
        if self.skip:
            return
        text = re.sub(r"\s+", " ", data)
        if not text.strip():
            if self.open or self.implicit:
                self.out.append(" ")
            return
        if not self.open and not self.implicit:
            self.out.append("<p>")
            self.implicit = True
        self.out.append(html.escape(text, quote=False))

    def result(self) -> str:
        self._close_implicit()
        while self.open:
            self.out.append(f"</{self.open.pop()}>")
        body = "".join(self.out)
        body = re.sub(r"<(p|h[2-6]|li|strong|em|a[^>]*)>\s*</\1?[a-z0-9]*>", "", body)
        body = re.sub(r"<p>\s*</p>", "", body)
        body = re.sub(r"\s+</", "</", body)
        body = re.sub(r"(<(?:p|h[2-6]|li)>)\s+", r"\1", body)
        return body


def content(path: str, title: str) -> str:
    with urllib.request.urlopen(urllib.request.Request(SITE + path, headers=UA), timeout=60) as response:
        page = response.read().decode("utf-8")
    start = page.index('id="main-content"')
    start = page.index(">", start) + 1
    end = page.index("<footer", start)
    parser = Clean()
    parser.feed(page[start:end])
    body = parser.result()
    # The title is the page's own heading on the landing; drop it and the leftovers of the theme.
    name = re.escape(title)
    body = re.sub(rf"<(h2|p)>\s*(?:<strong>)?\s*{name}\s*(?:</strong>)?\s*</\1>", "", body, count=1, flags=re.I)
    body = re.sub(rf"(<p>\s*{name}\s*</p>|<p>\s*team\s*</p>)\s*$", "", body, flags=re.I)
    # What the theme breaks: line breaks at the end of links, blank lines inside a paragraph, bullets typed as text.
    body = re.sub(r"(?:<br>\s*)+</a>", "</a>", body)
    body = re.sub(r"(?:<br>\s*){2,}", "</p><p>", body)
    body = re.sub(r"((?:<p>•.*?</p>)+)", lambda m: "<ul>" + re.sub(r"<p>•\s*(.*?)</p>", r"<li>\1</li>", m.group(1)) + "</ul>", body)
    body = re.sub(r"<h([2-6])><strong>(.*?)</strong></h\1>", r"<h\1>\2</h\1>", body)
    if path == "jobs/":
        body = body.replace("<h3>Cryptographer</h3>", '<h3><a href="jobs-cryptographer.html">Cryptographer</a></h3>')
    return body.strip()


def shell() -> tuple[str, str]:
    page = TEMPLATE.read_text()
    return page[: page.index('<main id="main">')], page[page.index("</main>"):]


def mark(head: str, current: str | None, file: str) -> str:
    if current == "projects":
        head = head.replace('<a href="projects.html">Projects</a>', '<a href="projects.html" aria-current="true">Projects</a>', 1)
        head = head.replace(f'<li><a href="{file}">', f'<li><a href="{file}" aria-current="page">', 1)
    elif current == "jobs":
        head = head.replace('<li><a href="jobs.html">Jobs</a></li>', '<li><a href="jobs.html" aria-current="page">Jobs</a></li>', 1)
    return head


def main() -> int:
    head, tail = shell()
    for path, (file, title, current) in PAGES.items():
        body = content(path, title)
        page_head = re.sub(r"<title>.*?</title>", f"<title>Shielded Labs: {html.escape(title.lower() if title != 'Zero' else title)}</title>", head, count=1)
        page_head = mark(page_head, current, file)
        main_html = f"""<main id="main">

<section class="section orig-page">
  <div class="wrap">
    <h1 class="orig__title">{html.escape(title)}</h1>
    <div class="orig-prose orig-prose--site">
{body}
    </div>
  </div>
</section>

"""
        (LANDING / file).write_text(page_head + main_html + tail)
        print(f"{file}: {len(body)} characters")
    return 0


if __name__ == "__main__":
    sys.exit(main())
