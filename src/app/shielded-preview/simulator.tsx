'use client';

import { useEffect, useRef, useState } from 'react';
import { feeSections, simulatorFrame, simulatorSource, type Simulator } from '@/lib/shielded-preview/editorial/simulators';
import { editorialCatalog, editorialHref } from '@/lib/shielded-preview/editorial/library';
import s from './simulator.module.css';

export default function SimulatorView({ tool, onFollow, backHref, embedded = false }: { tool: Simulator; onFollow: (href: string) => void; backHref?: string; embedded?: boolean }) {
  const [source, setSource] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [frameState, setFrameState] = useState<{ key: string; failed: boolean } | null>(null);
  const [canExpand, setCanExpand] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  // The frame reloads on Reset or a new tool; a new section only moves inside the loaded model.
  const frameKey = `${tool.id}:${attempt}`;
  const loading = frameState?.key !== frameKey;
  const failed = frameState?.key === frameKey && frameState.failed;
  useEffect(() => {
    function update() {
      const scenario = new URLSearchParams(window.location.search).get('simulation') ?? '';
      setSource(simulatorSource(tool.id, scenario));
    }
    update(); heading.current?.focus({ preventScroll: true });
    window.addEventListener('popstate', update); window.addEventListener('shielded:navigate', update);
    return () => { window.removeEventListener('popstate', update); window.removeEventListener('shielded:navigate', update); };
  }, [tool.id]);
  useEffect(() => {
    const change = () => setExpanded(globalThis.document.fullscreenElement === panel.current);
    const start = setTimeout(() => setCanExpand(tool.id === 'fees-simulator' && globalThis.document.fullscreenEnabled), 0);
    globalThis.document.addEventListener('fullscreenchange', change);
    return () => { clearTimeout(start); globalThis.document.removeEventListener('fullscreenchange', change); };
  }, [tool.id]);
  function toggleExpanded() {
    if (globalThis.document.fullscreenElement) void globalThis.document.exitFullscreen();
    else void panel.current?.requestFullscreen();
  }
  const guide = editorialHref(editorialCatalog.find(entry => entry.id === tool.guide)!);
  const Title = embedded ? 'h2' : 'h1';
  function chooseSection(section: string) {
    // Moving between sections of the lab keeps the page where it is and the lab loaded.
    const params = new URLSearchParams(window.location.search);
    params.set('simulation', `#${section}`);
    window.history.pushState(null, '', `?${params}`);
    window.dispatchEvent(new Event('shielded:navigate'));
  }
  return <article className={s.simulator}>
    {backHref && <a className={s.back} href={backHref} onClick={event => { if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); onFollow(backHref); }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6"/></svg>{embedded ? 'Research & guides' : 'Resources'}</a>}
    <header className={s.header}>
      <div><Title ref={heading} tabIndex={-1}>{tool.title}</Title><p>{tool.summary}</p></div>
      <a href={guide} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onFollow(guide); } }}>{tool.guideLabel}<span aria-hidden="true">→</span></a>
    </header>
    <div className={s.panel} ref={panel}>
      <div className={s.toolbar}>
        {tool.id === 'fees-simulator' ? <label className={s.sectionSelect}>Explore<select aria-label="Lab section" value={source ? new URL(source).hash.slice(1) : feeSections[0].id} onChange={event => chooseSection(event.target.value)}>{feeSections.map(section => <option key={section.id} value={section.id}>{section.label}</option>)}</select></label> : <span className={s.toolbarNote}>Interactive model <span aria-hidden="true">·</span> Outcomes depend on your assumptions.</span>}
        <div className={s.actions}>
          <a href={source ?? tool.source} target="_blank" rel="noopener noreferrer">Open in new tab<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></a>
          {canExpand && <button type="button" onClick={toggleExpanded}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={expanded ? 'M9 4v5H4m16 0h-5V4M4 15h5v5m6 0v-5h5' : 'M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5'}/></svg>{expanded ? 'Exit full screen' : 'Full screen'}</button>}
          <button type="button" onClick={() => setAttempt(value => value + 1)} aria-label="Reset and reload simulator"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20 10a8 8 0 1 0 0 6M20 4v6h-6"/></svg>Reset</button>
        </div>
      </div>
      <div className={s.frameWrap} aria-busy={loading}>
        {loading && <p role="status" className={s.loading}>Loading simulator…</p>}
        {failed && <p role="alert" className={s.loading}>The simulator could not load. Use Reset to try again.</p>}
        {source && <iframe key={frameKey} src={source} title={tool.model} className={s.frame} data-tool={tool.id} {...simulatorFrame} onLoad={() => setFrameState({ key: frameKey, failed: false })} onError={() => setFrameState({ key: frameKey, failed: true })}/>}
      </div>
    </div>
    <footer className={s.caption}>
      <span>Source model: {tool.model}{tool.linksLeaveFrame ? '. Links inside the model cannot open in this frame: use Open in new tab to follow them, or Reset to come back.' : ''}</span>
      {!embedded && <a href={`?view=projects&project=${tool.project}`} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onFollow(`?view=projects&project=${tool.project}`); } }}>Project details<span aria-hidden="true"> →</span></a>}
    </footer>
  </article>;
}
