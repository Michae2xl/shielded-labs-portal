import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('editorial', Path(__file__).with_name('import-editorial.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


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


if __name__ == '__main__':
    unittest.main()
