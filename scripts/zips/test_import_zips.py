import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

import import_zips as importer
import pulls
import sanitize

HAS_RENDERERS = importlib.util.find_spec('docutils') is not None and importlib.util.find_spec('markdown_it') is not None

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



class SanitizeTest(unittest.TestCase):
    def test_active_content_never_reaches_reader(self):
        nodes = sanitize.clean('<script>alert(1)</script><style>x{}</style><iframe src="https://bad.test"></iframe><p onclick="bad()">Visible <a href="jav&#97;script:alert(1)">safe text</a><img src="https://remote.test/x.png"></p><aside class="system-message"><p>raw directive disabled</p></aside>', 'zip-0001.rst')
        self.assertEqual(nodes, [{'tag': 'p', 'children': ['Visible ', 'safe text']}])

    def test_repository_links_resolve_to_records_official_site_or_github(self):
        resolve = lambda value: sanitize.resolve_link(value, 'zip-0317.rst')  # noqa: E731
        self.assertEqual(resolve('zip-0032.rst#key-path'), '?view=governance&section=zips&record=zip-0032#key-path')
        self.assertEqual(resolve('draft-ecc-onchain-accountable-voting.md'), '?view=governance&section=zips&record=draft-ecc-onchain-accountable-voting')
        self.assertEqual(resolve('../rendered/zip-0244.html'), '?view=governance&section=zips&record=zip-0244')
        self.assertEqual(resolve('https://zips.z.cash/zip-0244#abstract'), '?view=governance&section=zips&record=zip-0244#abstract')
        self.assertEqual(resolve('https://github.com/zcash/zips/blob/main/zips/zip-0244.rst'), '?view=governance&section=zips&record=zip-0244')
        self.assertEqual(resolve('../rendered/assets/data.csv'), 'https://zips.z.cash/assets/data.csv')
        pinned = 'https://github.com/zcash/zips/blob/4acf32ac6db409d93041c463880dad6df83875e1/zips/zip-0316.rst'
        self.assertEqual(resolve(pinned), pinned)
        branch = 'https://github.com/zcash/zips/blob/end-zcg-stream/zips/draft-bowe-end-zcg-stream.md'
        self.assertEqual(resolve(branch), branch)
        self.assertEqual(resolve('zip-271'), '?view=governance&section=zips&record=zip-0271')
        self.assertEqual(resolve('zip-0316-deriving-a-unified-address-from-a-uivk.rst'), '?view=governance&section=zips&record=zip-0316#deriving-a-unified-address-from-a-uivk')
        self.assertEqual(resolve('zip-tbd2.md'), '?view=governance&section=zips&record=zip-tbd2')
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
        self.assertEqual(nodes[1]['children'][1], {'tag': 'sup', 'children': [{'tag': 'a', 'children': ['1'], 'id': 'footnote-reference-1', 'href': '#fn'}]})
        self.assertEqual(nodes[2], {'tag': 'aside', 'attrs': {'kind': 'note'}, 'children': [{'tag': 'p', 'children': [{'tag': 'strong', 'children': ['Note']}]}, {'tag': 'p', 'children': ['Careful.']}]})
        self.assertEqual(nodes[3], {'tag': 'ol', 'children': [{'tag': 'li', 'id': 'fn', 'children': [{'tag': 'p', 'children': ['Footnote body.']}]}]})

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
            self.assertEqual(meta['counts'], {'documents': 2, 'zips': 1, 'drafts': 1, 'guides': 0, 'proposals': 0, 'images': 0})
            self.assertEqual(meta['failures'][0]['file'], 'broken.rst')
            self.assertFalse((root / 'out/documents/stale.json').exists())
            document = json.loads((root / 'out/documents/zip-0032.json').read_text(encoding='utf-8'))
            self.assertEqual(document['summary'], 'This proposal defines wallets.')
            self.assertEqual(document['headings'], [{'id': 'abstract', 'title': 'Abstract', 'level': 2}])
            self.assertNotIn('body', json.loads((root / 'out/index.json').read_text(encoding='utf-8'))[0])


class LinkTest(unittest.TestCase):
    def test_inline_and_list_anchors_survive_for_their_links(self):
        raw = '<p><a href="#rev">see</a> and <a href="#list">list</a> and <a href="#empty">empty</a></p><p><span class="target" id="rev">Revision 2</span> <span class="plain">text</span></p><ul class="simple" id="list"><li>Item</li></ul><a id="empty"></a>'
        nodes, _ = sanitize.prepare(sanitize.clean(raw, 'zip-0316.rst'))
        self.assertEqual(sanitize.collect_ids(nodes), {'rev', 'list', 'empty'})
        self.assertEqual(nodes[1]['children'][0], {'tag': 'span', 'id': 'rev', 'children': ['Revision 2']})
        self.assertEqual([child['href'] for child in nodes[0]['children'] if isinstance(child, dict)], ['#rev', '#list', '#empty'])
        self.assertEqual(nodes[1]['children'][-1], 'text')

    def test_links_to_missing_anchors_keep_their_words_and_dead_backrefs_go(self):
        raw = '<p>Read <a href="#gone">the section</a> and <a href="#here">this</a>.</p><h2 id="here">Here</h2><ol><li>Note <a href="#fnref:unused">\u21a9</a></li></ol>'
        nodes, _ = sanitize.prepare(sanitize.clean(raw, 'zip-0001.md'))
        self.assertEqual(nodes[0]['children'][0:2], ['Read ', 'the section'])
        self.assertEqual(nodes[0]['children'][3]['href'], '#here')
        self.assertEqual(sanitize.plain(nodes[2]).strip(), 'Note')

    def test_blocks_never_end_up_inside_paragraphs_and_rows_sit_in_a_body(self):
        nodes = sanitize.clean('<p id="note">Intro<ul><li>Item</li></ul>tail</p><table><tr><td>A</td></tr></table>', 'zip-0001.md')
        self.assertEqual([node['tag'] for node in nodes], ['p', 'ul', 'p', 'table'])
        self.assertEqual(nodes[0]['id'], 'note')
        self.assertEqual(nodes[0]['children'], ['Intro'])
        self.assertEqual(nodes[3]['children'][0]['tag'], 'tbody')
        self.assertEqual(nodes[3]['children'][0]['children'][0]['tag'], 'tr')

    def test_footnotes_keep_all_their_content(self):
        several = '<aside class="footnote" id="a"><span class="label">[1]</span><p>First.</p><p>Second.</p></aside>'
        nodes = sanitize.clean(several, 'zip-0001.rst')
        self.assertEqual([sanitize.plain(node) for node in nodes], ['[1] First.', 'Second.'])
        self.assertEqual(nodes[0]['id'], 'a')
        cited_twice = sanitize.clean('<aside class="footnote" id="c"><span class="label">[3]</span><span class="backrefs">(<a href="#r1">1</a>,<a href="#r2">2</a>)</span><p>Text.</p></aside>', 'zip-0001.rst')
        self.assertEqual(cited_twice, [{'tag': 'p', 'children': ['[3] ', 'Text.'], 'id': 'c'}])
        listed = sanitize.clean('<aside class="footnote" id="b"><span class="label">[2]</span><ul><li><p>Item</p></li></ul></aside>', 'zip-0001.rst')
        self.assertEqual([node['tag'] for node in listed], ['p', 'ul'])
        self.assertEqual(listed[0], {'tag': 'p', 'children': ['[2] '], 'id': 'b'})

    def test_links_between_documents_land_on_records_that_exist(self):
        link = lambda record: {'tag': 'a', 'href': f'?view=governance&section=zips&record={record}', 'children': [record]}  # noqa: E731
        pull = {'number': 7, 'file': 'draft-a-new.md'}
        documents = [
            {'id': 'zip-0001', 'body': [{'tag': 'h2', 'id': 'real', 'children': ['Real']}, {'tag': 'p', 'children': [link('draft-a-new'), link('draft-missing'), link('zip-0001#real'), link('zip-0001#gone')]}]},
            {'id': 'pr-7-draft-a-new', 'pull': pull, 'body': [{'tag': 'p', 'children': [link('draft-a-other')]}]},
            {'id': 'pr-9-draft-a-other', 'pull': {'number': 9, 'file': 'draft-a-other.md'}, 'body': []},
            {'id': 'pr-7-draft-a-other', 'pull': {'number': 7, 'file': 'draft-a-other.md'}, 'body': []},
            {'id': 'pr-8-draft-a-third', 'pull': {'number': 8, 'file': 'draft-a-third.md'}, 'body': [{'tag': 'p', 'children': [link('draft-a-new')]}]},
        ]
        linked = importer.link_documents(documents)
        children = linked[0]['body'][1]['children']
        self.assertEqual(children[0], 'draft-a-new')
        self.assertEqual(children[1], 'draft-missing')
        self.assertEqual(children[2]['href'], '?view=governance&section=zips&record=zip-0001#real')
        self.assertEqual(children[3]['href'], '?view=governance&section=zips&record=zip-0001')
        self.assertEqual(linked[1]['body'][0]['children'][0]['href'], '?view=governance&section=zips&record=pr-7-draft-a-other')
        self.assertEqual(linked[4]['body'][0]['children'][0]['href'], '?view=governance&section=zips&record=pr-7-draft-a-new')

    @unittest.skipUnless(HAS_RENDERERS, 'docutils and Markdown are required for rendering tests')
    def test_markdown_headings_match_the_ids_the_documents_link_to(self):
        html_out = importer.render_markdown('# Stream Layer\n\nSee [it](#streamlayer) and [other](#pre-signedtransactionstorage).\n\n## Pre-signed Transaction Storage\n')
        nodes, headings = sanitize.prepare(sanitize.clean(html_out, 'draft-x.md', heading_shift=1))
        self.assertEqual([heading['id'] for heading in headings], ['streamlayer', 'pre-signedtransactionstorage'])
        self.assertEqual([child['href'] for child in nodes[1]['children'] if isinstance(child, dict)], ['#streamlayer', '#pre-signedtransactionstorage'])


@unittest.skipUnless(HAS_RENDERERS, 'docutils and markdown-it-py are required for rendering tests')
class MarkdownStructureTest(unittest.TestCase):
    def render(self, source, **options):
        return sanitize.prepare(sanitize.clean(importer.render_markdown(source), 'draft-x.md', heading_shift=1, formula=importer.mathml, **options))

    def test_lists_nest_at_any_indent(self):
        nodes, _ = self.render('- one\n  - two\n    - three\n')
        self.assertEqual(nodes[0]['tag'], 'ul')
        inner = nodes[0]['children'][0]['children']
        self.assertEqual(inner[-1]['tag'], 'ul')
        self.assertEqual(inner[-1]['children'][0]['children'][-1]['tag'], 'ul')

    def test_code_stays_code_inside_quotes_and_lists(self):
        nodes, _ = self.render('> ```\n> cost $x$ and $y$\n> ```\n\n- item\n\n  ```\n  $z$\n  ```\n')
        self.assertEqual(nodes[0]['tag'], 'blockquote')
        self.assertEqual(nodes[0]['children'][0], {'tag': 'pre', 'children': ['cost $x$ and $y$']})
        self.assertEqual(sanitize.plain(nodes[1]['children'][0]['children'][-1]), '$z$')

    def test_formulas_are_read_in_lists_and_quotes_but_prices_stay_text(self):
        nodes, _ = self.render('- a\n\n    $x_1$ here\n\n> $y$\n\nFrom $700 to $900 a month, and $z$.\n')
        tags = []

        def collect(items):
            for item in items:
                if isinstance(item, dict):
                    tags.append(item['tag'])
                    collect(item['children'])
        collect(nodes)
        self.assertEqual(tags.count('math'), 3)
        self.assertIn('$700 to $900', sanitize.plain(nodes[-1]))
        spaced, _ = self.render('Set $\\mathsf{ok} \\leftarrow $ true.\n')
        self.assertEqual(spaced[0]['children'][1]['tag'], 'math')

    def test_formulas_the_first_converter_rejects_use_the_second(self):
        for tex in [r'\begin{array}{rl} a & b \\ c & d \end{array}', r'{k \choose n}', r'a \\']:
            self.assertIn('<math', importer.mathml(tex, False), tex)
        self.assertTrue(importer.mathml(r'\nosuchcommand{x}', False).startswith('<code>'))

    def test_collapsible_blocks_keep_markdown_inside(self):
        nodes, headings = self.render('<details>\n<summary>\n\n### Why\n</summary>\n\nBody *text*.\n\n</details>\n')
        self.assertEqual(nodes[0]['tag'], 'details')
        self.assertEqual(nodes[0]['children'][0]['tag'], 'summary')
        self.assertEqual(nodes[0]['children'][0]['children'][0]['tag'], 'h4')
        self.assertEqual(nodes[0]['children'][1]['children'][1], {'tag': 'em', 'children': ['text']})
        self.assertEqual(headings[0]['title'], 'Why')

    def test_a_heading_label_names_the_anchor_and_is_not_shown(self):
        nodes, headings = self.render('## Stale rate [stale-rate]\n\nSee [it](#stale-rate).\n')
        self.assertEqual(headings, [{'id': 'stale-rate', 'title': 'Stale rate', 'level': 3}])
        self.assertEqual(nodes[1]['children'][1]['href'], '#stale-rate')

    def test_note_and_warning_markers_box_the_next_paragraph(self):
        nodes, _ = self.render('<div class=warning></div>\n\nCareful.\n\n<div class="note"></div>\n\nAside.\n\nPlain.\n')
        self.assertEqual([node['tag'] for node in nodes], ['aside', 'aside', 'p'])
        self.assertEqual(nodes[0]['attrs'], {'kind': 'warning'})
        self.assertEqual(sanitize.plain(nodes[1]), 'NoteAside.')

    def test_footnotes_show_plain_numbers_in_citation_order(self):
        nodes, _ = self.render('First[^b] then[^a].\n\n[^a]: Note A.\n[^b]: Note B.\n')
        self.assertEqual(nodes[0]['children'][1], {'tag': 'sup', 'children': [{'tag': 'a', 'children': ['1'], 'href': '#fn1', 'id': 'fnref1'}]})
        self.assertIn('Note B.', sanitize.plain(nodes[-1]['children'][0]))

    def test_footnote_markers_with_no_definition_leave_the_text(self):
        nodes, _ = self.render('Known[^a] and unknown [^missing] with `[^code]`.\n\n[^a]: Note.\n')
        text = sanitize.plain(nodes[0])
        self.assertNotIn('[^missing]', text)
        self.assertIn('[^code]', text)

    def test_a_figure_on_its_own_line_shows_its_description(self):
        nodes, _ = self.render('![A graph](../rendered/assets/images/x.png)\n', image=lambda src: '/shielded-preview/zips/x.png')
        self.assertEqual(nodes[0]['tag'], 'figure')
        self.assertEqual(nodes[0]['children'][1], {'tag': 'figcaption', 'children': ['A graph']})

    def test_diagrams_are_marked_only_when_allowed(self):
        source = '```mermaid\nflowchart TD\n  A --> B\n```\n'
        self.assertEqual(self.render(source)[0][0]['attrs'], {'lang': 'mermaid'})
        self.assertNotIn('attrs', self.render(source, diagrams=False)[0][0])


@unittest.skipUnless(HAS_RENDERERS, 'docutils and markdown-it-py are required for rendering tests')
class RstStructureTest(unittest.TestCase):
    def render(self, source):
        return sanitize.prepare(sanitize.clean(importer.render_rst(source), 'zip-0001.rst', formula=importer.mathml))

    def test_collapsible_blocks_survive_with_raw_html_disabled(self):
        source = 'Before.\n\n.. raw:: html\n\n   <details>\n   <summary>Click to show/hide</summary>\n\nInside.\n\n.. raw:: html\n\n   </details>\n\n.. raw:: html\n\n   <script>alert(1)</script>\n\nAfter.\n'
        nodes, _ = self.render(source)
        self.assertEqual([node['tag'] for node in nodes], ['p', 'details', 'p'])
        self.assertEqual(nodes[1]['children'], [{'tag': 'summary', 'children': ['Click to show/hide']}, {'tag': 'p', 'children': ['Inside.']}])
        self.assertNotIn('alert', sanitize.plain(nodes))

    def test_a_block_left_open_keeps_its_text_in_place(self):
        nodes, _ = self.render('.. raw:: html\n\n   <details>\n   <summary>More</summary>\n\nInside.\n')
        self.assertEqual(nodes, [{'tag': 'p', 'children': ['Inside.']}])

    def test_notes_warnings_and_numbered_footnotes(self):
        nodes, _ = self.render('Cited [#a]_.\n\n.. warning::\n\n   Careful.\n\n.. [#a] Source one.\n.. [#b] Source two.\n')
        self.assertEqual(nodes[0]['children'][1]['tag'], 'sup')
        self.assertEqual(nodes[1]['attrs'], {'kind': 'warning'})
        self.assertEqual(nodes[2]['tag'], 'ol')
        self.assertEqual([item['id'] for item in nodes[2]['children']], ['a', 'b'])

    def test_formula_blocks_the_first_converter_rejects_become_math(self):
        nodes, _ = self.render('.. math::\n\n   \\begin{array}{rl} a & b \\end{array}\n')
        self.assertEqual(nodes[0]['tag'], 'math')

    def test_line_break_substitutions_become_breaks(self):
        nodes, _ = self.render('.. |br| raw:: html\n\n  <br/>\n\nFirst. |br|\nSecond.\n\n|br|\n\nAfter.\n')
        self.assertEqual(nodes[0]['children'][1], {'tag': 'br', 'children': []})
        self.assertEqual(sanitize.plain(nodes[0]).split(), ['First.', 'Second.'])
        self.assertEqual([node['tag'] for node in nodes], ['p', 'p'])

    def test_a_formula_next_to_a_letter_is_still_a_formula(self):
        self.assertEqual(importer.rst_math('a$x$b'), 'a\\ :math:`x`\\ b\n')

    def test_an_indented_list_is_not_a_quotation(self):
        nodes, _ = self.render('Intro:\n\n   * item\n\nThen:\n\n   Quoted rule.\n')
        self.assertEqual([node['tag'] for node in nodes], ['p', 'ul', 'p', 'blockquote'])


class RobustnessTest(unittest.TestCase):
    def test_lone_surrogates_are_dropped(self):
        self.assertEqual(sanitize.plain(sanitize.clean('<p>a\ud800b</p>', 'zip-0001.rst')), 'ab')

    def test_page_ids_stay_out_of_third_party_text(self):
        nodes, headings = sanitize.prepare(sanitize.clean('<p id="zip-sources">x</p><h2 id="zip-sources-title">y</h2><h2>zip sources</h2>', 'draft-x.md'))
        self.assertNotIn('id', nodes[0])
        self.assertEqual([heading['id'] for heading in headings], ['y', 'section-zip-sources'])

    def test_stray_text_in_a_table_does_not_fail_the_document(self):
        nodes = sanitize.clean('<table>stray<tr><td>A</td></tr></table>', 'draft-x.md')
        self.assertEqual(nodes[0]['children'][0]['tag'], 'tbody')

    def test_header_fields_fit_the_portal_schema(self):
        meta = importer.parse_header('::\n\n  ZIP: 1\n  Title: ' + 'x' * 400 + '\n  Status: Draft\n  Category: ' + 'y' * 400 + '\n')
        record = importer.entry(meta, Path('zip-0001.rst'))
        self.assertEqual(len(record['title']), 300)
        self.assertEqual(len(record['category']), 120)

    def test_phrasing_keeps_inner_spaces(self):
        nodes = sanitize.clean('<p>a <em>b </em>c <span id="s">d <strong>e</strong> f</span></p>', 'draft-x.md')
        self.assertEqual(sanitize.plain(nodes), 'a b c d e f')


class PullRequestTest(unittest.TestCase):
    def test_only_open_well_formed_pull_requests_are_listed(self):
        raw = {'number': 7, 'title': '  Add  draft ', 'html_url': 'https://github.com/zcash/zips/pull/7', 'state': 'open', 'draft': True, 'user': {'login': 'tester'},
               'head': {'sha': 'a' * 40}, 'created_at': '2026-11-01T00:00:00Z', 'updated_at': '2026-11-02T10:00:00+01:00'}
        pull = pulls.normalize_pull(raw)
        self.assertEqual(pull['title'], 'Add draft')
        self.assertEqual(pull['updatedAt'], '2026-11-02T09:00:00Z')
        self.assertTrue(pull['draft'])
        self.assertIsNone(pulls.normalize_pull(dict(raw, state='closed')))
        self.assertIsNone(pulls.normalize_pull(dict(raw, html_url='https://github.com/other/repo/pull/7')))
        self.assertIsNone(pulls.normalize_pull(dict(raw, html_url='https://github.com/zcash/zips/pull/8')))
        self.assertIsNone(pulls.normalize_pull(dict(raw, head={'sha': 'not-a-sha'})))
        self.assertEqual(pulls.pull_identifier(1428, 'draft-Mcgee_Future Fund.md'), 'pr-1428-draft-mcgee-future-fund')

    @unittest.skipUnless(HAS_RENDERERS, 'docutils and Markdown are required for rendering tests')
    def test_open_pull_requests_render_as_labelled_previews(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder) / 'source'
            (root / 'zips').mkdir(parents=True)
            git = lambda *args: subprocess.run(['git', '-C', str(root), *args], check=True, capture_output=True, text=True).stdout.strip()  # noqa: E731
            git('init', '-q', '-b', 'main')
            git('config', 'user.email', 'test@example.org')
            git('config', 'user.name', 'Test')
            (root / 'zips/zip-0032.rst').write_text(RST_HEADER, encoding='utf-8')
            git('add', '-A')
            git('commit', '-qm', 'main')
            git('update-ref', 'refs/remotes/origin/main', 'HEAD')
            git('checkout', '-qb', 'feature')
            (root / 'zips/draft-test-new.md').write_text(MD_HEADER + '\nProposal body.\n', encoding='utf-8')
            (root / 'zips/zip-0032.rst').write_text(RST_HEADER + '\nA changed paragraph.\n', encoding='utf-8')
            (root / 'zips/zip-guide.rst').write_text(RST_HEADER.replace('ZIP: 32', 'ZIP: Unassigned'), encoding='utf-8')
            git('add', '-A')
            git('commit', '-qm', 'feature')
            head = git('rev-parse', 'HEAD')
            git('update-ref', 'refs/remotes/pr/7', 'HEAD')
            git('checkout', '-q', 'main')
            listing = Path(folder) / 'pulls.json'
            listing.write_text(json.dumps([[{'number': 7, 'title': 'Add a draft', 'html_url': 'https://github.com/zcash/zips/pull/7', 'state': 'open', 'draft': False, 'user': {'login': 'tester'},
                                             'head': {'sha': head}, 'created_at': '2026-11-01T00:00:00Z', 'updated_at': '2026-11-02T00:00:00Z'}]]), encoding='utf-8')
            index, meta = importer.run(root, Path(folder) / 'out', Path(folder) / 'public', pulls=listing, log=lambda _: None)
            proposals = {item['id']: item for item in index if item['kind'] == 'proposal'}
            self.assertEqual(sorted(proposals), ['pr-7-draft-test-new', 'pr-7-zip-0032'])
            new = proposals['pr-7-draft-test-new']
            self.assertEqual((new['pull']['change'], new['base'], new['pull']['author'], new['pull']['number']), ('new', None, 'tester', 7))
            self.assertEqual(new['source'], f'https://github.com/zcash/zips/blob/{head}/zips/draft-test-new.md')
            self.assertEqual(new['official'], 'https://github.com/zcash/zips/pull/7')
            self.assertEqual(new['updatedAt'], '2026-11-02T00:00:00Z')
            update = proposals['pr-7-zip-0032']
            self.assertEqual((update['pull']['change'], update['base'], update['number']), ('update', 'zip-0032', 32))
            self.assertEqual(sorted(update['pull']['files']), ['draft-test-new.md', 'zip-0032.rst'])
            self.assertEqual(meta['pulls'], {'listed': 1, 'rendered': 2, 'failures': []})
            self.assertEqual(meta['counts']['proposals'], 2)
            document = json.loads((Path(folder) / 'out/documents/pr-7-zip-0032.json').read_text(encoding='utf-8'))
            self.assertIn('A changed paragraph.', sanitize.plain(document['body']))
            self.assertEqual([item['id'] for item in index if item['kind'] == 'zip'], ['zip-0032'])


if __name__ == '__main__':
    unittest.main()
