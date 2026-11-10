/** The Transparency page shows one concern at a time; the debates come first. */
export const transparencyLanes = [
  { id: 'debates', name: 'Debates' },
  { id: 'involvement', name: 'Shielded Labs involvement' },
  { id: 'evidence', name: 'Evidence and sources' },
  { id: 'method', name: 'Editorial policy' },
] as const;
export type TransparencyLane = typeof transparencyLanes[number]['id'];
export const transparencyLaneIds: readonly string[] = transparencyLanes.map(lane => lane.id);

export function transparencyLane(value: string): TransparencyLane {
  return transparencyLanes.find(lane => lane.id === value)?.id ?? 'debates';
}

/** The tab that holds an in-page anchor, so a link written before the page had tabs still lands on its target. */
export function laneForAnchor(id: string): TransparencyLane | null {
  if (id.startsWith('debate-')) return 'debates';
  if (id === 'editorial-policy') return 'method';
  if (id === 'evidence' || id === 'source-thermometer') return 'evidence';
  return null;
}
