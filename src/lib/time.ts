const FRACTION_DIVISORS = [10, 100, 1000];

/** Turns a `d`-digit fraction (from a timestamp) into seconds, e.g. `"5"` -> 0.5. */
export function fractionToSeconds(fraction: string | undefined): number {
  if (!fraction) {
    return 0;
  }
  const divisor = FRACTION_DIVISORS[fraction.length - 1] ?? 1000;
  return Number(fraction) / divisor;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatLrcTime(seconds: number): string {
  const totalHundredths = Math.round(Math.max(0, seconds) * 100);
  const minutes = Math.floor(totalHundredths / 6000);
  const secs = Math.floor((totalHundredths % 6000) / 100);
  const hundredths = totalHundredths % 100;

  return `${pad2(minutes)}:${pad2(secs)}.${pad2(hundredths)}`;
}

export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${pad2(secs)}`;
}

const TIME_INPUT = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/;

/** Accepts `mm:ss.xx`, `m:ss` or `hh:mm:ss` and returns seconds, or null when invalid. */
export function parseTimeInput(value: string): number | null {
  const match = TIME_INPUT.exec(value.trim());
  if (!match) {
    return null;
  }

  const hours = match[1] ? Number(match[1]) : 0;
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  if (seconds >= 60) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds + fractionToSeconds(match[4]);
}
