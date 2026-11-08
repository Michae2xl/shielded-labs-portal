import { pointKind } from './evidence';
import type { Debate, DebatePoint, DebateSide, Voice } from './debates';

/** One row of the comments table: a debate point with the direction it argues for. */
export type CommentRow = DebatePoint & { side: DebateSide };
export type SortOrder = 'newest' | 'oldest';
export const PAGE_SIZE = 8;

export const commentRows = (debate: Debate): CommentRow[] => debate.sides.flatMap(side => side.points.map(point => ({ ...point, side })));

/** Rows from one voice (or all) and, when given, one direction. */
export const filterRows = (rows: CommentRow[], voice: Voice, side: string | null) =>
  rows.filter(row => (voice === 'all' || pointKind(row) === voice) && (side === null || row.side.label === side));

/** Newest or oldest first; posts from the same day keep their listed order. */
export const sortRows = (rows: CommentRow[], order: SortOrder) =>
  [...rows].sort((a, b) => (order === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));

/** One page of rows, with the page kept in range and the numbers a pager needs. */
export function paginate<T>(rows: T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * size;
  return { rows: rows.slice(start, start + size), page: current, pages, from: rows.length ? start + 1 : 0, to: Math.min(start + size, rows.length), total: rows.length };
}

/** Comments per direction for the selected voice, in the order the directions are listed. */
export const directionCounts = (debate: Debate, voice: Voice) => {
  const rows = filterRows(commentRows(debate), voice, null);
  return debate.sides.map(side => {
    const own = rows.filter(row => row.side === side);
    return { side, count: own.length, shieldedLabs: own.filter(row => row.shieldedLabs).length };
  });
};
