import { describe, expect, it } from 'vitest';
import type { LyricLine } from '../types';
import {
  MIN_GAP_SECONDS,
  clearLineTime,
  clearLineTimes,
  setLineTime,
  shiftAllTimes,
  shiftLineTimes,
} from './annotation';

function line(text: string, time: number | null = null): LyricLine {
  return { id: text, text, time };
}

describe('setLineTime', () => {
  it('sets a timestamp', () => {
    const result = setLineTime([line('A'), line('B')], 0, 5);
    expect(result[0].time).toBe(5);
    expect(result[1].time).toBeNull();
  });

  it('clamps negative times to zero', () => {
    const result = setLineTime([line('A')], 0, -5);
    expect(result[0].time).toBe(0);
  });

  it('pulls the previous line back to preserve the minimum gap', () => {
    const result = setLineTime([line('A', 5), line('B', 12)], 1, 0.5);
    expect(result[0].time).toBeCloseTo(0.49);
    expect(result[1].time).toBeCloseTo(0.5);
  });

  it('leaves an earlier previous line alone', () => {
    const result = setLineTime([line('A', 5), line('B')], 1, 10);
    expect(result[0].time).toBe(5);
    expect(result[1].time).toBe(10);
  });
});

describe('shiftAllTimes', () => {
  it('shifts every timed line and leaves untimed lines', () => {
    const result = shiftAllTimes([line('A', 5), line('B', 10), line('C')], 0.05);
    expect(result[0].time).toBeCloseTo(5.05);
    expect(result[1].time).toBeCloseTo(10.05);
    expect(result[2].time).toBeNull();
  });

  it('clamps at zero', () => {
    const result = shiftAllTimes([line('A', 0.02)], -5);
    expect(result[0].time).toBe(0);
  });

  it('keeps the sequence monotonic', () => {
    const result = shiftAllTimes([line('A', 0), line('B', 0)], 0);
    expect(result[0].time).toBe(0);
    expect(result[1].time).toBeCloseTo(MIN_GAP_SECONDS);
  });
});

describe('clearLineTime', () => {
  it('removes a single timestamp', () => {
    const result = clearLineTime([line('A', 5), line('B', 10)], 0);
    expect(result[0].time).toBeNull();
    expect(result[1].time).toBe(10);
  });
});

describe('shiftLineTimes', () => {
  it('shifts only the selected timed lines', () => {
    const result = shiftLineTimes([line('A', 5), line('B', 10), line('C', 15)], [1], 0.05);
    expect(result[0].time).toBe(5);
    expect(result[1].time).toBeCloseTo(10.05);
    expect(result[2].time).toBe(15);
  });

  it('skips untimed lines in the selection', () => {
    const result = shiftLineTimes([line('A', 5), line('B'), line('C', 15)], [0, 1, 2], 1);
    expect(result[0].time).toBe(6);
    expect(result[1].time).toBeNull();
    expect(result[2].time).toBe(16);
  });

  it('pushes following lines forward when shifting later', () => {
    const result = shiftLineTimes([line('A', 5), line('B', 10), line('C', 10.02)], [1], 0.05);
    expect(result[1].time).toBeCloseTo(10.05);
    expect(result[2].time).toBeCloseTo(10.06);
  });

  it('pulls preceding lines back when shifting earlier', () => {
    const result = shiftLineTimes([line('A', 5), line('B', 7), line('C', 10)], [1], -4);
    expect(result[0].time).toBeCloseTo(2.99);
    expect(result[1].time).toBeCloseTo(3);
    expect(result[2].time).toBe(10);
  });

  it('clamps shifted lines at zero and re-spaces them', () => {
    const result = shiftLineTimes([line('A', 0.02), line('B', 0.03)], [0, 1], -5);
    expect(result[0].time).toBe(0);
    expect(result[1].time).toBeCloseTo(MIN_GAP_SECONDS);
  });

  it('returns the same array when nothing changes', () => {
    const lines = [line('A', 5)];
    expect(shiftLineTimes(lines, [0], 0)).toBe(lines);
    expect(shiftLineTimes(lines, [], 0.05)).toBe(lines);
    expect(shiftLineTimes(lines, [1], 0.05)).toBe(lines);
  });
});

describe('clearLineTimes', () => {
  it('removes the selected timestamps only', () => {
    const result = clearLineTimes([line('A', 5), line('B', 10), line('C', 15)], [0, 2]);
    expect(result[0].time).toBeNull();
    expect(result[1].time).toBe(10);
    expect(result[2].time).toBeNull();
  });

  it('returns the same array when no selected line is timed', () => {
    const lines = [line('A', 5), line('B')];
    expect(clearLineTimes(lines, [1])).toBe(lines);
  });
});
