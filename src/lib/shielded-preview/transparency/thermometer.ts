/** How current a source is, against how often it is meant to refresh: fresh up to 2x, aging up to 6x, then stale. */
export type Freshness = 'fresh' | 'aging' | 'stale' | 'unknown';

export function freshness(checkedAt: string | null | undefined, everyMs: number, now = Date.now()): Freshness {
  const time = checkedAt ? Date.parse(checkedAt) : Number.NaN;
  if (!Number.isFinite(time)) return 'unknown';
  const age = Math.max(0, now - time);
  return age <= everyMs * 2 ? 'fresh' : age <= everyMs * 6 ? 'aging' : 'stale';
}

export function ageLabel(checkedAt: string | null | undefined, now = Date.now()): string {
  const time = checkedAt ? Date.parse(checkedAt) : Number.NaN;
  if (!Number.isFinite(time)) return 'Not checked';
  const minutes = Math.max(0, Math.round((now - time) / 60000));
  if (minutes < 2) return 'Just now';
  if (minutes < 120) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
