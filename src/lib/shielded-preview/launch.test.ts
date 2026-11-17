import { describe, expect, it } from 'vitest';
import { isLaunchHost, launchRoute, requestHost } from './launch';

const headers = (values: Record<string, string>) => ({ get: (name: string) => values[name] ?? null });

describe('the launch address', () => {
  it('reads the host the proxy forwards, without a port', () => {
    expect(requestHost(headers({ host: 'Governance.ShieldedLabs.net:443' }))).toBe('governance.shieldedlabs.net');
    expect(requestHost(headers({ 'x-forwarded-host': 'governance.shieldedlabs.net', host: 'nu1dh10t.up.railway.app' }))).toBe('governance.shieldedlabs.net');
    expect(requestHost(headers({}))).toBe('');
  });
  it('serves the poll page at its root and sends every other page back to it', () => {
    const host = 'governance.shieldedlabs.net';
    expect(launchRoute(host, '/')).toEqual({ rewrite: '/poll' });
    expect(launchRoute(host, '/poll')).toBeNull();
    for (const path of ['/governance', '/shielded-preview', '/landing', '/landing/index.html']) expect(launchRoute(host, path)).toEqual({ redirect: '/' });
  });
  it('serves only the data the page reads', () => {
    const host = 'governance.shieldedlabs.net';
    expect(launchRoute(host, '/api/shielded-preview/turnout')).toBeNull();
    expect(launchRoute(host, '/api/shielded-preview/governance')).toEqual({ notFound: true });
    expect(launchRoute(host, '/api/shielded-preview/contact')).toEqual({ notFound: true });
  });
  it('leaves the preview address, and any other host, as it is', () => {
    expect(isLaunchHost('shielded-labs-portal-preview.up.railway.app')).toBe(false);
    for (const path of ['/', '/governance', '/landing/index.html', '/api/shielded-preview/governance']) {
      expect(launchRoute('shielded-labs-portal-preview.up.railway.app', path)).toBeNull();
      expect(launchRoute('127.0.0.1', path)).toBeNull();
    }
  });
});
