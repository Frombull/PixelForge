import type { Shape } from "./types";
import { cloneShape } from "./geometry";

export interface HistoryState {
  stack: Shape[][];
  index: number;
}

export function createHistory(initial: Shape[] = []): HistoryState {
  return { stack: [initial.map(cloneShape)], index: 0 };
}

export function pushHistory(
  history: HistoryState,
  shapes: Shape[]
): HistoryState {
  const truncated = history.stack.slice(0, history.index + 1);
  return {
    stack: [...truncated, shapes.map(cloneShape)],
    index: history.index + 1,
  };
}

export function undoHistory(history: HistoryState): {
  history: HistoryState;
  shapes: Shape[];
} | null {
  if (history.index <= 0) return null;
  const index = history.index - 1;
  return {
    history: { ...history, index },
    shapes: history.stack[index].map(cloneShape),
  };
}

export function redoHistory(history: HistoryState): {
  history: HistoryState;
  shapes: Shape[];
} | null {
  if (history.index >= history.stack.length - 1) return null;
  const index = history.index + 1;
  return {
    history: { ...history, index },
    shapes: history.stack[index].map(cloneShape),
  };
}
