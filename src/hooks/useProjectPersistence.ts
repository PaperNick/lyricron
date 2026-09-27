import { useEffect } from 'react';
import type { LyricLine } from '../types';
import { saveProject } from '../lib/storage';

const SAVE_DEBOUNCE_MS = 400;

/** Persists the project (debounced) so a refresh does not lose the work. */
export function useProjectPersistence(lines: LyricLine[], fileName: string | null) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveProject({ audioName: fileName, lines });
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [lines, fileName]);
}
