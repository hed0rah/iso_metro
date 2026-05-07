import type { Waypoint, ScreenPoint } from './types';

// isometric basis (screen y points down):
//   i hat = ( cos30,  sin30)    east in plane
//   j hat = (-cos30,  sin30)    north in plane (toward upper left)
//   k hat = (     0,    -1)    rise between planes

export const COS30 = Math.cos(Math.PI / 6);
export const SIN30 = Math.sin(Math.PI / 6);

export interface ProjectionConfig {
  /** screen pixels per grid unit inside a plane. */
  grid: number;
  /** screen pixels of vertical offset between adjacent planes. */
  planeGap: number;
}

export const DEFAULT_PROJECTION: ProjectionConfig = {
  grid: 46,
  planeGap: 210,
};

export function project(
  gx: number,
  gy: number,
  plane: number,
  cfg: ProjectionConfig = DEFAULT_PROJECTION,
): ScreenPoint {
  const wx = gx * cfg.grid;
  const wy = gy * cfg.grid;
  return {
    x: (wx - wy) * COS30,
    y: (wx + wy) * SIN30 - plane * cfg.planeGap,
  };
}

export function projectWaypoint(
  wp: Waypoint,
  cfg: ProjectionConfig = DEFAULT_PROJECTION,
): ScreenPoint {
  return project(wp.gx, wp.gy, wp.plane, cfg);
}
