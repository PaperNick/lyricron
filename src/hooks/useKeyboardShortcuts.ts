import { useEffect } from 'react';
import { SHORTCUTS } from '../config/shortcuts';
import { useLatest } from './useLatest';

const SHIFT_STEP = 0.05;
const SEEK_STEP = 5;
const FINE_SEEK_STEP = 1;

export interface ShortcutHandlers {
  toggle: () => void;
  annotate: () => void;
  undo: () => void;
  redo: () => void;
  shiftLast: (delta: number) => void;
  deleteLast: () => void;
  jumpTimedLine: (direction: 1 | -1) => void;
  seek: (time: number) => void;
  currentTime: number;
  showHelp: () => void;
  /** Index of the highlighted line, or -1 when none is active. */
  activeIndex: number;
  shiftLine: (index: number, delta: number) => void;
  deleteLine: (index: number) => void;
  setTimeToNow: (index: number) => void;
  /** True while lines are selected for bulk actions. */
  isSelecting: boolean;
  extendSelection: (direction: 1 | -1) => void;
  dismissSelection: () => void;
  shiftSelection: (delta: number) => void;
  clearSelectionTimes: () => void;
}

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
};

/** Binds the global keyboard shortcuts, ignoring keystrokes in form fields. */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const latest = useLatest(handlers);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const activeHandlers = latest.current;
      const code = event.code;
      const ctrl = event.ctrlKey || event.metaKey;

      if (ctrl && code === 'KeyZ') {
        event.preventDefault();
        if (event.shiftKey) {
          activeHandlers.redo();
        } else {
          activeHandlers.undo();
        }
        return;
      }
      if (ctrl && code === 'KeyY') {
        event.preventDefault();
        activeHandlers.redo();
        return;
      }

      if (event.shiftKey && (code === SHORTCUTS.selectUp || code === SHORTCUTS.selectDown)) {
        event.preventDefault();
        const direction = code === SHORTCUTS.selectUp ? -1 : 1;
        activeHandlers.extendSelection(direction);
        return;
      }
      if (code === SHORTCUTS.deselect && activeHandlers.isSelecting) {
        event.preventDefault();
        activeHandlers.dismissSelection();
        return;
      }

      if (code === SHORTCUTS.playPause) {
        event.preventDefault();
        activeHandlers.toggle();
        return;
      }
      if (code === SHORTCUTS.annotate) {
        event.preventDefault();
        if (ctrl) {
          const index = activeHandlers.activeIndex;
          if (index !== -1) {
            activeHandlers.setTimeToNow(index);
          }
        } else {
          activeHandlers.annotate();
        }
        return;
      }
      if (code === SHORTCUTS.undo) {
        event.preventDefault();
        activeHandlers.undo();
        return;
      }

      // Ctrl/⌘ scopes a shortcut to the highlighted line; otherwise it acts on
      // the selection when one is active, or on the last timed line.
      const runByContext = (
        onActive: (index: number) => void,
        onSelection: () => void,
        onFallback: () => void,
      ) => {
        const index = activeHandlers.activeIndex;
        if (ctrl) {
          if (index !== -1) {
            onActive(index);
          }
        } else if (activeHandlers.isSelecting) {
          onSelection();
        } else {
          onFallback();
        }
      };

      if (code === SHORTCUTS.shiftEarlier) {
        runByContext(
          (index) => activeHandlers.shiftLine(index, -SHIFT_STEP),
          () => activeHandlers.shiftSelection(-SHIFT_STEP),
          () => activeHandlers.shiftLast(-SHIFT_STEP),
        );
        return;
      }
      if (code === SHORTCUTS.shiftLater) {
        runByContext(
          (index) => activeHandlers.shiftLine(index, SHIFT_STEP),
          () => activeHandlers.shiftSelection(SHIFT_STEP),
          () => activeHandlers.shiftLast(SHIFT_STEP),
        );
        return;
      }
      if (code === SHORTCUTS.delete) {
        event.preventDefault();
        runByContext(
          activeHandlers.deleteLine,
          activeHandlers.clearSelectionTimes,
          activeHandlers.deleteLast,
        );
        return;
      }
      if (code === SHORTCUTS.seekBack) {
        event.preventDefault();
        if (ctrl) {
          activeHandlers.jumpTimedLine(-1);
        } else {
          const step = event.shiftKey ? FINE_SEEK_STEP : SEEK_STEP;
          activeHandlers.seek(activeHandlers.currentTime - step);
        }
        return;
      }
      if (code === SHORTCUTS.seekForward) {
        event.preventDefault();
        if (ctrl) {
          activeHandlers.jumpTimedLine(1);
        } else {
          const step = event.shiftKey ? FINE_SEEK_STEP : SEEK_STEP;
          activeHandlers.seek(activeHandlers.currentTime + step);
        }
        return;
      }
      if (code === SHORTCUTS.help && event.shiftKey) {
        event.preventDefault();
        activeHandlers.showHelp();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [latest]);
}
