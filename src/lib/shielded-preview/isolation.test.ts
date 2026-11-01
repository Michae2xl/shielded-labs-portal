import { afterEach, describe, expect, it, vi } from 'vitest';
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe('Preview isolation', () => {
  it.each(['/', '/shielded-preview', '/api/shielded-preview', '/api/shielded-preview/governance'])('rejects %s before page streaming when disabled', async path => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '');
    const result = await middleware(new NextRequest('http://localhost:4247'+path));
    expect(result.status).toBe(404);
    expect(result.headers.get('cache-control')).toBe('private, no-store');
  });
});
