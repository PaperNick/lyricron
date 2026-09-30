import { memo, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import type { LyricLine } from '../../types';
import { TimestampInput } from './TimestampInput';
import { LineActionsMenu } from './LineActionsMenu';
import { useIsMobile } from '../../hooks/useIsMobile';
import { LineText, ListRoot, Row, TooltipTarget } from './RawLyricsList.styles';

interface Props {
  lines: LyricLine[];
  nextIndex: number;
  activeIndex: number;
  canSetTime: boolean;
  onEditTime: (index: number, time: number) => void;
  onClearTime: (index: number) => void;
  onShift: (index: number, delta: number) => void;
  onSeekLine: (index: number) => void;
  onSetTimeToNow: (index: number) => void;
  onHoverLine: (index: number | null) => void;
}

/** Left-anchored tooltip for per-row icon buttons. */
function RowActionTooltip({ title, children }: { title: string; children: ReactElement }) {
  return (
    <Tooltip title={title} placement="left">
      <TooltipTarget>{children}</TooltipTarget>
    </Tooltip>
  );
}

export const RawLyricsList = memo(function RawLyricsList({
  lines,
  nextIndex,
  activeIndex,
  canSetTime,
  onEditTime,
  onClearTime,
  onShift,
  onSeekLine,
  onSetTimeToNow,
  onHoverLine,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (nextIndex < 0) {
      return;
    }
    const element = containerRef.current?.querySelector<HTMLElement>(`[data-index="${nextIndex}"]`);
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [nextIndex]);

  return (
    <ListRoot ref={containerRef} data-testid="raw-list" onMouseLeave={() => onHoverLine(null)}>
      {lines.map((line, index) => {
        const isNext = index === nextIndex;
        const isActive = index === activeIndex;
        const isBlank = line.text.trim() === '';
        const clickable = line.time !== null;

        return (
          <Row
            key={line.id}
            data-index={index}
            onMouseEnter={() => onHoverLine(index)}
            onMouseLeave={() => onHoverLine(null)}
            $next={isNext}
            $active={isActive}
          >
            <TimestampInput
              time={line.time}
              onCommit={(time) => onEditTime(index, time)}
              onClear={() => onClearTime(index)}
            />
            <LineText
              variant="body2"
              noWrap
              title={isBlank ? 'Blank line' : line.text}
              onClick={() => clickable && onSeekLine(index)}
              $blank={isBlank}
              $clickable={clickable}
            >
              {isBlank ? 'Blank line' : line.text}
            </LineText>
            {isMobile ? (
              <LineActionsMenu
                time={line.time}
                canSetTime={canSetTime}
                onShift={(delta) => onShift(index, delta)}
                onSetTimeToNow={() => onSetTimeToNow(index)}
                onDelete={() => onClearTime(index)}
              />
            ) : (
              <>
                {line.time !== null && (
                  <>
                    <RowActionTooltip title="Shift −50 ms">
                      <IconButton
                        size="small"
                        onClick={() => onShift(index, -0.05)}
                        aria-label="Shift -50 ms"
                      >
                        <RemoveIcon fontSize="inherit" />
                      </IconButton>
                    </RowActionTooltip>
                    <RowActionTooltip title="Shift +50 ms">
                      <IconButton
                        size="small"
                        onClick={() => onShift(index, 0.05)}
                        aria-label="Shift +50 ms"
                      >
                        <AddIcon fontSize="inherit" />
                      </IconButton>
                    </RowActionTooltip>
                  </>
                )}
                <RowActionTooltip title="Set to current time">
                  <IconButton
                    size="small"
                    disabled={!canSetTime}
                    onClick={() => onSetTimeToNow(index)}
                    aria-label="Set to current time"
                  >
                    <MyLocationIcon fontSize="inherit" />
                  </IconButton>
                </RowActionTooltip>
                {line.time !== null && (
                  <RowActionTooltip title="Delete timestamp">
                    <IconButton
                      size="small"
                      onClick={() => onClearTime(index)}
                      aria-label="Delete timestamp"
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  </RowActionTooltip>
                )}
              </>
            )}
          </Row>
        );
      })}
    </ListRoot>
  );
});
