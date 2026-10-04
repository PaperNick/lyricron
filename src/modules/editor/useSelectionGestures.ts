import { useCallback, useEffect, useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import type { LineSelection } from './useLineSelection';

const LONG_PRESS_MS = 450;
const LONG_PRESS_SLOP_PX = 10;

interface SelectionGesturesOptions {
  selection: LineSelection;
  isMobile: boolean;
  onHoverLine: (index: number | null) => void;
}

export interface SelectionGestures {
  rowMouseEnter: (index: number) => void;
  rowMouseDown: (event: MouseEvent<HTMLDivElement>, index: number) => void;
  rowClickCapture: (event: MouseEvent<HTMLDivElement>, index: number) => void;
  rowContextMenu: (event: MouseEvent<HTMLDivElement>) => void;
  pointerDown: (event: PointerEvent<HTMLDivElement>, index: number) => void;
  pointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  pointerCancel: () => void;
  railMouseDown: (event: MouseEvent<HTMLDivElement>, index: number) => void;
  railClick: (event: MouseEvent<HTMLDivElement>, index: number) => void;
}

/**
 * Pointer gestures for row selection: drag-sweeping with the mouse and
 * long-press on touch. Kept out of the list component so it only renders.
 */
export function useSelectionGestures({
  selection,
  isMobile,
  onHoverLine,
}: SelectionGesturesOptions): SelectionGestures {
  const dragRef = useRef<{ start: number } | null>(null);
  const sweptRef = useRef(false);
  const longPressTimer = useRef<number | undefined>(undefined);
  const longPressStart = useRef<{ x: number; y: number } | null>(null);
  const longPressFired = useRef(false);

  useEffect(() => {
    const stopDrag = () => {
      dragRef.current = null;
    };
    window.addEventListener('mouseup', stopDrag);
    return () => window.removeEventListener('mouseup', stopDrag);
  }, []);

  const cancelLongPress = useCallback(() => {
    window.clearTimeout(longPressTimer.current);
    longPressTimer.current = undefined;
    longPressStart.current = null;
  }, []);

  useEffect(() => cancelLongPress, [cancelLongPress]);

  /** Hover tracking doubles as the drag-sweep cursor on desktop. */
  const rowMouseEnter = (index: number) => {
    onHoverLine(index);
    const drag = dragRef.current;
    if (drag !== null && index !== drag.start) {
      sweptRef.current = true;
      selection.selectRange(drag.start, index);
    }
  };

  /** Starts a drag from the checkbox rail, before the click that toggles it. */
  const railMouseDown = (event: MouseEvent<HTMLDivElement>, index: number) => {
    if (event.button !== 0) {
      return;
    }
    // Keep the drag from selecting row text.
    event.preventDefault();
    sweptRef.current = false;
    dragRef.current = { start: index };
  };

  const railClick = (event: MouseEvent<HTMLDivElement>, index: number) => {
    if (sweptRef.current) {
      sweptRef.current = false;
      return;
    }
    if (event.shiftKey) {
      selection.extendTo(index);
    } else {
      selection.toggle(index);
    }
  };

  /**
   * Starts a potential range sweep from anywhere on the row, so dragging over
   * lyric lines selects them. A press without movement stays a normal click
   * (line seek, timestamp edit, ...).
   */
  const rowMouseDown = (event: MouseEvent<HTMLDivElement>, index: number) => {
    if (event.button !== 0) {
      return;
    }
    // A fresh press ends the sweep-click suppression from a previous drag.
    sweptRef.current = false;
    if (isMobile) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest('button, input, [data-select-rail]')) {
      return;
    }
    event.preventDefault();
    dragRef.current = { start: index };
  };

  /** On touch, holding a row long enough selects it; moving cancels it. */
  const pointerDown = (event: PointerEvent<HTMLDivElement>, index: number) => {
    // Any new press ends the suppression window of a previous long press.
    longPressFired.current = false;
    if (!isMobile || event.pointerType === 'mouse' || selection.isSelecting) {
      return;
    }
    cancelLongPress();
    longPressStart.current = { x: event.clientX, y: event.clientY };
    longPressTimer.current = window.setTimeout(() => {
      longPressStart.current = null;
      longPressFired.current = true;
      selection.toggle(index);
    }, LONG_PRESS_MS);
  };

  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = longPressStart.current;
    if (start === null) {
      return;
    }
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > LONG_PRESS_SLOP_PX) {
      cancelLongPress();
    }
  };

  /** Suppresses the click a drag or long press leaves behind. */
  const rowClickCapture = (event: MouseEvent<HTMLDivElement>, index: number) => {
    if (sweptRef.current || longPressFired.current) {
      sweptRef.current = false;
      longPressFired.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (isMobile && selection.isSelecting) {
      event.preventDefault();
      event.stopPropagation();
      selection.toggle(index);
    }
  };

  const rowContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    if (longPressFired.current) {
      longPressFired.current = false;
      event.preventDefault();
    }
  };

  return {
    rowMouseEnter,
    rowMouseDown,
    rowClickCapture,
    rowContextMenu,
    pointerDown,
    pointerMove,
    pointerCancel: cancelLongPress,
    railMouseDown,
    railClick,
  };
}
