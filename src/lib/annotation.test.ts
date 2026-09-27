import { describe, expect, it } from 'vitest';
import type { LyricLine } from '../types';
import { MIN_GAP_SECONDS, clearLineTime, setLineTime, shiftAllTimes } from './annotation';

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
