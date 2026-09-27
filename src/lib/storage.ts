import type { LyricLine, SavedProject } from '../types';
import type { ThemeMode } from '../theme';

const PROJECT_STORAGE_KEY = 'lyricron-v1';
const THEME_STORAGE_KEY = 'lyricron-theme';

export function loadThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

export function saveThemeMode(mode: ThemeMode): void {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
}

export function loadSavedLines(): LyricLine[] {
  try {
    const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as Partial<SavedProject>;
    return Array.isArray(parsed.lines) ? parsed.lines : [];
  } catch {
    return [];
  }
}

export function saveProject(project: SavedProject): void {
  localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project));
}
