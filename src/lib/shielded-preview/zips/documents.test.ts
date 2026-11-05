import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { zipDocumentSchema, type ZipDocument, type ZipNode } from './types';

const folder = path.join(process.cwd(), 'src/lib/shielded-preview/zips/documents');
const documents = readdirSync(folder).filter(name => name.endsWith('.json')).map(name => JSON.parse(readFileSync(path.join(folder, name), 'utf8')) as ZipDocument);
const anchors = new Map(documents.map(document => {
  const found = new Set<string>();
  const visit = (node: ZipNode) => { if (typeof node === 'string') return; if (node.id) found.add(node.id); node.children.forEach(visit); };
  document.body.forEach(visit);
  return [document.id, found];
}));
const blocks = new Set('p h2 h3 h4 h5 h6 ul ol dl table blockquote pre figure hr details aside'.split(' '));
function walk(nodes: ZipNode[], visit: (node: Exclude<ZipNode, string>, parents: string[]) => void, parents: string[] = []) {
  for (const node of nodes) {
    if (typeof node === 'string') continue;
    visit(node, parents);
    walk(node.children, visit, [...parents, node.tag]);
  }
}

describe('Rendered ZIP documents', () => {
  it('all pass the schema the portal applies to synced documents', () => {
    const invalid = documents.filter(document => !zipDocumentSchema.safeParse(document).success).map(document => document.id);
    expect(invalid).toEqual([]);
  });
  it('only link to anchors and records that exist', () => {
    const broken: string[] = [];
    for (const document of documents) walk(document.body, node => {
      const href = node.href ?? '';
      if (href.startsWith('#') && !anchors.get(document.id)!.has(href.slice(1))) broken.push(`${document.id} ${href}`);
      const record = /^\?view=governance&section=zips&record=([^#&]+)(?:#(.*))?$/.exec(href);
      if (record && !anchors.has(record[1])) broken.push(`${document.id} ${href}`);
      if (record?.[2] && !anchors.get(record[1])?.has(record[2])) broken.push(`${document.id} ${href}`);
    });
    expect(broken).toEqual([]);
  });
  it('have an outline whose every entry lands on a heading', () => {
    for (const document of documents) for (const heading of document.headings) expect(anchors.get(document.id)!.has(heading.id), `${document.id} ${heading.id}`).toBe(true);
  });
  it('keep valid nesting, so the browser does not rearrange the text', () => {
    const invalid: string[] = [];
    for (const document of documents) walk(document.body, (node, parents) => {
      if (parents.includes('p') && blocks.has(node.tag)) invalid.push(`${document.id}: ${node.tag} in p`);
      if (node.tag === 'a' && parents.includes('a')) invalid.push(`${document.id}: a in a`);
      if (node.tag === 'tr' && !['thead', 'tbody', 'tfoot'].includes(parents.at(-1) ?? '')) invalid.push(`${document.id}: tr outside a table section`);
      if (node.tag === 'details' && (typeof node.children[0] === 'string' || node.children[0]?.tag !== 'summary')) invalid.push(`${document.id}: details without a summary first`);
    });
    expect(invalid).toEqual([]);
  });
  it('show formulas as math, not as LaTeX source', () => {
    const raw: string[] = [];
    const scan = (nodes: ZipNode[], id: string, inCode: boolean) => {
      for (const node of nodes) {
        if (typeof node === 'string') { if (!inCode && /\\(?:mathsf|mathbb|mathtt|frac|begin\{)/.test(node)) raw.push(`${id}: ${node.slice(0, 60)}`); continue; }
        if (node.tag !== 'math') scan(node.children, id, inCode || node.tag === 'pre' || node.tag === 'code');
      }
    };
    for (const document of documents) scan(document.body, document.id, false);
    expect(raw).toEqual([]);
  });
  it('keep headings free of source labels and merged documents free of links to previews', () => {
    const wrong: string[] = [];
    for (const document of documents) walk(document.body, node => {
      if (/^h[2-6]$/.test(node.tag)) {
        const last = node.children.at(-1);
        if (typeof last === 'string' && /\s\[[\w.:-]+\]\s*$/.test(last)) wrong.push(`${document.id}: ${last}`);
      }
      if (document.kind !== 'proposal' && /record=pr-/.test(node.href ?? '')) wrong.push(`${document.id}: ${node.href}`);
    });
    expect(wrong).toEqual([]);
  });
});
