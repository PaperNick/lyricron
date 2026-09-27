import { describe, expect, it } from 'vitest';
import type { LyricLine } from '../types';
import { isLrcText, lrcToPlainText, parseLrc, serializeLrc } from './lrc';

function line(id: string, text: string, time: number | null): LyricLine {
  return { id, text, time };
}

describe('parseLrc', () => {
  it('parses timestamped lines', () => {
    const lines = parseLrc('[00:05.00]Line one\n[00:10.00]Line two');
    expect(lines.map((entry) => entry.text)).toEqual(['Line one', 'Line two']);
    expect(lines.map((entry) => entry.time)).toEqual([5, 10]);
  });

  it('expands multiple timestamps on one line', () => {
    const lines = parseLrc('[00:05.00][00:15.00]Chorus');
    expect(lines).toHaveLength(2);
    expect(lines.map((entry) => entry.text)).toEqual(['Chorus', 'Chorus']);
    expect(lines.map((entry) => entry.time)).toEqual([5, 15]);
  });

  it('skips metadata tags and untimed lines', () => {
    const lines = parseLrc('[ti:Title]\n[ar:Artist]\nnot timed\n[00:05.00]Line');
    expect(lines).toHaveLength(1);
    expect(lines[0].text).toBe('Line');
  });

  it('parses fractional timestamps', () => {
    const lines = parseLrc('[00:05.5]a\n[00:05.55]b\n[00:05.555]c');
    expect(lines[0].time).toBeCloseTo(5.5);
    expect(lines[1].time).toBeCloseTo(5.55);
    expect(lines[2].time).toBeCloseTo(5.555);
  });

  it('sorts lines by time', () => {
    const lines = parseLrc('[00:10.00]later\n[00:05.00]earlier');
    expect(lines.map((entry) => entry.text)).toEqual(['earlier', 'later']);
  });

  it('keeps blank timed lines', () => {
    const lines = parseLrc('[00:05.00]');
    expect(lines).toHaveLength(1);
    expect(lines[0].text).toBe('');
    expect(lines[0].time).toBe(5);
  });
});

describe('serializeLrc', () => {
  it('writes timed lines in order and skips untimed ones', () => {
    const result = serializeLrc([
      line('a', 'Second', 10),
      line('b', 'First', 5),
      line('c', 'Untimed', null),
    ]);
    expect(result).toBe('[00:05.00] First\n[00:10.00] Second');
  });

  it('writes a bare stamp for blank lines', () => {
    expect(serializeLrc([line('a', '', 8)])).toBe('[00:08.00]');
  });
});

describe('isLrcText', () => {
  it('detects fully timed text', () => {
    expect(isLrcText('[00:05.00]Line\n[00:10.00]Line')).toBe(true);
  });

  it('detects mostly-timed text at the threshold', () => {
    expect(isLrcText('Line\n[00:05.00]Line\n[00:10.00]Line\n[00:15.00]Line')).toBe(true);
  });

  it('rejects plain text', () => {
    expect(isLrcText('hello\nworld')).toBe(false);
  });

  it('rejects a single timestamp among many plain lines', () => {
    expect(isLrcText('one\ntwo\n[00:05.00]three\nfour\nfive')).toBe(false);
  });
});

describe('lrcToPlainText', () => {
  it('strips timestamps', () => {
    expect(lrcToPlainText('[00:05.00]Line one\n[00:10.00]Line two')).toBe('Line one\nLine two');
  });

  it('removes metadata lines', () => {
    expect(lrcToPlainText('[ti:Title]\n[00:05.00]Line')).toBe('Line');
  });

  it('strips all timestamps from a multi-timestamp line', () => {
    expect(lrcToPlainText('[00:05.00][00:15.00]Chorus')).toBe('Chorus');
  });
});
