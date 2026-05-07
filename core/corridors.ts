import type {
  Line, Waypoint, GridPoint, EdgeKey, Corridor, CorridorMap, Vec2,
} from './types';

export const TRACK_SPACING = 0.20;

function canonicalEndpoints(a: Waypoint, b: Waypoint): [GridPoint, GridPoint] {
  // sort lexicographically so opposite-direction traversals match.
  if (a.gx < b.gx || (a.gx === b.gx && a.gy <= b.gy)) {
    return [[a.gx, a.gy], [b.gx, b.gy]];
  }
  return [[b.gx, b.gy], [a.gx, a.gy]];
}

export function edgeKey(a: Waypoint, b: Waypoint): EdgeKey {
  const [p1, p2] = canonicalEndpoints(a, b);
  return `${a.plane}|${p1[0]},${p1[1]}|${p2[0]},${p2[1]}`;
}

/**
 * walks every line and groups segments into corridors. two lines that
 * share an edge (in either direction) end up in the same corridor's
 * lineIds list, in deterministic insertion order.
 */
export function buildCorridors(lines: ReadonlyArray<Line>): CorridorMap {
  const m: CorridorMap = new Map();
  for (const ln of lines) {
    for (let i = 0; i < ln.waypoints.length - 1; i++) {
      const a = ln.waypoints[i];
      const b = ln.waypoints[i + 1];
      if (a.plane !== b.plane) continue;
      const key = edgeKey(a, b);
      let cor = m.get(key);
      if (!cor) {
        const [p1, p2] = canonicalEndpoints(a, b);
        cor = { plane: a.plane, p1, p2, lineIds: [] };
        m.set(key, cor);
      }
      if (!cor.lineIds.includes(ln.id)) cor.lineIds.push(ln.id);
    }
  }
  return m;
}

/**
 * perpendicular offset for one line on one edge, in plane-local grid units.
 */
export function edgeOffset(
  a: Waypoint,
  b: Waypoint,
  lineId: string,
  corridors: CorridorMap,
  spacing: number = TRACK_SPACING,
): Vec2 {
  if (a.plane !== b.plane) return { x: 0, y: 0 };
  const cor = corridors.get(edgeKey(a, b));
  if (!cor || !cor.lineIds.includes(lineId)) return { x: 0, y: 0 };
  const slot = cor.lineIds.indexOf(lineId);
  const n = cor.lineIds.length;
  const amount = (slot - (n - 1) / 2) * spacing;
  const cdx = cor.p2[0] - cor.p1[0];
  const cdy = cor.p2[1] - cor.p1[1];
  const L = Math.hypot(cdx, cdy);
  if (L < 1e-6) return { x: 0, y: 0 };
  // ccw perpendicular
  return { x: (-cdy / L) * amount, y: (cdx / L) * amount };
}

/**
 * average perpendicular offset at waypoint i, from the up to two incident
 * edges on the same plane. produces a smooth offset transition between
 * differently-shared corridors.
 */
export function waypointOffset(
  line: Line,
  i: number,
  corridors: CorridorMap,
  spacing: number = TRACK_SPACING,
): Vec2 {
  const wps = line.waypoints;
  const offs: Vec2[] = [];
  if (i > 0 && wps[i - 1].plane === wps[i].plane) {
    offs.push(edgeOffset(wps[i - 1], wps[i], line.id, corridors, spacing));
  }
  if (i < wps.length - 1 && wps[i + 1].plane === wps[i].plane) {
    offs.push(edgeOffset(wps[i], wps[i + 1], line.id, corridors, spacing));
  }
  if (!offs.length) return { x: 0, y: 0 };
  const sx = offs.reduce((s, o) => s + o.x, 0);
  const sy = offs.reduce((s, o) => s + o.y, 0);
  return { x: sx / offs.length, y: sy / offs.length };
}
