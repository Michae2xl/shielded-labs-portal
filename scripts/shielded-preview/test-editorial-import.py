import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('editorial', Path(__file__).with_name('import-editorial.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
text_spec = importlib.util.spec_from_file_location('article_text', Path(__file__).with_name('import-article-text.py'))
article_text = importlib.util.module_from_spec(text_spec)
text_spec.loader.exec_module(article_text)


class EditorialImportTest(unittest.TestCase):
    def test_reviewed_project_associations_survive_reimport(self):
        self.assertEqual(module.article_projects('zcash-and-staking-economics', 'Zcash and Staking Economics'), ['crosslink'])
        self.assertEqual(module.article_projects('the-orchard-counterfeiting-vulnerability', 'The Orchard Counterfeiting Vulnerability'), ['ironwood'])
        self.assertEqual(module.article_projects('crosslink-update', 'Crosslink update'), ['crosslink'])
        self.assertEqual(module.article_projects('unrelated', 'Zcash governance'), [])

    def test_active_content_never_reaches_reader(self):
        nodes = module.clean('<script>alert(1)</script><style>x{}</style><iframe src="https://bad.test"></iframe><form><p>hidden form</p></form><p onclick="bad()">Visible <a href="jav&#97;script:alert(1)">safe text</a></p>', download=False)
        self.assertEqual(nodes, [{'tag': 'p', 'children': ['Visible ', 'safe text']}])

    def test_shortcodes_removed_but_words_and_markup_preserved(self):
        nodes = module.clean('[vc_row css="x"]<h3>Question?</h3><p>A <strong>complete</strong> answer.</p>[/vc_row]', download=False)
        self.assertEqual(module.plain(nodes), 'Question? A  complete  answer.')
        self.assertEqual(nodes[1]['children'][1]['tag'], 'strong')

    def test_unique_stable_heading_ids_and_no_duplicate_title(self):
        nodes, headings = module.prepare(module.clean('<h1>Guide</h1><h2>Steps</h2><h2>Steps</h2><h3 id="precise-link">Exact</h3>', download=False), 'Guide')
        self.assertEqual([x['id'] for x in headings], ['steps', 'steps-2', 'precise-link'])
        self.assertEqual(len(nodes), 3)

    def test_links_cannot_expose_credentials_or_active_schemes(self):
        for value in ['javascript:alert(1)', 'data:text/html,hello', 'https://user:pass@example.org/', 'java\nscript:bad()']:
            self.assertIsNone(module.safe_url(value))
        self.assertEqual(module.safe_url('/crosslink/'), 'https://shieldedlabs.net/crosslink/')


class ArticleTextTest(unittest.TestCase):
    def test_pasted_markdown_becomes_the_same_nodes_as_a_post(self):
        entry = article_text.convert('## First section\n\nWords with a [link](https://example.org/) and **bold**.\n\nSecond line\ncontinues here.\n\n---\n\n- One\n- Two', 'an-article')
        self.assertEqual(entry['headings'], [{'id': 'first-section', 'title': 'First section', 'level': 2}])
        self.assertEqual([node['tag'] for node in entry['body']], ['h2', 'p', 'p', 'hr', 'ul'])
        words = entry['body'][1]['children']
        self.assertEqual(words[1], {'tag': 'a', 'children': ['link'], 'href': 'https://example.org/'})
        self.assertEqual(words[3]['tag'], 'strong')
        self.assertEqual(entry['body'][2]['children'], ['Second line continues here.'])
        self.assertEqual(entry['minutes'], 1)

    def test_a_short_line_without_punctuation_is_a_section_title(self):
        entry = article_text.convert('Opening words of the article.\n\nWhy It Matters\n\nA sentence follows here.', 'an-article')
        self.assertEqual([node['tag'] for node in entry['body']], ['p', 'h2', 'p'])
        self.assertEqual(entry['headings'][0]['id'], 'why-it-matters')

    def test_a_paste_with_no_blank_lines_keeps_one_block_per_line(self):
        entry = article_text.convert('Opening words of the article.\nWhy It Matters\nA sentence follows here.\n________\nThanks to @some_name.', 'an-article')
        self.assertEqual([node['tag'] for node in entry['body']], ['p', 'h2', 'p', 'hr', 'p'])
        self.assertEqual(entry['body'][4]['children'], ['Thanks to @some_name.'])

    def test_the_instruction_note_and_a_repeated_title_are_dropped(self):
        entry = article_text.convert('<!-- Paste below. -->\n\nAn Article: Title\n\nThe text.', 'an-article-title')
        self.assertEqual(entry['body'], [{'tag': 'p', 'children': ['The text.']}])

    def test_a_note_only_file_has_no_text(self):
        self.assertIsNone(article_text.convert('<!-- Paste below. -->\n\n', 'an-article'))

    def test_markup_in_the_paste_stays_inert(self):
        entry = article_text.convert('Before <script>alert(1)</script> and [bad](javascript:alert(1)) after.', 'an-article')
        paragraph = entry['body'][0]
        self.assertEqual([child for child in paragraph['children'] if isinstance(child, dict)], [])
        self.assertIn('<script>alert(1)</script>', module.plain(paragraph))

    def test_reading_time_follows_the_text(self):
        self.assertEqual(article_text.convert(' '.join(['word'] * 660) + '.', 'an-article')['minutes'], 3)


if __name__ == '__main__':
    unittest.main()
