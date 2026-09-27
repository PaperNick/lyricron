import type { LyricLine } from '../types';
import { fractionToSeconds, formatLrcTime } from './time';
import { uid } from './plain';

const LRC_TIMESTAMP = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
const LRC_METADATA = /^\[(ti|ar|al|by|offset|re|ve|length):.*\]$/i;

interface TimestampedLine {
  times: number[];
  content: string;
}

/**
 * Extracts every timestamp from a line and the text that follows them, or null
 * when the line has no timestamp at all.
 */
function parseTimestampedLine(line: string): TimestampedLine | null {
  const times: number[] = [];
  let contentStart = 0;
  let match: RegExpExecArray | null;
  LRC_TIMESTAMP.lastIndex = 0;

  while ((match = LRC_TIMESTAMP.exec(line)) !== null) {
    times.push(Number(match[1]) * 60 + Number(match[2]) + fractionToSeconds(match[3]));
    contentStart = LRC_TIMESTAMP.lastIndex;
  }

  if (times.length === 0) {
    return null;
  }

  return { times, content: line.slice(contentStart).trim() };
}

export function parseLrc(text: string): LyricLine[] {
  const lines: LyricLine[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || LRC_METADATA.test(line)) {
      continue;
    }

    const parsed = parseTimestampedLine(line);
    if (!parsed) {
      continue;
    }

    for (const time of parsed.times) {
      lines.push({ id: uid(), text: parsed.content, time });
    }
  }

  return lines.sort((left, right) => (left.time ?? 0) - (right.time ?? 0));
}

/**
 * Returns true when the text looks like a timed LRC: most of its non-empty,
 * non-metadata lines carry a timestamp.
 */
export function isLrcText(text: string): boolean {
  let stamped = 0;
  let total = 0;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || LRC_METADATA.test(line)) {
      continue;
    }
    total += 1;
    LRC_TIMESTAMP.lastIndex = 0;
    if (LRC_TIMESTAMP.test(line)) {
      stamped += 1;
    }
  }

  return total > 0 && stamped / total >= 0.5;
}

/**
 * Converts timed LRC text to plain lyrics by stripping timestamps and metadata
 * tags, keeping untimed lines and blank lines intact.
 */
export function lrcToPlainText(text: string): string {
  return text
    .split(/\r?\n/)
    .map((rawLine) => {
      const line = rawLine.trim();
      if (LRC_METADATA.test(line)) {
        return null;
      }
      return rawLine.replace(LRC_TIMESTAMP, '').trim();
    })
    .filter((line): line is string => line !== null)
    .join('\n');
}

export function serializeLrc(lines: LyricLine[]): string {
  return lines
    .filter((line) => line.time !== null)
    .sort((left, right) => (left.time as number) - (right.time as number))
    .map((line) => {
      const text = line.text.trim();
      const stamp = formatLrcTime(line.time as number);
      return text === '' ? `[${stamp}]` : `[${stamp}] ${text}`;
    })
    .join('\n');
}
