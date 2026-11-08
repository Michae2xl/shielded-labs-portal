/**
 * How each piece of content is marked, so a reader can tell evidence from argument at a glance:
 * - fact: checkable on the chain itself (an activation height, a pool balance);
 * - record: an official document or dataset (a ZIP header, a published result, a grants ledger);
 * - position: Shielded Labs speaking for itself;
 * - community: an argument by someone else in the ecosystem;
 * - press: reported by a third party, not the speaker's own words.
 */
export type EvidenceKind = 'fact' | 'record' | 'position' | 'community' | 'press';

export const evidenceKinds: { kind: EvidenceKind; label: string; meaning: string }[] = [
  { kind: 'fact', label: 'Verified fact', meaning: 'Checkable on the Zcash chain itself.' },
  { kind: 'record', label: 'Official record', meaning: 'From a ZIP, a published result or a ledger.' },
  { kind: 'position', label: 'Shielded Labs position', meaning: 'Shielded Labs speaking for itself.' },
  { kind: 'community', label: 'Community view', meaning: 'An argument by someone else, in their own post.' },
  { kind: 'press', label: 'Press report', meaning: 'Reported by a third party; the original is not linked.' },
];

export const evidenceLabel = (kind: EvidenceKind) => evidenceKinds.find(item => item.kind === kind)!.label;

/** The kind of source behind a link, named the way a reader would recognise it. */
export function sourceType(url: string): string {
  let host = '';
  let path = '';
  try { const parsed = new URL(url); host = parsed.hostname.replace(/^www\./, ''); path = parsed.pathname; } catch { return 'Source'; }
  if (host === 'forum.zcashcommunity.com') return 'Forum post';
  if (host === 'github.com' && /^\/zcash\/zips\/pull\//.test(path)) return 'ZIP pull request';
  if (host === 'github.com' && /^\/zcash\/zips\/commit\//.test(path)) return 'ZIP repository';
  if (host === 'zips.z.cash' || (host === 'github.com' && path.startsWith('/zcash/zips'))) return 'ZIP text';
  if (host === 'blockchair.com') return 'Block explorer';
  if (host === 'openzcash.org') return 'OpenZcash';
  return host;
}

/** Who speaks in a debate point: Shielded Labs itself, someone in the community, or the press. */
export type Speaker = Extract<EvidenceKind, 'position' | 'community' | 'press'>;

/** A debate point is Shielded Labs' position, a press report, or a community view, in that order. */
export const pointKind = (point: { shieldedLabs?: boolean; via?: string }): Speaker => point.shieldedLabs ? 'position' : point.via ? 'press' : 'community';
