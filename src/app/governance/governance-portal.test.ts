import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import GovernanceNavigation from '@/app/shielded-preview/governance-navigation';
import PortalFooter from '@/app/shielded-preview/portal-footer';
import PortalNavigation, { portalNavigation, portalSearchIndex } from '@/app/shielded-preview/portal-navigation';
import { governanceSections, governanceSectionSlug } from '@/lib/shielded-preview/governance-sections';
import GovernanceHeader from './governance-header';
import GovernancePortal, { governanceLinkTarget } from './governance-portal';

const hrefs = (html: string) => [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map(match => match[1].replaceAll('&amp;', '&'));
const sectionLinks = governanceSections.map(section => `?view=governance&section=${governanceSectionSlug(section)}`);

describe('The governance portal frame', () => {
  it('lists its sections in a sidebar under its own name, with the way to Shielded Labs at the foot', () => {
    const html = renderToStaticMarkup(createElement(GovernanceNavigation, { value: 'ZIPs', onChange: vi.fn() }));
    const sidebar = html.slice(html.indexOf('<aside'), html.indexOf('</aside>'));
    expect(sidebar).toContain('aria-label="Governance sidebar"');
    expect(sidebar).toContain('Zcash Governance');
    expect(sidebar).toContain('Maintained by');
    expect(sidebar).toContain('Shielded Labs');
    // The name leads, the ten sections follow in order, and the Labs portal closes the column.
    expect(hrefs(sidebar)).toEqual(['/governance', ...sectionLinks, '/?view=overview']);
    expect(sidebar.match(/aria-current="page"/g)).toHaveLength(1);
    expect(sidebar).toMatch(/<a[^>]*section=zips[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*section=zips/);
  });

  it('keeps the same sections as a grid of buttons for small screens', () => {
    const html = renderToStaticMarkup(createElement(GovernanceNavigation, { value: 'Overview', onChange: vi.fn() }));
    const grid = html.slice(html.indexOf('</aside>'));
    expect(hrefs(grid)).toEqual(sectionLinks);
    expect(grid.match(/aria-current="page"/g)).toHaveLength(1);
    // Both lists answer to the same name; only one of them is shown at a time.
    expect(html.match(/aria-label="Governance sections"/g)).toHaveLength(2);
  });

  it('opens a section in place and leaves modified clicks to the browser', () => {
    const onChange = vi.fn();
    const tree = GovernanceNavigation({ value: 'Overview', onChange });
    const find = (node: unknown, test: (props: Record<string, unknown>) => boolean): { props: Record<string, unknown> } | null => {
      if (Array.isArray(node)) { for (const child of node) { const hit = find(child, test); if (hit) return hit; } return null; }
      if (!node || typeof node !== 'object' || !('props' in node)) return null;
      const element = node as { props: Record<string, unknown> };
      return test(element.props) ? element : find(element.props.children, test);
    };
    const voting = find(tree, props => props.href === '?view=governance&section=voting')!;
    const event = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, preventDefault: vi.fn() };
    (voting.props.onClick as (event: unknown) => void)(event);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledExactlyOnceWith('Voting');
    onChange.mockClear();
    (voting.props.onClick as (event: unknown) => void)({ ...event, metaKey: true, preventDefault: vi.fn() });
    expect(onChange).not.toHaveBeenCalled();
    // The name on top is a plain link to the front page: the frame opens it in place, as it does for the bar's.
    expect(find(tree, props => props.href === '/governance')!.props.onClick).toBeUndefined();
  });

  it('opens its own pages in place and sends Labs pages to the Labs address', () => {
    expect(governanceLinkTarget('/governance')).toEqual({ here: '/governance' });
    expect(governanceLinkTarget('?view=governance')).toEqual({ here: '/governance' });
    expect(governanceLinkTarget('?view=governance&section=transparency&lane=method#editorial-policy')).toEqual({ here: '/governance?section=transparency&lane=method#editorial-policy' });
    expect(governanceLinkTarget('?view=blog&section=all&record=zcash-governance-is-a-superpower')).toEqual({ away: '/?view=blog&section=all&record=zcash-governance-is-a-superpower' });
    expect(governanceLinkTarget('?view=projects&project=crosslink#scope')).toEqual({ away: '/?view=projects&project=crosslink#scope' });
    // Anything else is left to the browser: other sites, anchors, the Labs address written out, unknown views.
    for (const href of ['https://example.org/?view=governance', '#governance-outcome', '/?view=overview', '?view=unknown', '?section=zips', 'mailto:someone@example.org']) expect(governanceLinkTarget(href), href).toBeNull();
  });

  it('lets a keyboard reader skip past the sections to the page', () => {
    const html = renderToStaticMarkup(createElement(GovernancePortal));
    const skip = html.indexOf('href="#governance-content"');
    const target = html.indexOf('id="governance-content"');
    expect(skip).toBeGreaterThan(-1);
    expect(html.slice(0, skip)).not.toContain('<aside');
    // The target sits after both lists of sections, so the next Tab reaches the page and not the menu.
    expect(target).toBeGreaterThan(html.lastIndexOf('aria-label="Governance sections"'));
    expect(target).toBeGreaterThan(html.indexOf('</aside>'));
    expect(html.slice(target)).not.toContain('aria-label="Governance sections"');
  });

  it('carries its name and a way to Shielded Labs in the bar small screens show', () => {
    const html = renderToStaticMarkup(createElement(GovernanceHeader));
    expect(html).toContain('Zcash');
    expect(html).toContain('Governance');
    expect(html).toContain('Shielded Labs');
    expect(hrefs(html)).toEqual(['/governance', '/?view=overview']);
  });

  it('points its footer at the Labs portal instead of at itself', () => {
    const html = renderToStaticMarkup(createElement(PortalFooter, { compact: true, base: '/' }));
    expect(hrefs(html)).toEqual(['/?view=overview', '/?view=about&section=contact', '/?view=about&section=privacy']);
    expect(html).not.toContain('Sources');
  });
});

describe('The Labs portal frame', () => {
  it('has no governance entry in its menu: the two portals are separate systems', () => {
    const html = renderToStaticMarkup(createElement(PortalNavigation, { view: 'overview', onNavigate: vi.fn() }));
    const links = hrefs(html);
    expect(links.some(href => href.includes('governance'))).toBe(false);
    // The phone bar leads with the Shielded Labs mark, then the menu lists this portal's pages.
    expect(links).toEqual(['?view=overview', ...['overview', 'projects', 'impact', 'activity', 'people', 'blog', 'about'].map(view => `?view=${view}`)]);
    expect(html).toContain('alt="Shielded Labs"');
    expect(html).not.toContain('zcash.svg');
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(portalNavigation.map(item => item.id)).toEqual(['overview', 'projects', 'impact', 'activity', 'people', 'blog', 'about']);
  });

  it('still finds the governance portal from its search', () => {
    expect(portalSearchIndex.map(item => item.id)).toEqual(['governance', ...portalNavigation.map(item => item.id)]);
  });

  it('keeps its own footer links relative', () => {
    const html = renderToStaticMarkup(createElement(PortalFooter, { compact: false, onHome: vi.fn(), onContact: vi.fn(), onPrivacy: vi.fn(), onSources: vi.fn() }));
    expect(hrefs(html)).toEqual(['?view=overview', '?view=about&section=contact', '?view=about&section=privacy']);
    expect(html).toContain('Sources');
  });
});
