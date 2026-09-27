import { describe, expect, it } from 'vitest';
import { shortcutLabel } from './shortcuts';

describe('shortcutLabel', () => {
  it('formats space, letter and digit codes', () => {
    expect(shortcutLabel('Space')).toBe('Space');
    expect(shortcutLabel('KeyA')).toBe('A');
    expect(shortcutLabel('Digit5')).toBe('5');
  });

  it('formats symbols', () => {
    expect(shortcutLabel('ArrowLeft')).toBe('←');
    expect(shortcutLabel('BracketLeft')).toBe('[');
    expect(shortcutLabel('Slash')).toBe('/');
    expect(shortcutLabel('Comma')).toBe(',');
  });

  it('falls back to the raw code', () => {
    expect(shortcutLabel('F1')).toBe('F1');
  });
});
