import { describe, expect, it } from 'vitest';
import type { LyricLine } from '../types';
import { hasLyrics, linesToText, textToLines } from './plain';

let counter = 0;

function line(text: string, time: number | null = null): LyricLine {
  counter += 1;
  return { id: `l${counter}`, text, time };
}

describe('linesToText', () => {
  it('joins line texts with newlines', () => {
    expect(linesToText([line('A'), line('B')])).toBe('A\nB');
  });
});

describe('hasLyrics', () => {
  it('detects non-blank text', () => {
    expect(hasLyrics([line('A')])).toBe(true);
    expect(hasLyrics([line('')])).toBe(false);
    expect(hasLyrics([line('   ')])).toBe(false);
  });
});

describe('textToLines', () => {
  it('creates untimed lines from scratch', () => {
    const result = textToLines('Line one\nLine two');
    expect(result.map((entry) => entry.text)).toEqual(['Line one', 'Line two']);
    expect(result.map((entry) => entry.time)).toEqual([null, null]);
  });

  it('preserves timestamps for unchanged text', () => {
    const result = textToLines('A\nB', [line('A', 5), line('B', 10)]);
    expect(result.map((entry) => entry.text)).toEqual(['A', 'B']);
    expect(result.map((entry) => entry.time)).toEqual([5, 10]);
  });

  it('keeps timestamps when editing text in place', () => {
    const result = textToLines('A edited\nB', [line('A', 5), line('B', 10)]);
    expect(result.map((entry) => entry.text)).toEqual(['A edited', 'B']);
    expect(result.map((entry) => entry.time)).toEqual([5, 10]);
  });

  it('inserts a blank line that inherits the next time minus 10 ms', () => {
    const result = textToLines('A\n\nB', [line('A', 5), line('B', 10)]);
    expect(result.map((entry) => entry.text)).toEqual(['A', '', 'B']);
    expect(result[0].time).toBe(5);
    expect(result[1].time).toBeCloseTo(9.99);
    expect(result[2].time).toBe(10);
  });

  it('drops a deleted middle line without shifting the rest', () => {
    const result = textToLines('A\nC', [line('A', 5), line('B', 10), line('C', 15)]);
    expect(result.map((entry) => entry.text)).toEqual(['A', 'C']);
    expect(result.map((entry) => entry.time)).toEqual([5, 15]);
  });

  it('matches lines in the middle via the LCS alignment', () => {
    const result = textToLines('A\nX\nB\nY\nC', [line('A', 5), line('B', 10), line('C', 15)]);
    expect(result.map((entry) => entry.text)).toEqual(['A', 'X', 'B', 'Y', 'C']);
    expect(result.map((entry) => entry.time)).toEqual([5, null, 10, null, 15]);
  });
});
