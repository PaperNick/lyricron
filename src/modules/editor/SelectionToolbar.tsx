import type { ReactElement } from 'react';
import { Divider, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import RemoveIcon from '@mui/icons-material/Remove';
import { TooltipTarget } from '../../components/TooltipTarget';
import { Header, Title } from './Pane.styles';
import { Spacer } from './TimedLyricsPane.styles';
import { RowActionButton } from './RawLyricsList.styles';

interface Props {
  count: number;
  timedCount: number;
  canSetTime: boolean;
  onShift: (delta: number) => void;
  onAlignToNow: () => void;
  onClearTimes: () => void;
  onDeselect: () => void;
}

function SelectionAction({ title, children }: { title: string; children: ReactElement }) {
  return (
    <Tooltip title={title} placement="bottom">
      <TooltipTarget>{children}</TooltipTarget>
    </Tooltip>
  );
}

/**
 * Replaces the pane header while lines are selected, so bulk actions stay in
 * one compact, always-visible place instead of floating over the lyrics.
 */
export function SelectionToolbar({
  count,
  timedCount,
  canSetTime,
  onShift,
  onAlignToNow,
  onClearTimes,
  onDeselect,
}: Props) {
  const hasTimed = timedCount > 0;

  return (
    <Header $inset={0.5} role="toolbar" aria-label="Selected lines actions">
      <Title variant="subtitle1" data-testid="selection-count" sx={{ whiteSpace: 'nowrap' }}>
        {count} selected
      </Title>
      {timedCount !== count ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ whiteSpace: 'nowrap', display: { xs: 'none', sm: 'inline' } }}
        >
          {timedCount} timed
        </Typography>
      ) : null}
      <Spacer />
      <SelectionAction title="Shift selected −50 ms">
        <RowActionButton
          aria-label="Shift selected -50 ms"
          disabled={!hasTimed}
          onClick={() => onShift(-0.05)}
        >
          <RemoveIcon fontSize="inherit" />
        </RowActionButton>
      </SelectionAction>
      <SelectionAction title="Shift selected +50 ms">
        <RowActionButton
          aria-label="Shift selected +50 ms"
          disabled={!hasTimed}
          onClick={() => onShift(0.05)}
        >
          <AddIcon fontSize="inherit" />
        </RowActionButton>
      </SelectionAction>
      <SelectionAction title="Align first line to current time">
        <RowActionButton
          aria-label="Align first line to current time"
          disabled={!hasTimed || !canSetTime}
          onClick={onAlignToNow}
        >
          <MyLocationIcon fontSize="inherit" />
        </RowActionButton>
      </SelectionAction>
      <SelectionAction title="Clear timestamps">
        <RowActionButton aria-label="Clear timestamps" disabled={!hasTimed} onClick={onClearTimes}>
          <DeleteOutlineIcon fontSize="inherit" />
        </RowActionButton>
      </SelectionAction>
      <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
      <SelectionAction title="Deselect (Esc)">
        <RowActionButton aria-label="Deselect lines" onClick={onDeselect}>
          <CloseIcon fontSize="inherit" />
        </RowActionButton>
      </SelectionAction>
    </Header>
  );
}
