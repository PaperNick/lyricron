import { describe, expect, it } from 'vitest';
import { embeddedLyricsToLines, extractEmbeddedLyrics } from './embeddedLyrics';

const encoder = new TextEncoder();

function concat(...parts: number[][]): number[] {
  return parts.flat();
}

/** Latin-1 / ASCII bytes for the tests' single-byte characters. */
function ascii(text: string): number[] {
  return [...text].map((char) => char.charCodeAt(0) & 0xff);
}

function utf16leWithBom(text: string): number[] {
  const bytes = [0xff, 0xfe];
  for (const char of text) {
    const code = char.charCodeAt(0);
    bytes.push(code & 0xff, (code >> 8) & 0xff);
  }
  return bytes;
}

function utf16be(text: string): number[] {
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.charCodeAt(0);
    bytes.push((code >> 8) & 0xff, code & 0xff);
  }
  return bytes;
}

function encode(text: string, encoding: number): number[] {
  if (encoding === 0) {
    return ascii(text);
  }
  if (encoding === 1) {
    return utf16leWithBom(text);
  }
  if (encoding === 2) {
    return utf16be(text);
  }
  return [...encoder.encode(text)];
}

function terminator(encoding: number): number[] {
  return encoding === 1 || encoding === 2 ? [0, 0] : [0];
}

function uint32be(value: number): number[] {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function synchsafe(size: number): number[] {
  return [(size >>> 21) & 0x7f, (size >>> 14) & 0x7f, (size >>> 7) & 0x7f, size & 0x7f];
}

interface FrameOptions {
  major?: 2 | 3 | 4;
  unsynchronised?: boolean;
}

function frame(id: string, payload: number[], options: FrameOptions = {}): number[] {
  const major = options.major ?? 3;
  if (major === 2) {
    return concat(
      ascii(id),
      [(payload.length >> 16) & 0xff, (payload.length >> 8) & 0xff, payload.length & 0xff],
      payload,
    );
  }
  const size = major === 4 ? synchsafe(payload.length) : uint32be(payload.length);
  const flags = major === 4 && options.unsynchronised ? [0, 0x02] : [0, 0];
  return concat(ascii(id), size, flags, payload);
}

interface PayloadOptions {
  encoding?: number;
  language?: string;
  descriptor?: string;
}

function usltPayload(text: string, options: PayloadOptions = {}): number[] {
  const encoding = options.encoding ?? 3;
  return concat(
    [encoding],
    ascii(options.language ?? 'eng'),
    encode(options.descriptor ?? '', encoding),
    terminator(encoding),
    encode(text, encoding),
  );
}

interface SyltPayloadOptions extends PayloadOptions {
  format?: number;
  contentType?: number;
}

function syltPayload(
  entries: Array<{ text: string; timeMs: number }>,
  options: SyltPayloadOptions = {},
): number[] {
  const encoding = options.encoding ?? 3;
  const parts: number[][] = [
    [encoding],
    ascii(options.language ?? 'eng'),
    [options.format ?? 2, options.contentType ?? 1],
    encode(options.descriptor ?? '', encoding),
    terminator(encoding),
  ];
  for (const entry of entries) {
    parts.push(encode(entry.text, encoding), terminator(encoding), uint32be(entry.timeMs));
  }
  return concat(...parts);
}

function id3Tag(
  frames: number[][],
  options: { major?: 2 | 3 | 4; unsynchronised?: boolean; padding?: number } = {},
): Uint8Array {
  const body = concat(...frames, new Array<number>(options.padding ?? 0).fill(0));
  return new Uint8Array(
    concat(
      [0x49, 0x44, 0x33, options.major ?? 3, 0, options.unsynchronised ? 0x80 : 0],
      synchsafe(body.length),
      body,
    ),
  );
}

/** Applies the ID3 unsynchronisation scheme (stuffs a zero after every `FF`). */
function unsynchronise(bytes: number[]): number[] {
  const result: number[] = [];
  for (const byte of bytes) {
    result.push(byte);
    if (byte === 0xff) {
      result.push(0);
    }
  }
  return result;
}

function blob(bytes: Uint8Array): Blob {
  return new Blob([bytes.slice().buffer]);
}

describe('extractEmbeddedLyrics', () => {
  it('returns null when the file has no ID3 tag', async () => {
    expect(await extractEmbeddedLyrics(blob(new Uint8Array([1, 2, 3, 4, 5])))).toBeNull();
    expect(await extractEmbeddedLyrics(blob(new Uint8Array()))).toBeNull();
  });

  it('returns null when the tag has no lyric frames', async () => {
    const tag = id3Tag([frame('TIT2', [3, ...encoder.encode('Just a title')])]);
    expect(await extractEmbeddedLyrics(blob(tag))).toBeNull();
  });

  it('reads plain USLT lyrics', async () => {
    const tag = id3Tag([frame('USLT', usltPayload('Line one\nLine two'))]);
    expect(await extractEmbeddedLyrics(blob(tag))).toEqual({
      source: 'USLT',
      language: 'eng',
      text: 'Line one\nLine two',
    });
  });

  it('reads USLT lyrics in ISO-8859-1', async () => {
    const tag = id3Tag([frame('USLT', usltPayload('Café résumé', { encoding: 0 }))]);
    expect((await extractEmbeddedLyrics(blob(tag)))?.text).toBe('Café résumé');
  });

  it('reads USLT lyrics in UTF-16 with a BOM', async () => {
    const tag = id3Tag([frame('USLT', usltPayload('日本語の歌詞', { encoding: 1 }))]);
    expect((await extractEmbeddedLyrics(blob(tag)))?.text).toBe('日本語の歌詞');
  });

  it('reads USLT lyrics in UTF-16BE', async () => {
    const tag = id3Tag([frame('USLT', usltPayload('日本語の歌詞', { encoding: 2 }))]);
    expect((await extractEmbeddedLyrics(blob(tag)))?.text).toBe('日本語の歌詞');
  });

  it('skips a non-empty descriptor', async () => {
    const tag = id3Tag([frame('USLT', usltPayload('Lyrics here', { descriptor: 'desc' }))]);
    expect((await extractEmbeddedLyrics(blob(tag)))?.text).toBe('Lyrics here');
  });

  it('reads SYLT entries including blank lines', async () => {
    const entries = [
      { text: 'First line', timeMs: 5000 },
      { text: '', timeMs: 8000 },
      { text: 'Second line', timeMs: 10500 },
    ];
    const tag = id3Tag([frame('SYLT', syltPayload(entries))]);
    const lyrics = await extractEmbeddedLyrics(blob(tag));
    expect(lyrics).toMatchObject({ source: 'SYLT', language: 'eng' });
    expect(lyrics?.entries).toEqual(entries);
  });

  it('prefers SYLT over USLT', async () => {
    const tag = id3Tag([
      frame('USLT', usltPayload('plain lyrics')),
      frame('SYLT', syltPayload([{ text: 'timed', timeMs: 1000 }])),
    ]);
    expect((await extractEmbeddedLyrics(blob(tag)))?.source).toBe('SYLT');
  });

  it('falls back to USLT when the SYLT frame has no entries', async () => {
    const tag = id3Tag([frame('SYLT', syltPayload([])), frame('USLT', usltPayload('fallback'))]);
    expect(await extractEmbeddedLyrics(blob(tag))).toMatchObject({
      source: 'USLT',
      text: 'fallback',
    });
  });

  it('falls back to USLT when the SYLT frame only has blank entries', async () => {
    const tag = id3Tag([
      frame('SYLT', syltPayload([{ text: '   ', timeMs: 1000 }])),
      frame('USLT', usltPayload('fallback text')),
    ]);
    expect(await extractEmbeddedLyrics(blob(tag))).toMatchObject({
      source: 'USLT',
      text: 'fallback text',
    });
  });

  it('handles ID3v2.4 synchsafe frame sizes', async () => {
    const text = 'Long lyric line '.repeat(20).trim();
    const tag = id3Tag([frame('USLT', usltPayload(text), { major: 4 })], { major: 4 });
    expect((await extractEmbeddedLyrics(blob(tag)))?.text).toBe(text);
  });

  it('handles ID3v2.2 frame ids', async () => {
    const tag = id3Tag([frame('ULT', usltPayload('Legacy frame'), { major: 2 })], { major: 2 });
    expect((await extractEmbeddedLyrics(blob(tag)))?.text).toBe('Legacy frame');
  });

  it('handles globally unsynchronised tags', async () => {
    const payload = unsynchronise(usltPayload('Hello', { encoding: 1 }));
    const tag = id3Tag([frame('USLT', payload)], { unsynchronised: true });
    expect((await extractEmbeddedLyrics(blob(tag)))?.text).toBe('Hello');
  });

  it('handles the v2.4 per-frame unsynchronisation flag', async () => {
    const payload = unsynchronise(usltPayload('Per frame', { encoding: 1 }));
    const tag = id3Tag([frame('USLT', payload, { major: 4, unsynchronised: true })], {
      major: 4,
    });
    expect((await extractEmbeddedLyrics(blob(tag)))?.text).toBe('Per frame');
  });

  it('stops at padding after the lyric frames', async () => {
    const tag = id3Tag([frame('USLT', usltPayload('Padded'))], { padding: 64 });
    expect((await extractEmbeddedLyrics(blob(tag)))?.text).toBe('Padded');
  });

  it('does not throw on truncated or corrupt tags', async () => {
    const complete = id3Tag([frame('USLT', usltPayload('Full text'))]);
    expect(await extractEmbeddedLyrics(blob(complete.slice(0, 14)))).toBeNull();

    const oversized = new Uint8Array(
      concat([0x49, 0x44, 0x33, 3, 0, 0], synchsafe(100_000), [0, 0, 0, 0, 0]),
    );
    expect(await extractEmbeddedLyrics(blob(oversized))).toBeNull();
  });
});

describe('embeddedLyricsToLines', () => {
  it('maps SYLT entries to timed lines', () => {
    const lines = embeddedLyricsToLines({
      source: 'SYLT',
      language: 'eng',
      entries: [
        { text: 'One', timeMs: 5000 },
        { text: '', timeMs: 8000 },
      ],
    });
    expect(lines.map(({ text, time }) => ({ text, time }))).toEqual([
      { text: 'One', time: 5 },
      { text: '', time: 8 },
    ]);
  });

  it('maps timed USLT text to timed lines', () => {
    const lines = embeddedLyricsToLines({
      source: 'USLT',
      language: 'eng',
      text: '[00:05.00]Hello\n[00:10.50]World',
    });
    expect(lines.map(({ text, time }) => ({ text, time }))).toEqual([
      { text: 'Hello', time: 5 },
      { text: 'World', time: 10.5 },
    ]);
  });

  it('maps plain USLT text to plain lines', () => {
    const lines = embeddedLyricsToLines({
      source: 'USLT',
      language: 'eng',
      text: 'Line one\nLine two\n',
    });
    expect(lines.map(({ text, time }) => ({ text, time }))).toEqual([
      { text: 'Line one', time: null },
      { text: 'Line two', time: null },
    ]);
  });
});
