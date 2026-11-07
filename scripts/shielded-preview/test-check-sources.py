import importlib.util
from datetime import datetime, timezone
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('check_sources', Path(__file__).with_name('check-sources.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

CATALOG = [{'id': 'nsm-guide', 'source': 'https://shieldedlabs.net/nsm/', 'updatedAt': '2026-11-05T12:53:32Z'}]
row = lambda link, modified, slug='x', title='Title', date='2026-11-01T00:00:00': {'link': link, 'modified_gmt': modified, 'slug': slug, 'title': {'rendered': title}, 'date_gmt': date}
DEV_FUND = ("export const devFundPublished: DevFundPublication = { questions: null, results: null };\n"
            "    { id: 'proposals', label: 'Proposal deadline', endsAt: '2026-11-08T23:59:00Z' },\n"
            "    { id: 'polling', label: 'Planned polling', endsAt: '2026-11-30T23:59:00Z' },\n")


class SourceWatchTest(unittest.TestCase):
    def test_new_posts_and_changed_copies_are_listed_with_the_command_to_run(self):
        items = module.site_changes(CATALOG, {
            'posts': [row('https://shieldedlabs.net/new-post/', '2026-11-07T10:00:00', title='A new post')],
            'pages': [row('https://shieldedlabs.net/nsm/', '2026-11-06T09:00:00', title='NSM'), row('https://shieldedlabs.net/team/', '2026-11-06T00:00:00', 'team', 'Team')],
        }, '2026-11-05')
        self.assertIn('New post [A new post]', items[0])
        self.assertIn('--only nsm-guide', items[1])
        self.assertIn('Team page', items[2])

    def test_unchanged_sources_stay_quiet(self):
        rows = {'posts': [], 'pages': [row('https://shieldedlabs.net/nsm/', '2026-11-05T12:53:32'), row('https://shieldedlabs.net/team/', '2026-10-22T00:00:00', 'team')]}
        self.assertEqual(module.site_changes(CATALOG, rows, '2026-11-05'), [])

    def test_forum_posts_in_the_window_without_duplicating_watched_threads(self):
        since = '2026-11-06T00:00:00Z'
        threads = [(58906, 'Dev Fund', '2026-11-06T10:00:00.000Z', 12), (42703, 'NSM', '2026-11-01T10:00:00.000Z', 335)]
        actions = [{'username': 'aquietinvestor', 'title': 'Dev Fund', 'slug': 'dev-fund', 'topic_id': 58906, 'post_number': 12, 'created_at': '2026-11-06T10:00:00.000Z'},
                   {'username': 'aquietinvestor', 'title': 'Other', 'slug': 'other', 'topic_id': 1, 'post_number': 2, 'created_at': '2026-11-06T11:00:00.000Z'}]
        items = module.forum_changes(threads, actions, since)
        self.assertEqual(len(items), 2)
        self.assertIn('/t/58906/12', items[0])
        self.assertIn('/t/other/1/2', items[1])

    def test_a_newer_crosslink_release_asks_for_a_guide_review(self):
        self.assertEqual(module.release_changes('v16', 'v16'), [])
        self.assertIn('v17', module.release_changes('v17', 'v16')[0])

    def test_dated_reminders_follow_the_published_timeline(self):
        before = datetime(2026, 11, 8, 12, tzinfo=timezone.utc)
        after = datetime(2026, 12, 2, tzinfo=timezone.utc)
        self.assertEqual(module.dated_reminders(before, DEV_FUND, '2026-11-06', '2026-11-05T05:25:18Z'), [])
        late = module.dated_reminders(after, DEV_FUND, '2026-09-30', '2026-11-05T05:25:18Z')
        self.assertEqual(len(late), 4)
        filled = DEV_FUND.replace('questions: null, results: null', 'questions: QUESTIONS, results: null')
        self.assertEqual(len(module.dated_reminders(after, filled, '2026-11-06', '2026-11-30T00:00:00Z')), 1)

    def test_the_report_is_empty_when_nothing_changed(self):
        self.assertEqual(module.render([('Forum', [])], []), '')
        self.assertIn('- [ ] A', module.render([('Forum', ['A'])], ['Crosslink: URLError']))


if __name__ == '__main__':
    unittest.main()
