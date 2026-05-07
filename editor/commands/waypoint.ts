import { get } from 'svelte/store';
import { mapData } from '../stores';
import type { Waypoint } from '$core/index';
import type { Command } from './base';

export function addWaypoint(lineId: string, wp: Waypoint): Command {
  let prevLength = 0;
  return {
    label: `add waypoint to ${lineId}`,
    do() {
      mapData.update(d => {
        const ln = d.lines.find(l => l.id === lineId);
        if (!ln) return d;
        prevLength = ln.waypoints.length;
        ln.waypoints = [...ln.waypoints, wp];
        return { ...d };
      });
    },
    undo() {
      mapData.update(d => {
        const ln = d.lines.find(l => l.id === lineId);
        if (!ln) return d;
        ln.waypoints = ln.waypoints.slice(0, prevLength);
        return { ...d };
      });
    },
    redo() { this.do(); },
  };
}

export function moveWaypoint(
  lineId: string, wpIndex: number, to: Waypoint,
): Command {
  let from: Waypoint | null = null;
  return {
    label: `move waypoint`,
    do() {
      mapData.update(d => {
        const ln = d.lines.find(l => l.id === lineId);
        if (!ln) return d;
        from = ln.waypoints[wpIndex];
        ln.waypoints = ln.waypoints.map((w, i) => i === wpIndex ? to : w);
        return { ...d };
      });
    },
    undo() {
      if (!from) return;
      mapData.update(d => {
        const ln = d.lines.find(l => l.id === lineId);
        if (!ln) return d;
        ln.waypoints = ln.waypoints.map((w, i) => i === wpIndex ? from! : w);
        return { ...d };
      });
    },
    redo() { this.do(); },
  };
}

export function deleteWaypoint(lineId: string, wpIndex: number): Command {
  let removed: Waypoint | null = null;
  return {
    label: `delete waypoint`,
    do() {
      mapData.update(d => {
        const ln = d.lines.find(l => l.id === lineId);
        if (!ln) return d;
        removed = ln.waypoints[wpIndex];
        ln.waypoints = ln.waypoints.filter((_, i) => i !== wpIndex);
        return { ...d };
      });
    },
    undo() {
      if (!removed) return;
      mapData.update(d => {
        const ln = d.lines.find(l => l.id === lineId);
        if (!ln) return d;
        const wps = [...ln.waypoints];
        wps.splice(wpIndex, 0, removed!);
        ln.waypoints = wps;
        return { ...d };
      });
    },
    redo() { this.do(); },
  };
}
