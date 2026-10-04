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

/**
 * Applies `update` to the timestamps of the selected timed lines, returning the
 * new array and whether anything changed. Untimed and unselected lines pass
 * through unchanged.
 */
function mapSelectedTimes(
  lines: LyricLine[],
  indices: number[],
  update: (time: number) => number | null,
): { result: LyricLine[]; changed: boolean } {
  const selected = new Set(indices);
  let changed = false;
  const result = lines.map((line, index) => {
    if (!selected.has(index) || line.time === null) {
      return line;
    }
    changed = true;
    return { ...line, time: update(line.time) };
  });
  return { result, changed };
}

/**
 * Shifts the timestamps of the selected lines by `delta` seconds. Untimed lines
 * are skipped. Shifting later pushes following lines forward, and shifting
 * earlier pulls preceding lines back, so the minimum gap is preserved.
 */
export function shiftLineTimes(lines: LyricLine[], indices: number[], delta: number): LyricLine[] {
  if (delta === 0 || indices.length === 0) {
    return lines;
  }

  const { result, changed } = mapSelectedTimes(lines, indices, (time) => Math.max(0, time + delta));
  if (!changed) {
    return lines;
  }

  // Cascade in the shift direction first so gaps stay monotonic.
  if (delta > 0) {
    pushLaterLinesForward(result, 0);
    pullEarlierLinesBack(result, result.length - 1);
  } else {
    pullEarlierLinesBack(result, result.length - 1);
    pushLaterLinesForward(result, 0);
  }

  return result;
}

/** Removes the timestamps of the selected lines, leaving other lines untouched. */
export function clearLineTimes(lines: LyricLine[], indices: number[]): LyricLine[] {
  const { result, changed } = mapSelectedTimes(lines, indices, () => null);
  return changed ? result : lines;
}
