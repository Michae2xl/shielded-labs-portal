import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ZipsCollection } from '@/app/shielded-preview/governance-zips';
import { bundledZips, filterZips, isNewZip, zipIndexTime, type ZipActivity, type ZipLane } from './library';

const noop = () => {};
const render = (lane: ZipLane, activity: ZipActivity = 'all', filter = 'all') => renderToStaticMarkup(createElement(ZipsCollection, {
  index: bundledZips, lane, activity, filter, search: '', page: 1, onLane: noop, onActivity: noop, onSearch: noop, onFilter: noop, onPage: noop, onNavigate: noop,
}));

describe('ZIP library lists', () => {
  it('offers status and activity as click filters, each chip with its count, in every lane', () => {
    for (const lane of ['zips', 'drafts', 'proposals'] as const) {
      const html = render(lane);
      expect(html).toContain('aria-label="Filter by activity"');
      expect(html).toMatch(/aria-pressed="true"[^>]*>Any time<strong>\d+<\/strong>/);
      expect(html).not.toContain('<select');
    }
    expect(render('zips')).toMatch(/aria-label="Filter by status"[\s\S]*?>Final<strong>\d+<\/strong>/);
    expect(render('zips', 'all', 'Final')).toMatch(/aria-pressed="true"[^>]*>Final</);
  });

  it('marks what opened this week next to its activity date, and a window lists the latest movement first', () => {
    const now = zipIndexTime(bundledZips);
    const fresh = filterZips(bundledZips.entries, { lane: 'proposals', activity: '7', now });
    const html = render('proposals', '7');
    expect(html).toMatch(/aria-pressed="true"[^>]*>7 days<strong>\d+<\/strong>/);
    const decode = (text: string) => text.replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
    const titles = [...html.matchAll(/<h3>([^<]+)<\/h3>/g)].map(match => decode(match[1]));
    expect(titles.slice(0, 5)).toEqual(fresh.slice(0, 5).map(entry => entry.title));
    const newCount = fresh.slice(0, 12).filter(entry => isNewZip(entry, now)).length;
    expect(newCount).toBeGreaterThan(0);
    expect(html.match(/>New<\/span>/g)).toHaveLength(newCount);
  });
});
