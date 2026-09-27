import { useEffect, useState } from 'react';
import { useLatest } from '../../hooks/useLatest';

const hasFiles = (event: DragEvent): boolean =>
  event.dataTransfer?.types.includes('Files') ?? false;

/**
 * Listens for file drags anywhere on the page and reports whether one is
 * currently over the window, forwarding dropped files to `onFile`.
 */
export function useFileDrop(onFile: (file: File) => void): boolean {
  const [dragActive, setDragActive] = useState(false);
  const latest = useLatest({ onFile });

  useEffect(() => {
    let depth = 0;

    const onDragEnter = (event: DragEvent) => {
      if (!hasFiles(event)) {
        return;
      }
      depth += 1;
      setDragActive(true);
    };
    const onDragOver = (event: DragEvent) => {
      if (hasFiles(event)) {
        event.preventDefault();
      }
    };
    const onDragLeave = (event: DragEvent) => {
      if (!hasFiles(event)) {
        return;
      }
      depth = Math.max(0, depth - 1);
      if (depth === 0) {
        setDragActive(false);
      }
    };
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) {
        return;
      }
      event.preventDefault();
      depth = 0;
      setDragActive(false);
      const file = event.dataTransfer?.files[0];
      if (file) {
        latest.current.onFile(file);
      }
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [latest]);

  return dragActive;
}
