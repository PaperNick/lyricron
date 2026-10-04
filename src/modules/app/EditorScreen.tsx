import type { LinePulse, LyricLine, MobileTab } from '../../types';
import type { AnnotationStore } from '../editor/useAnnotationStore';
import type { LineSelection } from '../editor/useLineSelection';
import type { AudioPlayer } from '../player/useAudioPlayer';
import { PlainLyricsPane } from '../editor/PlainLyricsPane';
import { TimedLyricsPane } from '../editor/TimedLyricsPane';
import { TransportBar } from '../player/TransportBar';
import {
  ContentInner,
  DesktopGrid,
  MobileLayout,
  MobileTab as MobileTabButton,
  MobileTabs,
  PaneArea,
} from '../../App.styles';

interface Props {
  isMobile: boolean;
  mobileTab: MobileTab;
  onMobileTabChange: (tab: MobileTab) => void;
  hasAudio: boolean;
  lines: LyricLine[];
  timedLines: LyricLine[];
  hoveredIndex: number | null;
  activeIndex: number;
  nextIndex: number;
  pulse: LinePulse | null;
  canAnnotate: boolean;
  annotateHint: string;
  isDecoding: boolean;
  store: AnnotationStore;
  player: AudioPlayer;
  selection: LineSelection;
  onShiftLine: (index: number, delta: number) => void;
  onSeekLine: (index: number) => void;
  onSetTimeToNow: (index: number) => void;
  onShiftSelection: (delta: number) => void;
  onAlignSelection: () => void;
  onClearSelectionTimes: () => void;
  onHoverLine: (index: number | null) => void;
  onCopyPlain: () => void;
  onCopyTimed: () => void;
  onPasteLrc: (text: string) => void;
  onAnnotate: () => void;
  onJumpLine: (direction: 1 | -1) => void;
}

export function EditorScreen({
  isMobile,
  mobileTab,
  onMobileTabChange,
  hasAudio,
  lines,
  timedLines,
  hoveredIndex,
  activeIndex,
  nextIndex,
  pulse,
  canAnnotate,
  annotateHint,
  isDecoding,
  store,
  player,
  selection,
  onShiftLine,
  onSeekLine,
  onSetTimeToNow,
  onShiftSelection,
  onAlignSelection,
  onClearSelectionTimes,
  onHoverLine,
  onCopyPlain,
  onCopyTimed,
  onPasteLrc,
  onAnnotate,
  onJumpLine,
}: Props) {
  const plainPane = (
    <PlainLyricsPane
      lines={lines}
      hoveredIndex={hoveredIndex}
      activeIndex={activeIndex}
      onChange={store.setText}
      onCopy={onCopyPlain}
      onPasteLrc={onPasteLrc}
    />
  );

  const timedPane = (
    <TimedLyricsPane
      lines={lines}
      timedLines={timedLines}
      currentTime={player.currentTime}
      nextIndex={nextIndex}
      activeIndex={activeIndex}
      pulse={pulse}
      canSetTime={player.hasStarted}
      selection={selection}
      onEditTime={store.setTime}
      onClearTime={store.clearTime}
      onShift={onShiftLine}
      onSeekLine={onSeekLine}
      onSetTimeToNow={onSetTimeToNow}
      onShiftSelection={onShiftSelection}
      onAlignSelection={onAlignSelection}
      onClearSelectionTimes={onClearSelectionTimes}
      onSeek={player.seek}
      onHoverLine={onHoverLine}
      onCopy={onCopyTimed}
    />
  );

  const nextLineText = nextIndex === -1 ? null : lines[nextIndex].text.trim() || 'Blank line';

  return (
    <ContentInner>
      {isMobile ? (
        <MobileLayout>
          <MobileTabs
            value={mobileTab}
            onChange={(_, value: MobileTab) => onMobileTabChange(value)}
            variant="fullWidth"
          >
            <MobileTabButton value="lyrics" label="Lyrics" />
            <MobileTabButton value="timed" label="Timed" />
          </MobileTabs>
          <PaneArea>{mobileTab === 'lyrics' ? plainPane : timedPane}</PaneArea>
        </MobileLayout>
      ) : (
        <DesktopGrid>
          {plainPane}
          {timedPane}
        </DesktopGrid>
      )}
      <TransportBar
        isPlaying={player.isPlaying}
        disabled={!hasAudio || isDecoding}
        canAnnotate={canAnnotate}
        annotateHint={annotateHint}
        isDecoding={isDecoding}
        nextLineText={nextLineText}
        currentTime={player.currentTime}
        duration={player.duration}
        markers={timedLines.map((line) => line.time as number)}
        playbackRate={player.playbackRate}
        onToggle={player.toggle}
        onAnnotate={onAnnotate}
        onSeek={player.seek}
        onRateChange={player.setPlaybackRate}
        onShiftAll={store.shiftAll}
        onPrevLine={() => onJumpLine(-1)}
        onNextLine={() => onJumpLine(1)}
      />
    </ContentInner>
  );
}
