import type { LyricLine } from '../types';

let counter = 0;

export function uid(): string {
  counter += 1;
  return `line-${counter}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Seconds before the next timed line that an inserted blank line receives. */
const BLANK_LINE_OFFSET = 0.01;

/**
 * Builds the LCS length table for two lists. `table[prevIndex][nextIndex]` holds
 * the length of the longest common subsequence of `prev.slice(prevIndex)` and
 * `next.slice(nextIndex)`.
 */
function buildLcsTable(prev: string[], next: string[]): number[][] {
  const rowCount = prev.length + 1;
  const colCount = next.length + 1;
  const table = Array.from({ length: rowCount }, () => new Array<number>(colCount).fill(0));

  for (let prevIndex = prev.length - 1; prevIndex >= 0; prevIndex -= 1) {
    for (let nextIndex = next.length - 1; nextIndex >= 0; nextIndex -= 1) {
      if (prev[prevIndex] === next[nextIndex]) {
        table[prevIndex][nextIndex] = table[prevIndex + 1][nextIndex + 1] + 1;
      } else {
        const skipPrev = table[prevIndex + 1][nextIndex];
        const skipNext = table[prevIndex][nextIndex + 1];
        table[prevIndex][nextIndex] = Math.max(skipPrev, skipNext);
      }
    }
  }

  return table;
}

/**
 * Walks an LCS table to recover the matching `[prevIndex, nextIndex]` pairs.
 * `offset` is added to each index so the results refer to the original lists.
 */
function alignMiddle(
  prev: string[],
  next: string[],
  table: number[][],
  offset: number,
): Array<[number, number]> {
  const matches: Array<[number, number]> = [];
  let prevIndex = 0;
  let nextIndex = 0;

  while (prevIndex < prev.length && nextIndex < next.length) {
    if (prev[prevIndex] === next[nextIndex]) {
      matches.push([offset + prevIndex, offset + nextIndex]);
      prevIndex += 1;
      nextIndex += 1;
      continue;
    }

    // Prefer skipping a previous line on ties so earlier lines keep their
    // timestamps when a line is inserted right after them.
    const skipPrev = table[prevIndex + 1][nextIndex];
    const skipNext = table[prevIndex][nextIndex + 1];
    if (skipPrev >= skipNext) {
      prevIndex += 1;
    } else {
      nextIndex += 1;
    }
  }

  return matches;
}

/**
 * Aligns two lists of line texts, returning matched index pairs `[previous, next]`.
 * Uses a common prefix/suffix trim plus an LCS on the changed middle.
 */
function alignLines(prev: string[], next: string[]): Array<[number, number]> {
  const matches: Array<[number, number]> = [];

  // Keep the shared prefix.
  let start = 0;
  while (start < prev.length && start < next.length && prev[start] === next[start]) {
    matches.push([start, start]);
    start += 1;
  }

  // Keep the shared suffix (collected in reverse, appended after the middle).
  let prevEnd = prev.length;
  let nextEnd = next.length;
  const tail: Array<[number, number]> = [];
  while (prevEnd > start && nextEnd > start && prev[prevEnd - 1] === next[nextEnd - 1]) {
    prevEnd -= 1;
    nextEnd -= 1;
    tail.unshift([prevEnd, nextEnd]);
  }

  const midPrev = prev.slice(start, prevEnd);
  const midNext = next.slice(start, nextEnd);
  const lcsTable = buildLcsTable(midPrev, midNext);
  matches.push(...alignMiddle(midPrev, midNext, lcsTable, start));

  return matches.concat(tail);
}

function findPreviousTime(lines: LyricLine[], index: number): number | null {
  for (let scanIndex = index - 1; scanIndex >= 0; scanIndex -= 1) {
    if (lines[scanIndex].time !== null) {
      return lines[scanIndex].time;
    }
  }
  return null;
}

function findNextTime(lines: LyricLine[], index: number): number | null {
  for (let scanIndex = index + 1; scanIndex < lines.length; scanIndex += 1) {
    if (lines[scanIndex].time !== null) {
      return lines[scanIndex].time;
    }
  }
  return null;
}

/**
 * Gives each newly inserted blank line a time just before the next timed line,
 * leaving it untimed when there is no room between the surrounding lines.
 */
function assignBlankLineTimes(
  rows: Array<{ line: LyricLine; inserted: boolean }>,
  result: LyricLine[],
) {
  rows.forEach((row, index) => {
    if (!row.inserted || row.line.time !== null || row.line.text.trim() !== '') {
      return;
    }

    const previousTime = findPreviousTime(result, index);
    const nextTime = findNextTime(result, index);
    if (nextTime === null) {
      return;
    }

    const candidate = nextTime - BLANK_LINE_OFFSET;
    if (candidate >= 0 && (previousTime === null || candidate > previousTime)) {
      row.line.time = candidate;
    }
  });
}

/**
 * Rebuilds the line list from the plain-text editor. Lines are matched by content so that
 * inserting or deleting a line does not shift the timestamps of the surrounding lines.
 * A newly inserted blank line inherits the next timed line's time minus 10 ms.
 */
export function textToLines(text: string, previous: LyricLine[] = []): LyricLine[] {
  const texts = text.split('\n');
  const anchors = alignLines(
    previous.map((line) => line.text),
    texts,
  );

  const rows: Array<{ line: LyricLine; inserted: boolean }> = [];
  let prevCursor = 0;
  let nextCursor = 0;

  const flushGap = (prevEnd: number, nextEnd: number) => {
    const paired = Math.min(prevEnd - prevCursor, nextEnd - nextCursor);
    for (let offset = 0; offset < paired; offset += 1) {
      const prevLine = previous[prevCursor + offset];
      rows.push({
        line: { id: prevLine.id, text: texts[nextCursor + offset], time: prevLine.time },
        inserted: false,
      });
    }
    for (let offset = paired; offset < nextEnd - nextCursor; offset += 1) {
      rows.push({
        line: { id: uid(), text: texts[nextCursor + offset], time: null },
        inserted: true,
      });
    }
    prevCursor = prevEnd;
    nextCursor = nextEnd;
  };

  for (const [prevIndex, nextIndex] of anchors) {
    flushGap(prevIndex, nextIndex);
    const prevLine = previous[prevIndex];
    rows.push({
      line: { id: prevLine.id, text: texts[nextIndex], time: prevLine.time },
      inserted: false,
    });
    prevCursor = prevIndex + 1;
    nextCursor = nextIndex + 1;
  }
  flushGap(previous.length, texts.length);

  const result = rows.map((row) => row.line);
  assignBlankLineTimes(rows, result);

  return result;
}

export function linesToText(lines: LyricLine[]): string {
  return lines.map((line) => line.text).join('\n');
}

export function hasLyrics(lines: ReadonlyArray<{ text: string }>): boolean {
  return lines.some((line) => line.text.trim() !== '');
}
