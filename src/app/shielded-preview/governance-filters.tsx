import type { CSSProperties, ReactNode } from 'react';
import { governanceFilters, triangle, trianglePieces } from '@/lib/shielded-preview/governance-filters';
import s from './governance-filters.module.css';

const { pieces } = trianglePieces();
const summary = `A change to Zcash passes three filters: ${governanceFilters.map(filter => `${filter.who.toLowerCase()} ${filter.verb}`).join(', then ')}.`;

/** The three filters as three pieces that lock around the Zcash mark. The page's opening paragraph and its steps form one
 *  text column; the art stands beside it. */
export default function GovernanceFilters({ lead, children }: { lead?: string; children?: ReactNode }) {
  const [cx, cy] = triangle.centre;
  return <div className={s.figure}>
    {lead && <p className={s.lead}>{lead}</p>}
    <svg className={s.art} viewBox={`0 0 ${triangle.width} ${triangle.height}`} role="img" aria-label={summary}>
      <defs>
        <pattern id="filter-cells" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" style={{ fill: 'var(--c-101010, #101010)' }}/><rect x=".5" y=".5" width="6" height="6" rx=".7" style={{ fill: 'var(--c-272727, #272727)' }}/></pattern>
      </defs>
      {pieces.map((piece, index) => <g key={piece.id} className={s.piece} style={{ '--dx': `${piece.slide[0]}px`, '--dy': `${piece.slide[1]}px`, '--delay': `${index * .13}s` } as CSSProperties}>
        <path d={piece.path} fill="url(#filter-cells)"/>
        <text x={piece.label[0]} y={piece.label[1] - 15} className={s.step}>{index + 1}</text>
        <text x={piece.label[0]} y={piece.label[1] + 6} className={s.name}>{governanceFilters[index].label}</text>
        <text x={piece.label[0]} y={piece.label[1] + 25} className={s.verb}>{governanceFilters[index].verb}</text>
      </g>)}
      {/* The gaps are drawn last, over the fills, so every seam and tab keeps the same width. */}
      <g className={s.gaps}>{pieces.map(piece => <path key={piece.id} d={piece.path}/>)}</g>
      <g className={s.mark}><circle cx={cx} cy={cy} r={triangle.hole - 7}/><image href="/logos/zcash.svg" x={cx - 30} y={cy - 30} width="60" height="60"/></g>
    </svg>
    {children && <div className={s.steps}>{children}</div>}
  </div>;
}
