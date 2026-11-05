'use client';

import { useEffect, useId, useState } from 'react';
import z from './governance-zips.module.css';

const font = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const frameStyle = 'html,body{margin:0;background:#fff}svg{display:block;width:100%;height:auto;max-width:100%}';
const SIZE = /viewBox="[-\d.e]+ [-\d.e]+ ([\d.e]+) ([\d.e]+)"/;

/**
 * Draws a Mermaid diagram from a merged ZIP; previews of open pull requests stay code.
 * The drawing sits in a frame with no scripts and no access to the portal.
 */
export default function ZipDiagram({ source }: { source: string }) {
  const id = useId().replace(/\W/g, '');
  const [drawing, setDrawing] = useState<{ svg: string; width: number; height: number } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      const { default: mermaid } = await import('mermaid');
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default', fontFamily: font, suppressErrorRendering: true });
      const { svg } = await mermaid.render(`zip-diagram-${id}`, source);
      const size = SIZE.exec(svg);
      if (!size) throw new Error('The diagram has no size');
      if (active) setDrawing({ svg, width: Number(size[1]), height: Number(size[2]) });
    })().catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [id, source]);
  if (failed) return <pre>{source}</pre>;
  return <figure className={z.diagram}>
    {drawing
      ? <div className={z.diagramScroll}><iframe title="Diagram from the proposal" sandbox="" srcDoc={`<!doctype html><meta charset="utf-8"><style>${frameStyle}</style>${drawing.svg}`} style={{ aspectRatio: `${drawing.width} / ${drawing.height}`, maxWidth: drawing.width, minWidth: Math.min(drawing.width, 640) }}/></div>
      : <p className={z.status} role="status">Drawing the diagram…</p>}
    <details className={z.diagramSource}><summary>Diagram source</summary><pre>{source}</pre></details>
  </figure>;
}
