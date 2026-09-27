import { describe, expect, it } from 'vitest';
import { isPlayableMedia } from './media';

function file(name: string, type = ''): File {
  return new File([new Uint8Array(1)], name, { type });
}

describe('isPlayableMedia', () => {
  it('accepts audio and video MIME types', () => {
    expect(isPlayableMedia(file('song.mp3', 'audio/mpeg'))).toBe(true);
    expect(isPlayableMedia(file('clip.mp4', 'video/mp4'))).toBe(true);
  });

  it('accepts known extensions even without a MIME type', () => {
    expect(isPlayableMedia(file('song.mp3'))).toBe(true);
    expect(isPlayableMedia(file('song.wav'))).toBe(true);
    expect(isPlayableMedia(file('clip.webm'))).toBe(true);
  });

  it('rejects non-media files', () => {
    expect(isPlayableMedia(file('notes.txt', 'text/plain'))).toBe(false);
    expect(isPlayableMedia(file('image.png', 'image/png'))).toBe(false);
    expect(isPlayableMedia(file('lyrics.lrc'))).toBe(false);
  });
});
