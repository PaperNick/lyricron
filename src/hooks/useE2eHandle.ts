import { useEffect } from 'react';
import type { AudioPlayer } from '../modules/player/useAudioPlayer';

interface E2eHandle {
  seek: (time: number) => void;
  pause: () => void;
  getTime: () => number;
  isPlaying: () => boolean;
}

/**
 * Exposes a stable `window.__lyricron` handle in development so end-to-end
 * tests can seek and read the clock without reaching into the <audio> element.
 */
export function useE2eHandle(player: AudioPlayer) {
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }
    const target = window as unknown as { __lyricron?: E2eHandle };
    target.__lyricron = {
      seek: (time) => player.seek(time),
      pause: () => player.pause(),
      getTime: () => player.currentTime,
      isPlaying: () => player.isPlaying,
    };
    return () => {
      delete target.__lyricron;
    };
  }, [player]);
}
