// data model types. shared between core algorithms, editor state, and IO.
// world coords are (gx, gy, plane). gx, gy are integer or fractional grid
// units inside a plane. plane is an integer index 0..N from bottom to top.

export type GridPoint = readonly [number, number];

export interface Waypoint {
  gx: number;
  gy: number;
  plane: number;
}

export type StationKind = 'terminal' | 'interchange' | 'regular' | 'bend';

export interface Station {
  id: string;
  gx: number;
  gy: number;
  plane: number;
  name: string;
  kind: StationKind;
  /** optional manual label position offset, in screen pixels. */
  labelDx?: number;
  labelDy?: number;
  labelAnchor?: 'start' | 'middle' | 'end';
}

export interface Line {
  id: string;
  name: string;
  /** css color string. e.g. "#d62828" or "rgb(...)". */
  color: string;
  waypoints: Waypoint[];
}

export interface Lift {
  /** waypoint or station coords on plane A. */
  a: Waypoint;
  /** waypoint or station coords on plane B. */
  b: Waypoint;
}

export interface Plane {
  name: string;
  /** vertical screen offset in pixels for this plane after projection. */
  z: number;
}

export interface MapData {
  planes: Plane[];
  lines: Line[];
  stations: Station[];
  lifts: Lift[];
}

/**
 * canonical undirected edge key. two segments traversing the same corridor
 * in opposite directions produce the same key. format:
 *   `${plane}|${minGx},${minGy}|${maxGx},${maxGy}`
 */
export type EdgeKey = string;

export interface Corridor {
  plane: number;
  p1: GridPoint;
  p2: GridPoint;
  /** ids of all lines that traverse this edge, in deterministic insertion order. */
  lineIds: string[];
}

export type CorridorMap = Map<EdgeKey, Corridor>;

export interface Vec2 {
  x: number;
  y: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

/** screen space label placement result. */
export interface LabelPlacement {
  x: number;
  y: number;
  anchor: 'start' | 'middle' | 'end';
  /** [x, y, w, h] of bounding box in screen px. */
  bbox: [number, number, number, number];
  /** optional leader from station rim to label edge. */
  leader: [number, number, number, number] | null;
}
