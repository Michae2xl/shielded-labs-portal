import { describe, expect, it } from 'vitest';
import { markdownNodes, safeHref, type MarkdownNode } from './markdown';

const tags = (nodes: MarkdownNode[]): string[] => nodes.flatMap(node => typeof node === 'string' ? [] : [node.tag, ...tags(node.children)]);
const text = (nodes: MarkdownNode[]): string => nodes.map(node => typeof node === 'string' ? node : text(node.children)).join('');
const find = (nodes: MarkdownNode[], tag: string): Exclude<MarkdownNode, string>[] => nodes.flatMap(node => typeof node === 'string' ? [] : [...(node.tag === tag ? [node] : []), ...find(node.children, tag)]);

describe('Markdown from applications', () => {
  it('keeps lists, nesting, emphasis and tables as structure', () => {
    const nodes = markdownNodes('- Compensation:\n  - $(USD): 1500\n  - **Justification**: 30 hours\n- Total: 1500\n\n| Milestone | Amount |\n|---|---|\n| 1 | $6,000 |');
    expect(tags(nodes)).toEqual(['ul', 'li', 'ul', 'li', 'li', 'strong', 'li', 'table', 'thead', 'tr', 'th', 'th', 'tbody', 'tr', 'td', 'td']);
    expect(text(nodes)).toContain('$(USD): 1500');
    expect(text(find(nodes, 'td'))).toBe('1$6,000');
  });

  it('allows only web and mail links and turns images into links', () => {
    const nodes = markdownNodes('[Repo](https://github.com/a/b) [x](javascript:alert(1)) ![shot](https://img.example/a.png) <https://example.com/x>');
    expect(find(nodes, 'a').map(link => link.href)).toEqual(['https://github.com/a/b', 'https://img.example/a.png', 'https://example.com/x']);
    expect(text(nodes)).toContain('x');
    expect(text(find(nodes, 'a'))).toContain('Image: shot');
  });

  it('drops raw HTML and comments but keeps the words inside', () => {
    const nodes = markdownNodes('<!-- hidden -->\n<details><summary>More</summary>Inner text</details>\n\nA <b>bold</b> word<br>next');
    expect(text(nodes)).not.toContain('hidden');
    expect(text(nodes)).toContain('Inner text');
    expect(text(nodes)).toContain('bold');
    expect(tags(nodes)).not.toContain('b');
    expect(tags(nodes)).toContain('br');
  });

  it('places headings below the field heading and keeps task boxes and code', () => {
    const nodes = markdownNodes('# Big\n### Small\n- [x] done\n- [ ] open\n\n```\ncode <x>\n```');
    expect(tags(nodes).slice(0, 2)).toEqual(['h4', 'h5']);
    expect(find(nodes, 'check').map(box => box.checked)).toEqual([true, false]);
    expect(text(find(nodes, 'pre'))).toBe('code <x>');
  });

  it('refuses links that carry credentials or are not web or mail', () => {
    expect(safeHref('https://user:pw@example.com')).toBeNull();
    expect(safeHref('mailto:team@example.com')).toBe('mailto:team@example.com');
    expect(safeHref('/relative/path')).toBeNull();
    expect(safeHref('data:text/html,hi')).toBeNull();
  });
});
