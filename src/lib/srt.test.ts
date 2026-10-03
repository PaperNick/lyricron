import { describe, expect, it } from 'vitest';
import type { LyricLine } from '../types';
import { parseSrt, serializeSrt } from './srt';

function line(id: string, text: string, time: number | null): LyricLine {
  return { id, text, time };
}

describe('parseSrt', () => {
  it('parses cues, keeps the start time and adds a trailing blank at the last end', () => {
    const srt =
      '1\n00:00:05,000 --> 00:00:10,000\nLine one\n\n2\n00:00:10,500 --> 00:00:12,000\nLine two';
    const lines = parseSrt(srt);
    expect(lines.map((entry) => entry.text)).toEqual(['Line one', 'Line two', '']);
    expect(lines.map((entry) => entry.time)).toEqual([5, 10.5, 12]);
  });

  it('appends a blank line at the last cue end', () => {
    const lines = parseSrt('1\n00:00:05,000 --> 00:00:07,500\nLine');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toMatchObject({ text: '', time: 7.5 });
  });

  it('flattens wrapped cue text into one line', () => {
    const srt = '1\n00:00:05,000 --> 00:00:08,000\nHello\nworld';
    expect(parseSrt(srt)[0].text).toBe('Hello world');
  });

  it('sorts cues by time', () => {
    const srt =
      '1\n00:00:10,000 --> 00:00:12,000\nlater\n\n2\n00:00:05,000 --> 00:00:06,000\nearlier';
    expect(parseSrt(srt).map((entry) => entry.text)).toEqual(['earlier', 'later']);
  });

  it('returns an empty list for plain text', () => {
    expect(parseSrt('just lyrics\nno timestamps')).toEqual([]);
  });
});

describe('serializeSrt', () => {
  it('numbers cues and uses the next line as the end time', () => {
    const result = serializeSrt([line('a', 'Second', 10), line('b', 'First', 5)]);
    expect(result).toBe(
      '1\n00:00:05,000 --> 00:00:10,000\nFirst\n\n2\n00:00:10,000 --> 00:00:12,000\nSecond',
    );
  });

  it('skips untimed lines', () => {
    expect(serializeSrt([line('a', 'Untimed', null)])).toBe('');
  });

  it('gives the last line a fallback duration', () => {
    expect(serializeSrt([line('a', 'Only', 8)])).toBe('1\n00:00:08,000 --> 00:00:10,000\nOnly');
  });

  it('uses blank lines as cue boundaries without emitting empty cues', () => {
    const result = serializeSrt([line('a', 'First', 5), line('b', '', 8), line('c', 'Second', 12)]);
    expect(result).toBe(
      '1\n00:00:05,000 --> 00:00:08,000\nFirst\n\n2\n00:00:12,000 --> 00:00:14,000\nSecond',
    );
  });

  it('formats hours and milliseconds', () => {
    expect(serializeSrt([line('a', 'Late', 3661.5)])).toBe(
      '1\n01:01:01,500 --> 01:01:03,500\nLate',
    );
  });
});
