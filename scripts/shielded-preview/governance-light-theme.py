#!/usr/bin/env python3
"""Light theme for the governance portal.

Every colour literal in the governance CSS reads a variable named after it, with the literal as its
fallback: `color: #eee` becomes `color: var(--c-eeeeee, #eee)`. The dark theme defines none of these
variables, so it keeps every literal. The light theme (src/app/governance/governance-theme.css, written
by this script) defines each one: dark greys become warm paper, light greys become ink, and accents
are darkened until they read on white.

Run it after adding a colour to a governance stylesheet; it is idempotent:

    python3 scripts/shielded-preview/governance-light-theme.py
"""
from __future__ import annotations

import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
THEME = ROOT / 'src/app/governance/governance-theme.css'
# Stylesheets the governance portal and the poll site import. A stylesheet with its own light theme (poll-turnout) is not listed.
SHEETS = [
    'src/app/governance/governance-portal.module.css',
    'src/app/poll/poll-site.module.css',
    *[f'src/app/shielded-preview/{name}.module.css' for name in (
        'coinholder-proposals', 'context-notice', 'governance-archive', 'governance-bento', 'governance-collections',
        'governance-dev-fund', 'governance-filters', 'governance-grant-rounds', 'governance-insights', 'governance-navigation',
        'governance-overview', 'governance-participation', 'governance-process', 'governance-program-guide', 'governance-record',
        'governance-references', 'governance-zcap', 'governance-zcg', 'governance-zips', 'governance', 'markdown', 'portal-footer',
        'poll-participation', 'poll-turnout-days', 'portal', 'proposal-map', 'transparency', 'typography', 'upcoming-upgrade-sections', 'zip-explorer',
    )],
]

# Colours drawn from components rather than stylesheets (SVG fills and strokes, written as var(--c-…) there).
COMPONENT_COLOURS = [
    '111111',  # governance-glyph.tsx
    '101010', '272727',  # governance-filters.tsx
    '292929', 'eeeeee', 'b8b8b8', '909090', '6d6d6d', '525252', '3e3e3e',  # governance-insights.tsx
]

# ---------- colour math (sRGB <-> OKLab) ----------

def _lin(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def _gam(c: float) -> float:
    return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055

def to_oklab(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    r, g, b = (_lin(v / 255) for v in rgb)
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l, m, s = (math.copysign(abs(v) ** (1 / 3), v) for v in (l, m, s))
    return (0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s)

def from_oklab(lab: tuple[float, float, float]) -> tuple[float, float, float]:
    L, a, b = lab
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return (_gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
            _gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
            _gam(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s))

def oklch_to_rgb(L: float, C: float, h: float) -> tuple[int, int, int]:
    """The colour at this lightness and hue, its chroma reduced until it fits sRGB."""
    for step in range(60):
        c = C * (1 - step / 60)
        rgb = from_oklab((L, c * math.cos(h), c * math.sin(h)))
        if all(-0.0005 <= v <= 1.0005 for v in rgb):
            return tuple(max(0, min(255, round(v * 255))) for v in rgb)
    v = max(0, min(255, round(_gam(L ** 3) * 255)))
    return (v, v, v)

def luminance(rgb) -> float:
    r, g, b = (_lin(v / 255) for v in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast(a, b) -> float:
    x, y = sorted((luminance(a), luminance(b)), reverse=True)
    return (x + 0.05) / (y + 0.05)

# ---------- the light value of a dark-theme colour ----------

# Dark-theme grey level -> light-theme grey level. The darkest greys are the page and its cards (cards are
# lighter than the page in both themes); from there up, greys are lines, then text, and run the other way.
GREYS = [(0x00, 0xf3), (0x0b, 0xf4), (0x11, 0xff), (0x18, 0xfb), (0x1e, 0xf6), (0x26, 0xef), (0x2e, 0xe6), (0x38, 0xdb),
         (0x44, 0xcd), (0x5c, 0xb1), (0x77, 0x90), (0x90, 0x74), (0xa8, 0x62), (0xbb, 0x53), (0xcc, 0x43), (0xdd, 0x31),
         (0xee, 0x21), (0xff, 0x15)]
WHITE = (255, 255, 255)

def light_grey(level: int) -> tuple[int, int, int]:
    for (x0, y0), (x1, y1) in zip(GREYS, GREYS[1:]):
        if x0 <= level <= x1:
            v = round(y0 + (y1 - y0) * (level - x0) / (x1 - x0))
            break
    if v >= 255:
        return WHITE
    # A warm paper: the blue channel a little lower than red, less so for ink.
    return (v, max(0, v - 1), max(0, v - (4 if v > 0x60 else 2)))

def light_rgb(rgb: tuple[int, int, int]) -> tuple[int, int, int]:
    L, a, b = to_oklab(rgb)
    C, h = math.hypot(a, b), math.atan2(b, a)
    if C < 0.025:
        return light_grey(round(sum(rgb) / 3))
    if L < 0.42:
        # A dark tinted surface or border: a light tint of the same hue.
        return oklch_to_rgb(1 - L * 0.55, C * 0.8, h)
    # An accent on dark: the same hue, dark enough to read on white.
    target = L
    while target > 0.25 and contrast(oklch_to_rgb(target, C, h), WHITE) < 4.5:
        target -= 0.01
    return oklch_to_rgb(target, C, h)

def hex6(rgb) -> str:
    return '#' + ''.join(f'{v:02x}' for v in rgb)

# ---------- rewriting the stylesheets ----------

HEX = re.compile(r'#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b')
RGB = re.compile(r'\b(rgba?)\(\s*(\d+)(\s*,\s*|\s+)(\d+)\3(\d+)\s*((?:,|/)[^)]*)?\)')
NAMED = re.compile(r'(?<=[:\s,(])white(?=[\s;,)!}])')
SKIP = re.compile(r'/\*.*?\*/|"[^"]*"|\'[^\']*\'|url\([^)]*\)|var\(--c-[^,()]+,\s*[^)]*\)', re.S)

def expand(h: str) -> str:
    h = h.lower()
    return ''.join(c * 2 for c in h) if len(h) in (3, 4) else h

def convert(css: str, tokens: dict[str, str]) -> str:
    def hex_sub(m: re.Match) -> str:
        full = expand(m.group(1))
        rgb = tuple(int(full[i:i + 2], 16) for i in (0, 2, 4))
        alpha = full[6:]
        if alpha and rgb in ((255, 255, 255), (0, 0, 0)):
            return m.group(0)  # A white or black veil reads the same on either theme.
        tokens[f'--c-{full}'] = hex6(light_rgb(rgb)) + alpha
        return f'var(--c-{full}, {m.group(0)})'

    def rgb_sub(m: re.Match) -> str:
        fn, r, sep, g, b, rest = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5), m.group(6) or ''
        if not (r == g == b) or r == '0':
            return m.group(0)
        level = int(r)
        light = light_grey(level)
        if ',' in sep:
            name = f'--c-rgb-{level:02x}{level:02x}{level:02x}'
            tokens[name] = ', '.join(map(str, light))
            return f'{fn}(var({name}, {r}, {g}, {b}){rest})'
        name = f'--c-rgbs-{level:02x}{level:02x}{level:02x}'
        tokens[name] = ' '.join(map(str, light))
        return f'{fn}(var({name}, {r} {g} {b}) {rest.strip()})'

    def named_sub(m: re.Match) -> str:
        tokens['--c-ffffff'] = hex6(light_rgb(WHITE))
        return 'var(--c-ffffff, white)'

    out, last = [], 0
    for skip in SKIP.finditer(css):
        out.append(NAMED.sub(named_sub, RGB.sub(rgb_sub, HEX.sub(hex_sub, css[last:skip.start()]))))
        out.append(skip.group(0))
        if skip.group(0).startswith('var(--c-'):
            key = skip.group(0)[4:].split(',')[0].strip()
            fallback = skip.group(0).split(',', 1)[1].rstrip(')').strip()
            tokens.setdefault(key, light_value_of(key, fallback))
        last = skip.end()
    out.append(NAMED.sub(named_sub, RGB.sub(rgb_sub, HEX.sub(hex_sub, css[last:]))))
    return ''.join(out)

def light_value_of(key: str, fallback: str) -> str:
    """The light value of a token already in a stylesheet, from its own name."""
    name = key[len('--c-'):]
    if name.startswith('rgb-') or name.startswith('rgbs-'):
        level = int(name.split('-')[1][:2], 16)
        light = light_grey(level)
        return (', ' if name.startswith('rgb-') else ' ').join(map(str, light))
    if name == 'ffffff' and fallback == 'white':
        return hex6(light_rgb(WHITE))
    rgb = tuple(int(name[i:i + 2], 16) for i in (0, 2, 4))
    return hex6(light_rgb(rgb)) + name[6:]

def main() -> None:
    tokens: dict[str, str] = {}
    for sheet in SHEETS:
        path = ROOT / sheet
        css = path.read_text()
        converted = convert(css, tokens)
        if converted != css:
            path.write_text(converted)
    for colour in COMPONENT_COLOURS:
        tokens.setdefault(f'--c-{colour}', light_value_of(f'--c-{colour}', f'#{colour}'))
    page, ink = hex6(light_grey(0x07)), hex6(light_grey(0xf5))
    lines = [
        '/* Light theme for the governance portal, written by scripts/shielded-preview/governance-light-theme.py.',
        '   Each variable is the light value of the colour in its name; the dark theme defines none and keeps the literal. */',
        ":root[data-gov-theme='light'] {",
        '  color-scheme: light;',
        *[f'  {name}: {value};' for name, value in sorted(tokens.items())],
        '}',
        f":root[data-gov-theme='light'] body {{ background: {page}; color: {ink}; }}",
        '',
    ]
    THEME.write_text('\n'.join(lines))
    print(f'{len(SHEETS)} stylesheets, {len(tokens)} colours')

if __name__ == '__main__':
    main()
