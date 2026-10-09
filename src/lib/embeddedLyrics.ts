import type { LyricLine } from '../types';
import { parseLrc } from './lrc';
import { hasLyrics, textToLines, uid } from './plain';

/**
 * Reads synchronized (SYLT) or unsynchronized (USLT) lyrics embedded in the
 * ID3v2 tag of an audio file. Only the tag region of the file is read, so the
 * audio data itself is never loaded into memory.
 *
 * SYLT is preferred over USLT when it carries any lyric text. USLT is returned
 * as raw text because some taggers store timed LRC in it; `embeddedLyricsToLines`
 * detects and parses that.
 */

export interface SyltEntry {
  text: string;
  /**
   * Timestamp exactly as stored in the frame. Format 2 (the common one) is
   * milliseconds; format 1 (MPEG frames) is passed through unchanged.
   */
  timeMs: number;
}

export interface EmbeddedLyrics {
  source: 'SYLT' | 'USLT';
  /** Three-letter ID3 language code, e.g. `eng`. */
  language: string;
  /** Present for SYLT. */
  entries?: SyltEntry[];
  /** Present for USLT: plain text or timed LRC, depending on the tagger. */
  text?: string;
}

const ID3_HEADER_SIZE = 10;
const ID3_MAGIC = 'ID3';
/** Upper bound for the tag size; guards against corrupt headers. */
const MAX_TAG_SIZE = 32 * 1024 * 1024;

type Id3Version = 2 | 3 | 4;

/** Frame header size (id + size + flags) for each ID3 version. */
const FRAME_HEADER_SIZE: Record<Id3Version, number> = { 2: 6, 3: 10, 4: 10 };
const FRAME_ID_LENGTH: Record<Id3Version, number> = { 2: 3, 3: 4, 4: 4 };

const Encoding = {
  Latin1: 0,
  Utf16: 1,
  Utf16Be: 2,
  Utf8: 3,
} as const;

/** ID3v2.3 frame-format flag bits (stored at header byte 9). */
const V3_COMPRESSED = 0x80;
const V3_ENCRYPTED = 0x40;
const V3_GROUPING = 0x20;

/** ID3v2.4 frame-format flag bits (stored at header byte 9). */
const V4_GROUPING = 0x40;
const V4_COMPRESSED = 0x08;
const V4_ENCRYPTED = 0x04;
const V4_UNSYNCHRONISED = 0x02;
const V4_DATA_LENGTH_INDICATOR = 0x01;

/** ID3 header flag marking the whole tag as unsynchronised. */
const HEADER_FLAG_UNSYNCHRONISED = 0x80;

const UTF8 = new TextDecoder('utf-8');
const UTF16LE = new TextDecoder('utf-16le');
const UTF16BE = new TextDecoder('utf-16be');

const SYLT_IDS = new Set(['SYLT', 'SLT']);
const USLT_IDS = new Set(['USLT', 'ULT']);

function isSupportedVersion(version: number): version is Id3Version {
  return version >= 2 && version <= 4;
}

function isWideEncoding(encoding: number): boolean {
  return encoding === Encoding.Utf16 || encoding === Encoding.Utf16Be;
}

/** Reads `length` big-endian bytes, each contributing `bitsPerByte` bits. */
function readBigEndian(bytes: Uint8Array, offset: number, length: number, bitsPerByte = 8): number {
  const mask = (1 << bitsPerByte) - 1;
  const base = 1 << bitsPerByte;
  let value = 0;
  for (let index = 0; index < length; index += 1) {
    value = value * base + (bytes[offset + index] & mask);
  }
  return value;
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return readBigEndian(bytes, offset, 4);
}

function readSynchsafe(bytes: Uint8Array, offset: number): number {
  return readBigEndian(bytes, offset, 4, 7);
}

/** Decodes the ID3 ISO-8859-1 variant, avoiding the browser's windows-1252 mapping. */
function latin1Decode(bytes: Uint8Array): string {
  let result = '';
  for (const byte of bytes) {
    result += String.fromCharCode(byte);
  }
  return result;
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return latin1Decode(bytes.subarray(offset, offset + length));
}

function decodeString(bytes: Uint8Array, encoding: number): string {
  switch (encoding) {
    case Encoding.Utf16: {
      if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
        return UTF16LE.decode(bytes.subarray(2));
      }
      if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
        return UTF16BE.decode(bytes.subarray(2));
      }
      // No BOM: assume little-endian, as most taggers write it.
      return UTF16LE.decode(bytes);
    }
    case Encoding.Utf16Be:
      return UTF16BE.decode(bytes);
    case Encoding.Utf8:
      return UTF8.decode(bytes);
    default:
      return latin1Decode(bytes);
  }
}

interface TerminatedString {
  text: string;
  /** Offset of the first byte after the terminator. */
  next: number;
}

function readTerminatedString(data: Uint8Array, start: number, encoding: number): TerminatedString {
  const step = isWideEncoding(encoding) ? 2 : 1;
  let end = data.length;

  for (let index = start; index + step <= data.length; index += step) {
    if (data[index] === 0 && (step === 1 || data[index + 1] === 0)) {
      end = index;
      break;
    }
  }

  return {
    text: decodeString(data.subarray(start, end), encoding),
    next: Math.min(end + step, data.length),
  };
}

function languageCode(payload: Uint8Array, offset: number): string {
  return latin1Decode(payload.subarray(offset, offset + 3))
    .replace(/\s+/g, '')
    .replaceAll('\0', '');
}

interface TextFrameHeader {
  encoding: number;
  language: string;
  /** Offset of the first content byte, just past the descriptor. */
  contentStart: number;
}

/** Reads the encoding, language and terminated descriptor shared by SYLT and USLT. */
function readTextFrameHeader(payload: Uint8Array, descriptorOffset: number): TextFrameHeader {
  const encoding = payload[0] ?? Encoding.Latin1;
  const language = languageCode(payload, 1);
  const descriptor = readTerminatedString(payload, descriptorOffset, encoding);
  return { encoding, language, contentStart: descriptor.next };
}

/** Reverses the ID3 unsynchronisation scheme, where `FF 00` stands for `FF`. */
function deunsynchronise(bytes: Uint8Array): Uint8Array {
  const result = new Uint8Array(bytes.length);
  let length = 0;

  for (let index = 0; index < bytes.length; index += 1) {
    result[length] = bytes[index];
    length += 1;
    if (bytes[index] === 0xff && bytes[index + 1] === 0x00) {
      index += 1;
    }
  }

  return result.subarray(0, length);
}

function parseSylt(payload: Uint8Array): { language: string; entries: SyltEntry[] } {
  const { encoding, language, contentStart } = readTextFrameHeader(payload, 6);
  const entries: SyltEntry[] = [];

  let cursor = contentStart;
  while (cursor < payload.length) {
    const { text, next } = readTerminatedString(payload, cursor, encoding);
    cursor = next;
    if (cursor + 4 > payload.length) {
      break;
    }
    entries.push({ text, timeMs: readUint32BE(payload, cursor) });
    cursor += 4;
  }

  return { language, entries };
}

function parseUslt(payload: Uint8Array): { language: string; text: string } {
  const { encoding, language, contentStart } = readTextFrameHeader(payload, 4);
  const text = decodeString(payload.subarray(contentStart), encoding).replace(/\0+$/, '');
  return { language, text };
}

function readFrameSize(tag: Uint8Array, offset: number, version: Id3Version): number {
  if (version === 2) {
    return readBigEndian(tag, offset + 3, 3);
  }
  if (version === 4) {
    return readSynchsafe(tag, offset + 4);
  }
  return readUint32BE(tag, offset + 4);
}

interface FrameHeader {
  id: string;
  size: number;
}

/** Reads a frame id and size, or null when the walker reached the padding. */
function readFrameHeader(tag: Uint8Array, offset: number, version: Id3Version): FrameHeader | null {
  const id = readAscii(tag, offset, FRAME_ID_LENGTH[version]);
  if (id.charCodeAt(0) === 0 || !/^[A-Z0-9]+$/.test(id)) {
    return null;
  }

  const size = readFrameSize(tag, offset, version);
  if (size <= 0) {
    return null;
  }

  return { id, size };
}

/**
 * Extracts the frame payload, applying grouping, data-length and
 * unsynchronisation flags. Returns null for compressed, encrypted or empty
 * frames, which carry no parseable inline text.
 */
function readFramePayload(
  tag: Uint8Array,
  offset: number,
  size: number,
  version: Id3Version,
  globallyUnsynchronised: boolean,
): Uint8Array | null {
  let dataOffset = offset + FRAME_HEADER_SIZE[version];
  let unsynchronised = globallyUnsynchronised;

  if (version === 3) {
    const flags = tag[offset + 9];
    if (flags & (V3_COMPRESSED | V3_ENCRYPTED)) {
      return null;
    }
    if (flags & V3_GROUPING) {
      dataOffset += 1;
    }
  }

  if (version === 4) {
    const flags = tag[offset + 9];
    if (flags & (V4_COMPRESSED | V4_ENCRYPTED)) {
      return null;
    }
    if (flags & V4_GROUPING) {
      dataOffset += 1;
    }
    if (flags & V4_DATA_LENGTH_INDICATOR) {
      dataOffset += 4;
    }
    if (flags & V4_UNSYNCHRONISED) {
      unsynchronised = true;
    }
  }

  const dataEnd = Math.min(dataOffset + size, tag.length);
  if (dataEnd <= dataOffset) {
    return null;
  }

  const payload = tag.subarray(dataOffset, dataEnd);
  if (!unsynchronised) {
    return payload;
  }
  return deunsynchronise(payload);
}

/** Walks ID3v2 frames and returns the first SYLT and USLT payload found. */
function collectLyricFrames(
  tag: Uint8Array,
  version: Id3Version,
  globallyUnsynchronised: boolean,
): { sylt?: Uint8Array; uslt?: Uint8Array } {
  const result: { sylt?: Uint8Array; uslt?: Uint8Array } = {};
  const headerSize = FRAME_HEADER_SIZE[version];
  let offset = 0;

  while (offset + headerSize <= tag.length) {
    const header = readFrameHeader(tag, offset, version);
    if (!header) {
      break; // Padding after the last frame.
    }

    const payload = readFramePayload(tag, offset, header.size, version, globallyUnsynchronised);
    if (payload) {
      if (SYLT_IDS.has(header.id) && !result.sylt) {
        result.sylt = payload;
      } else if (USLT_IDS.has(header.id) && !result.uslt) {
        result.uslt = payload;
      }
    }

    offset += headerSize + header.size;
  }

  return result;
}

function hasId3Magic(header: Uint8Array): boolean {
  return readAscii(header, 0, ID3_MAGIC.length) === ID3_MAGIC;
}

export async function extractEmbeddedLyrics(file: Blob): Promise<EmbeddedLyrics | null> {
  if (file.size < ID3_HEADER_SIZE) {
    return null;
  }

  const header = new Uint8Array(await file.slice(0, ID3_HEADER_SIZE).arrayBuffer());
  if (!hasId3Magic(header)) {
    return null;
  }

  const version = header[3];
  if (!isSupportedVersion(version)) {
    return null;
  }

  const tagSize = readSynchsafe(header, 6);
  if (tagSize <= 0 || tagSize > MAX_TAG_SIZE) {
    return null;
  }

  const end = Math.min(ID3_HEADER_SIZE + tagSize, file.size);
  const tag = new Uint8Array(await file.slice(ID3_HEADER_SIZE, end).arrayBuffer());
  const frames = collectLyricFrames(tag, version, (header[5] & HEADER_FLAG_UNSYNCHRONISED) !== 0);

  if (frames.sylt) {
    const { language, entries } = parseSylt(frames.sylt);
    if (hasLyrics(entries)) {
      return { source: 'SYLT', language, entries };
    }
  }

  if (frames.uslt) {
    const { language, text } = parseUslt(frames.uslt);
    return { source: 'USLT', language, text };
  }

  return null;
}

/**
 * Converts embedded lyrics into editor lines. SYLT entries are inherently
 * timed; USLT content is parsed as LRC when it carries timestamps and kept as
 * plain text otherwise.
 */
export function embeddedLyricsToLines(lyrics: EmbeddedLyrics): LyricLine[] {
  if (lyrics.source === 'SYLT') {
    return (lyrics.entries ?? []).map((entry) => ({
      id: uid(),
      text: entry.text,
      time: entry.timeMs / 1000,
    }));
  }

  const text = lyrics.text ?? '';
  const lrc = parseLrc(text);
  if (lrc.length > 0) {
    return lrc;
  }
  return textToLines(text.trim());
}
