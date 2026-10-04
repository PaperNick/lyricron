import { useState } from 'react';
import { ToggleButton } from '@mui/material';
import type { LinePulse, LyricLine } from '../../types';
import type { LineSelection } from './useLineSelection';
import { RawLyricsList } from './RawLyricsList';
import { PreviewPane } from './PreviewPane';
import { PaneRoot } from './Pane.styles';
import { PaneHeader } from './PaneHeader';
import { SelectionToolbar } from './SelectionToolbar';
import { SelectLinesMenu } from './SelectLinesMenu';
import { Spacer, ToggleGroup } from './TimedLyricsPane.styles';

type TabValue = 'edit' | 'preview';

interface Props {
  lines: LyricLine[];
  timedLines: LyricLine[];
  currentTime: number;
  nextIndex: number;
  activeIndex: number;
  pulse: LinePulse | null;
  canSetTime: boolean;
  selection: LineSelection;
  onEditTime: (index: number, time: number) => void;
  onClearTime: (index: number) => void;
  onShift: (index: number, delta: number) => void;
  onSeekLine: (index: number) => void;
  onSetTimeToNow: (index: number) => void;
  onShiftSelection: (delta: number) => void;
  onAlignSelection: () => void;
  onClearSelectionTimes: () => void;
  onSeek: (time: number) => void;
  onHoverLine: (index: number | null) => void;
  onCopy: () => void;
}

export function TimedLyricsPane({
  lines,
  timedLines,
  currentTime,
  nextIndex,
  activeIndex,
  pulse,
  canSetTime,
  selection,
  onEditTime,
  onClearTime,
  onShift,
  onSeekLine,
  onSetTimeToNow,
  onShiftSelection,
  onAlignSelection,
  onClearSelectionTimes,
  onSeek,
  onHoverLine,
  onCopy,
}: Props) {
  const [tab, setTab] = useState<TabValue>('edit');
  // Selecting lines is an edit-mode action; the remembered tab returns on Esc.
  const activeTab = selection.isSelecting ? 'edit' : tab;

  return (
    <PaneRoot variant="outlined">
      {selection.isSelecting ? (
        <SelectionToolbar
          count={selection.count}
          timedCount={selection.timedCount}
          canSetTime={canSetTime}
          onShift={onShiftSelection}
          onAlignToNow={onAlignSelection}
          onClearTimes={onClearSelectionTimes}
          onDeselect={selection.clear}
        />
      ) : (
        <PaneHeader
          title="Timed lyrics"
          copyLabel="Copy timed lyrics"
          copyTooltip="Copy timed lyrics (.lrc)"
          copyDisabled={timedLines.length === 0}
          onCopy={onCopy}
          inset={0.5}
        >
          <SelectLinesMenu lines={lines} onSelect={selection.selectAll} />
          <Spacer />
          <ToggleGroup
            size="small"
            exclusive
            value={tab}
            onChange={(_, value: TabValue | null) => {
              if (value) {
                setTab(value);
              }
            }}
            aria-label="Timed lyrics view"
          >
            <ToggleButton value="edit" aria-label="Edit view">
              Edit
            </ToggleButton>
            <ToggleButton value="preview" aria-label="Preview view">
              Preview
            </ToggleButton>
          </ToggleGroup>
        </PaneHeader>
      )}

      {activeTab === 'edit' ? (
        <RawLyricsList
          lines={lines}
          nextIndex={nextIndex}
          activeIndex={activeIndex}
          pulse={pulse}
          canSetTime={canSetTime}
          selection={selection}
          onEditTime={onEditTime}
          onClearTime={onClearTime}
          onShift={onShift}
          onSeekLine={onSeekLine}
          onSetTimeToNow={onSetTimeToNow}
          onHoverLine={onHoverLine}
        />
      ) : (
        <PreviewPane lines={timedLines} currentTime={currentTime} onSeek={onSeek} />
      )}
    </PaneRoot>
  );
}
