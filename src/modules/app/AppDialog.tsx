import { useState } from 'react';
import { Dialog as MuiDialog } from '@mui/material';
import type { DialogProps } from '@mui/material';

/**
 * A MUI `Dialog` that keeps rendering its last contents while the closing
 * transition runs, so clearing state on close doesn't collapse the paper to
 * an empty box mid-fade.
 */
export function AppDialog({ open, children, ...props }: DialogProps) {
  const [retained, setRetained] = useState(children);

  // Derive during render; `children` is stable on the re-render, so it runs
  // once and cannot loop.
  if (open && retained !== children) {
    setRetained(children);
  }

  return (
    <MuiDialog {...props} open={open}>
      {open ? children : retained}
    </MuiDialog>
  );
}
