import { describe, expect, it } from 'vitest';
import { filenameToQuery } from './lrclib';

describe('filenameToQuery', () => {
  it('strips the extension and a dotted track number', () => {
    expect(filenameToQuery('01. Test Artist - Test Song.mp3')).toBe('Test Artist - Test Song');
  });

  it('replaces underscores with spaces', () => {
    expect(filenameToQuery('Artist_Song.mp3')).toBe('Artist Song');
  });

  it('strips a dash-separated track prefix', () => {
    expect(filenameToQuery('01 - Song.mp3')).toBe('Song');
  });

  it('handles a bare filename', () => {
    expect(filenameToQuery('song')).toBe('song');
  });
});
