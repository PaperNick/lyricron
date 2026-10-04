import { useCallback, useMemo, useState } from 'react';
import type { LyricLine } from '../../types';
import { useLatest } from '../../hooks/useLatest';

export type LineFilter = 'all' | 'timed' | 'untimed';

export interface LineSelection {
  selectedIds: ReadonlySet<string>;
  selectedIndices: number[];
  /** Selected indices whose line has a timestamp. */
  timedIndices: number[];
  count: number;
  timedCount: number;
  isSelecting: boolean;
  toggle: (index: number) => void;
  extendTo: (index: number) => void;
  selectRange: (start: number, end: number) => void;
  extendBy: (direction: 1 | -1, baseIndex: number) => void;
  selectAll: (filter?: LineFilter) => void;
  clear: () => void;
}

interface SelectionState {
  ids: Set<string>;
  /** Line the range extension grows from. */
  anchorId: string | null;
  /** Line the keyboard extension is currently moving. */
  focusId: string | null;
}

/** A fresh state per hook instance, so selections never share a mutable set. */
function createEmptySelection(): SelectionState {
  return { ids: new Set(), anchorId: null, focusId: null };
}

function keepExisting(ids: Set<string>, lines: LyricLine[]): Set<string> {
  const existing = new Set(lines.map((line) => line.id));
  const next = new Set<string>();
  for (const id of ids) {
    if (existing.has(id)) {
      next.add(id);
    }
  }
  return next;
}

function indexOfId(lines: LyricLine[], id: string | null): number {
  return id === null ? -1 : lines.findIndex((line) => line.id === id);
}

function rangeIds(lines: LyricLine[], from: number, to: number): Set<string> {
  const ids = new Set<string>();
  const start = Math.max(0, Math.min(from, to));
  const end = Math.min(lines.length - 1, Math.max(from, to));
  for (let index = start; index <= end; index += 1) {
    ids.add(lines[index].id);
  }
  return ids;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Initial range for a keyboard extension that starts at `baseIndex`. */
function selectionFromBase(
  lines: LyricLine[],
  baseIndex: number,
  direction: 1 | -1,
): SelectionState {
  const lastIndex = lines.length - 1;
  const inBounds = baseIndex >= 0 && baseIndex < lines.length;
  const anchor = inBounds ? baseIndex : direction === 1 ? 0 : lastIndex;
  const focus = inBounds ? clamp(anchor + direction, 0, lastIndex) : anchor;
  return {
    ids: rangeIds(lines, anchor, focus),
    anchorId: lines[anchor].id,
    focusId: lines[focus].id,
  };
}

/**
 * Tracks which lyric lines are selected for bulk actions. Selection is stored
 * by line id so it survives text edits that keep a line's identity, and stale
 * ids are ignored when the underlying lines change.
 */
export function useLineSelection(lines: LyricLine[]): LineSelection {
  const [state, setState] = useState<SelectionState>(createEmptySelection);
  const linesRef = useLatest(lines);

  const selectedIds = useMemo(() => keepExisting(state.ids, lines), [state.ids, lines]);
  const selectedIndices = useMemo(() => {
    const indices: number[] = [];
    lines.forEach((line, index) => {
      if (selectedIds.has(line.id)) {
        indices.push(index);
      }
    });
    return indices;
  }, [lines, selectedIds]);
  const timedIndices = useMemo(
    () => selectedIndices.filter((index) => lines[index].time !== null),
    [lines, selectedIndices],
  );
  const count = selectedIndices.length;
  const timedCount = timedIndices.length;

  /** Adds or removes a single line, and makes it the new range anchor. */
  const toggle = useCallback(
    (index: number) => {
      setState((prev) => {
        const current = linesRef.current;
        const line = current[index];
        if (!line) {
          return prev;
        }
        const ids = keepExisting(prev.ids, current);
        if (ids.has(line.id)) {
          ids.delete(line.id);
        } else {
          ids.add(line.id);
        }
        return { ids, anchorId: line.id, focusId: line.id };
      });
    },
    [linesRef],
  );

  /** Replaces the selection with the range between the anchor and this line. */
  const extendTo = useCallback(
    (index: number) => {
      setState((prev) => {
        const current = linesRef.current;
        const line = current[index];
        if (!line) {
          return prev;
        }
        const anchorIndex = indexOfId(current, prev.anchorId);
        if (anchorIndex === -1) {
          return { ids: new Set([line.id]), anchorId: line.id, focusId: line.id };
        }
        return {
          ids: rangeIds(current, anchorIndex, index),
          anchorId: prev.anchorId,
          focusId: line.id,
        };
      });
    },
    [linesRef],
  );

  /** Replaces the selection with a contiguous range (drag sweeping). */
  const selectRange = useCallback(
    (start: number, end: number) => {
      setState((prev) => {
        const current = linesRef.current;
        if (!current[start] || !current[end]) {
          return prev;
        }
        return {
          ids: rangeIds(current, start, end),
          anchorId: current[start].id,
          focusId: current[end].id,
        };
      });
    },
    [linesRef],
  );

  /**
   * Extends the selection one line up or down. With no selection yet, the
   * range starts at `baseIndex` (normally the highlighted playback line).
   */
  const extendBy = useCallback(
    (direction: 1 | -1, baseIndex: number) => {
      setState((prev) => {
        const current = linesRef.current;
        if (current.length === 0) {
          return prev;
        }

        const anchorIndex = indexOfId(current, prev.anchorId);
        const hasSelection = anchorIndex !== -1 && keepExisting(prev.ids, current).size > 0;
        if (!hasSelection) {
          return selectionFromBase(current, baseIndex, direction);
        }

        const focusIndex = indexOfId(current, prev.focusId);
        const from = focusIndex === -1 ? anchorIndex : focusIndex;
        const focus = clamp(from + direction, 0, current.length - 1);
        if (focus === from) {
          return prev;
        }
        return {
          ids: rangeIds(current, anchorIndex, focus),
          anchorId: prev.anchorId,
          focusId: current[focus].id,
        };
      });
    },
    [linesRef],
  );

  /** Selects every line, or only timed/untimed ones. */
  const selectAll = useCallback(
    (filter: LineFilter = 'all') => {
      setState(() => {
        const current = linesRef.current;
        const matches = (line: LyricLine) =>
          filter === 'all' || (filter === 'timed') === (line.time !== null);
        const selected = current.filter(matches);
        if (selected.length === 0) {
          return createEmptySelection();
        }
        return {
          ids: new Set(selected.map((line) => line.id)),
          anchorId: selected[0].id,
          focusId: selected[selected.length - 1].id,
        };
      });
    },
    [linesRef],
  );

  const clear = useCallback(() => {
    setState((prev) =>
      prev.ids.size === 0 && prev.anchorId === null ? prev : createEmptySelection(),
    );
  }, []);

  return useMemo(
    () => ({
      selectedIds,
      selectedIndices,
      timedIndices,
      count,
      timedCount,
      isSelecting: count > 0,
      toggle,
      extendTo,
      selectRange,
      extendBy,
      selectAll,
      clear,
    }),
    [
      selectedIds,
      selectedIndices,
      timedIndices,
      count,
      timedCount,
      toggle,
      extendTo,
      selectRange,
      extendBy,
      selectAll,
      clear,
    ],
  );
}
