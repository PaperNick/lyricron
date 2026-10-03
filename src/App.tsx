import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CssBaseline, Snackbar, ThemeProvider, useMediaQuery } from '@mui/material';
import type { LinePulse, LinePulseDirection, MobileTab, PendingConfirm } from './types';
import { useAudioPlayer } from './modules/player/useAudioPlayer';
import { useAnnotationStore } from './modules/editor/useAnnotationStore';
import { useIsMobile } from './hooks/useIsMobile';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useFileDrop } from './modules/import/useFileDrop';
import { useBeforeUnload } from './hooks/useBeforeUnload';
import { useProjectPersistence } from './hooks/useProjectPersistence';
import { useProjectActions } from './hooks/useProjectActions';
import { useE2eHandle } from './hooks/useE2eHandle';
import { hasLyrics } from './lib/plain';
import { formatClock } from './lib/time';
import { loadSavedLines, loadThemeMode, saveThemeMode } from './lib/storage';
import { LrclibSearchDialog } from './modules/import/LrclibSearchDialog';
import { ConfirmDialog } from './modules/app/ConfirmDialog';
import { LrcPasteDialog } from './modules/import/LrcPasteDialog';
import { KeyboardShortcutsDialog } from './modules/app/KeyboardShortcutsDialog';
import { TopBar } from './modules/app/TopBar';
import { UploadScreen } from './modules/app/UploadScreen';
import { ChooseScreen } from './modules/app/ChooseScreen';
import { EditorScreen } from './modules/app/EditorScreen';
import {
  Content,
  DropOverlay,
  OverlayContent,
  OverlayIcon,
  OverlayTitle,
  Root,
} from './App.styles';
import { createAppTheme } from './theme';
import type { ThemeMode } from './theme';

const RESTART_THRESHOLD_SECONDS = 1;

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(loadThemeMode);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const resolvedMode = themeMode === 'system' ? (prefersDark ? 'dark' : 'light') : themeMode;
  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode]);

  useEffect(() => {
    saveThemeMode(themeMode);
  }, [themeMode]);

  const cycleTheme = () =>
    setThemeMode((current) =>
      current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system',
    );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell themeMode={themeMode} onCycleTheme={cycleTheme} />
    </ThemeProvider>
  );
}

interface AppShellProps {
  themeMode: ThemeMode;
  onCycleTheme: () => void;
}

function AppShell({ themeMode, onCycleTheme }: AppShellProps) {
  const isMobile = useIsMobile();
  const [initialLines] = useState(loadSavedLines);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const handleFallback = useCallback(() => {
    setSnackbar(
      "This file couldn't be decoded in-browser, so a fallback player is used. Timing may drift on variable-bitrate audio.",
    );
  }, [setSnackbar]);
  const player = useAudioPlayer(audioRef, handleFallback);
  const store = useAnnotationStore(initialLines);

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('lyrics');
  const [lyricsReady, setLyricsReady] = useState(() => hasLyrics(initialLines));
  const [lrclibOpen, setLrclibOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<PendingConfirm | null>(null);
  const [pendingLrcText, setPendingLrcText] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pulse, setPulse] = useState<LinePulse | null>(null);
  const pulseTimer = useRef<number | undefined>(undefined);
  const importInputRef = useRef<HTMLInputElement>(null);

  const triggerPulse = useCallback((index: number, direction: LinePulseDirection) => {
    setPulse((current) => ({
      index,
      direction,
      nonce: (current?.nonce ?? 0) + 1,
    }));
    window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => setPulse(null), 700);
  }, []);

  useEffect(() => () => window.clearTimeout(pulseTimer.current), []);

  const { lines } = store;
  const timedLines = useMemo(() => lines.filter((line) => line.time !== null), [lines]);

  const hasRealLyrics = useMemo(() => hasLyrics(lines), [lines]);
  const hasContent = useMemo(
    () => hasRealLyrics || lines.some((line) => line.time !== null),
    [hasRealLyrics, lines],
  );

  // The next line to annotate is simply the first one without a timestamp.
  // Blank lines are included so instrumental gaps can be timed too.
  const nextIndex = useMemo(() => lines.findIndex((line) => line.time === null), [lines]);

  // The line being annotated must come after the last timed line *before* it,
  // not after the globally-last timestamp (there may be gaps from deleted lines).
  const previousTime = useMemo(() => {
    let max = -Infinity;
    for (let lineIndex = 0; lineIndex < nextIndex; lineIndex++) {
      const time = lines[lineIndex]?.time;
      if (time !== null && time !== undefined && time > max) {
        max = time;
      }
    }
    return max;
  }, [lines, nextIndex]);

  const activeIndex = useMemo(() => {
    let index = -1;
    lines.forEach((line, lineIndex) => {
      if (line.time !== null && line.time <= player.currentTime) {
        index = lineIndex;
      }
    });
    return index;
  }, [lines, player.currentTime]);

  const canAnnotate = player.hasStarted && nextIndex !== -1 && player.currentTime > previousTime;

  const annotateHint = useMemo(() => {
    if (nextIndex === -1) {
      return 'All lines are annotated';
    }
    if (!player.hasStarted) {
      return 'Press Play to start annotating';
    }
    if (player.currentTime <= previousTime) {
      return `Play past ${formatClock(previousTime)} to annotate the next line`;
    }
    return '';
  }, [nextIndex, player.hasStarted, player.currentTime, previousTime]);

  const annotate = useCallback(() => {
    if (nextIndex === -1 || !player.hasStarted || player.currentTime <= previousTime) {
      return;
    }
    store.setTime(nextIndex, player.currentTime);
    if (isMobile) {
      setMobileTab('timed');
    }
  }, [nextIndex, player.hasStarted, player.currentTime, previousTime, store, isMobile]);

  const setTimeToNow = useCallback(
    (index: number) => {
      if (!player.hasStarted) {
        return;
      }
      store.setTime(index, player.currentTime);
      triggerPulse(index, 'now');
    },
    [player.hasStarted, player.currentTime, store, triggerPulse],
  );

  const shiftLine = useCallback(
    (index: number, delta: number) => {
      const time = store.lines[index]?.time;
      if (time === null || time === undefined) {
        return;
      }
      const next = Math.max(0, time + delta);
      if (next === time) {
        return;
      }
      store.setTime(index, next);
      triggerPulse(index, delta < 0 ? 'earlier' : 'later');
    },
    [store, triggerPulse],
  );

  const shiftLast = useCallback(
    (delta: number) => {
      let index = -1;
      store.lines.forEach((line, lineIndex) => {
        if (line.time !== null) {
          index = lineIndex;
        }
      });
      if (index !== -1) {
        shiftLine(index, delta);
      }
    },
    [store, shiftLine],
  );

  const jumpTimedLine = useCallback(
    (direction: 1 | -1) => {
      const times = store.lines
        .filter((line) => line.time !== null)
        .map((line) => line.time as number);
      if (times.length === 0) {
        return;
      }

      const epsilon = 0.05;
      const current = player.currentTime;

      if (direction > 0) {
        const next = times.find((time) => time > current + epsilon);
        if (next !== undefined) {
          player.seek(next);
        }
        return;
      }

      // Find the line currently playing (the last one that started at or before now).
      let currentLineIndex = -1;
      for (let lineIndex = 0; lineIndex < times.length; lineIndex++) {
        if (times[lineIndex] <= current + epsilon) {
          currentLineIndex = lineIndex;
        } else {
          break;
        }
      }

      if (currentLineIndex < 0) {
        player.seek(0);
        return;
      }

      // Just after a line started -> go to the previous line; otherwise restart it.
      const nearLineStart = current - times[currentLineIndex] < RESTART_THRESHOLD_SECONDS;
      const targetIndex = nearLineStart ? currentLineIndex - 1 : currentLineIndex;
      player.seek(targetIndex >= 0 ? times[targetIndex] : 0);
    },
    [store.lines, player],
  );

  const seekToLine = useCallback(
    (index: number) => {
      const time = store.lines[index]?.time;
      if (time !== null && time !== undefined) {
        player.seek(time);
      }
    },
    [store.lines, player],
  );

  useKeyboardShortcuts({
    toggle: player.toggle,
    annotate,
    undo: store.undo,
    redo: store.redo,
    shiftLast,
    jumpTimedLine,
    seek: player.seek,
    currentTime: player.currentTime,
    showHelp: () => setShortcutsOpen(true),
  });

  useProjectPersistence(lines, player.fileName);

  useE2eHandle(player);

  const {
    importFile,
    openImport,
    selectLrclib,
    exportLrc,
    copyPlain,
    copyTimed,
    applyPastedLrc,
    convertPastedLrc,
    reset,
    newProject,
    loadDroppedFile,
  } = useProjectActions({
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
  });

  const dragActive = useFileDrop(loadDroppedFile);

  const hasAudio = player.fileName !== null;
  const inEditor = hasAudio && lyricsReady;

  useBeforeUnload(inEditor);

  const renderScreen = () => {
    if (!hasAudio) {
      return <UploadScreen fileName={player.fileName} onFile={loadDroppedFile} />;
    }

    if (!lyricsReady) {
      return (
        <ChooseScreen
          onManual={() => setLyricsReady(true)}
          onSearch={() => setLrclibOpen(true)}
          onImport={openImport}
        />
      );
    }

    return (
      <EditorScreen
        isMobile={isMobile}
        mobileTab={mobileTab}
        onMobileTabChange={setMobileTab}
        hasAudio={hasAudio}
        lines={lines}
        timedLines={timedLines}
        hoveredIndex={hoveredIndex}
        activeIndex={activeIndex}
        nextIndex={nextIndex}
        pulse={pulse}
        canAnnotate={canAnnotate}
        annotateHint={annotateHint}
        isDecoding={player.isDecoding}
        store={store}
        player={player}
        onShiftLine={shiftLine}
        onSeekLine={seekToLine}
        onSetTimeToNow={setTimeToNow}
        onHoverLine={setHoveredIndex}
        onCopyPlain={copyPlain}
        onCopyTimed={copyTimed}
        onPasteLrc={setPendingLrcText}
        onAnnotate={annotate}
        onJumpLine={jumpTimedLine}
      />
    );
  };

  return (
    <Root>
      <audio ref={audioRef} hidden />
      <TopBar
        isMobile={isMobile}
        themeMode={themeMode}
        hasAudio={hasAudio}
        hasContent={hasContent}
        inEditor={inEditor}
        hasTimedLines={timedLines.length > 0}
        canUndo={store.canUndo}
        canRedo={store.canRedo}
        importInputRef={importInputRef}
        onNew={newProject}
        onUndo={store.undo}
        onRedo={store.redo}
        onShowShortcuts={() => setShortcutsOpen(true)}
        onCycleTheme={onCycleTheme}
        onExport={exportLrc}
        onReset={reset}
        onImportFile={importFile}
      />
      <Content>{renderScreen()}</Content>

      <Snackbar
        open={snackbar !== null}
        autoHideDuration={2500}
        onClose={() => setSnackbar(null)}
        message={snackbar ?? ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <Snackbar
        open={player.decodingVisible}
        message="Decoding audio…"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <KeyboardShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <LrclibSearchDialog
        open={lrclibOpen}
        onClose={() => setLrclibOpen(false)}
        onSelect={selectLrclib}
        fileName={player.fileName}
      />

      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? ''}
        message={confirmState?.message ?? ''}
        confirmLabel={confirmState?.confirmLabel ?? 'Confirm'}
        secondaryLabel={confirmState?.secondaryLabel}
        onConfirm={() => {
          confirmState?.action();
          setConfirmState(null);
        }}
        onSecondary={() => {
          confirmState?.secondaryAction?.();
          setConfirmState(null);
        }}
        onCancel={() => setConfirmState(null)}
      />

      <LrcPasteDialog
        open={pendingLrcText !== null}
        onCancel={() => setPendingLrcText(null)}
        onConvert={() => {
          if (pendingLrcText !== null) {
            convertPastedLrc(pendingLrcText);
          }
          setPendingLrcText(null);
        }}
        onReplace={() => {
          if (pendingLrcText !== null) {
            applyPastedLrc(pendingLrcText);
          }
          setPendingLrcText(null);
        }}
      />

      {dragActive && (
        <DropOverlay>
          <OverlayContent spacing={1.5}>
            <OverlayIcon color="primary" />
            <OverlayTitle variant="h6">Drop the file to load it</OverlayTitle>
          </OverlayContent>
        </DropOverlay>
      )}
    </Root>
  );
}
