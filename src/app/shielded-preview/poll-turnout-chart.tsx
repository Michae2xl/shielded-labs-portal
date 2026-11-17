'use client';

import { useCallback, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { BodyTurnout } from '@/lib/shielded-preview/poll-turnout/turnout';
import { knownAt, lineEnd, niceMax } from '@/lib/shielded-preview/poll-turnout/view';
import s from './poll-turnout.module.css';

const HOUR = 3_600_000;
const PAD_TOP = 18;
const PAD_BOTTOM = 3;

/** The poll's window, now, and the span the chart shows (the whole poll, or the part so far). */
export interface Window {
  opens: number;
  closes: number;
  now: number;
  start: number;
  end: number;
}

/** The pixel width of an element, measured from when it mounts and kept current as it resizes. */
export function useWidth<T extends HTMLElement>(): [(node: T | null) => () => void, number] {
  const [width, setWidth] = useState(0);
  const ref = useCallback((node: T | null) => {
    if (!node) return () => {};
    // Measured at once too: a page in a background tab gets no resize notice until it is shown.
    setWidth(Math.round(node.getBoundingClientRect().width));
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

const xOf = (t: number, w: Window, width: number) => ((Math.min(Math.max(t, w.start), w.end) - w.start) / (w.end - w.start)) * width;

/** The time under the pointer, held between the poll's opening and now. */
export function timeAt(clientX: number, rect: DOMRect, w: Window): number {
  const share = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  return Math.max(w.opens, Math.min(w.start + share * (w.end - w.start), Math.min(w.now, w.closes)));
}

/** One body's running total across the poll window: a step line for counts with their own times, read-by-hand counts as points. */
export function TurnoutTrack({ body, w, width, height, hover }: { body: BodyTurnout; w: Window; width: number; height: number; hover: number | null }) {
  if (width <= 0) return <svg className={s.track} height={height} aria-hidden="true" />;
  const end = lineEnd(body, w.now);
  // An earlier round's pace, drawn up to the end of the span in view; the scale makes room for it.
  const reference = (body.reference?.points ?? []).filter((p) => Date.parse(p.at) <= w.end);
  const top = niceMax(Math.max(body.value ?? 0, ...body.series.map((p) => p.value), ...reference.map((p) => p.value)));
  const y = (v: number) => PAD_TOP + (1 - v / top) * (height - PAD_TOP - PAD_BOTTOM);
  const points = body.series.map((p) => ({ x: xOf(Date.parse(p.at), w, width), y: y(p.value) }));
  const nowX = xOf(w.now, w, width);
  const base = y(0);
  let line = '';
  if (points.length && end !== null) {
    if (body.timing === 'recorded') line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    else line = `${points.map((p, i) => (i ? `H${p.x.toFixed(1)} V${p.y.toFixed(1)}` : `M${p.x.toFixed(1)} ${p.y.toFixed(1)}`)).join(' ')} H${xOf(end, w, width).toFixed(1)}`;
  }
  const referenceLine = reference.length > 1 ? reference.map((p, i) => `${i ? 'L' : 'M'}${xOf(Date.parse(p.at), w, width).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ') : '';
  const last = points.at(-1);
  const endX = end === null ? null : xOf(end, w, width);
  const hoverValue = hover === null ? null : knownAt(body, hover);
  return (
    <svg className={s.track} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <rect className={s.elapsed} x={0} y={PAD_TOP} width={nowX} height={base - PAD_TOP} />
      <line className={s.grid} x1={0} x2={width} y1={PAD_TOP + 0.5} y2={PAD_TOP + 0.5} />
      <line className={s.baseline} x1={0} x2={width} y1={base + 0.5} y2={base + 0.5} />
      <text className={s.tick} x={0} y={PAD_TOP - 5}>
        {top.toLocaleString('en-US')}
      </text>
      {referenceLine && <path className={s.reference} d={referenceLine} />}
      {line && body.timing !== 'recorded' && <path className={s.area} d={`${line} V${base} H${points[0].x.toFixed(1)} Z`} />}
      {line && <path className={s.line} data-timing={body.timing} d={line} />}
      {body.timing === 'recorded' && points.slice(1).map((p, i) => <circle key={i} className={s.reading} cx={p.x} cy={p.y} r={3.5} />)}
      <line className={s.now} x1={nowX + 0.5} x2={nowX + 0.5} y1={PAD_TOP} y2={base} />
      {last && endX !== null && body.timing !== 'recorded' && (
        <g className={s.end} data-state={body.state}>
          <circle className={s.halo} cx={endX} cy={last.y} r={4} />
          <circle className={s.dot} cx={endX} cy={last.y} r={4} />
        </g>
      )}
      {hover !== null && (
        <g className={s.crosshair}>
          <line x1={xOf(hover, w, width) + 0.5} x2={xOf(hover, w, width) + 0.5} y1={PAD_TOP} y2={base} />
          {hoverValue !== null && <circle className={s.dot} cx={xOf(hover, w, width)} cy={y(hoverValue)} r={4} />}
        </g>
      )}
    </svg>
  );
}

/** Pointer and arrow keys move one shared crosshair across every track. */
export function useCrosshair(w: Window | null) {
  const [hover, setHover] = useState<number | null>(null);
  const onPointer = (event: PointerEvent<HTMLElement>) => {
    if (!w) return;
    const target = event.currentTarget.querySelector('svg');
    if (target) setHover(timeAt(event.clientX, target.getBoundingClientRect(), w));
  };
  const onKey = (event: KeyboardEvent<HTMLElement>) => {
    if (!w) return;
    const latest = Math.min(w.now, w.closes);
    const from = hover ?? latest;
    const moves: Record<string, number> = { ArrowLeft: from - 6 * HOUR, ArrowRight: from + 6 * HOUR, Home: w.opens, End: latest };
    if (event.key === 'Escape') setHover(null);
    else if (event.key in moves) {
      event.preventDefault();
      setHover(Math.min(latest, Math.max(w.opens, moves[event.key])));
    }
  };
  return { hover, onPointer, onKey, clear: () => setHover(null) };
}
