import type { LyricLine } from '../types';

export const MIN_GAP_SECONDS = 0.01;

function previousTimedIndex(lines: LyricLine[], index: number): number {
  for (let cursor = index - 1; cursor >= 0; cursor--) {
    if (lines[cursor].time !== null) {
      return cursor;
    }
  }
  return -1;
}

function nextTimedIndex(lines: LyricLine[], index: number): number {
  for (let cursor = index + 1; cursor < lines.length; cursor++) {
    if (lines[cursor].time !== null) {
      return cursor;
    }
  }
  return -1;
}

/**
 * Pulls earlier timed lines back so the gap between each pair stays at least
 * `MIN_GAP_SECONDS`, cascading towards the start of the list.
 */
function pullEarlierLinesBack(lines: LyricLine[], fromIndex: number) {
  for (let cursor = fromIndex; cursor >= 0; cursor--) {
    const previousIndex = previousTimedIndex(lines, cursor);
    if (previousIndex === -1) {
      break;
    }

    const currentTime = lines[cursor].time;
    const previousTime = lines[previousIndex].time;
    if (currentTime === null || previousTime === null) {
      continue;
    }
    if (previousTime <= currentTime - MIN_GAP_SECONDS) {
      continue;
    }

    const earliest = Math.max(currentTime - MIN_GAP_SECONDS, 0);
    lines[previousIndex] = { ...lines[previousIndex], time: earliest };
    if (currentTime < earliest + MIN_GAP_SECONDS) {
      lines[cursor] = { ...lines[cursor], time: earliest + MIN_GAP_SECONDS };
    }
  }
}

/** Pushes later timed lines forward to preserve the minimum gap. */
function pushLaterLinesForward(lines: LyricLine[], fromIndex: number) {
  for (let cursor = fromIndex; cursor < lines.length; cursor++) {
    const followingIndex = nextTimedIndex(lines, cursor);
    if (followingIndex === -1) {
      break;
    }

    const currentTime = lines[cursor].time;
    const followingTime = lines[followingIndex].time;
    if (currentTime === null || followingTime === null) {
      continue;
    }
    if (followingTime >= currentTime + MIN_GAP_SECONDS) {
      continue;
    }

    lines[followingIndex] = { ...lines[followingIndex], time: currentTime + MIN_GAP_SECONDS };
  }
}

/**
 * Sets a line's time and keeps timestamps monotonic, pulling earlier lines back
 * and pushing later lines forward so a minimum gap is always preserved.
 */
export function setLineTime(lines: LyricLine[], index: number, time: number): LyricLine[] {
  const result = lines.map((line) => ({ ...line }));
  result[index] = { ...result[index], time: Math.max(0, time) };

  pullEarlierLinesBack(result, index);
  pushLaterLinesForward(result, index);

  return result;
}

/** Shifts every timed line by `delta` seconds, keeping the sequence monotonic. */
export function shiftAllTimes(lines: LyricLine[], delta: number): LyricLine[] {
  const result = lines.map((line) => {
    if (line.time === null) {
      return line;
    }
    return { ...line, time: Math.max(0, line.time + delta) };
  });

  let previousTime = -Infinity;
  for (const line of result) {
    if (line.time === null) {
      continue;
    }
    if (line.time < previousTime + MIN_GAP_SECONDS) {
      line.time = previousTime + MIN_GAP_SECONDS;
    }
    previousTime = line.time;
  }

  return result;
}

export function clearLineTime(lines: LyricLine[], index: number): LyricLine[] {
  const result = lines.map((line) => ({ ...line }));
  result[index] = { ...result[index], time: null };
  return result;
}
