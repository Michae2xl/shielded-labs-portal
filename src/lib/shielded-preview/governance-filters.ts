/** The three filters a change passes before it is real, in the order "In one minute" gives them. */
export const governanceFilters = [
  { id: 'community', label: 'Community', verb: 'signals', who: 'The community' },
  { id: 'organizations', label: 'Organizations', verb: 'implement', who: 'Development organizations' },
  { id: 'network', label: 'Network', verb: 'adopts or refuses', who: 'The network' },
] as const;

type Point = [number, number];
const round = (value: number) => +value.toFixed(1);
const text = (points: Point[]) => points.map(([x, y]) => `${round(x)} ${round(y)}`).join('L');

/** Art box, the triangle's corners (top, right, left) and where the Zcash mark sits. */
export const triangle = { width: 520, height: 430, corners: [[260, 26], [478, 404], [42, 404]] as Point[], centre: [260, 278] as Point, hole: 46 };

/**
 * The triangle cut into three pieces around its centre, one per corner. Each seam is a single line with a round tab,
 * used forward by one piece and backward by the next, so a tab is exactly its neighbour's notch and the pieces lock in a ring.
 */
export function trianglePieces() {
  const { corners, centre: [cx, cy], hole } = triangle;
  // Seam k runs from the hole to the middle of the side between corner k and corner k + 1.
  const seams = corners.map(([x, y], index) => {
    const [nx, ny] = corners[(index + 1) % 3], mid: Point = [(x + nx) / 2, (y + ny) / 2];
    const length = Math.hypot(mid[0] - cx, mid[1] - cy), dx = (mid[0] - cx) / length, dy = (mid[1] - cy) / length;
    const sx = -dy, sy = dx;                                       // the side the tab bulges to: into the next piece
    const at = (along: number, out = 0): Point => [cx + dx * along + sx * out, cy + dy * along + sy * out];
    const knobAt = hole + (length - hole) / 2, NECK = 7, RADIUS = 10, LIFT = 3, reach = LIFT + Math.sqrt(RADIUS ** 2 - NECK ** 2);
    const from = Math.atan2(-reach + LIFT, -NECK), sweep = 2 * Math.PI - 2 * Math.atan2(NECK, reach - LIFT);
    const knob = Array.from({ length: 17 }, (_, step): Point => {
      const angle = from - sweep * step / 16;
      return at(knobAt + Math.cos(angle) * RADIUS, reach + Math.sin(angle) * RADIUS);
    });
    return [at(hole), at(knobAt - NECK), ...knob, at(knobAt + NECK), mid] as Point[];
  });
  const pieces = governanceFilters.map((filter, index) => {
    const before = seams[(index + 2) % 3], after = seams[index], [ex, ey] = before[0];
    // Out along the seam before this corner, around the corner, back in along the seam after it, then round the hole.
    const path = `M${text(before)}L${text([corners[index]])}L${text([...after].reverse())}A${hole} ${hole} 0 0 0 ${round(ex)} ${round(ey)}Z`;
    const [x, y] = corners[index];
    return { id: filter.id, path, label: [round(cx + (x - cx) * .5), round(cy + (y - cy) * .5)] as Point, slide: [round((x - cx) * .1), round((y - cy) * .1)] as Point };
  });
  return { pieces, seams: seams.map(seam => seam.map(([x, y]) => [round(x), round(y)] as Point)) };
}
