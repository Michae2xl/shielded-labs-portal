import { describe, expect, it } from 'vitest';
import { SITE_HOME, siteMenu } from './site-menu';

describe('the Shielded Labs site menu on the poll page', () => {
  it('lists the tabs of shieldedlabs.net in the same order', () => {
    expect(siteMenu.map(item => item.label)).toEqual(['Home', 'Team', 'Projects', 'Governance', 'Blog', 'Contact', 'Transparency']);
  });
  it('leads every tab but Governance back to the site', () => {
    expect(SITE_HOME).toBe('https://shieldedlabs.net/');
    for (const item of siteMenu) {
      if (item.current) expect(item).toMatchObject({ label: 'Governance', href: 'https://governance.shieldedlabs.net/' });
      else expect(item.href.startsWith(SITE_HOME)).toBe(true);
    }
    expect(siteMenu.filter(item => item.current)).toHaveLength(1);
  });
});
