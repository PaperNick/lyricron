import { memo, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { Tooltip } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import type { LinePulse, LyricLine } from '../../types';
import type { LineSelection } from './useLineSelection';
import { TimestampInput } from './TimestampInput';
import { LineActionsMenu } from './LineActionsMenu';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useSelectionGestures } from './useSelectionGestures';
import { TooltipTarget } from '../../components/TooltipTarget';
import {
  LineText,
  ListRoot,
  Row,
  RowActionButton,
  RowActions,
  SelectCheckbox,
  SelectRail,
} from './RawLyricsList.styles';

interface Props {
  lines: LyricLine[];
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
  pulse,
  canSetTime,
  selection,
  onEditTime,
  onClearTime,
  onShift,
  onSeekLine,
  onSetTimeToNow,
  onHoverLine,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const gestures = useSelectionGestures({ selection, isMobile, onHoverLine });

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
        const isSelected = selection.selectedIds.has(line.id);
        const previousSelected = index > 0 && selection.selectedIds.has(lines[index - 1].id);
        const nextSelected =
          index < lines.length - 1 && selection.selectedIds.has(lines[index + 1].id);

        return (
          <Row
            key={line.id}
            data-index={index}
            data-selected={isSelected || undefined}
            onMouseEnter={() => gestures.rowMouseEnter(index)}
            onMouseLeave={() => onHoverLine(null)}
            onMouseDown={(event) => gestures.rowMouseDown(event, index)}
            onPointerDown={(event) => gestures.pointerDown(event, index)}
            onPointerMove={gestures.pointerMove}
            onPointerUp={gestures.pointerCancel}
            onPointerCancel={gestures.pointerCancel}
            onPointerLeave={gestures.pointerCancel}
            onClickCapture={(event) => gestures.rowClickCapture(event, index)}
            onContextMenu={gestures.rowContextMenu}
            $next={isNext}
            $active={isActive}
            $selected={isSelected}
            $selectionStart={isSelected && !previousSelected}
            $selectionEnd={isSelected && !nextSelected}
            $selecting={selection.isSelecting}
          >
            <SelectRail
              role="presentation"
              data-select-rail
              onMouseDown={(event) => gestures.railMouseDown(event, index)}
              onClick={(event) => gestures.railClick(event, index)}
            >
              <SelectCheckbox
                className="selection-checkbox"
                checked={isSelected}
                tabIndex={-1}
                disableRipple
                size="small"
                slotProps={{ input: { 'aria-label': `Select line ${index + 1}` } }}
                icon={<RadioButtonUncheckedIcon />}
                checkedIcon={<CheckCircleIcon />}
              />
            </SelectRail>
            <TimestampInput
              time={line.time}
              onCommit={(time) => onEditTime(index, time)}
              onClear={() => onClearTime(index)}
              pulse={pulse && pulse.indices.includes(index) ? pulse : null}
            />
            <LineText
              variant="body2"
              noWrap
              title={isBlank ? 'Blank line' : line.text}
              onClick={(event) => {
                if (event.shiftKey) {
                  selection.extendTo(index);
                  return;
                }
                if (clickable) {
                  onSeekLine(index);
                }
              }}
              $blank={isBlank}
              $clickable={clickable}
            >
              {isBlank ? 'Blank line' : line.text}
            </LineText>
            {!selection.isSelecting &&
              (isMobile ? (
                <LineActionsMenu
                  time={line.time}
                  canSetTime={canSetTime}
                  onShift={(delta) => onShift(index, delta)}
                  onSetTimeToNow={() => onSetTimeToNow(index)}
                  onDelete={() => onClearTime(index)}
                />
              ) : (
                <RowActions>
                  <RowActionTooltip title="Shift −50 ms">
                    <RowActionButton
                      disabled={line.time === null}
                      onClick={() => onShift(index, -0.05)}
                      aria-label="Shift -50 ms"
                    >
                      <RemoveIcon fontSize="inherit" />
                    </RowActionButton>
                  </RowActionTooltip>
                  <RowActionTooltip title="Shift +50 ms">
                    <RowActionButton
                      disabled={line.time === null}
                      onClick={() => onShift(index, 0.05)}
                      aria-label="Shift +50 ms"
                    >
                      <AddIcon fontSize="inherit" />
                    </RowActionButton>
                  </RowActionTooltip>
                  <RowActionTooltip title="Set to current time">
                    <RowActionButton
                      disabled={!canSetTime}
                      onClick={() => onSetTimeToNow(index)}
                      aria-label="Set to current time"
                    >
                      <MyLocationIcon fontSize="inherit" />
                    </RowActionButton>
                  </RowActionTooltip>
                  <LineActionsMenu
                    time={line.time}
                    canSetTime={canSetTime}
                    onShift={(delta) => onShift(index, delta)}
                    onSetTimeToNow={() => onSetTimeToNow(index)}
                    onDelete={() => onClearTime(index)}
                    deleteOnly
                  />
                </RowActions>
              ))}
          </Row>
        );
      })}
    </ListRoot>
  );
});
