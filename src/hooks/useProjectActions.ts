import { useRef, useState } from 'react';
import type { RefObject } from 'react';
import type {
  EmbeddedLyricsStatus,
  ExportFormat,
  LyricLine,
  MobileTab,
  PendingConfirm,
} from '../types';
import type { AnnotationStore } from '../modules/editor/useAnnotationStore';
import type { AudioPlayer } from '../modules/player/useAudioPlayer';
import type { LrclibSelection } from '../lib/lrclib';
import { hasLyrics, linesToText, textToLines } from '../lib/plain';
import { lrcToPlainText, parseLrc, serializeLrc } from '../lib/lrc';
import { parseSrt, serializeSrt } from '../lib/srt';
import { isMp3, isPlayableMedia } from '../lib/media';
import { embeddedLyricsToLines, extractEmbeddedLyrics } from '../lib/embeddedLyrics';

interface ProjectActionsOptions {
  store: AnnotationStore;
  player: AudioPlayer;
  hasContent: boolean;
  isMobile: boolean;
  importInputRef: RefObject<HTMLInputElement | null>;
  setLyricsReady: (ready: boolean) => void;
  setMobileTab: (tab: MobileTab) => void;
  setSnackbar: (message: string | null) => void;
  setConfirmState: (state: PendingConfirm | null) => void;
  setHoveredIndex: (index: number | null) => void;
}

export interface ProjectActions {
  importFile: (file: File | undefined) => void;
  openImport: () => void;
  selectLrclib: (selection: LrclibSelection) => void;
  exportLyrics: (format: ExportFormat) => void;
  copyPlain: () => void;
  copyTimed: () => void;
  applyPastedLrc: (text: string) => void;
  convertPastedLrc: (text: string) => void;
  reset: () => void;
  newProject: () => void;
  loadDroppedFile: (file: File) => void;
  embeddedLyricsStatus: EmbeddedLyricsStatus;
  importEmbeddedLyrics: () => void;
}

/** "N timed" or "N plain", used in import snackbar messages. */
function describeLines(lines: LyricLine[]): string {
  const timedCount = lines.filter((line) => line.time !== null).length;
  return timedCount > 0 ? `${timedCount} timed` : `${lines.length} plain`;
}

/** Project-level actions: loading, exporting, copying and resetting lyrics. */
export function useProjectActions({
  store,
  player,
  hasContent,
  isMobile,
  importInputRef,
  setLyricsReady,
  setMobileTab,
  setSnackbar,
  setConfirmState,
  setHoveredIndex,
}: ProjectActionsOptions): ProjectActions {
  const loadTokenRef = useRef(0);
  const [embeddedLines, setEmbeddedLines] = useState<LyricLine[] | null>(null);
  const [embeddedStatus, setEmbeddedStatus] = useState<EmbeddedLyricsStatus>('checking');

  const applyImportedLines = (imported: LyricLine[], message: string) => {
    store.replaceLines(imported);
    setLyricsReady(true);
    if (isMobile) {
      setMobileTab('timed');
    }
    setSnackbar(message);
  };

  /**
   * Scans a chosen file for lyrics embedded in its ID3 tags. The result feeds
   * the "Load from MP3" card on the add-lyrics screen; nothing is applied
   * until the user picks it.
   */
  const detectEmbeddedLyrics = async (file: File, token: number) => {
    let lines: LyricLine[] | null = null;
    try {
      const embedded = await extractEmbeddedLyrics(file);
      if (embedded) {
        const candidate = embeddedLyricsToLines(embedded);
        if (hasLyrics(candidate)) {
          lines = candidate;
        }
      }
    } catch {
      // A malformed tag simply means there is nothing to offer.
    }

    if (token !== loadTokenRef.current) {
      return; // A newer file was loaded while this scan was still in flight.
    }
    setEmbeddedLines(lines);
    setEmbeddedStatus(lines ? 'available' : 'none');
  };

  /** Loads the lyrics detected in the current file's tags, if any. */
  const importEmbeddedLyrics = () => {
    if (!embeddedLines) {
      return;
    }
    applyImportedLines(
      embeddedLines,
      `Imported ${describeLines(embeddedLines)} lines from MP3 tags`,
    );
  };

  const importFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    const text = await file.text();
    const lrc = parseLrc(text);
    const timed = lrc.length > 0 ? lrc : parseSrt(text);
    const imported = timed.length > 0 ? timed : textToLines(text.trim());
    if (timed.length === 0 && !hasLyrics(imported)) {
      setSnackbar('No lyrics found in that file');
      return;
    }
    const message = `Imported ${describeLines(imported)} lines`;
    const apply = () => applyImportedLines(imported, message);
    if (hasContent) {
      setConfirmState({
        title: 'Replace existing lyrics?',
        message:
          'This will discard your current lyrics and timestamps and load the imported file instead.',
        confirmLabel: 'Replace',
        action: apply,
      });
    } else {
      apply();
    }
  };

  const openImport = () => importInputRef.current?.click();

  const applyLrclibSelection = (selection: LrclibSelection) => {
    const synced = selection.synced ? parseLrc(selection.synced) : [];
    if (synced.length > 0) {
      store.replaceLines(synced);
      setLyricsReady(true);
      if (isMobile) {
        setMobileTab('timed');
      }
      setSnackbar(`Loaded synced lyrics for ${selection.title}`);
      return;
    }
    if (selection.plain) {
      store.replaceLines(textToLines(selection.plain.trim()));
      setLyricsReady(true);
      setSnackbar(`Loaded plain lyrics for ${selection.title}`);
      return;
    }
    setSnackbar('No lyrics available for that track');
  };

  const selectLrclib = (selection: LrclibSelection) => {
    if (hasContent) {
      setConfirmState({
        title: 'Replace existing lyrics?',
        message:
          'This will discard your current lyrics and timestamps and load the selected lyrics instead.',
        confirmLabel: 'Replace',
        action: () => applyLrclibSelection(selection),
      });
      return;
    }
    applyLrclibSelection(selection);
  };

  const download = (content: string, extension: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(player.fileName ?? 'lyrics').replace(/\.[^.]+$/, '')}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportLyrics = (format: ExportFormat) => {
    if (format === 'srt') {
      download(serializeSrt(store.lines), 'srt');
    } else {
      download(serializeLrc(store.lines), 'lrc');
    }
  };

  const copyPlain = async () => {
    try {
      await navigator.clipboard.writeText(linesToText(store.lines));
      setSnackbar('Plain lyrics copied to clipboard');
    } catch {
      setSnackbar('Could not copy to clipboard');
    }
  };

  const copyTimed = async () => {
    try {
      await navigator.clipboard.writeText(serializeLrc(store.lines));
      setSnackbar('Timed lyrics copied to clipboard');
    } catch {
      setSnackbar('Could not copy to clipboard');
    }
  };

  const applyPastedLrc = (text: string) => {
    const timed = parseLrc(text);
    store.replaceLines(timed);
    setLyricsReady(true);
    if (isMobile) {
      setMobileTab('timed');
    }
    setSnackbar(`Loaded ${timed.length} timed lines`);
  };

  const convertPastedLrc = (text: string) => {
    store.replaceLines(textToLines(lrcToPlainText(text)));
    setLyricsReady(true);
    setSnackbar('Converted pasted lyrics to plain text');
  };

  const reset = () =>
    setConfirmState({
      title: 'Clear everything?',
      message: 'This will remove all lyrics and timestamps. This cannot be undone.',
      confirmLabel: 'Clear',
      action: () => {
        player.pause();
        store.replaceLines([]);
        setLyricsReady(false);
      },
    });

  const newProject = () =>
    setConfirmState({
      title: 'Start a new project?',
      message:
        'This will remove the current audio, lyrics and timestamps so you can upload a new MP3.',
      confirmLabel: 'New project',
      action: () => {
        player.reset();
        store.replaceLines([]);
        setLyricsReady(false);
        setHoveredIndex(null);
        setMobileTab('lyrics');
        setEmbeddedLines(null);
        setEmbeddedStatus('checking');
      },
    });

  const loadDroppedFile = (file: File) => {
    if (!isPlayableMedia(file)) {
      setSnackbar('That file type cannot be played');
      return;
    }
    const adopt = (resetLyrics: boolean) => {
      // Any new load invalidates a tag scan still in flight for a previous file.
      const token = ++loadTokenRef.current;
      setEmbeddedLines(null);
      if (isMp3(file)) {
        setEmbeddedStatus('checking');
        void detectEmbeddedLyrics(file, token);
      } else {
        setEmbeddedStatus('unsupported');
      }
      if (resetLyrics) {
        store.replaceLines([]);
        setLyricsReady(false);
        setHoveredIndex(null);
        setMobileTab('lyrics');
      }
      player.loadFile(file);
    };
    if (hasContent) {
      setConfirmState({
        title: 'Replace current project?',
        message:
          'This will discard the current audio, lyrics and timestamps and load the dropped file instead.',
        confirmLabel: 'Replace',
        secondaryLabel: 'Use existing',
        secondaryAction: () => adopt(false),
        action: () => adopt(true),
      });
      return;
    }
    adopt(true);
  };

  return {
    importFile,
    openImport,
    selectLrclib,
    exportLyrics,
    copyPlain,
    copyTimed,
    applyPastedLrc,
    convertPastedLrc,
    reset,
    newProject,
    loadDroppedFile,
    embeddedLyricsStatus: embeddedStatus,
    importEmbeddedLyrics,
  };
}
