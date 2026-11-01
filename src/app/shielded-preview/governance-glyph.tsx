import type { ReactNode } from 'react';

export type GovernanceGlyphKind = 'overview' | 'proposals' | 'grants' | 'voting' | 'results' | 'zcap' | 'insights' | 'history' | 'network';

const drawings: Record<GovernanceGlyphKind, ReactNode> = {
  overview: <><path d="m24 5 19 19-19 19L5 24Z" opacity=".35"/><path d="m24 14 10 10-10 10-10-10Z" fill="currentColor" fillOpacity=".1"/><path d="M24 5v9m19 10h-9M24 43v-9M5 24h9"/><circle cx="24" cy="24" r="3" fill="currentColor" stroke="none"/></>,
  proposals: <><path d="M13 8h17l8 8v24H13Z" fill="currentColor" fillOpacity=".07"/><path d="M30 8v9h8M8 15v28h23" opacity=".5"/><path d="M20 24h11m-11 7h8"/><path d="m19 9 5-5 5 5" opacity=".35"/></>,
  grants: <><ellipse cx="19" cy="13" rx="12" ry="6" fill="currentColor" fillOpacity=".1"/><path d="M7 13v7c0 3.3 5.4 6 12 6m12-13v6M7 20v7c0 3.3 5.4 6 12 6"/><circle cx="31" cy="31" r="11" fill="currentColor" fillOpacity=".06"/><path d="M27 31h8m-4-4v8"/><path d="M7 28v6c0 3 5.4 6 12 6" opacity=".4"/></>,
  voting: <><path d="M7 27h34v15H7Z" fill="currentColor" fillOpacity=".08"/><path d="m7 27 7-9h4m23 9-7-9h-4M19 28h10" opacity=".55"/><path d="m17 6 14 4-4 15-14-4Z"/><path d="m18 15 2 3 5-4"/><path d="M14 36h20" opacity=".3"/></>,
  results: <><path d="M7 39h35" opacity=".4"/><path d="M10 38V27h7v11m4 0V19h7v19m4 0V11h7v27" fill="currentColor" fillOpacity=".08"/><path d="m9 18 9-8 7 3 9-8m-6 0h6v6"/></>,
  zcap: <><path d="m24 7 15 9v17l-15 9-15-9V16Z" opacity=".35"/><path d="M24 13v6m10 11-5-3m-15 3 5-3" opacity=".6"/><circle cx="24" cy="8" r="4" fill="currentColor" fillOpacity=".1"/><circle cx="9" cy="33" r="4" fill="currentColor" fillOpacity=".1"/><circle cx="39" cy="33" r="4" fill="currentColor" fillOpacity=".1"/><circle cx="24" cy="24" r="6" fill="currentColor" fillOpacity=".12"/></>,
  insights: <><circle cx="23" cy="22" r="15" opacity=".35"/><path d="m34 34 9 9M23 7v5M8 22h5m10 15v-5m15-10h-5"/><path d="m17 26 5-9 4 6 5-5"/><circle cx="22" cy="17" r="2" fill="currentColor" stroke="none"/></>,
  history: <><path d="M11 14h27v27H11Z" fill="currentColor" fillOpacity=".06"/><path d="M8 7h33v7H8Z"/><path d="M20 21h10"/><circle cx="15" cy="33" r="9" fill="#111"/><path d="M15 28v5l4 2"/></>,
  network: <><path d="m24 8 16 16-16 16L8 24Z" opacity=".4"/><path d="M24 12v24M12 24h24" opacity=".35"/><path d="m24 18 6 6-6 6-6-6Z" fill="currentColor" fillOpacity=".1"/><circle cx="24" cy="8" r="3"/><circle cx="40" cy="24" r="3"/><circle cx="24" cy="40" r="3"/><circle cx="8" cy="24" r="3"/></>,
};

export default function GovernanceGlyph({ kind, size = 36 }: { kind: GovernanceGlyphKind; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={size <= 24 ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{drawings[kind]}</svg>;
}
