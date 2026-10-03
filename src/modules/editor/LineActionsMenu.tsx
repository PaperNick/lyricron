import { useState } from 'react';
import { Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { RowActionButton } from './RawLyricsList.styles';

interface Props {
  time: number | null;
  canSetTime: boolean;
  onShift: (delta: number) => void;
  onSetTimeToNow: () => void;
  onDelete: () => void;
  /** Desktop shows the quick actions inline, so the menu holds only delete. */
  deleteOnly?: boolean;
}

export function LineActionsMenu({
  time,
  canSetTime,
  onShift,
  onSetTimeToNow,
  onDelete,
  deleteOnly = false,
}: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const close = () => setAnchorEl(null);
  const run = (action: () => void) => {
    close();
    action();
  };

  return (
    <>
      <RowActionButton
        aria-label="Line actions"
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <MoreVertIcon fontSize="inherit" />
      </RowActionButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={close}>
        {!deleteOnly && (
          <>
            <MenuItem disabled={time === null} onClick={() => run(() => onShift(-0.05))}>
              <RemoveIcon fontSize="small" sx={{ mr: 1 }} />
              Shift −50 ms
            </MenuItem>
            <MenuItem disabled={time === null} onClick={() => run(() => onShift(0.05))}>
              <AddIcon fontSize="small" sx={{ mr: 1 }} />
              Shift +50 ms
            </MenuItem>
            <MenuItem disabled={!canSetTime} onClick={() => run(onSetTimeToNow)}>
              <MyLocationIcon fontSize="small" sx={{ mr: 1 }} />
              Set to current time
            </MenuItem>
          </>
        )}
        <MenuItem disabled={time === null} onClick={() => run(onDelete)}>
          <CloseIcon fontSize="small" sx={{ mr: 1 }} />
          Delete timestamp
        </MenuItem>
      </Menu>
    </>
  );
}
