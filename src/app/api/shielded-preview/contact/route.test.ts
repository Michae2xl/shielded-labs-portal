import { afterEach, describe, expect, it, vi } from 'vitest';

const { forwardContact } = vi.hoisted(() => ({ forwardContact: vi.fn().mockResolvedValue(Response.json({ sent: true })) }));
vi.mock('@/lib/shielded-preview/contact', () => ({ createContactHandler: () => forwardContact }));
import { POST } from './route';

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe('contact feedback boundary', () => {
  it('blocks direct API submissions in the feedback prototype', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '1');
    vi.stubEnv('NEXT_PUBLIC_SHIELDED_LABS_FEEDBACK_PREVIEW', '1');
    const response = await POST(new Request('https://preview.test/api/shielded-preview/contact', { method: 'POST' }));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ sent: false });
    expect(forwardContact).not.toHaveBeenCalled();
  });
  it('retains normal contact behavior outside feedback mode', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '1');
    vi.stubEnv('NEXT_PUBLIC_SHIELDED_LABS_FEEDBACK_PREVIEW', '');
    const request = new Request('https://preview.test/api/shielded-preview/contact', { method: 'POST' });
    expect((await POST(request)).status).toBe(200);
    expect(forwardContact).toHaveBeenCalledWith(request);
  });
  it('does not open the portal API when the preview guard is disabled', async () => {
    vi.stubEnv('SHIELDED_LABS_PREVIEW', '');
    vi.stubEnv('NEXT_PUBLIC_SHIELDED_LABS_FEEDBACK_PREVIEW', '1');
    expect((await POST(new Request('https://preview.test/api/shielded-preview/contact', { method: 'POST' }))).status).toBe(404);
    expect(forwardContact).not.toHaveBeenCalled();
  });
});
