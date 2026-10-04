import { useState } from 'react';
import { Menu, MenuItem, Tooltip } from '@mui/material';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import type { LyricLine } from '../../types';
import type { LineFilter } from './useLineSelection';
import { TooltipTarget } from '../../components/TooltipTarget';
import { HeaderIconButton } from './Pane.styles';

interface Props {
  lines: LyricLine[];
  onSelect: (filter: LineFilter) => void;
}

/** Idle-header entry point for selecting lines (and select-all shortcuts). */
export function SelectLinesMenu({ lines, onSelect }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const close = () => setAnchorEl(null);
  const run = (filter: LineFilter) => {
    close();
    onSelect(filter);
  };
  const timedCount = lines.filter((line) => line.time !== null).length;
  const untimedCount = lines.length - timedCount;

  return (
    <>
      <Tooltip title="Select lines">
        <TooltipTarget>
          <HeaderIconButton
            size="small"
            aria-label="Select lines"
            disabled={lines.length === 0}
            onClick={(event) => setAnchorEl(event.currentTarget)}
          >
            <PlaylistAddCheckIcon sx={{ fontSize: 24 }} />
          </HeaderIconButton>
        </TooltipTarget>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={close}>
        <MenuItem onClick={() => run('all')}>Select all ({lines.length})</MenuItem>
        <MenuItem disabled={timedCount === 0} onClick={() => run('timed')}>
          Select timed ({timedCount})
        </MenuItem>
        <MenuItem disabled={untimedCount === 0} onClick={() => run('untimed')}>
          Select untimed ({untimedCount})
        </MenuItem>
      </Menu>
    </>
  );
}
