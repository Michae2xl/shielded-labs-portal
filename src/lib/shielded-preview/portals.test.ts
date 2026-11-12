import { describe, expect, it } from 'vitest';
import { GOVERNANCE_PATH, governanceAddress, governanceCanonical, governanceRedirect, isLabsView, labsAddress, labsAnswer, portalOf } from './portals';

const labsViews = ['overview', 'projects', 'activity', 'impact', 'people', 'blog', 'resources', 'about', 'website'];

describe('The two portals and their addresses', () => {
  it('gives the governance portal its own address and drops the view that named it', () => {
    expect(GOVERNANCE_PATH).toBe('/governance');
    expect(governanceAddress()).toBe('/governance');
    expect(governanceAddress('?view=governance')).toBe('/governance');
    expect(governanceAddress('?view=governance&section=zips&record=zip-0237')).toBe('/governance?section=zips&record=zip-0237');
    expect(governanceAddress('?view=governance&section=transparency#debate-polls')).toBe('/governance?section=transparency#debate-polls');
    expect(governanceAddress('?section=voting&lane=dev-fund')).toBe('/governance?section=voting&lane=dev-fund');
  });

  it('keeps Labs pages on the Labs address, view included', () => {
    expect(labsAddress('?view=overview')).toBe('/?view=overview');
    expect(labsAddress('?view=projects&project=nsm')).toBe('/?view=projects&project=nsm');
    expect(labsAddress('?view=about&section=contact#form')).toBe('/?view=about&section=contact#form');
  });

  it('knows which views are Labs pages', () => {
    for (const view of labsViews) expect(isLabsView(view), view).toBe(true);
    for (const view of ['governance', 'unknown', '', null, undefined]) expect(isLabsView(view), String(view)).toBe(false);
  });

  it('knows which portal owns the view a link names', () => {
    expect(portalOf('?view=governance&section=zips')).toBe('governance');
    expect(portalOf('?view=blog&record=some-article')).toBe('labs');
    for (const link of ['?view=unknown', '?section=zips', '#anchor', 'https://example.org/?view=governance', '/governance?view=projects']) expect(portalOf(link), link).toBeNull();
  });

  it('redirects old governance links from the Labs address', () => {
    // Governance was the default view while both portals shared one address.
    expect(labsAnswer({ view: 'governance', section: 'zips', record: 'zip-0237' })).toEqual({ redirect: '/governance?section=zips&record=zip-0237' });
    expect(labsAnswer({ view: 'governance', section: 'voting', lane: 'upgrades', record: 'upgrade:NU7.1' })).toEqual({ redirect: `/governance?${new URLSearchParams({ section: 'voting', lane: 'upgrades', record: 'upgrade:NU7.1' })}` });
    expect(labsAnswer({ view: 'unknown', section: 'zips' })).toEqual({ redirect: '/governance?section=zips' });
    expect(labsAnswer({ section: 'voting' })).toEqual({ redirect: '/governance?section=voting' });
  });

  it('answers the bare Labs address with the governance front page itself', () => {
    // The hosting health check asks the root for a 2xx, so the root shows the page instead of redirecting to it.
    expect(labsAnswer({})).toEqual({ page: 'governance' });
    expect(labsAnswer({ view: 'governance' })).toEqual({ page: 'governance' });
    expect(labsAnswer({ view: 'unknown' })).toEqual({ page: 'governance' });
    expect(labsAnswer({ view: '' })).toEqual({ page: 'governance' });
  });

  it('leaves Labs pages where they are', () => {
    for (const view of labsViews) expect(labsAnswer({ view }), view).toEqual({ page: 'labs' });
    expect(labsAnswer({ view: 'projects', project: 'nsm', section: 'resources' })).toEqual({ page: 'labs' });
  });

  it('shows the governance address when the portal was opened somewhere else', () => {
    expect(governanceCanonical('/', '', '')).toBe('/governance');
    expect(governanceCanonical('/shielded-preview', '?view=governance', '')).toBe('/governance');
    expect(governanceCanonical('/governance', '?view=governance&section=zips', '#abstract')).toBe('/governance?section=zips#abstract');
    // An address that is already the portal's own is left as the reader wrote it.
    expect(governanceCanonical('/governance', '', '')).toBeNull();
    expect(governanceCanonical('/governance', '?section=voting&record=upgrade:NU7.1', '#governance-proposed')).toBeNull();
  });

  it('keeps the governance address canonical and hands Labs views back', () => {
    expect(governanceRedirect({})).toBeNull();
    expect(governanceRedirect({ section: 'zips', record: 'zip-0237' })).toBeNull();
    expect(governanceRedirect({ view: 'governance', section: 'zips' })).toBe('/governance?section=zips');
    expect(governanceRedirect({ view: 'unknown' })).toBe('/governance');
    expect(governanceRedirect({ view: 'projects', project: 'nsm' })).toBe('/?view=projects&project=nsm');
    expect(governanceRedirect({ view: 'about', section: 'privacy' })).toBe('/?view=about&section=privacy');
  });

  it('reads the first value of a repeated parameter and skips empty ones', () => {
    expect(labsAnswer({ view: ['projects', 'governance'] })).toEqual({ page: 'labs' });
    expect(labsAnswer({ view: ['governance', 'projects'], section: ['zips', 'voting'], record: undefined })).toEqual({ redirect: '/governance?section=zips' });
    expect(governanceRedirect({ view: ['about'], section: 'contact' })).toBe('/?view=about&section=contact');
  });
});
