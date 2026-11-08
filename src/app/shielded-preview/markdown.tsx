'use client';

import { useMemo, type ReactNode } from 'react';
import { leavingLink, sourceHref } from '@/lib/shielded-preview/editorial/library';
import { markdownNodes, type MarkdownNode } from '@/lib/shielded-preview/markdown';
import m from './markdown.module.css';

function render(node: MarkdownNode, key: number): ReactNode {
  if (typeof node === 'string') return node;
  const children = node.children.map(render);
  switch (node.tag) {
    case 'a': { const target = sourceHref(node.href ?? ''); return <a key={key} href={target} {...leavingLink(target)}>{children}</a>; }
    case 'check': return <span key={key} className={m.check} role="img" aria-label={node.checked ? 'Checked' : 'Not checked'}>{node.checked ? '☑' : '☐'}</span>;
    case 'table': return <div key={key} className={m.tableScroll} role="region" aria-label="Table from the application" tabIndex={0}><table>{children}</table></div>;
    case 'ol': return <ol key={key} start={node.start}>{children}</ol>;
    case 'hr': return <hr key={key}/>;
    case 'br': return <br key={key}/>;
    default: { const Tag = node.tag; return <Tag key={key}>{children}</Tag>; }
  }
}

/** Markdown from an application, rendered from inert nodes: no raw HTML, only web and mail links. */
export function Markdown({ text }: { text: string }) {
  const nodes = useMemo(() => markdownNodes(text), [text]);
  return <div className={m.markdown}>{nodes.map(render)}</div>;
}
