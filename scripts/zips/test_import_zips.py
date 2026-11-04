import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

import import_zips as importer
import sanitize

HAS_RENDERERS = importlib.util.find_spec('docutils') is not None and importlib.util.find_spec('markdown') is not None

RST_HEADER = """::

  ZIP: 32
  Title: Shielded Hierarchical Deterministic Wallets
  Owners: Jack Grigg <thestr4d@gmail.com>
          Daira-Emma Hopwood <daira@jacaranda.org>
  Status: [Revision 0: Canopy, Revision 1: NU6] Final, [Revision 2: NU7] Proposed
  Category: Standards / Wallet
  Created: 2018-05-22
  License: MIT
  Discussions-To: <https://github.com/zcash/zips/issues/922>


Abstract
========

This proposal defines wallets.
"""

MD_HEADER = """    ZIP: Unassigned
    Title: Update to ZIP 1016 & ZIP 271: Key-Holder Organizations
    Owners: Jason McGee <jason@shieldedlabs.net>
    Status: Draft
    Category: Process
    Created: 2026-09-14
    License: MIT
    Discussions-To: <URL TBD>


# Terminology
"""


class HeaderTest(unittest.TestCase):
    def test_reads_rst_and_markdown_headers_with_continuation_lines(self):
        meta = importer.parse_header(RST_HEADER)
        self.assertEqual(meta['Owners'], ['Jack Grigg <thestr4d@gmail.com>', 'Daira-Emma Hopwood <daira@jacaranda.org>'])
        self.assertEqual(meta['Created'], ['2018-05-22'])
        self.assertEqual(importer.parse_header(MD_HEADER)['Title'], ['Update to ZIP 1016 & ZIP 271: Key-Holder Organizations'])
        fenced = '```\nZIP: 233\nTitle: NSM\nStatus: Draft\nCategory: Consensus\n```\n\n# Terminology\n'
        self.assertEqual(importer.parse_header(fenced)['ZIP'], ['233'])
        self.assertEqual(importer.parse_header('::\n\n   ZIP: 1006\n   Title: Three-space indent\n   Status: Obsolete\n')['Title'], ['Three-space indent'])

    def test_entry_keeps_source_wording_but_drops_contact_addresses(self):
        record = importer.entry(importer.parse_header(RST_HEADER), Path('zip-0032.rst'))
        self.assertEqual(record['number'], 32)
        self.assertEqual(record['status'], 'Proposed')
        self.assertTrue(record['statusDetail'].startswith('[Revision 0'))
        self.assertEqual(record['owners'], ['Jack Grigg', 'Daira-Emma Hopwood'])
        self.assertEqual(record['discussionsTo'], 'https://github.com/zcash/zips/issues/922')
        self.assertEqual(record['official'], 'https://zips.z.cash/zip-0032')
        self.assertEqual(record['kind'], 'zip')
        draft = importer.entry(importer.parse_header(MD_HEADER), Path('draft-mcgee-keyholders-organizations.md'))
        self.assertIsNone(draft['number'])
        self.assertEqual(draft['kind'], 'draft')
        self.assertIsNone(draft['discussionsTo'])
        self.assertEqual(draft['created'], '2026-09-14')

    def test_unknown_or_placeholder_metadata_is_not_invented(self):
        record = importer.entry({'ZIP': ['XXX'], 'Title': ['Template'], 'Status': ['[Revision 0] Draft'], 'Category': ['{Consensus | Standards Track}']}, Path('zip-0000.rst'))
        self.assertEqual(record['status'], 'Draft')
        self.assertEqual(record['category'], 'Not recorded')
        self.assertIsNone(record['created'])
        self.assertEqual(importer.latest_status('Something else'), 'Unknown')
        guide = importer.entry({'ZIP': ['Unassigned'], 'Title': ['ZIP guide'], 'Status': ['Active'], 'Category': ['Process']}, Path('zip-guide.rst'))
        self.assertEqual(guide['kind'], 'guide')


class MathTest(unittest.TestCase):
    def test_text_mode_and_sizing_commands_become_portable(self):
        source = r'$\mathsf{BLAKE2b}\textsf{-}\mathsf{256}(p)$ and $x\kern-0.15em y$ {\small z} $\big( a \big)$ $\mathrel{\textsf{:=}}$ $\bigcup_i$'
        self.assertEqual(importer.portable_math(source), r'$\mathsf{BLAKE2b}\mathsf{-}\mathsf{256}(p)$ and $x y$ {z} $( a )$ $\mathsf{:=}$ $\bigcup_i$')

    def test_dollar_spans_become_math_roles_but_escaped_dollars_stay_text(self):
        self.assertEqual(importer.rst_math('Fee is $x + 1$ and costs \\$5.'), 'Fee is :math:`x + 1` and costs $5.\n')

    def test_formula_characters_outside_text_mode_are_wrapped(self):
        self.assertEqual(importer.portable_formula(r'\mathtt{“Zcash\_ExpandSeed”} \;{⦂}\; a \mathbin{||} b \LaTeX'), r'\mathtt{\text{“}Zcash\_ExpandSeed\text{”}} \;{\text{⦂}}\; a || b \text{LaTeX}')
        self.assertEqual(importer.rst_math('See $x\;{⦂}\;y$ and :math:`“a”` here.'), 'See :math:`x\\;{\\text{⦂}}\\;y` and :math:`\\text{“}a\\text{”}` here.\n')

        protected, maths = importer.protect_math('Inline $a_b$ and `$not$` and $$c^2$$\n```\n$code$\n```\n    $indented$\n')
        self.assertEqual([latex for latex, _ in maths], ['a_b', 'c^2'])
        self.assertEqual([block for _, block in maths], [False, True])
        self.assertIn('`$not$`', protected)
        self.assertIn('$code$', protected)
        self.assertIn('    $indented$', protected)


class SanitizeTest(unittest.TestCase):
    def test_active_content_never_reaches_reader(self):
        nodes = sanitize.clean('<script>alert(1)</script><style>x{}</style><iframe src="https://bad.test"></iframe><p onclick="bad()">Visible <a href="jav&#97;script:alert(1)">safe text</a><img src="https://remote.test/x.png"></p><aside class="system-message"><p>raw directive disabled</p></aside>', 'zip-0001.rst')
        self.assertEqual(nodes, [{'tag': 'p', 'children': ['Visible ', 'safe text']}])

    def test_repository_links_resolve_to_records_official_site_or_github(self):
        resolve = lambda value: sanitize.resolve_link(value, 'zip-0317.rst')  # noqa: E731
        self.assertEqual(resolve('zip-0032.rst#key-path'), '?view=governance&section=zips&record=zip-0032#key-path')
        self.assertEqual(resolve('draft-ecc-onchain-accountable-voting.md'), '?view=governance&section=zips&record=draft-ecc-onchain-accountable-voting')
        self.assertEqual(resolve('../rendered/zip-0244.html'), 'https://zips.z.cash/zip-0244.html')
        self.assertEqual(resolve('protocol/protocol.pdf'), 'https://zips.z.cash/protocol/protocol.pdf')
        self.assertEqual(resolve('../README.rst'), 'https://github.com/zcash/zips/blob/main/README.rst')
        self.assertEqual(resolve('#fn1'), '#fn1')
        for value in ['javascript:alert(1)', 'data:text/html,hi', 'https://user:pass@example.org/', '#bad id', 'zip-0032.rst#bad frag']:
            self.assertNotIn(' ', resolve(value) or '')
            self.assertFalse((resolve(value) or '').startswith(('javascript', 'data')))

    def test_footnotes_sections_and_admonitions_keep_anchors_and_reading_order(self):
        raw = ('<section id="terminology"><h2>Terminology</h2><p>Text<a class="brackets" href="#fn" id="footnote-reference-1">[1]</a></p>'
               '<aside class="admonition note"><p class="admonition-title">Note</p><p>Careful.</p></aside></section>'
               '<aside class="footnote-list brackets"><aside class="footnote brackets" id="fn" role="doc-footnote"><span class="label">[<a href="#footnote-reference-1">1</a>]</span><p>Footnote body.</p></aside></aside>')
        nodes = sanitize.clean(raw, 'zip-0001.rst')
        self.assertEqual(nodes[0], {'tag': 'h2', 'children': ['Terminology'], 'id': 'terminology'})
        self.assertEqual(nodes[1]['children'][1], {'tag': 'a', 'children': ['[1]'], 'id': 'footnote-reference-1', 'href': '#fn'})
        self.assertEqual(nodes[2], {'tag': 'p', 'children': [{'tag': 'strong', 'children': ['Note']}]})
        self.assertEqual(nodes[4], {'tag': 'p', 'children': ['[1] ', 'Footnote body.'], 'id': 'fn'})

    def test_markdown_headings_tables_and_definition_lists(self):
        raw = '<h1 id="h">Top</h1><table><caption>Fees</caption><colgroup><col></colgroup><thead><tr><th>A</th></tr></thead></table><dl><dt>Term</dt><dd>Meaning</dd></dl><ol start="3"><li>c</li></ol>'
        nodes = sanitize.clean(raw, 'zip-0233.md', heading_shift=1)
        self.assertEqual(nodes[0], {'tag': 'h2', 'children': ['Top'], 'id': 'h'})
        self.assertEqual(nodes[1], {'tag': 'p', 'children': [{'tag': 'strong', 'children': ['Fees']}]})
        self.assertEqual(nodes[2], {'tag': 'table', 'children': [{'tag': 'thead', 'children': [{'tag': 'tr', 'children': [{'tag': 'th', 'children': ['A']}]}]}]})
        self.assertEqual(nodes[3]['tag'], 'dl')
        self.assertEqual(nodes[4], {'tag': 'ol', 'children': [{'tag': 'li', 'children': ['c']}], 'start': 3})

    def test_mathml_keeps_only_presentation_attributes(self):
        raw = '<p>Inline <math xmlns="http://www.w3.org/1998/Math/MathML" display="block" onload="x()"><mrow><mi mathvariant="sans-serif">x</mi><mo stretchy="false">(</mo><annotation>x</annotation></mrow></math> done</p><mi>loose</mi>'
        nodes = sanitize.clean(raw, 'zip-0001.rst')
        math = nodes[0]['children'][1]
        self.assertEqual(math['tag'], 'math')
        self.assertEqual(math['attrs'], {'display': 'block'})
        self.assertEqual(math['children'][0]['children'][0], {'tag': 'mi', 'children': ['x'], 'attrs': {'mathvariant': 'sans-serif'}})
        self.assertEqual(len(math['children'][0]['children']), 2)
        self.assertEqual(nodes[0]['children'][2], ' done')
        self.assertEqual(len(nodes), 1)

    def test_images_are_local_png_copies_or_dropped(self):
        nodes = sanitize.clean('<figure><img src="../rendered/assets/images/zip-0032-f1.png" alt="Key tree"><figcaption>Figure 1</figcaption></figure><figure><img src="https://remote.test/x.png"><figcaption>Gone</figcaption></figure>', 'zip-0032.rst', image=lambda src: '/shielded-preview/zips/zip-0032-f1.png' if src.endswith('f1.png') else None)
        self.assertEqual(nodes[0]['tag'], 'figure')
        self.assertEqual(nodes[0]['children'][0], {'tag': 'img', 'src': '/shielded-preview/zips/zip-0032-f1.png', 'alt': 'Key tree', 'children': []})
        path_alt = sanitize.clean('<img src="../rendered/assets/images/zip-0032-f1.png" alt="../rendered/assets/images/zip-0032-f1.png">', 'zip-0032.rst', image=lambda src: '/shielded-preview/zips/zip-0032-f1.png')
        self.assertEqual(path_alt[0]['alt'], '')
        self.assertEqual(nodes[1], {'tag': 'p', 'children': ['Gone']})

    def test_prepare_removes_header_and_builds_a_unique_outline_and_summary(self):
        nodes = [{'tag': 'pre', 'children': ['ZIP: 32\nTitle: X']}, {'tag': 'h2', 'children': ['Abstract']}, {'tag': 'p', 'children': ['The abstract.']},
                 {'tag': 'h2', 'children': ['Steps']}, {'tag': 'h2', 'children': ['Steps']}, {'tag': 'h3', 'children': ['Exact'], 'id': 'precise-link'}]
        nodes, headings = sanitize.prepare(nodes)
        self.assertEqual([heading['id'] for heading in headings], ['abstract', 'steps', 'steps-2', 'precise-link'])
        self.assertEqual(nodes[0]['tag'], 'h2')
        self.assertEqual(sanitize.summary(nodes), 'The abstract.')
        self.assertEqual(sanitize.summary([{'tag': 'p', 'children': ['x' * 300]}]), 'x' * 240 + '…')


@unittest.skipUnless(HAS_RENDERERS, 'docutils and Markdown are required for rendering tests')
class RenderTest(unittest.TestCase):
    def test_rst_math_and_disabled_raw_html(self):
        source = RST_HEADER + '\nThe fee is $x^2$ here.\n\n.. raw:: html\n\n   <script>alert(1)</script>\n\nAfter.\n'
        nodes, headings = sanitize.prepare(sanitize.clean(importer.render_rst(source), 'zip-0032.rst'))
        text = sanitize.plain(nodes)
        self.assertNotIn('ZIP: 32', text)
        self.assertNotIn('alert', text)
        self.assertIn('After.', text)
        self.assertEqual(headings[0]['title'], 'Abstract')
        math = [child for node in nodes if isinstance(node, dict) for child in node['children'] if isinstance(child, dict) and child['tag'] == 'math']
        self.assertEqual(len(math), 1)

    def test_markdown_math_footnotes_and_header_removal(self):
        source = MD_HEADER + '\nValue[^1] is $a_b$.\n\n[^1]: Footnote.\n'
        nodes, headings = sanitize.prepare(sanitize.clean(importer.render_markdown(source), 'draft-test.md', heading_shift=1))
        self.assertEqual(nodes[0], {'tag': 'h2', 'children': ['Terminology'], 'id': 'terminology'})
        self.assertIn('Footnote.', sanitize.plain(nodes))
        self.assertTrue(any(isinstance(child, dict) and child['tag'] == 'math' for node in nodes if isinstance(node, dict) for child in node['children']))

    def test_full_import_writes_index_documents_and_meta(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'source/zips').mkdir(parents=True)
            (root / 'source/zips/zip-0032.rst').write_text(RST_HEADER, encoding='utf-8')
            (root / 'source/zips/draft-mcgee-test.md').write_text(MD_HEADER + '\nBody.\n', encoding='utf-8')
            (root / 'source/zips/broken.rst').write_text('No header here.\n', encoding='utf-8')
            (root / 'out/documents').mkdir(parents=True)
            (root / 'out/documents/stale.json').write_text('{}', encoding='utf-8')
            index, meta = importer.run(root / 'source', root / 'out', root / 'public', log=lambda _: None)
            self.assertEqual([item['id'] for item in index], ['zip-0032', 'draft-mcgee-test'])
            self.assertEqual(meta['counts'], {'documents': 2, 'zips': 1, 'drafts': 1, 'guides': 0, 'images': 0})
            self.assertEqual(meta['failures'][0]['file'], 'broken.rst')
            self.assertFalse((root / 'out/documents/stale.json').exists())
            document = json.loads((root / 'out/documents/zip-0032.json').read_text(encoding='utf-8'))
            self.assertEqual(document['summary'], 'This proposal defines wallets.')
            self.assertEqual(document['headings'], [{'id': 'abstract', 'title': 'Abstract', 'level': 2}])
            self.assertNotIn('body', json.loads((root / 'out/index.json').read_text(encoding='utf-8'))[0])


if __name__ == '__main__':
    unittest.main()
