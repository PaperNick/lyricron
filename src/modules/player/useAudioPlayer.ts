import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export interface AudioPlayer {
  fileName: string | null;
  isPlaying: boolean;
  hasStarted: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  loadFile: (file: File) => void;
  reset: () => void;
  toggle: () => void;
  pause: () => void;
  seek: (time: number) => void;
  shift: (delta: number) => void;
  setPlaybackRate: (rate: number) => void;
}

export function useAudioPlayer(audioRef: RefObject<HTMLAudioElement | null>): AudioPlayer {
  const objectUrlRef = useRef<string | null>(null);
  const rateRef = useRef(1);

  const [fileName, setFileName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);

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
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [audioRef]);

  // Smooth time updates while playing (native `timeupdate` is only ~4Hz).
  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    let raf = 0;
    const tick = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, audioRef]);

  const loadFile = useCallback(
    (file: File) => {
      const audio = audioRef.current;
      if (!audio) {
        return;
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      audio.src = url;
      audio.playbackRate = rateRef.current;
      audio.load();
      setFileName(file.name);
      setCurrentTime(0);
      setDuration(0);
      setHasStarted(false);
      setIsPlaying(false);
    },
    [audioRef],
  );

  const reset = useCallback(() => {
    const audio = audioRef.current;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    setFileName(null);
    setCurrentTime(0);
    setDuration(0);
    setHasStarted(false);
    setIsPlaying(false);
  }, [audioRef]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) {
      return;
    }
    if (audio.paused) {
      void audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [audioRef]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, [audioRef]);

  const seek = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio || !audio.src) {
        return;
      }
      const max = Number.isFinite(audio.duration) ? audio.duration : Math.max(time, 0);
      audio.currentTime = Math.min(Math.max(time, 0), max);
      setCurrentTime(audio.currentTime);
    },
    [audioRef],
  );

  const shift = useCallback(
    (delta: number) => {
      const audio = audioRef.current;
      if (audio) {
        seek(audio.currentTime + delta);
      }
    },
    [audioRef, seek],
  );

  const setPlaybackRate = useCallback(
    (rate: number) => {
      rateRef.current = rate;
      if (audioRef.current) {
        audioRef.current.playbackRate = rate;
      }
      setPlaybackRateState(rate);
    },
    [audioRef],
  );

  return {
    fileName,
    isPlaying,
    hasStarted,
    currentTime,
    duration,
    playbackRate,
    loadFile,
    reset,
    toggle,
    pause,
    seek,
    shift,
    setPlaybackRate,
  };
}
