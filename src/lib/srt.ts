import type { LyricLine } from '../types';
import { fractionToSeconds } from './time';
import { uid } from './plain';

const FALLBACK_SECONDS = 2;
const SRT_TIMECODE =
  /^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})(?:\s+.*)?$/;

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

function timecodeToSeconds(
  hours: string,
  minutes: string,
  seconds: string,
  fraction: string,
): number {
  return (
    Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds) + fractionToSeconds(fraction)
  );
}

function formatSrtTime(seconds: number): string {
  const totalMs = Math.round(Math.max(0, seconds) * 1000);
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms, 3)}`;
}

/** Parses SubRip cues into timed lines, keeping each cue's start time and flattening wrapped text. */
export function parseSrt(text: string): LyricLine[] {
  const cues: LyricLine[] = [];
  let current: { time: number; text: string[] } | null = null;
  let lastEnd = 0;

  const flush = () => {
    if (current) {
      cues.push({ id: uid(), text: current.text.join(' ').trim(), time: current.time });
      current = null;
    }
  };

  for (const rawLine of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trim();
    const match = SRT_TIMECODE.exec(line);
    if (match) {
      flush();
      lastEnd = timecodeToSeconds(match[5], match[6], match[7], match[8]);
      current = { time: timecodeToSeconds(match[1], match[2], match[3], match[4]), text: [] };
      continue;
    }
    if (!current) {
      continue;
    }
    if (line === '') {
      flush();
      continue;
    }
    current.text.push(line);
  }
  flush();

  const sorted = cues.sort((left, right) => (left.time as number) - (right.time as number));
  const lastStart = sorted[sorted.length - 1]?.time ?? -Infinity;
  if (sorted.length > 0 && lastEnd > lastStart) {
    sorted.push({ id: uid(), text: '', time: lastEnd });
  }
  return sorted;
}

/** Serializes timed lines to SubRip cues. Blank lines mark cue ends but produce no cue. */
export function serializeSrt(lines: LyricLine[]): string {
  const timed = lines
    .filter((line) => line.time !== null)
    .sort((left, right) => (left.time as number) - (right.time as number));

  return timed
    .filter((line) => line.text.trim() !== '')
    .map((line, index) => {
      const start = line.time as number;
      const next = timed.find((candidate) => (candidate.time as number) > start)?.time;
      const end = next != null && next > start ? next : start + FALLBACK_SECONDS;
      return `${index + 1}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${line.text.trim()}`;
    })
    .join('\n\n');
}
