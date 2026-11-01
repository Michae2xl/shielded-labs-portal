import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { editorialCatalog, resolveEditorialLink } from './library';
import { simulatorSource, simulators } from './simulators';

describe('Portal simulators and news artwork', () => {
  it('opens each official model inside an internal record', () => {
    for (const tool of simulators) {
      expect(resolveEditorialLink(tool.source)).toContain(`record=${tool.id}`);
      expect(editorialCatalog.find(entry => entry.id === tool.id)?.category).toBe('Simulator');
    }
  });
  it('preserves supported scenarios while fixing the frame origin', () => {
    const mapped = new URL(resolveEditorialLink('https://aphelionz.github.io/crosslink-economics-simulator/?ps=50&c=10&dz=100&ts=3000000')!, 'https://portal.example');
    const frame = new URL(simulatorSource('crosslink-simulator', mapped.searchParams.get('simulation')!)!);
    expect(frame.searchParams.get('ps')).toBe('50');
    expect(frame.searchParams.get('ts')).toBe('3000000');
    expect(simulatorSource('nsm-simulator', '#z=abc_123-XYZ')).toContain('#z=abc_123-XYZ');
    for (const tool of simulators) {
      for (const malicious of ['https://untrusted.example/', '//untrusted.example/', 'javascript:alert(1)', '?ps=-1&c=1000&redirect=https://untrusted.example', '#z=<script>']) {
        expect(new URL(simulatorSource(tool.id, malicious)!).origin).toBe(new URL(tool.source).origin);
      }
    }
    expect(simulatorSource('unknown')).toBeNull();
  });
  it('does not map similar, untrusted URLs into the frame', () => {
    expect(resolveEditorialLink('https://aphelionz.github.io.evil.example/crosslink-economics-simulator/')).not.toContain('?view=resources');
  });
  it('opens the fee calculator directly and preserves approved lab sections', () => {
    expect(simulatorSource('fees-simulator')).toBe('https://fees.shieldedinfra.net/#enter-zip-317-and-actions');
    expect(simulatorSource('fees-simulator', '#proposal')).toBe('https://fees.shieldedinfra.net/#proposal');
    expect(simulatorSource('fees-simulator', '#')).toBe('https://fees.shieldedinfra.net/');
    const link = new URL(resolveEditorialLink('https://fees.shieldedinfra.net/#proposal')!, 'https://portal.example');
    expect(link.searchParams.get('simulation')).toBe('#proposal');
  });
  it('gives all 20 articles locally served publisher artwork with dimensions', () => {
    const articles = editorialCatalog.filter(entry => entry.view === 'blog');
    expect(articles).toHaveLength(20);
    for (const article of articles) {
      expect(article.image?.source).toMatch(/^https:\/\/shieldedlabs.net\/wp-content\/uploads\//);
      expect(article.image!.width).toBeGreaterThan(0);
      expect(article.image!.height).toBeGreaterThan(0);
      expect(existsSync(`public${article.image!.src}`)).toBe(true);
    }
  });
});
