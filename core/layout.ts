import type {
  MapData, Station, CorridorMap, LabelPlacement, Line, Waypoint,
} from './types';
import { project, ProjectionConfig, DEFAULT_PROJECTION } from './projection';
import { waypointOffset } from './corridors';

const LABEL_FONT_SIZE = 10.5;
const LABEL_CHAR_WIDTH = 5.6;

const BASE_CANDIDATES: Array<[number, number, 'start' | 'middle' | 'end']> = [
  [12, -8, 'start'], [-12, -8, 'end'],
  [12, 16, 'start'], [-12, 16, 'end'],
  [0, -14, 'middle'], [0, 20, 'middle'],
  [16, 4, 'start'], [-16, 4, 'end'],
];

function candidates(): Array<[number, number, 'start' | 'middle' | 'end']> {
  const out: Array<[number, number, 'start' | 'middle' | 'end']> = [];
  for (const scale of [1.0, 1.5, 2.1]) {
    for (const [dx, dy, anchor] of BASE_CANDIDATES) {
      out.push([dx * scale, dy * scale, anchor]);
    }
  }
  return out;
}

const CANDIDATE_OFFSETS = candidates();

function labelBox(
  text: string,
  sx: number,
  sy: number,
  dx: number,
  dy: number,
  anchor: 'start' | 'middle' | 'end',
): [number, number, number, number] {
  const w = text.length * LABEL_CHAR_WIDTH + 4;
  const h = LABEL_FONT_SIZE + 4;
  const cx = sx + dx;
  const cy = sy + dy;
  let bx: number;
  if (anchor === 'start') bx = cx - 2;
  else if (anchor === 'end') bx = cx - w + 2;
  else bx = cx - w / 2;
  return [bx, cy - h * 0.78, w, h];
}

function boxesOverlap(
  a: readonly [number, number, number, number],
  b: readonly [number, number, number, number],
  pad = 1,
): boolean {
  return !(
    a[0] + a[2] + pad < b[0] ||
    b[0] + b[2] + pad < a[0] ||
    a[1] + a[3] + pad < b[1] ||
    b[1] + b[3] + pad < a[1]
  );
}

function segmentBoxIntersect(
  p1: readonly [number, number],
  p2: readonly [number, number],
  box: readonly [number, number, number, number],
): boolean {
  // liang barsky parametric clip
  const [bx, by, bw, bh] = box;
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
  const p = [-dx, dx, -dy, dy];
  const q = [p1[0] - bx, bx + bw - p1[0], p1[1] - by, by + bh - p1[1]];
  let u1 = 0, u2 = 1;
  for (let i = 0; i < 4; i++) {
    if (Math.abs(p[i]) < 1e-12) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) u1 = Math.max(u1, t);
      else u2 = Math.min(u2, t);
    }
  }
  return u1 <= u2;
}

function circleBoxIntersect(
  cx: number, cy: number, r: number,
  box: readonly [number, number, number, number],
): boolean {
  const [bx, by, bw, bh] = box;
  const closestX = Math.max(bx, Math.min(cx, bx + bw));
  const closestY = Math.max(by, Math.min(cy, by + bh));
  const ddx = cx - closestX, ddy = cy - closestY;
  return ddx * ddx + ddy * ddy <= r * r;
}

/**
 * places every station's name at the lowest-penalty candidate offset,
 * then runs a greedy descent that swaps pairs to reduce total penalty.
 * not real annealing (no temperature) but close enough for transit map
 * densities.
 */
export function placeLabels(
  data: MapData,
  corridors: CorridorMap,
  cfg: ProjectionConfig = DEFAULT_PROJECTION,
): Map<string, LabelPlacement> {
  const lineSegments: Array<readonly [readonly [number, number], readonly [number, number]]> = [];
  for (const ln of data.lines) {
    const path: Array<readonly [number, number]> = ln.waypoints.map((wp, i) => {
      const o = waypointOffset(ln, i, corridors);
      const p = project(wp.gx + o.x, wp.gy + o.y, wp.plane, cfg);
      return [p.x, p.y] as const;
    });
    for (let i = 0; i < path.length - 1; i++) {
      lineSegments.push([path[i], path[i + 1]]);
    }
  }
  for (const lf of data.lifts) {
    const a = project(lf.a.gx, lf.a.gy, lf.a.plane, cfg);
    const b = project(lf.b.gx, lf.b.gy, lf.b.plane, cfg);
    lineSegments.push([[a.x, a.y], [b.x, b.y]]);
  }

  const stationCircles: Array<[number, number, number, string]> = [];
  for (const st of data.stations) {
    const p = project(st.gx, st.gy, st.plane, cfg);
    const r =
      st.kind === 'interchange' ? 10.5 :
      st.kind === 'terminal' ? 8 :
      6.5;
    stationCircles.push([p.x, p.y, r, st.id]);
  }

  const placed: Map<string, [number, number, number, number]> = new Map();
  const result: Map<string, LabelPlacement> = new Map();

  const priority = (kind: Station['kind']) =>
    kind === 'interchange' ? 0 :
    kind === 'terminal' ? 1 :
    kind === 'regular' ? 2 : 3;

  const sorted = [...data.stations].sort(
    (a, b) => priority(a.kind) - priority(b.kind));

  for (const st of sorted) {
    const sp = project(st.gx, st.gy, st.plane, cfg);
    let bestPenalty = Infinity;
    let best: { x: number; y: number; anchor: 'start'|'middle'|'end'; box: [number,number,number,number] } | null = null;
    for (const [dx, dy, anchor] of CANDIDATE_OFFSETS) {
      const box = labelBox(st.name, sp.x, sp.y, dx, dy, anchor);
      let penalty = 0;
      for (const other of placed.values()) {
        if (boxesOverlap(box, other, 1)) penalty += 100;
      }
      for (const [cx, cy, cr, ownerId] of stationCircles) {
        if (ownerId === st.id) continue;
        if (circleBoxIntersect(cx, cy, cr + 2, box)) penalty += 50;
      }
      for (const [a, b] of lineSegments) {
        if (segmentBoxIntersect(a, b, box)) penalty += 30;
      }
      if (penalty < bestPenalty) {
        bestPenalty = penalty;
        best = { x: sp.x + dx, y: sp.y + dy, anchor, box };
        if (penalty === 0) break;
      }
    }
    if (best) {
      placed.set(st.id, best.box);
      result.set(st.id, {
        x: best.x, y: best.y, anchor: best.anchor, bbox: best.box, leader: null,
      });
    }
  }
  return result;
}
