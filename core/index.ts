// public api re-exports. import from $core in editor code.
export type {
  Waypoint, Station, StationKind, Line, Lift, Plane, MapData,
  Corridor, CorridorMap, EdgeKey, Vec2, ScreenPoint, GridPoint,
  LabelPlacement,
} from './types';

export {
  COS30, SIN30, DEFAULT_PROJECTION, project, projectWaypoint,
} from './projection';
export type { ProjectionConfig } from './projection';

export {
  OCTOLINEAR_DIRECTIONS, direction, isCollinear, paramOnSegment, octolinearSnap,
} from './octolinear';

export {
  TRACK_SPACING, edgeKey, buildCorridors, edgeOffset, waypointOffset,
} from './corridors';

export { autoSubdivide } from './autosubdivide';

export { stadiumForStation } from './stadium';
export type { StadiumGeom } from './stadium';

export { placeLabels } from './layout';

export { exportSvg } from './export-svg';
export type { ExportOptions } from './export-svg';
