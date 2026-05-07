import { writable, derived, type Writable } from 'svelte/store';
import type { MapData, Waypoint } from '$core/index';
import { buildCorridors } from '$core/index';

/**
 * canonical map data. all mutations go through commands; never mutate
 * directly. use update() for atomic swap.
 */
export const mapData: Writable<MapData> = writable({
  planes: [
    { name: 'Surface',   z: 0 },
    { name: 'Mid Level', z: 210 },
    { name: 'Sky Lines', z: 420 },
  ],
  lines: [],
  stations: [],
  lifts: [],
});

export const corridors = derived(mapData, ($m) => buildCorridors($m.lines));

export type EditorMode = 'draw' | 'bend' | 'move' | 'delete' | 'lift' | 'station';

export const mode: Writable<EditorMode> = writable('draw');
export const activePlane: Writable<number> = writable(0);
export const activeLineId: Writable<string | null> = writable(null);
export const liftPending: Writable<{ lineId: string; wpIndex: number } | null> =
  writable(null);
export const hoverCell: Writable<Waypoint | null> = writable(null);
export const selection: Writable<{ kind: 'waypoint'; lineId: string; wpIndex: number } | { kind: 'station'; stationId: string } | null> = writable(null);

/** undo/redo stack of commands. see commands/base.ts. */
export const history = writable({ undo: [] as Array<{ undo: () => void; redo: () => void }>, redo: [] as Array<{ undo: () => void; redo: () => void }> });
