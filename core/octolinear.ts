import type { Waypoint, GridPoint } from './types';

// the eight allowed unit directions inside a plane.
export const OCTOLINEAR_DIRECTIONS: ReadonlyArray<GridPoint> = [
  [1, 0], [1, 1], [0, 1], [-1, 1],
  [-1, 0], [-1, -1], [0, -1], [1, -1],
];

/**
 * returns the octolinear unit direction (dx, dy) of segment a->b, or null
 * if the segment is degenerate or off-axis.
 */
export function direction(a: Waypoint, b: Waypoint): GridPoint | null {
  const dx = b.gx - a.gx;
  const dy = b.gy - a.gy;
  if (dx === 0 && dy === 0) return null;
  if (dx === 0) return [0, dy > 0 ? 1 : -1];
  if (dy === 0) return [dx > 0 ? 1 : -1, 0];
  if (Math.abs(dx) === Math.abs(dy))
    return [dx > 0 ? 1 : -1, dy > 0 ? 1 : -1];
  return null;
}

/**
 * is point c on the line through a, b? assumes octolinear segments.
 */
export function isCollinear(a: Waypoint, b: Waypoint, c: Waypoint): boolean {
  const ab = direction(a, b);
  if (!ab) return false;
  const acx = c.gx - a.gx;
  const acy = c.gy - a.gy;
  return acx * ab[1] - acy * ab[0] === 0;
}

/**
 * parametric position t such that p = a + t * (b - a). assumes p is on
 * the line through a and b.
 */
export function paramOnSegment(p: Waypoint, a: Waypoint, b: Waypoint): number {
  const dx = b.gx - a.gx;
  const dy = b.gy - a.gy;
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx === 0) return 0;
    return (p.gx - a.gx) / dx;
  }
  return (p.gy - a.gy) / dy;
}

/**
 * snap candidate so segment from->candidate is one of the 8 octolinear
 * directions. picks the result closest to the original candidate.
 */
export function octolinearSnap(
  from: Waypoint,
  candidate: Waypoint,
): Waypoint {
  const dx = candidate.gx - from.gx;
  const dy = candidate.gy - from.gy;
  if (dx === 0 || dy === 0) return candidate;
  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (adx === ady) return candidate;
  const sx = Math.sign(dx), sy = Math.sign(dy);
  const min = Math.min(adx, ady), max = Math.max(adx, ady);
  const candidates: Waypoint[] = [
    { gx: from.gx + dx, gy: from.gy, plane: candidate.plane },
    { gx: from.gx, gy: from.gy + dy, plane: candidate.plane },
    { gx: from.gx + sx * min, gy: from.gy + sy * min, plane: candidate.plane },
    { gx: from.gx + sx * max, gy: from.gy + sy * max, plane: candidate.plane },
  ];
  let best = candidates[0];
  let bestD = Infinity;
  for (const c of candidates) {
    const d = (c.gx - candidate.gx) ** 2 + (c.gy - candidate.gy) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}
