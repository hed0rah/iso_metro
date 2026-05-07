import type { Line, Waypoint } from './types';
import { isCollinear, paramOnSegment } from './octolinear';

/**
 * insert breakpoints in line waypoints wherever another line joins, leaves,
 * or crosses an octolinear segment. mutates LINES in place. iterates to a
 * fixed point so chained subdivisions converge.
 *
 * lets the user author sparse waypoints (e.g. terminus to terminus) and have
 * shared corridors detected automatically.
 */
export function autoSubdivide(lines: Line[]): void {
  let changed = true;
  while (changed) {
    changed = false;
    // snapshot every segment so we don't iterate while mutating
    const snapshot: Array<{ id: string; a: Waypoint; b: Waypoint }> = [];
    for (const ln of lines) {
      for (let i = 0; i < ln.waypoints.length - 1; i++) {
        snapshot.push({
          id: ln.id,
          a: ln.waypoints[i],
          b: ln.waypoints[i + 1],
        });
      }
    }
    for (const ln of lines) {
      const newWps: Waypoint[] = [];
      for (let i = 0; i < ln.waypoints.length - 1; i++) {
        const a = ln.waypoints[i];
        const b = ln.waypoints[i + 1];
        newWps.push(a);
        if (a.plane !== b.plane) continue;
        const breakpoints: Waypoint[] = [];
        for (const seg of snapshot) {
          if (seg.id === ln.id) continue;
          if (seg.a.plane !== a.plane) continue;
          for (const op of [seg.a, seg.b]) {
            if (samePoint(op, a) || samePoint(op, b)) continue;
            if (!isCollinear(a, b, op)) continue;
            const t = paramOnSegment(op, a, b);
            if (t > 0 && t < 1) {
              const bp: Waypoint = { gx: op.gx, gy: op.gy, plane: a.plane };
              if (!breakpoints.some(x => samePoint(x, bp)))
                breakpoints.push(bp);
            }
          }
        }
        if (breakpoints.length) {
          breakpoints.sort((p, q) =>
            paramOnSegment(p, a, b) - paramOnSegment(q, a, b));
          newWps.push(...breakpoints);
          changed = true;
        }
      }
      newWps.push(ln.waypoints[ln.waypoints.length - 1]);
      ln.waypoints = newWps;
    }
  }
}

function samePoint(p: Waypoint, q: Waypoint): boolean {
  return p.gx === q.gx && p.gy === q.gy && p.plane === q.plane;
}
