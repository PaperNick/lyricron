import { describe, expect, it } from 'vitest';
import { formatClock, formatLrcTime, parseTimeInput } from './time';

describe('formatLrcTime', () => {
  it('formats seconds as mm:ss.xx', () => {
    expect(formatLrcTime(0)).toBe('00:00.00');
    expect(formatLrcTime(5)).toBe('00:05.00');
    expect(formatLrcTime(65)).toBe('01:05.00');
    expect(formatLrcTime(65.5)).toBe('01:05.50');
    expect(formatLrcTime(3599)).toBe('59:59.00');
  });

  it('clamps negative values to zero', () => {
    expect(formatLrcTime(-5)).toBe('00:00.00');
  });

  it('carries rounding overflow', () => {
    expect(formatLrcTime(59.999)).toBe('01:00.00');
  });
});

describe('formatClock', () => {
  it('formats as m:ss', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(3599)).toBe('59:59');
  });

  it('handles non-finite and negative input', () => {
    expect(formatClock(-1)).toBe('0:00');
    expect(formatClock(Number.NaN)).toBe('0:00');
    expect(formatClock(Number.POSITIVE_INFINITY)).toBe('0:00');
  });
});

describe('parseTimeInput', () => {
  it('parses mm:ss.xx', () => {
    expect(parseTimeInput('00:05.00')).toBe(5);
    expect(parseTimeInput('00:00.50')).toBe(0.5);
  });

  it('parses hh:mm:ss', () => {
    expect(parseTimeInput('01:05:00')).toBe(3900);
  });

  it('parses fractional precision', () => {
    expect(parseTimeInput('00:05.5')).toBeCloseTo(5.5);
    expect(parseTimeInput('00:05.55')).toBeCloseTo(5.55);
    expect(parseTimeInput('00:05.555')).toBeCloseTo(5.555);
  });

  it('accepts a comma decimal separator', () => {
    expect(parseTimeInput('00:05,50')).toBeCloseTo(5.5);
  });

  it('rejects invalid input', () => {
    expect(parseTimeInput('')).toBeNull();
    expect(parseTimeInput('garbage')).toBeNull();
    expect(parseTimeInput('00:60.00')).toBeNull();
    expect(parseTimeInput('5')).toBeNull();
  });
});
