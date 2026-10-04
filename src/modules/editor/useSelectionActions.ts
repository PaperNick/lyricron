import { useCallback } from 'react';
import type { LinePulseDirection } from '../../types';
import type { AnnotationStore } from './useAnnotationStore';
import type { LineSelection } from './useLineSelection';

interface SelectionActionsOptions {
  selection: LineSelection;
  store: AnnotationStore;
  activeIndex: number;
  currentTime: number;
  hasStarted: boolean;
  seek: (time: number) => void;
  triggerPulse: (indices: number[], direction: LinePulseDirection) => void;
  notify: (message: string) => void;
}

export interface SelectionActions {
  shift: (delta: number) => void;
  alignToPlayhead: () => void;
  clearTimes: () => void;
  extend: (direction: 1 | -1) => void;
}

/**
 * Bulk actions applied to the current selection. Extracted from the app shell
 * so playback, annotation, and selection concerns stay separate.
 */
export function useSelectionActions({
  selection,
  store,
  activeIndex,
  currentTime,
  hasStarted,
  seek,
  triggerPulse,
  notify,
}: SelectionActionsOptions): SelectionActions {
  const shift = useCallback(
    (delta: number) => {
      const timed = selection.timedIndices;
      if (timed.length === 0) {
        return;
      }
      // Remember the active line's pre-shift time to keep the playhead on it.
      const activeTime = timed.includes(activeIndex)
        ? (store.lines[activeIndex].time as number)
        : null;

      store.shiftLines(timed, delta);
      triggerPulse(timed, delta < 0 ? 'earlier' : 'later');

      if (activeTime === null) {
        return;
      }
      const next = Math.max(0, activeTime + delta);
      if (activeTime <= currentTime && next > currentTime) {
        seek(next);
      }
    },
    [selection, store, activeIndex, currentTime, seek, triggerPulse],
  );

  /** Moves the whole selection so its first timed line starts at the playhead. */
  const alignToPlayhead = useCallback(() => {
    if (!hasStarted) {
      return;
    }
    const timed = selection.timedIndices;
    if (timed.length === 0) {
      return;
    }
    const firstTime = store.lines[timed[0]].time as number;
    // Clamp so the first line never moves before zero.
    const delta = Math.max(currentTime - firstTime, -firstTime);
    if (delta === 0) {
      return;
    }
    store.shiftLines(timed, delta);
    triggerPulse(timed, 'now');
  }, [hasStarted, selection, store, currentTime, triggerPulse]);

  const clearTimes = useCallback(() => {
    const timed = selection.timedIndices;
    if (timed.length === 0) {
      return;
    }
    store.clearTimes(timed);
    notify(`Cleared ${timed.length} timestamp${timed.length === 1 ? '' : 's'}`);
    selection.clear();
  }, [selection, store, notify]);

  const extend = useCallback(
    (direction: 1 | -1) => selection.extendBy(direction, activeIndex),
    [selection, activeIndex],
  );

  return { shift, alignToPlayhead, clearTimes, extend };
}
