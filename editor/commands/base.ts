import { get } from 'svelte/store';
import { history } from '../stores';

/**
 * mutating action with reversible semantics. all editor mutations should
 * be wrapped in a Command so undo/redo, autosave, and replay debugging
 * fall out for free.
 *
 * convention: do() runs the forward action and returns the command for
 * pushing onto the history. redo() repeats it. undo() reverses it.
 */
export interface Command {
  /** human label, e.g. "add waypoint to VCO". */
  label: string;
  do(): void;
  undo(): void;
  redo(): void;
}

export function exec(cmd: Command): void {
  cmd.do();
  history.update(h => ({
    undo: [...h.undo, cmd].slice(-100),
    redo: [],
  }));
}

export function undo(): void {
  const h = get(history);
  if (h.undo.length === 0) return;
  const cmd = h.undo[h.undo.length - 1];
  cmd.undo();
  history.set({
    undo: h.undo.slice(0, -1),
    redo: [...h.redo, cmd],
  });
}

export function redo(): void {
  const h = get(history);
  if (h.redo.length === 0) return;
  const cmd = h.redo[h.redo.length - 1];
  cmd.redo();
  history.set({
    undo: [...h.undo, cmd],
    redo: h.redo.slice(0, -1),
  });
}
