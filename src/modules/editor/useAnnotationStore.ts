import { useCallback, useReducer } from 'react';
import type { LyricLine } from '../../types';
import { textToLines } from '../../lib/plain';
import {
  clearLineTime,
  clearLineTimes,
  setLineTime,
  shiftAllTimes,
  shiftLineTimes,
} from '../../lib/annotation';

interface State {
  past: LyricLine[][];
  present: LyricLine[];
  future: LyricLine[][];
  coalesce: boolean;
}

type Action =
  | { type: 'setLines'; lines: LyricLine[]; coalesce?: boolean }
  | { type: 'setLineTime'; index: number; time: number }
  | { type: 'clearLineTime'; index: number }
  | { type: 'shiftLines'; indices: number[]; delta: number }
  | { type: 'clearTimes'; indices: number[] }
  | { type: 'shiftAll'; delta: number }
  | { type: 'undo' }
  | { type: 'redo' };

const MAX_HISTORY = 200;

function commit(state: State, lines: LyricLine[], coalesce: boolean): State {
  if (lines === state.present) {
    return state;
  }
  if (coalesce && state.coalesce) {
    return { ...state, present: lines, future: [] };
  }
  return {
    past: [...state.past, state.present].slice(-MAX_HISTORY),
    present: lines,
    future: [],
    coalesce,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setLines':
      return commit(state, action.lines, action.coalesce ?? false);
    case 'setLineTime':
      return commit(state, setLineTime(state.present, action.index, action.time), false);
    case 'clearLineTime':
      return commit(state, clearLineTime(state.present, action.index), false);
    case 'shiftLines':
      return commit(state, shiftLineTimes(state.present, action.indices, action.delta), false);
    case 'clearTimes':
      return commit(state, clearLineTimes(state.present, action.indices), false);
    case 'shiftAll':
      return commit(state, shiftAllTimes(state.present, action.delta), false);
    case 'undo': {
      if (state.past.length === 0) {
        return state;
      }
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        coalesce: false,
      };
    }
    case 'redo': {
      if (state.future.length === 0) {
        return state;
      }
      const next = state.future[0];
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
        coalesce: false,
      };
    }
  }
}

export interface AnnotationStore {
  lines: LyricLine[];
  canUndo: boolean;
  canRedo: boolean;
  setText: (text: string) => void;
  replaceLines: (lines: LyricLine[]) => void;
  setTime: (index: number, time: number) => void;
  clearTime: (index: number) => void;
  shiftLines: (indices: number[], delta: number) => void;
  clearTimes: (indices: number[]) => void;
  shiftAll: (delta: number) => void;
  undo: () => void;
  redo: () => void;
}

export function useAnnotationStore(initialLines: LyricLine[]): AnnotationStore {
  const [state, dispatch] = useReducer(reducer, {
    past: [],
    present: initialLines,
    future: [],
    coalesce: false,
  });

  const setText = useCallback(
    (text: string) => {
      dispatch({ type: 'setLines', lines: textToLines(text, state.present), coalesce: true });
    },
    [state.present],
  );

  const replaceLines = useCallback((lines: LyricLine[]) => {
    dispatch({ type: 'setLines', lines, coalesce: false });
  }, []);

  const setTime = useCallback((index: number, time: number) => {
    dispatch({ type: 'setLineTime', index, time });
  }, []);

  const clearTime = useCallback((index: number) => {
    dispatch({ type: 'clearLineTime', index });
  }, []);

  const shiftLines = useCallback((indices: number[], delta: number) => {
    dispatch({ type: 'shiftLines', indices, delta });
  }, []);

  const clearTimes = useCallback((indices: number[]) => {
    dispatch({ type: 'clearTimes', indices });
  }, []);

  const shiftAll = useCallback((delta: number) => {
    dispatch({ type: 'shiftAll', delta });
  }, []);

  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  return {
    lines: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    setText,
    replaceLines,
    setTime,
    clearTime,
    shiftLines,
    clearTimes,
    shiftAll,
    undo,
    redo,
  };
}
