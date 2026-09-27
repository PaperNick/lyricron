import { useState } from 'react';
import { ToggleButton, Tooltip } from '@mui/material';
import type { LyricLine } from '../../types';
import { RawLyricsList } from './RawLyricsList';
import { PreviewPane } from './PreviewPane';
import { CopyButton, CopyIcon, Header, PaneRoot, Title, TooltipTarget } from './Pane.styles';
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
      <Header $inset={0.5}>
        <Title variant="subtitle1">Timed lyrics</Title>
        <Tooltip title="Copy timed lyrics (.lrc)">
          <TooltipTarget>
            <CopyButton
              size="small"
              onClick={onCopy}
              disabled={timedLines.length === 0}
              aria-label="Copy timed lyrics"
            >
              <CopyIcon />
            </CopyButton>
          </TooltipTarget>
        </Tooltip>
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
      </Header>

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
