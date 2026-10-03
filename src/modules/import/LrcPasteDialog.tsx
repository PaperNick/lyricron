import { Button, DialogActions, DialogContent, DialogContentText } from '@mui/material';
import { AppDialog } from '../app/AppDialog';
import { Header } from '../app/ConfirmDialog.styles';

interface Props {
  open: boolean;
  onReplace: () => void;
  onConvert: () => void;
  onCancel: () => void;
}

export function LrcPasteDialog({ open, onReplace, onConvert, onCancel }: Props) {
  return (
    <AppDialog
      open={open}
      onClose={onCancel}
      aria-labelledby="lrc-paste-dialog-title"
      aria-describedby="lrc-paste-dialog-description"
    >
      <Header id="lrc-paste-dialog-title">Timed lyrics pasted</Header>
      <DialogContent dividers>
        <DialogContentText id="lrc-paste-dialog-description">
          You pasted timed lyrics (LRC). Load them as timed lyrics, or convert them to plain text?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConvert}>Use plain</Button>
        <Button onClick={onReplace} color="primary" variant="contained" autoFocus>
          Use timed
        </Button>
      </DialogActions>
    </AppDialog>
  );
}
