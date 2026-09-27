import { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface Props {
  time: number | null;
  canSetTime: boolean;
  onShift: (delta: number) => void;
  onSetTimeToNow: () => void;
  onDelete: () => void;
}

export function LineActionsMenu({ time, canSetTime, onShift, onSetTimeToNow, onDelete }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const close = () => setAnchorEl(null);
  const run = (action: () => void) => {
    close();
    action();
  };

  return (
    <>
      <IconButton
        size="small"
        aria-label="Line actions"
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <MoreVertIcon fontSize="inherit" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={close}>
        <MenuItem disabled={time === null} onClick={() => run(() => onShift(-0.05))}>
          Shift −50 ms
        </MenuItem>
        <MenuItem disabled={time === null} onClick={() => run(() => onShift(0.05))}>
          Shift +50 ms
        </MenuItem>
        <MenuItem disabled={!canSetTime} onClick={() => run(onSetTimeToNow)}>
          Set to current time
        </MenuItem>
        <MenuItem disabled={time === null} onClick={() => run(onDelete)}>
          Delete timestamp
        </MenuItem>
      </Menu>
    </>
  );
}
