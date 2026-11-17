import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { THEME_KEY, THEME_SCRIPT } from './theme';
import ThemeToggle from './theme-toggle';

const ROOT = process.cwd();
/** Stylesheets with a light theme of their own instead of the generated one. */
const SELF_THEMED = new Set(['src/app/shielded-preview/poll-turnout.module.css']);

/** Every stylesheet and component the governance portal imports, following its local imports. */
function governanceFiles() {
  const seen = new Set<string>();
  const sheets = new Set<string>();
  const resolveImport = (from: string, spec: string) => {
    const base = spec.startsWith('@/') ? join(ROOT, 'src', spec.slice(2)) : spec.startsWith('.') ? resolve(dirname(from), spec) : null;
    if (!base) return null;
    if (base.endsWith('.css')) return base;
    return ['', '.tsx', '.ts', '/index.tsx', '/index.ts'].map((ext) => base + ext).find((file) => existsSync(file) && statSync(file).isFile()) ?? null;
  };
  const walk = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    for (const match of readFileSync(file, 'utf8').matchAll(/(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]/g)) {
      const target = resolveImport(file, match[1] ?? match[2]);
      if (!target || /\.test\.tsx?$/.test(target)) continue;
      if (target.endsWith('.css')) sheets.add(relative(ROOT, target));
      else walk(target);
    }
  };
  walk(join(ROOT, 'src/app/governance/governance-portal.tsx'));
  walk(join(ROOT, 'src/app/poll/poll-site.tsx'));
  return { sheets: [...sheets].sort(), components: [...seen].filter((f) => f.endsWith('.tsx')) };
}

const theme = readFileSync(join(ROOT, 'src/app/governance/governance-theme.css'), 'utf8');
const defined = new Set([...theme.matchAll(/(--c-[0-9a-z-]+):/g)].map((m) => m[1]));
const outside = (css: string) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"[^"]*"|'[^']*'/g, '""')
    .replace(/url\([^)]*\)/g, 'url()')
    .replace(/var\(--c-[^,()]+,\s*[^)]*\)/g, 'var()');

describe('the governance light theme', () => {
  const { sheets, components } = governanceFiles();

  it('finds the portal’s stylesheets', () => {
    expect(sheets).toContain('src/app/shielded-preview/governance.module.css');
    expect(sheets).toContain('src/app/governance/governance-theme.css');
    expect(sheets).toContain('src/app/poll/poll-site.module.css');
  });
  it('leaves no colour literal without a light value in any governance stylesheet', () => {
    for (const sheet of sheets.filter((s) => !SELF_THEMED.has(s) && s.endsWith('.module.css'))) {
      const css = outside(readFileSync(join(ROOT, sheet), 'utf8'));
      const hex = [...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0])// A white or black veil reads the same on either theme.
        .filter((h) => !/^#(?:(?:ffffff|000000)[0-9a-f]{2}|(?:fff|000)[0-9a-f])$/i.test(h));
      const greys = [...css.matchAll(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/g)].filter(([, r, g, b]) => r === g && g === b && r !== '0');
      const white = css.match(/(?<=[:\s,(])white(?=[\s;,)!}])/g) ?? [];
      expect({ sheet, hex, greys: greys.map((m) => m[0]), white }).toEqual({ sheet, hex: [], greys: [], white: [] });
    }
  });
  it('defines every colour variable the stylesheets and components read', () => {
    const used = new Set<string>();
    for (const file of [...sheets.map((s) => join(ROOT, s)), ...components]) {
      for (const m of readFileSync(file, 'utf8').matchAll(/var\((--c-[0-9a-z-]+)/g)) used.add(m[1]);
    }
    for (const hex of ['eeeeee', 'b8b8b8', '909090', '6d6d6d', '525252', '3e3e3e']) used.add(`--c-${hex}`);
    expect([...used].filter((name) => !defined.has(name))).toEqual([]);
  });
  it('turns the page light only when this browser chose it', () => {
    const run = (stored: string | null) => {
      const dataset: Record<string, string> = {};
      new Function('localStorage', 'document', THEME_SCRIPT)({ getItem: (k: string) => (k === THEME_KEY ? stored : null) }, { documentElement: { dataset } });
      return dataset.govTheme ?? 'dark';
    };
    expect([run(null), run('dark'), run('light')]).toEqual(['dark', 'dark', 'light']);
    expect(() => new Function('localStorage', 'document', THEME_SCRIPT)({ getItem: () => { throw new Error('blocked'); } }, {})).not.toThrow();
  });
  it('shows a sun on the dark theme, the emoji alone, named for what it does', () => {
    const html = renderToStaticMarkup(createElement(ThemeToggle, { className: 'corner' }));
    expect(html).toContain('aria-label="Switch to the light theme"');
    expect(html).toContain('☀️');
    expect(html).not.toMatch(/<svg|<img/);
  });
});
