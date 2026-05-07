import type { Station, CorridorMap, Vec2 } from './types';
import { project, ProjectionConfig, DEFAULT_PROJECTION } from './projection';
import { TRACK_SPACING } from './corridors';

/**
 * stadium marker geometry for an interchange whose dominant corridor is
 * shared by 2+ lines. returns null when a plain circle marker is more
 * appropriate (single-line corridors or non-interchange stations).
 *
 * the stadium long axis runs perpendicular to the corridor so the n
 * parallel tracks of that corridor each get a black dot inside the pill.
 */
export interface StadiumGeom {
  cx: number;
  cy: number;
  /** stadium long-axis length in screen px. */
  length: number;
  /** rotation in degrees, screen space. */
  angle: number;
  /** number of tracks (== lines in dominant corridor). */
  nTracks: number;
  /** unit perpendicular vector in screen px. */
  perp: Vec2;
  /** screen distance between adjacent track dots. */
  trackSpacing: number;
}

export function stadiumForStation(
  station: Station,
  corridors: CorridorMap,
  cfg: ProjectionConfig = DEFAULT_PROJECTION,
  spacing: number = TRACK_SPACING,
  rimRadius: number = 8.5,
): StadiumGeom | null {
  if (station.kind !== 'interchange') return null;
  let best: { lines: number; cor: ReturnType<CorridorMap['get']> } | null = null;
  for (const cor of corridors.values()) {
    if (cor.plane !== station.plane) continue;
    const onP1 = cor.p1[0] === station.gx && cor.p1[1] === station.gy;
    const onP2 = cor.p2[0] === station.gx && cor.p2[1] === station.gy;
    if (!onP1 && !onP2) continue;
    if (!best || cor.lineIds.length > best.lines) {
      best = { lines: cor.lineIds.length, cor };
    }
  }
  if (!best || best.lines < 2) return null;
  const cor = best.cor!;
  const s1 = project(cor.p1[0], cor.p1[1], cor.plane, cfg);
  const s2 = project(cor.p2[0], cor.p2[1], cor.plane, cfg);
  const sdx = s2.x - s1.x;
  const sdy = s2.y - s1.y;
  const L = Math.hypot(sdx, sdy);
  if (L < 1e-6) return null;
  const ux = sdx / L, uy = sdy / L;
  const perp: Vec2 = { x: -uy, y: ux };
  const trackSpacing = spacing * cfg.grid;
  const center = project(station.gx, station.gy, station.plane, cfg);
  const length = (best.lines - 1) * trackSpacing + 2 * rimRadius;
  const angle = (Math.atan2(perp.y, perp.x) * 180) / Math.PI;
  return {
    cx: center.x,
    cy: center.y,
    length,
    angle,
    nTracks: best.lines,
    perp,
    trackSpacing,
  };
}
