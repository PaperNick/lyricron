import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useLatest } from '../../hooks/useLatest';

export interface AudioPlayer {
  fileName: string | null;
  isPlaying: boolean;
  hasStarted: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isDecoding: boolean;
  decodingVisible: boolean;
  loadFile: (file: File) => void;
  reset: () => void;
  toggle: () => void;
  pause: () => void;
  seek: (time: number) => void;
  shift: (delta: number) => void;
  setPlaybackRate: (rate: number) => void;
}

const VIDEO_EXTENSION = /\.(mp4|m4v|mov|mkv|ogv|3gp|webm)$/i;
const MIN_DECODING_VISIBLE_MS = 600;

/** Video files can't be decoded by `decodeAudioData`, so they keep the element. */
function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || VIDEO_EXTENSION.test(file.name);
}

interface DecodingNotice {
  isDecoding: boolean;
  isVisible: boolean;
  begin: () => void;
  end: () => void;
  reset: () => void;
}

/** Tracks decoding state and keeps a "Decoding…" notice visible for a minimum time. */
function useDecodingNotice(minVisibleMs: number): DecodingNotice {
  const [isDecoding, setIsDecoding] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const begin = useCallback(() => {
    clearTimer();
    startedAtRef.current = Date.now();
    setIsDecoding(true);
    setIsVisible(true);
  }, [clearTimer]);

  const end = useCallback(() => {
    setIsDecoding(false);
    const remaining = Math.max(0, minVisibleMs - (Date.now() - startedAtRef.current));
    timerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      timerRef.current = null;
    }, remaining);
  }, [minVisibleMs]);

  const reset = useCallback(() => {
    clearTimer();
    setIsDecoding(false);
    setIsVisible(false);
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return { isDecoding, isVisible, begin, end, reset };
}

/**
 * Playback engine. Audio files are decoded to raw PCM once (`decodeAudioData`)
 * and played through a Web Audio `AudioBufferSourceNode`, so the playback clock
 * (`AudioContext.currentTime`) is the audio-hardware clock and stays sample
 * accurate - it never drifts the way `HTMLAudioElement.currentTime` does for
 * variable-bitrate MP3. Video files fall back to the media element.
 */
export function useAudioPlayer(
  audioRef: RefObject<HTMLAudioElement | null>,
  onFallback?: () => void,
): AudioPlayer {
  const objectUrlRef = useRef<string | null>(null);
  const rateRef = useRef(1);
  const loadTokenRef = useRef(0);
  const onFallbackRef = useLatest(onFallback);

  // Web Audio state (audio files).
  const contextRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startOffsetRef = useRef(0);
  const startContextTimeRef = useRef(0);
  const pausedOffsetRef = useRef(0);
  const modeRef = useRef<'buffer' | 'element'>('element');

  const [fileName, setFileName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);

  const {
    isDecoding,
    isVisible: decodingVisible,
    begin: beginDecoding,
    end: endDecoding,
    reset: resetDecoding,
  } = useDecodingNotice(MIN_DECODING_VISIBLE_MS);

  const getContext = useCallback((): AudioContext => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    return contextRef.current;
  }, []);

  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stopSource = useCallback(() => {
    const source = sourceRef.current;
    if (!source) {
      return;
    }
    sourceRef.current = null;
    source.onended = null;
    try {
      source.stop();
    } catch {
      // Already stopped.
    }
  }, []);

  /** Current position within the buffer, in seconds. */
  const getPosition = useCallback((): number => {
    const context = contextRef.current;
    const source = sourceRef.current;
    if (context && source) {
      return (
        startOffsetRef.current +
        (context.currentTime - startContextTimeRef.current) * rateRef.current
      );
    }
    return pausedOffsetRef.current;
  }, []);

  const loadIntoElement = useCallback(
    (file: File, token: number) => {
      if (token !== loadTokenRef.current) {
        return;
      }
      modeRef.current = 'element';
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      const audio = audioRef.current;
      if (audio) {
        audio.src = url;
        audio.playbackRate = rateRef.current;
        audio.load();
      }
    },
    [audioRef],
  );

  // Release resources on unmount.
  useEffect(() => {
    return () => {
      stopSource();
      releaseObjectUrl();
      if (contextRef.current) {
        void contextRef.current.close();
      }
    };
  }, [stopSource, releaseObjectUrl]);

  // Media-element events (video fallback only - never fires in buffer mode).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const handleLoaded = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      audio.playbackRate = rateRef.current;
    };
    const handlePlay = () => {
      setIsPlaying(true);
      setHasStarted(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleSeeked = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('durationchange', handleLoaded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('seeked', handleSeeked);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('durationchange', handleLoaded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('seeked', handleSeeked);
    };
  }, [audioRef]);

  // Smooth time updates while playing (native `timeupdate` is only ~4 Hz, and
  // Web Audio emits no `timeupdate` at all).
  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    let raf = 0;
    const tick = () => {
      if (modeRef.current === 'buffer') {
        const context = contextRef.current;
        const source = sourceRef.current;
        if (context && source) {
          setCurrentTime(
            startOffsetRef.current +
              (context.currentTime - startContextTimeRef.current) * rateRef.current,
          );
        }
      } else if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, audioRef]);

  const loadFile = useCallback(
    async (file: File) => {
      const token = ++loadTokenRef.current;
      stopSource();
      bufferRef.current = null;
      releaseObjectUrl();

      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }

      setFileName(file.name);
      setCurrentTime(0);
      setDuration(0);
      setHasStarted(false);
      setIsPlaying(false);
      resetDecoding();
      pausedOffsetRef.current = 0;

      if (isVideoFile(file)) {
        loadIntoElement(file, token);
        return;
      }

      // Audio: decode to PCM and play via Web Audio for an accurate clock.
      modeRef.current = 'buffer';
      beginDecoding();
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = await getContext().decodeAudioData(arrayBuffer);
        if (token !== loadTokenRef.current) {
          return; // A newer file was loaded while decoding.
        }
        bufferRef.current = buffer;
        pausedOffsetRef.current = 0;
        setDuration(buffer.duration);
        endDecoding();
      } catch {
        if (token !== loadTokenRef.current) {
          return;
        }
        bufferRef.current = null;
        endDecoding();
        onFallbackRef.current?.();
        loadIntoElement(file, token);
      }
    },
    [
      audioRef,
      getContext,
      stopSource,
      releaseObjectUrl,
      loadIntoElement,
      resetDecoding,
      beginDecoding,
      endDecoding,
      onFallbackRef,
    ],
  );

  const playBuffer = useCallback(async () => {
    const buffer = bufferRef.current;
    if (!buffer) {
      return;
    }
    const context = getContext();
    if (context.state === 'suspended') {
      await context.resume();
    }

    stopSource();
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rateRef.current;
    source.connect(context.destination);

    const offset = pausedOffsetRef.current >= buffer.duration ? 0 : pausedOffsetRef.current;
    sourceRef.current = source;
    startOffsetRef.current = offset;
    startContextTimeRef.current = context.currentTime;
    source.onended = () => {
      if (sourceRef.current !== source) {
        return; // Stopped manually (pause/seek/reset).
      }
      sourceRef.current = null;
      pausedOffsetRef.current = 0;
      setCurrentTime(buffer.duration);
      setIsPlaying(false);
    };
    source.start(0, offset);
    setIsPlaying(true);
    setHasStarted(true);
  }, [getContext, stopSource]);

  const pauseBuffer = useCallback(() => {
    const context = contextRef.current;
    const source = sourceRef.current;
    if (context && source) {
      pausedOffsetRef.current =
        startOffsetRef.current +
        (context.currentTime - startContextTimeRef.current) * rateRef.current;
    }
    stopSource();
    setIsPlaying(false);
  }, [stopSource]);

  const reset = useCallback(() => {
    loadTokenRef.current += 1;
    pauseBuffer();
    bufferRef.current = null;
    releaseObjectUrl();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    modeRef.current = 'element';
    setFileName(null);
    setCurrentTime(0);
    setDuration(0);
    setHasStarted(false);
    setIsPlaying(false);
    resetDecoding();
    pausedOffsetRef.current = 0;
  }, [audioRef, pauseBuffer, releaseObjectUrl, resetDecoding]);

  const toggle = useCallback(() => {
    if (modeRef.current === 'buffer') {
      if (sourceRef.current) {
        pauseBuffer();
      } else {
        void playBuffer();
      }
      return;
    }
    const audio = audioRef.current;
    if (!audio || !audio.src) {
      return;
    }
    if (audio.paused) {
      void audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [audioRef, pauseBuffer, playBuffer]);

  const pause = useCallback(() => {
    if (modeRef.current === 'buffer') {
      pauseBuffer();
      return;
    }
    audioRef.current?.pause();
  }, [audioRef, pauseBuffer]);

  const seek = useCallback(
    (time: number) => {
      if (modeRef.current === 'buffer') {
        const buffer = bufferRef.current;
        if (!buffer) {
          return;
        }
        const clamped = Math.min(Math.max(time, 0), buffer.duration);
        if (sourceRef.current) {
          pausedOffsetRef.current = clamped;
          void playBuffer();
        } else {
          pausedOffsetRef.current = clamped;
          setCurrentTime(clamped);
        }
        return;
      }
      const audio = audioRef.current;
      if (!audio || !audio.src) {
        return;
      }
      const max = Number.isFinite(audio.duration) ? audio.duration : Math.max(time, 0);
      audio.currentTime = Math.min(Math.max(time, 0), max);
      setCurrentTime(audio.currentTime);
    },
    [audioRef, playBuffer],
  );

  const shift = useCallback(
    (delta: number) => {
      if (modeRef.current === 'buffer') {
        seek(getPosition() + delta);
        return;
      }
      const audio = audioRef.current;
      if (audio) {
        seek(audio.currentTime + delta);
      }
    },
    [audioRef, getPosition, seek],
  );

  const setPlaybackRate = useCallback(
    (rate: number) => {
      const previousRate = rateRef.current;
      rateRef.current = rate;
      setPlaybackRateState(rate);

      if (modeRef.current !== 'buffer') {
        if (audioRef.current) {
          audioRef.current.playbackRate = rate;
        }
        return;
      }

      // Restart at the current position so the new rate applies cleanly.
      const context = contextRef.current;
      const source = sourceRef.current;
      if (context && source) {
        const position =
          startOffsetRef.current +
          (context.currentTime - startContextTimeRef.current) * previousRate;
        const buffer = bufferRef.current;
        pausedOffsetRef.current = buffer ? Math.min(position, buffer.duration) : position;
        void playBuffer();
      }
    },
    [audioRef, playBuffer],
  );

  return {
    fileName,
    isPlaying,
    hasStarted,
    currentTime,
    duration,
    playbackRate,
    isDecoding,
    decodingVisible,
    loadFile,
    reset,
    toggle,
    pause,
    seek,
    shift,
    setPlaybackRate,
  };
}
