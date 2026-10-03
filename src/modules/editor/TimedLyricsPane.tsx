import { useState } from 'react';
import { ToggleButton } from '@mui/material';
import type { LyricLine } from '../../types';
import { RawLyricsList } from './RawLyricsList';
import { PreviewPane } from './PreviewPane';
import { PaneRoot } from './Pane.styles';
import { PaneHeader } from './PaneHeader';
import { Spacer, ToggleGroup } from './TimedLyricsPane.styles';

type TabValue = 'edit' | 'preview';

interface Props {
  lines: LyricLine[];
  timedLines: LyricLine[];
  currentTime: number;
  nextIndex: number;
  activeIndex: number;
  canSetTime: boolean;
  onEditTime: (index: number, time: number) => void;
  onClearTime: (index: number) => void;
  onShift: (index: number, delta: number) => void;
  onSeekLine: (index: number) => void;
  onSetTimeToNow: (index: number) => void;
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
  canSetTime,
  onEditTime,
  onClearTime,
  onShift,
  onSeekLine,
  onSetTimeToNow,
  onSeek,
  onHoverLine,
  onCopy,
}: Props) {
  const [tab, setTab] = useState<TabValue>('edit');

  return (
    <PaneRoot variant="outlined">
      <PaneHeader
        title="Timed lyrics"
        copyLabel="Copy timed lyrics"
        copyTooltip="Copy timed lyrics (.lrc)"
        copyDisabled={timedLines.length === 0}
        onCopy={onCopy}
        inset={0.5}
      >
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

      {tab === 'edit' ? (
        <RawLyricsList
          lines={lines}
          nextIndex={nextIndex}
          activeIndex={activeIndex}
          canSetTime={canSetTime}
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
