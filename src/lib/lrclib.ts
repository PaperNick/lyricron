export interface LrclibResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

export interface LrclibSelection {
  title: string;
  artist: string;
  synced: string | null;
  plain: string | null;
}

const SEARCH_URL = 'https://lrclib.net/api/search';

/** Derives a likely search query (artist - title) from an audio file name. */
export function filenameToQuery(fileName: string): string {
  return fileName
    .replace(/\.[^./\\]+$/, '')
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\d{1,3}\s*[.\-\u2013\u2014]\s*/, '')
    .trim();
}

export async function searchLrclib(query: string, signal?: AbortSignal): Promise<LrclibResult[]> {
  const response = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(query)}`, { signal });
  if (!response.ok) {
    throw new Error(`LRCLIB search failed (${response.status})`);
  }
  const data = (await response.json()) as LrclibResult[];
  return Array.isArray(data) ? data : [];
}
